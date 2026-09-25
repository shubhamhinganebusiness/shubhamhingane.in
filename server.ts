import express from "express";
import path from "path";
import cors from "cors";
import compression from "compression";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

// Lazy loading for sharp to prevent any startup crash if native bindings have issues
let sharpInstance: any = null;
async function getSharp() {
  if (sharpInstance) return sharpInstance;
  try {
    const mod = await import("sharp");
    sharpInstance = mod.default || mod;
    return sharpInstance;
  } catch (err) {
    console.warn("[Server] sharp native module not available or failed to load, falling back to raw buffer:", err);
    return null;
  }
}

dotenv.config();

// Lazy instance variables for server-side SEO database operations
let serverFirebaseDb: any = null;

async function getFirebaseDb(): Promise<any> {
  if (serverFirebaseDb) return serverFirebaseDb;
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (!fs.existsSync(configPath)) {
    console.log("[Meta SEO] No firebase configuration found. SEO tags will fall back to defaults.");
    return null;
  }
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const { initializeApp, getApps } = await import("firebase/app");
    const { getFirestore } = await import("firebase/firestore");
    
    const apps = getApps();
    const app = apps.length === 0 ? initializeApp(config) : apps[0];
    serverFirebaseDb = config.firestoreDatabaseId ? getFirestore(app, config.firestoreDatabaseId) : getFirestore(app);
    return serverFirebaseDb;
  } catch (error: any) {
    console.warn("[Meta SEO] Failed to initialize Firebase client inside server:", error.message || error);
    return null;
  }
}

async function fetchBlogMeta(blogId: string): Promise<any> {
  try {
    const db = await getFirebaseDb();
    if (!db) return null;
    const { doc, getDoc } = await import("firebase/firestore");
    const docRef = doc(db, "blogs", blogId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (error: any) {
    console.error("[Meta SEO] Error fetching blog post document:", error.message || error);
  }
  return null;
}

// Helper to handle robust fallbacks with exponential backoff & jitter when Gemini API encounters rate limits (429 / RESOURCE_EXHAUSTED)
const aiCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

function getCachedAIResponse(key: string): any | null {
  const cached = aiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  if (cached) {
    aiCache.delete(key);
  }
  return null;
}

function setCachedAIResponse(key: string, data: any): void {
  // Simple LRU cleanup if cache exceeds 300 entries
  if (aiCache.size > 300) {
    const oldestKey = aiCache.keys().next().value;
    if (oldestKey) aiCache.delete(oldestKey);
  }
  aiCache.set(key, { timestamp: Date.now(), data });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitOrTemporaryError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  const status = err.status || err.statusCode || (err.response && err.response.status) || (err.error && err.error.code);
  return (
    status === 429 ||
    status === 503 ||
    status === 500 ||
    msg.includes("429") ||
    msg.includes("resource_exhausted") ||
    msg.includes("quota") ||
    msg.includes("rate") ||
    msg.includes("too many requests") ||
    msg.includes("limit") ||
    msg.includes("overloaded") ||
    msg.includes("unavailable") ||
    msg.includes("high demand") ||
    msg.includes("exceeded")
  );
}

function isServiceUnavailableOrDemandSpike(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  const status = err.status || err.statusCode || (err.response && err.response.status) || (err.error && err.error.code);
  return (
    status === 503 ||
    msg.includes("503") ||
    msg.includes("unavailable") ||
    msg.includes("high demand") ||
    msg.includes("overloaded")
  );
}

// Track temporary model cooldowns to avoid repeatedly hammering a model experiencing high demand spikes
const modelCoolDownUntil = new Map<string, number>();

function isModelCoolingDown(model: string): boolean {
  const coolUntil = modelCoolDownUntil.get(model);
  if (!coolUntil) return false;
  if (Date.now() > coolUntil) {
    modelCoolDownUntil.delete(model);
    return false;
  }
  return true;
}

function markModelUnavailable(model: string, durationMs = 180000): void {
  modelCoolDownUntil.set(model, Date.now() + durationMs);
}

// Queue / concurrency throttler to prevent bursts of API calls from exceeding rate limits
let activeGenCalls = 0;
const MAX_CONCURRENT_AI_CALLS = 2;
const callQueue: Array<() => void> = [];

function acquireCallSlot(): Promise<void> {
  if (activeGenCalls < MAX_CONCURRENT_AI_CALLS) {
    activeGenCalls++;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    callQueue.push(() => {
      activeGenCalls++;
      resolve();
    });
  });
}

function releaseCallSlot(): void {
  activeGenCalls = Math.max(0, activeGenCalls - 1);
  if (callQueue.length > 0) {
    const next = callQueue.shift();
    if (next) next();
  }
}

async function generateContentWithFallback(
  ai: any,
  params: { contents: any; config?: any }
): Promise<any> {
  await acquireCallSlot();
  try {
    // Official valid Gemini models ordered for maximum availability and high throughput
    const baseModels = [
      "gemini-3.5-flash-lite",
      "gemini-3.6-flash",
      "gemini-3.8-flash",
      "gemini-flash-latest"
    ];

    // Prioritize healthy models that are not currently cooling down from a 503 spike
    const modelsToTry = [...baseModels].sort((a, b) => {
      const aCool = isModelCoolingDown(a) ? 1 : 0;
      const bCool = isModelCoolingDown(b) ? 1 : 0;
      return aCool - bCool;
    });

    let lastError: any = null;

    for (const model of modelsToTry) {
      const isCooling = isModelCoolingDown(model);
      if (isCooling && modelsToTry.some(m => !isModelCoolingDown(m))) {
        // Skip cooling model if we have non-cooling alternatives
        continue;
      }

      // Attempt model call with timeout protection (7s) to prevent proxy 504 gateway timeouts
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          console.log(`[Gemini] Calling model: ${model}${attempt > 0 ? ` (retry ${attempt + 1})` : ''}`);
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Model ${model} request timed out after 7000ms`)), 7000)
          );
          
          const response = await Promise.race([
            ai.models.generateContent({
              ...params,
              model,
            }),
            timeoutPromise
          ]) as any;

          if (response && response.text) {
            console.log(`[Gemini] Success using model: ${model}`);
            return response;
          }
        } catch (err: any) {
          lastError = err;

          // If network connection to Google API cannot be established (fetch failed / DNS / offline),
          // do not stall the user request with further retries; fail fast to instant local fallback.
          const errMsg = (err.message || String(err)).toLowerCase();
          if (errMsg.includes('fetch failed') || errMsg.includes('econnrefused') || errMsg.includes('enotfound')) {
            console.log(`[Gemini] Network connectivity unavailable (${err.message || err}). Failing fast to local generator.`);
            throw err;
          }

          // If the model timed out, do not retry this model; switch immediately to next fallback
          if (errMsg.includes('timed out')) {
            console.log(`[Gemini] Model ${model} timed out. Moving immediately to next fallback model.`);
            break;
          }

          // If the model is experiencing high demand (503), put it on cooldown and switch immediately
          if (isServiceUnavailableOrDemandSpike(err)) {
            console.log(`[Gemini] Model ${model} is experiencing high demand (503). Setting 3m cooldown and switching to next model.`);
            markModelUnavailable(model, 180000);
            break; // Switch to next model immediately without delay
          }

          // Handle 404 (deprecated / unavailable model name)
          const errStatus = err.status || err.statusCode || (err.error && err.error.code);
          if (errStatus === 404) {
            console.log(`[Gemini] Model ${model} returned 404. Setting long cooldown and switching to next model.`);
            markModelUnavailable(model, 3600000);
            break;
          }

          // Handle 429 rate limits with quick backoff on first attempt
          if (isRateLimitOrTemporaryError(err) && attempt === 0) {
            const backoffMs = 500 + Math.floor(Math.random() * 300);
            console.log(`[Gemini] Rate limit detected for ${model}. Backing off ${backoffMs}ms...`);
            await sleep(backoffMs);
            continue;
          }

          console.log(`[Gemini] Model ${model} failed: ${err.message || err}. Moving to next fallback model.`);
          break; // Move to next fallback model
        }
      }
    }

    throw lastError || new Error("All fallback Gemini models encountered rate limits or temporary unavailability.");
  } finally {
    releaseCallSlot();
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // High-performance gzip/deflate compression for all API and static responses
  app.use(compression());

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // High-Traffic Security & Anti-DDoS Headers (Cricbuzz-grade standards)
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    // In AI Studio preview iframe, do not set X-Frame-Options SAMEORIGIN so the preview renders properly
    res.setHeader("Content-Security-Policy", "frame-ancestors *;");
    next();
  });

  // Anti-DDoS in-memory token-bucket IP rate limiter for spectator and API endpoints
  const ipHitCounter = new Map<string, { count: number; resetAt: number }>();
  app.use((req, res, next) => {
    // Only rate-limit /api/ endpoints to preserve static asset loading speed
    if (!req.path.startsWith("/api/")) {
      return next();
    }
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown_ip";
    const now = Date.now();
    const windowMs = 10000; // 10-second rolling window
    // Generous limit for live score polling: up to 150 requests per 10s per IP
    const maxRequestsPerWindow = 150;

    let tracker = ipHitCounter.get(ip);
    if (!tracker || now > tracker.resetAt) {
      tracker = { count: 1, resetAt: now + windowMs };
      ipHitCounter.set(ip, tracker);
    } else {
      tracker.count++;
    }

    // Clean old IPs periodically if map gets huge
    if (ipHitCounter.size > 20000) {
      ipHitCounter.forEach((v, k) => {
        if (now > v.resetAt) ipHitCounter.delete(k);
      });
    }

    if (tracker.count > maxRequestsPerWindow) {
      res.setHeader("Retry-After", "5");
      return res.status(429).json({
        error: "Too Many Requests",
        message: "High-traffic spectator protection active. Please wait a few seconds."
      });
    }

    next();
  });

  // Gracefully catch body-parser PayloadTooLargeError or malformed JSON
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err && (err.type === "entity.too.large" || err.status === 413)) {
      console.warn(`[Server] Request entity too large (${req.method} ${req.path}):`, err.message);
      return res.status(413).json({
        error: "Request entity too large",
        message: "The payload exceeds the maximum allowed limit of 50MB."
      });
    }
    if (err instanceof SyntaxError && "status" in err && (err as any).status === 400) {
      return res.status(400).json({ error: "Invalid JSON format", message: (err as any).message });
    }
    next(err);
  });

  // API routes go here FIRST
  app.get(["/api/health", "/health", "/healthz"], (req, res) => {
    res.json({ status: "ok" });
  });

  // Serve static uploads directory for optimized CDN/static images
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
    } catch (_) {}
  }
  app.use("/uploads", express.static(uploadsDir, {
    maxAge: "1y",
    immutable: true
  }));

  // Cricbuzz-grade Image Upload Architecture Endpoint:
  // 1. Organizes into logical Firebase Storage folders:
  //    - players/ (player profile photos, e.g. players/player_id_123.webp)
  //    - matches/ (match and tournament banners, e.g. matches/match_id_789.webp)
  //    - ads/ (advertisement and sponsor banners, e.g. ads/sponsor_ad_01.webp)
  //    - teams/ (team logos and club emblems)
  // 2. Sharp Image Optimization:
  //    - Resizes players to 200x200 square crop, compressing 5MB photos down to ~15KB
  //    - Resizes banners to 1280x720 (16:9 standard)
  // 3. Google Cloud CDN Caching:
  //    - Sets cache-control headers (public, max-age=31536000, immutable) for repeat-user speed
  app.post("/api/upload-image", async (req, res) => {
    try {
      const {
        image,
        folder = "uploads",
        filename,
        mimeType,
        entityId,
        maxWidth,
        maxHeight,
        quality,
        cropSquare
      } = req.body || {};

      if (!image || typeof image !== "string") {
        return res.status(400).json({ error: "Image data (base64 or data URL) is required." });
      }

      // Parse base64 or data URL
      let inputBuffer: Buffer;
      let inputContentType = mimeType || "image/jpeg";
      if (image.startsWith("data:")) {
        const match = image.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
        if (match) {
          inputContentType = match[1];
          inputBuffer = Buffer.from(match[2], "base64");
        } else {
          return res.status(400).json({ error: "Invalid data URL format." });
        }
      } else {
        inputBuffer = Buffer.from(image, "base64");
      }

      // 25MB upper boundary safeguard
      if (inputBuffer.length > 25 * 1024 * 1024) {
        return res.status(413).json({ error: "Image exceeds 25MB limit." });
      }

      // 1. Logical Cricbuzz-standard Hierarchical Folder Classification
      let cleanFolder = folder.replace(/^\/+|\/+$/g, "");
      const folderLower = cleanFolder.toLowerCase();

      // Normalize common synonyms to full Cricbuzz standard paths
      if (folderLower === "players" || folderLower === "players/avatars" || folderLower === "squad_players") {
        cleanFolder = "players/avatars";
      } else if (folderLower === "players/action_shots" || folderLower === "action_shots") {
        cleanFolder = "players/action_shots";
      } else if (folderLower === "teams" || folderLower === "teams/logos") {
        cleanFolder = "teams/logos";
      } else if (folderLower === "tournaments" || folderLower === "tournaments/banners") {
        cleanFolder = "tournaments/banners";
      } else if (folderLower === "tournaments/trophies" || folderLower === "trophies") {
        cleanFolder = "tournaments/trophies";
      } else if (folderLower === "ads" || folderLower === "ads/sponsor_banners" || folderLower === "sponsors") {
        cleanFolder = "ads/sponsor_banners";
      } else if (folderLower === "player_identity_docs" || folderLower === "docs" || folderLower === "kyc") {
        cleanFolder = "player_identity_docs";
      }

      // 2. Sharp Image Optimization & Cricbuzz-Grade Compression
      let outputBuffer = inputBuffer;
      let outputContentType = inputContentType;
      let outputExt = "webp";

      try {
        const isSvg = inputContentType === "image/svg+xml" || (filename && filename.endsWith(".svg"));
        const isGif = inputContentType === "image/gif" || (filename && filename.endsWith(".gif"));

        if (!isSvg && !isGif) {
          const sharp = await getSharp();
          if (sharp) {
            const sharpImg = sharp(inputBuffer).rotate(); // auto-orient via EXIF

            if (cleanFolder.includes("players/avatars") || cropSquare) {
              // Cricbuzz Player Portrait Standard:
              // 200x200 square crop focused on upper face (compresses 5MB photos to ~15KB for 2G/3G gully networks)
              const targetDim = maxWidth && maxWidth <= 400 ? maxWidth : 200;
              outputBuffer = await sharpImg
                .resize(targetDim, targetDim, {
                  fit: "cover",
                  position: "top" // Headshot focus
                })
                .webp({ quality: quality || 82, effort: 4 })
                .toBuffer();
              outputContentType = "image/webp";
              outputExt = "webp";
            } else if (cleanFolder.includes("teams/logos") || cleanFolder.includes("trophies")) {
              // Cricbuzz Team Crest / Trophy Standard:
              // 200x200 or 400x400 contain with transparent alpha background
              const targetDim = cleanFolder.includes("trophies") ? (maxWidth || 400) : (maxWidth && maxWidth <= 400 ? maxWidth : 200);
              outputBuffer = await sharpImg
                .resize(targetDim, targetDim, {
                  fit: "contain",
                  background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .webp({ quality: quality || 85, effort: 4 })
                .toBuffer();
              outputContentType = "image/webp";
              outputExt = "webp";
            } else if (cleanFolder.includes("share_cards") || cleanFolder.includes("potm")) {
              // CricHeroes Viral Share Card Standard:
              // Up to 1200x1350 for WhatsApp Status & Instagram Cards
              const targetW = maxWidth || 1200;
              const targetH = maxHeight || 1350;
              outputBuffer = await sharpImg
                .resize(targetW, targetH, {
                  fit: "inside",
                  withoutEnlargement: true
                })
                .webp({ quality: quality || 88, effort: 4 })
                .toBuffer();
              outputContentType = "image/webp";
              outputExt = "webp";
            } else if (cleanFolder.includes("tournaments/banners") || cleanFolder.includes("matches") || cleanFolder.includes("sponsor_banners")) {
              // Cricbuzz 16:9 Match & Tournament Banner Standard: 1280x720
              const targetW = maxWidth || 1280;
              const targetH = maxHeight || 720;
              outputBuffer = await sharpImg
                .resize(targetW, targetH, {
                  fit: "inside",
                  withoutEnlargement: true
                })
                .webp({ quality: quality || 85, effort: 4 })
                .toBuffer();
              outputContentType = "image/webp";
              outputExt = "webp";
            } else {
              // General asset resize
              const targetW = maxWidth || 1200;
              const targetH = maxHeight || 1200;
              outputBuffer = await sharpImg
                .resize(targetW, targetH, {
                  fit: "inside",
                  withoutEnlargement: true
                })
                .webp({ quality: quality || 82 })
                .toBuffer();
              outputContentType = "image/webp";
              outputExt = "webp";
            }
          }
        }
      } catch (sharpError) {
        console.warn("[Upload Route] Sharp image processing note, using original buffer:", sharpError);
        outputBuffer = inputBuffer;
      }

      // 3. Structured File Naming (e.g. players/player_id_123.webp, matches/match_id_789.webp)
      const timestamp = Date.now();
      let safeName = "";
      if (entityId) {
        const sanitizedId = entityId.replace(/[^a-zA-Z0-9_-]/g, "_");
        safeName = `${sanitizedId}.${outputExt}`;
      } else if (cleanFolder.includes("players/avatars")) {
        safeName = `avatar_${timestamp}_${Math.random().toString(36).substring(2, 6)}.${outputExt}`;
      } else if (cleanFolder.includes("players/action_shots")) {
        safeName = `action_${timestamp}_${Math.random().toString(36).substring(2, 6)}.${outputExt}`;
      } else if (cleanFolder.includes("teams/logos")) {
        safeName = `logo_${timestamp}_${Math.random().toString(36).substring(2, 6)}.${outputExt}`;
      } else if (cleanFolder.includes("tournaments/banners")) {
        safeName = `tournament_banner_${timestamp}_${Math.random().toString(36).substring(2, 6)}.${outputExt}`;
      } else if (cleanFolder.includes("tournaments/trophies")) {
        safeName = `trophy_${timestamp}_${Math.random().toString(36).substring(2, 6)}.${outputExt}`;
      } else if (cleanFolder.includes("share_cards")) {
        safeName = `share_card_${timestamp}_${Math.random().toString(36).substring(2, 6)}.${outputExt}`;
      } else if (cleanFolder.includes("matches")) {
        safeName = `match_${timestamp}_${Math.random().toString(36).substring(2, 6)}.${outputExt}`;
      } else if (cleanFolder.includes("ads") || cleanFolder.includes("sponsor")) {
        safeName = `sponsor_ad_${timestamp}_${Math.random().toString(36).substring(2, 6)}.${outputExt}`;
      } else if (filename) {
        safeName = `${filename.replace(/[^a-zA-Z0-9_-]/g, "_")}.${outputExt}`;
      } else {
        safeName = `img_${timestamp}_${Math.random().toString(36).substring(2, 6)}.${outputExt}`;
      }

      const storagePath = `${cleanFolder}/${safeName}`;

      // 4. Upload to Firebase Storage with Google Cloud CDN Cache Headers
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
          const bucket = config.storageBucket;
          if (bucket) {
            // Upload binary to Firebase Storage
            const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o?uploadType=media&name=${encodeURIComponent(storagePath)}`;
            const uploadRes = await fetch(uploadUrl, {
              method: "POST",
              headers: {
                "Content-Type": outputContentType,
                ...(config.apiKey ? { "x-goog-api-key": config.apiKey } : {})
              },
              body: outputBuffer
            });

            if (uploadRes.ok) {
              const resJson: any = await uploadRes.json();
              const token = resJson.downloadTokens || (resJson.metadata && resJson.metadata.firebaseStorageDownloadTokens) || "";
              
              // Set Cache-Control metadata on Firebase Storage / Google Cloud CDN
              try {
                const patchUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(storagePath)}`;
                await fetch(patchUrl, {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    ...(config.apiKey ? { "x-goog-api-key": config.apiKey } : {})
                  },
                  body: JSON.stringify({
                    cacheControl: "public, max-age=31536000, immutable",
                    contentType: outputContentType,
                    metadata: {
                      firebaseStorageDownloadTokens: token,
                      optimizedBy: "sharp",
                      folder: cleanFolder
                    }
                  })
                });
              } catch (metaErr) {
                console.warn("[Upload Route] CDN cache metadata patch note:", metaErr);
              }

              const publicUrl = token
                ? `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`
                : `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(storagePath)}?alt=media`;

              return res.json({
                success: true,
                url: publicUrl,
                path: storagePath,
                size: outputBuffer.length,
                originalSize: inputBuffer.length,
                contentType: outputContentType,
                name: safeName,
                folder: cleanFolder,
                cacheControl: "public, max-age=31536000, immutable"
              });
            } else {
              const errText = await uploadRes.text();
              console.warn("[Upload Route] Firebase Storage REST note:", errText);
            }
          }
        } catch (storageErr) {
          console.warn("[Upload Route] Storage upload attempt note:", storageErr);
        }
      }

      // High-performance static disk file saving: ensures persistent, clean URLs for uploads
      try {
        const publicUploadsPath = path.join(process.cwd(), "public", "uploads", storagePath);
        const parentDir = path.dirname(publicUploadsPath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }
        fs.writeFileSync(publicUploadsPath, outputBuffer);

        const distUploadsPath = path.join(process.cwd(), "dist", "uploads", storagePath);
        if (fs.existsSync(path.join(process.cwd(), "dist"))) {
          const distParentDir = path.dirname(distUploadsPath);
          if (!fs.existsSync(distParentDir)) {
            fs.mkdirSync(distParentDir, { recursive: true });
          }
          fs.writeFileSync(distUploadsPath, outputBuffer);
        }

        const localStaticUrl = `/uploads/${storagePath}`;
        return res.json({
          success: true,
          url: localStaticUrl,
          path: storagePath,
          size: outputBuffer.length,
          originalSize: inputBuffer.length,
          contentType: outputContentType,
          name: safeName,
          folder: cleanFolder,
          cacheControl: "public, max-age=31536000, immutable"
        });
      } catch (diskErr) {
        console.warn("[Upload Route] Failed to save to local uploads dir:", diskErr);
      }

      // Safe fallback data URL if disk write failed
      const fallbackDataUrl = `data:${outputContentType};base64,${outputBuffer.toString("base64")}`;
      return res.json({
        success: true,
        url: fallbackDataUrl,
        path: `local-base64/${storagePath}`,
        size: outputBuffer.length,
        originalSize: inputBuffer.length,
        contentType: outputContentType,
        name: safeName,
        folder: cleanFolder,
        isBase64Fallback: true
      });
    } catch (error: any) {
      console.error("[Upload Route] Error processing upload:", error);
      res.status(500).json({ error: error.message || "Failed to upload image." });
    }
  });

  // High-reliability Image Proxy for Google Drive and external sponsor banners
  app.get("/api/image-proxy", async (req, res) => {
    try {
      const targetUrl = req.query.url;
      if (!targetUrl || typeof targetUrl !== "string") {
        return res.status(400).send("Missing url query parameter");
      }

      let fetchUrl = targetUrl;
      const driveMatch = targetUrl.match(/(?:drive|docs)\.google\.com\/(?:file\/)?d\/([a-zA-Z0-9_-]+)/i) ||
                         targetUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/i) ||
                         targetUrl.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i);

      if (driveMatch && driveMatch[1]) {
        fetchUrl = `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1600`;
      }

      let imageRes = await fetch(fetchUrl, {
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
        }
      });

      // If thumbnail returned non-OK, attempt lh3 fallback
      if (!imageRes.ok && driveMatch && driveMatch[1]) {
        const lh3Url = `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
        imageRes = await fetch(lh3Url, {
          redirect: "follow",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "image/*,*/*;q=0.8"
          }
        });
      }

      if (!imageRes.ok) {
        return res.status(imageRes.status).send(`Failed to fetch image: ${imageRes.statusText}`);
      }

      const contentType = imageRes.headers.get("content-type") || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
      res.setHeader("Access-Control-Allow-Origin", "*");

      const arrayBuffer = await imageRes.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (proxyErr: any) {
      console.error("[Image Proxy] Error fetching proxy image:", proxyErr?.message || proxyErr);
      res.status(500).send("Failed to proxy image.");
    }
  });

  // Cricket deleted matches persistence & cross-device synchronization
  const DELETED_MATCHES_FILE = path.join(process.cwd(), "cricket-deleted-matches.json");
  function loadDeletedMatchIds(): string[] {
    try {
      if (fs.existsSync(DELETED_MATCHES_FILE)) {
        const raw = fs.readFileSync(DELETED_MATCHES_FILE, "utf-8");
        const list = JSON.parse(raw);
        if (Array.isArray(list)) return list;
      }
    } catch (e) {
      console.warn("[Cricket Deleted] Failed to read deleted matches file:", e);
    }
    // Default seed containing previously discarded test matches
    const seed = [
      'match-1781148325457',
      'match-1782016325671',
      'match-1788498354696',
      'match-1788598366521',
      'match-1789287226767',
      'test-realtime-check',
      'node_test_match',
      'test_123'
    ];
    try {
      fs.writeFileSync(DELETED_MATCHES_FILE, JSON.stringify(seed, null, 2), "utf-8");
    } catch (_) {}
    return seed;
  }

  app.get("/api/cricket/deleted-matches", (req, res) => {
    const ids = loadDeletedMatchIds();
    res.json({ deletedIds: ids });
  });

  app.post("/api/cricket/delete-match", async (req, res) => {
    try {
      const { matchId } = req.body || {};
      if (!matchId || typeof matchId !== 'string') {
        return res.status(400).json({ error: "matchId required" });
      }
      const ids = loadDeletedMatchIds();
      if (!ids.includes(matchId)) {
        ids.push(matchId);
        try {
          fs.writeFileSync(DELETED_MATCHES_FILE, JSON.stringify(ids, null, 2), "utf-8");
        } catch (err) {
          console.warn("[Cricket Deleted] Failed to write deleted matches file:", err);
        }
      }

      // Invalidate server-side live caches immediately
      try {
        matchSummaryServerCache.delete(matchId);
        liveMatchesServerCache.data = liveMatchesServerCache.data.filter((m: any) => m && m.id !== matchId);
        liveMatchesServerCache.timestamp = 0;
      } catch (_) {}

      // Delete docs in Firestore and register real-time deletion tombstone
      try {
        const db = await getFirebaseDb();
        if (db) {
          const { doc, deleteDoc, setDoc } = await import("firebase/firestore");
          deleteDoc(doc(db, "cricket_matches", matchId)).catch(() => {});
          deleteDoc(doc(db, "cricket_live_summaries", matchId)).catch(() => {});
          setDoc(doc(db, "cricket_deleted_matches", matchId), {
            id: matchId,
            deletedAt: Date.now(),
            isDeleted: true
          }).catch(() => {});
        }
      } catch (_) {}

      res.json({ success: true, deletedId: matchId, count: ids.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to mark match deleted" });
    }
  });

  // Cricket deleted tournaments persistence & cross-device synchronization
  const DELETED_TOURNAMENTS_FILE = path.join(process.cwd(), "cricket-deleted-tournaments.json");
  function loadDeletedTournamentIds(): string[] {
    try {
      if (fs.existsSync(DELETED_TOURNAMENTS_FILE)) {
        const raw = fs.readFileSync(DELETED_TOURNAMENTS_FILE, "utf-8");
        const list = JSON.parse(raw);
        if (Array.isArray(list)) return list;
      }
    } catch (e) {
      console.warn("[Cricket Deleted Tournaments] Failed to read file:", e);
    }
    return [];
  }

  app.get("/api/cricket/deleted-tournaments", (req, res) => {
    const ids = loadDeletedTournamentIds();
    res.json({ deletedIds: ids });
  });

  app.post("/api/cricket/delete-tournament", async (req, res) => {
    try {
      const { tournamentId } = req.body || {};
      if (!tournamentId || typeof tournamentId !== 'string') {
        return res.status(400).json({ error: "tournamentId required" });
      }
      const ids = loadDeletedTournamentIds();
      if (!ids.includes(tournamentId)) {
        ids.push(tournamentId);
        try {
          fs.writeFileSync(DELETED_TOURNAMENTS_FILE, JSON.stringify(ids, null, 2), "utf-8");
        } catch (err) {
          console.warn("[Cricket Deleted Tournaments] Failed to write file:", err);
        }
      }

      // Delete doc in Firestore
      try {
        const db = await getFirebaseDb();
        if (db) {
          const { doc, deleteDoc } = await import("firebase/firestore");
          deleteDoc(doc(db, "cricket_tournaments", tournamentId)).catch(() => {});
        }
      } catch (fErr) {
        console.warn("[Cricket Deleted Tournaments] Firestore deleteDoc notice:", fErr);
      }

      res.json({ success: true, tournamentId });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to mark tournament deleted" });
    }
  });

  app.delete("/api/cricket/tournaments/:id", async (req, res) => {
    const tournamentId = req.params.id;
    if (!tournamentId) return res.status(400).json({ error: "id required" });
    const ids = loadDeletedTournamentIds();
    if (!ids.includes(tournamentId)) {
      ids.push(tournamentId);
      try {
        fs.writeFileSync(DELETED_TOURNAMENTS_FILE, JSON.stringify(ids, null, 2), "utf-8");
      } catch (err) {}
    }
    try {
      const db = await getFirebaseDb();
      if (db) {
        const { doc, deleteDoc } = await import("firebase/firestore");
        deleteDoc(doc(db, "cricket_tournaments", tournamentId)).catch(() => {});
      }
    } catch (_) {}
    res.json({ success: true, tournamentId });
  });

  // Active Match routing endpoint for OBS overlay and external integrations
  app.get("/api/cricket/active-match/:managerId", async (req, res) => {
    try {
      const { managerId } = req.params;
      if (!managerId) {
        return res.status(400).json({ error: "managerId parameter is required" });
      }

      const db = await getFirebaseDb();
      if (!db) {
        return res.status(503).json({ error: "Database not available" });
      }

      const { doc, getDoc, collection, query, where, getDocs, limit } = await import("firebase/firestore");

      // 1. Check direct score_managers pointer document
      let mgrData: any = null;
      const managerRef = doc(db, "score_managers", managerId);
      const managerSnap = await getDoc(managerRef);
      if (managerSnap.exists()) {
        mgrData = managerSnap.data();
      }

      // Fallback check to 'official_scorer' or 'default' if managerId doc had no live match
      if (!mgrData || mgrData.status !== 'live' || !mgrData.activeMatchId) {
        if (managerId !== 'official_scorer') {
          const offSnap = await getDoc(doc(db, "score_managers", "official_scorer")).catch(() => null);
          if (offSnap && offSnap.exists() && offSnap.data()?.status === 'live' && offSnap.data()?.activeMatchId) {
            mgrData = offSnap.data();
          }
        }
        if (!mgrData || mgrData.status !== 'live' || !mgrData.activeMatchId) {
          const defSnap = await getDoc(doc(db, "score_managers", "default")).catch(() => null);
          if (defSnap && defSnap.exists() && defSnap.data()?.status === 'live' && defSnap.data()?.activeMatchId) {
            mgrData = defSnap.data();
          }
        }
      }

      if (mgrData && mgrData.status === 'live' && mgrData.activeMatchId) {
        const matchRef = doc(db, "cricket_matches", mgrData.activeMatchId);
        const matchSnap = await getDoc(matchRef);
        if (matchSnap.exists() && matchSnap.data().status === 'live') {
          return res.json({
            active: true,
            managerId,
            matchId: mgrData.activeMatchId,
            streamKey: mgrData.streamKey || null,
            match: matchSnap.data()
          });
        }
      }

      // 2. Query cricket_matches for any live match, sorting by updatedAt descending so NEWEST is picked
      const q = query(
        collection(db, "cricket_matches"),
        where("status", "==", "live")
      );
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        const allLive = qSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
        allLive.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

        let liveMatch = allLive.find(m => m.managerId === managerId || m.createdBy === managerId);
        if (!liveMatch && (managerId === 'official_scorer' || managerId === 'default' || managerId === 'current')) {
          liveMatch = allLive[0];
        }
        if (!liveMatch && allLive.length > 0) {
          liveMatch = allLive[0];
        }

        if (liveMatch) {
          return res.json({
            active: true,
            managerId,
            matchId: liveMatch.id,
            match: liveMatch
          });
        }
      }

      // No active match currently running
      return res.json({
        active: false,
        managerId,
        message: "No live match currently active for this score manager."
      });
    } catch (err: any) {
      console.error("[Cricket Active Match API] Error fetching active match:", err);
      res.status(500).json({ error: err.message || "Failed to query active match" });
    }
  });

  // =========================================================================
  // Cricbuzz-Grade Edge Fan-out & Read-Replica Live Score Feed Endpoints
  // Protects Firestore from read exhaustion by caching live data at the edge
  // with HTTP Cache-Control (public, max-age=1, stale-while-revalidate=2).
  // =========================================================================

  // In-memory server cache for hot live matches (micro-cache: 3000ms)
  let liveMatchesServerCache: { timestamp: number; etag: string; data: any[] } = {
    timestamp: 0,
    etag: "",
    data: []
  };

  const matchSummaryServerCache = new Map<string, { timestamp: number; etag: string; data: any }>();

  // Server-side Firestore quota tracking & circuit breaker
  let serverFirestoreQuotaExhaustedUntil = 0;

  function isServerFirestoreQuotaExhausted(): boolean {
    return Date.now() < serverFirestoreQuotaExhaustedUntil;
  }

  function recordServerFirestoreQuotaExhaustion(durationMinutes = 3) {
    serverFirestoreQuotaExhaustedUntil = Date.now() + durationMinutes * 60 * 1000;
  }

  function isServerQuotaError(err: any): boolean {
    if (!err) return false;
    const msg = String(err?.message || err).toLowerCase();
    return (
      msg.includes("quota exceeded") ||
      msg.includes("resource-exhausted") ||
      msg.includes("resource_exhausted") ||
      msg.includes("quota limit exceeded")
    );
  }

  // Helper to extract lightweight Cricbuzz-style live score summary
  function extractServerLiveSummary(m: any) {
    if (!m || !m.id) return null;
    const currentInn = m.currentInningsNum === 1 ? m.innings1 : m.innings2;
    const balls = currentInn?.ballsBowled || 0;
    const oversFormatted = `${Math.floor(balls / 6)}.${balls % 6}`;
    const runs = currentInn?.runs || 0;
    const wickets = currentInn?.wickets || 0;
    const crr = balls > 0 ? parseFloat((runs / (balls / 6)).toFixed(2)) : 0;
    
    let rrr: number | null = null;
    if (m.currentInningsNum === 2 && m.targetRuns) {
      const needed = Math.max(0, m.targetRuns - runs);
      const remainingBalls = Math.max(0, (m.oversLimit || 10) * 6 - balls);
      rrr = remainingBalls > 0 ? parseFloat(((needed / remainingBalls) * 6).toFixed(2)) : null;
    }

    const striker = currentInn?.batsmen?.[currentInn?.strikerIndex];
    const nonStriker = currentInn?.batsmen?.[currentInn?.nonStrikerIndex];
    const bowler = currentInn?.bowlers?.[currentInn?.currentBowlerIndex];

    const recentBalls: any[] = [];
    if (Array.isArray(currentInn?.commentaryList) && currentInn.commentaryList.length > 0) {
      recentBalls.push(...currentInn.commentaryList.slice(0, 12));
    }

    return {
      id: m.id,
      status: m.status || "setup",
      teamA: m.teamA || "Team A",
      teamB: m.teamB || "Team B",
      teamALogo: m.teamALogo || "",
      teamBLogo: m.teamBLogo || "",
      tournamentName: m.tournamentName || "",
      groundName: m.groundName || "",
      oversLimit: m.oversLimit || 10,
      currentInningsNum: m.currentInningsNum || 1,
      targetRuns: m.targetRuns || null,
      isSuperOver: m.isSuperOver || false,
      score: {
        runs,
        wickets,
        ballsBowled: balls,
        oversFormatted,
        crr,
        rrr
      },
      striker: striker ? {
        name: striker.name,
        runs: striker.runs,
        balls: striker.balls,
        fours: striker.fours || 0,
        sixes: striker.sixes || 0
      } : null,
      nonStriker: nonStriker ? {
        name: nonStriker.name,
        runs: nonStriker.runs,
        balls: nonStriker.balls,
        fours: nonStriker.fours || 0,
        sixes: nonStriker.sixes || 0
      } : null,
      currentBowler: bowler ? {
        name: bowler.name,
        oversFormatted: `${Math.floor((bowler.ballsBowled || 0) / 6)}.${(bowler.ballsBowled || 0) % 6}`,
        maidens: bowler.maidens || 0,
        runsConceded: bowler.runsConceded || 0,
        wickets: bowler.wickets || 0
      } : null,
      recentBalls,
      updatedAt: m.updatedAt || Date.now()
    };
  }

  // 1. High-Traffic Live Feed Endpoint (/api/cricket/live-feed)
  app.get("/api/cricket/live-feed", async (req, res) => {
    try {
      const now = Date.now();
      const CACHE_WINDOW_MS = 3000; // 3 seconds micro-cache

      // Edge Caching Headers (Cloudflare / Cloud CDN / Fastly compatible)
      res.setHeader("Cache-Control", "public, max-age=2, stale-while-revalidate=5");
      res.setHeader("X-FanOut-Tier", "edge-replica");

      if (liveMatchesServerCache.data.length > 0 && now - liveMatchesServerCache.timestamp < CACHE_WINDOW_MS) {
        if (req.headers["if-none-match"] === liveMatchesServerCache.etag) {
          return res.status(304).end();
        }
        res.setHeader("ETag", liveMatchesServerCache.etag);
        return res.json({
          source: "edge_cache",
          cachedAt: liveMatchesServerCache.timestamp,
          etag: liveMatchesServerCache.etag,
          matches: liveMatchesServerCache.data
        });
      }

      // If Firestore quota was recently exceeded, serve from edge cache without making failing RPCs
      if (isServerFirestoreQuotaExhausted()) {
        if (liveMatchesServerCache.data.length > 0) {
          res.setHeader("ETag", liveMatchesServerCache.etag);
          return res.json({
            source: "edge_cache_quota_paused",
            cachedAt: liveMatchesServerCache.timestamp,
            etag: liveMatchesServerCache.etag,
            matches: liveMatchesServerCache.data
          });
        }
        return res.json({
          source: "fallback_quota_paused",
          cachedAt: now,
          etag: `W/"livefeed-quota-${now}"`,
          matches: []
        });
      }

      const db = await getFirebaseDb();
      if (!db) {
        // Fall back to stale cache if available
        if (liveMatchesServerCache.data.length > 0) {
          res.setHeader("ETag", liveMatchesServerCache.etag);
          return res.json({
            source: "edge_cache_fallback",
            cachedAt: liveMatchesServerCache.timestamp,
            etag: liveMatchesServerCache.etag,
            matches: liveMatchesServerCache.data
          });
        }
        return res.status(503).json({ error: "Database not available" });
      }

      const { collection, query, where, getDocs, limit, orderBy } = await import("firebase/firestore");
      
      const rawMatches: any[] = [];
      try {
        // Query active live matches first
        const liveQ = query(
          collection(db, "cricket_matches"),
          where("status", "==", "live"),
          limit(10)
        );
        const liveSnap = await getDocs(liveQ);
        liveSnap.forEach(d => rawMatches.push({ id: d.id, ...d.data() }));

        // If no live matches, fetch top 3 most recent completed matches for spectator display
        if (rawMatches.length === 0) {
          const recentQ = query(
            collection(db, "cricket_matches"),
            orderBy("updatedAt", "desc"),
            limit(5)
          );
          try {
            const recSnap = await getDocs(recentQ);
            recSnap.forEach(d => rawMatches.push({ id: d.id, ...d.data() }));
          } catch (_) {
            // fallback without orderBy if index is building
            const fallbackSnap = await getDocs(query(collection(db, "cricket_matches"), limit(5)));
            fallbackSnap.forEach(d => rawMatches.push({ id: d.id, ...d.data() }));
          }
        }
      } catch (dbErr: any) {
        if (isServerQuotaError(dbErr)) {
          recordServerFirestoreQuotaExhaustion(3);
          if (liveMatchesServerCache.data.length > 0) {
            res.setHeader("ETag", liveMatchesServerCache.etag);
            return res.json({
              source: "edge_cache_quota_paused",
              cachedAt: liveMatchesServerCache.timestamp,
              etag: liveMatchesServerCache.etag,
              matches: liveMatchesServerCache.data
            });
          }
          return res.json({
            source: "fallback_quota_paused",
            cachedAt: now,
            etag: `W/"livefeed-quota-${now}"`,
            matches: []
          });
        }
        throw dbErr;
      }

      const deletedIds = loadDeletedMatchIds();
      const summaries = rawMatches
        .filter(m => m && !m.isDeleted && m.status !== "deleted" && !deletedIds.includes(m.id))
        .map(extractServerLiveSummary);

      const etag = `W/"livefeed-${now}-${summaries.length}-${summaries[0]?.updatedAt || 0}"`;
      liveMatchesServerCache = {
        timestamp: now,
        etag,
        data: summaries
      };

      // Also warm matchSummaryServerCache for each match
      for (const s of summaries) {
        if (s && s.id) {
          const sEtag = `W/"match-${s.id}-${now}-${s.updatedAt || 0}"`;
          matchSummaryServerCache.set(s.id, { timestamp: now, etag: sEtag, data: s });
        }
      }

      res.setHeader("ETag", etag);
      return res.json({
        source: "origin_db",
        cachedAt: now,
        etag,
        matches: summaries
      });
    } catch (err: any) {
      if (isServerQuotaError(err)) {
        recordServerFirestoreQuotaExhaustion(3);
      }
      // Serve stale cache if available rather than erroring
      if (liveMatchesServerCache.data.length > 0) {
        return res.json({
          source: "edge_cache_emergency",
          cachedAt: liveMatchesServerCache.timestamp,
          etag: liveMatchesServerCache.etag,
          matches: liveMatchesServerCache.data
        });
      }
      // Graceful fallback to empty list instead of breaking clients
      return res.json({
        source: "fallback_empty",
        cachedAt: Date.now(),
        etag: `W/"livefeed-empty-${Date.now()}"`,
        matches: []
      });
    }
  });

  // 2. High-Traffic Match Summary Read-Replica Endpoint (/api/cricket/match-summary/:id)
  app.get("/api/cricket/match-summary/:matchId", async (req, res) => {
    try {
      const { matchId } = req.params;
      if (!matchId) return res.status(400).json({ error: "matchId required" });

      const now = Date.now();
      const CACHE_WINDOW_MS = 3000; // 3 seconds micro-cache

      res.setHeader("Cache-Control", "public, max-age=2, stale-while-revalidate=5");
      res.setHeader("X-FanOut-Tier", "edge-replica");

      const cached = matchSummaryServerCache.get(matchId);
      if (cached && now - cached.timestamp < CACHE_WINDOW_MS) {
        if (req.headers["if-none-match"] === cached.etag) {
          return res.status(304).end();
        }
        res.setHeader("ETag", cached.etag);
        return res.json({
          source: "edge_cache",
          cachedAt: cached.timestamp,
          etag: cached.etag,
          summary: cached.data
        });
      }

      // If server Firestore quota was recently exceeded, serve from edge cache or live feed immediately
      if (isServerFirestoreQuotaExhausted()) {
        if (cached) {
          if (req.headers["if-none-match"] === cached.etag) {
            return res.status(304).end();
          }
          res.setHeader("ETag", cached.etag);
          return res.json({
            source: "edge_cache_quota_paused",
            cachedAt: cached.timestamp,
            etag: cached.etag,
            summary: cached.data
          });
        }
        const liveFallback = liveMatchesServerCache.data.find((m: any) => m && m.id === matchId);
        if (liveFallback) {
          const fallbackEtag = `W/"match-${matchId}-${now}-${liveFallback.updatedAt || 0}"`;
          matchSummaryServerCache.set(matchId, { timestamp: now, etag: fallbackEtag, data: liveFallback });
          res.setHeader("ETag", fallbackEtag);
          return res.json({
            source: "live_feed_quota_paused",
            cachedAt: now,
            etag: fallbackEtag,
            summary: liveFallback
          });
        }
      }

      const db = await getFirebaseDb();
      if (!db) {
        if (cached) {
          res.setHeader("ETag", cached.etag);
          return res.json({
            source: "edge_cache_fallback",
            cachedAt: cached.timestamp,
            etag: cached.etag,
            summary: cached.data
          });
        }
        return res.status(503).json({ error: "Database not available" });
      }

      const { doc, getDoc } = await import("firebase/firestore");
      let docSnap: any = null;
      try {
        docSnap = await getDoc(doc(db, "cricket_matches", matchId));
      } catch (dbErr: any) {
        if (isServerQuotaError(dbErr)) {
          recordServerFirestoreQuotaExhaustion(3);
          if (cached) {
            res.setHeader("ETag", cached.etag);
            return res.json({
              source: "edge_cache_quota_fallback",
              cachedAt: cached.timestamp,
              etag: cached.etag,
              summary: cached.data
            });
          }
          const liveFallback = liveMatchesServerCache.data.find((m: any) => m && m.id === matchId);
          if (liveFallback) {
            const fallbackEtag = `W/"match-${matchId}-${now}-${liveFallback.updatedAt || 0}"`;
            return res.json({
              source: "live_feed_quota_fallback",
              cachedAt: now,
              etag: fallbackEtag,
              summary: liveFallback
            });
          }
          return res.json({
            source: "standby_quota_fallback",
            cachedAt: now,
            etag: `W/"standby-${matchId}-${now}"`,
            summary: {
              id: matchId,
              status: "live",
              teamA: "Team A",
              teamB: "Team B",
              score: { runs: 0, wickets: 0, ballsBowled: 0, oversFormatted: "0.0", crr: 0, rrr: null },
              updatedAt: now
            }
          });
        }
        throw dbErr;
      }

      if (!docSnap || !docSnap.exists()) {
        if (cached) {
          return res.json({
            source: "edge_cache_deleted_or_missing",
            cachedAt: cached.timestamp,
            etag: cached.etag,
            summary: cached.data
          });
        }
        return res.status(404).json({ error: "Match not found" });
      }

      const data = { id: docSnap.id, ...docSnap.data() } as any;
      const summary = extractServerLiveSummary(data);

      const etag = `W/"match-${matchId}-${now}-${data.updatedAt || 0}"`;
      const cacheObj = { timestamp: now, etag, data: summary };
      matchSummaryServerCache.set(matchId, cacheObj);

      // Clean old matches from map
      if (matchSummaryServerCache.size > 200) {
        const oldestKey = matchSummaryServerCache.keys().next().value;
        if (oldestKey) matchSummaryServerCache.delete(oldestKey);
      }

      res.setHeader("ETag", etag);
      return res.json({
        source: "origin_db",
        cachedAt: now,
        etag,
        summary
      });
    } catch (err: any) {
      if (isServerQuotaError(err)) {
        recordServerFirestoreQuotaExhaustion(3);
      }
      const matchId = req.params?.matchId;
      const cached = matchId ? matchSummaryServerCache.get(matchId) : null;
      if (cached) {
        res.setHeader("ETag", cached.etag);
        return res.json({
          source: "edge_cache_error_recovery",
          cachedAt: cached.timestamp,
          etag: cached.etag,
          summary: cached.data
        });
      }
      const liveFallback = matchId ? liveMatchesServerCache.data.find((m: any) => m && m.id === matchId) : null;
      if (liveFallback) {
        return res.json({
          source: "live_feed_error_recovery",
          cachedAt: Date.now(),
          etag: `W/"live-${matchId}-${Date.now()}"`,
          summary: liveFallback
        });
      }
      return res.json({
        source: "standby_error_recovery",
        cachedAt: Date.now(),
        etag: `W/"standby-${matchId || "unknown"}-${Date.now()}"`,
        summary: {
          id: matchId,
          status: "live",
          teamA: "Team A",
          teamB: "Team B",
          score: { runs: 0, wickets: 0, ballsBowled: 0, oversFormatted: "0.0", crr: 0, rrr: null },
          updatedAt: Date.now()
        }
      });
    }
  });

function pruneServerMatchPayload(payload: any, maxBytes = 800000): any {
  if (!payload || typeof payload !== "object") return payload;
  let clone: any = Array.isArray(payload) ? [...payload] : { ...payload };

  const getByteLength = (val: any): number => {
    try {
      return Buffer.byteLength(JSON.stringify(val), "utf8");
    } catch {
      return 0;
    }
  };

  let currentSize = getByteLength(clone);
  if (currentSize <= maxBytes) return clone;

  console.warn(`[Cricket Server Pruner] Match payload (${currentSize} bytes) exceeds limit (${maxBytes} bytes). Pruning...`);

  const imageKeys = ["teamALogo", "teamBLogo", "matchBannerUrl", "customOverlayImg"];
  for (const k of imageKeys) {
    if (typeof clone[k] === "string" && clone[k].length > 25000) {
      clone[k] = "";
    }
    if (clone.overlayConfig && typeof clone.overlayConfig[k] === "string" && clone.overlayConfig[k].length > 25000) {
      clone.overlayConfig[k] = "";
    }
  }

  if (clone.playerPhotos && typeof clone.playerPhotos === "object") {
    const photos: Record<string, string> = { ...clone.playerPhotos };
    for (const [pk, pv] of Object.entries(photos)) {
      if (typeof pv === "string" && pv.length > 20000) {
        delete photos[pk];
      }
    }
    clone.playerPhotos = photos;
  }

  currentSize = getByteLength(clone);
  if (currentSize <= maxBytes) return clone;

  delete clone.playerPhotos;
  for (const k of imageKeys) clone[k] = "";

  currentSize = getByteLength(clone);
  if (currentSize <= maxBytes) return clone;

  if (clone.innings1 && typeof clone.innings1 === "object") {
    clone.innings1 = { ...clone.innings1 };
    if (Array.isArray(clone.innings1.commentaryList) && clone.innings1.commentaryList.length > 75) {
      clone.innings1.commentaryList = clone.innings1.commentaryList.slice(-75);
    }
    if (Array.isArray(clone.innings1.history) && clone.innings1.history.length > 100) {
      clone.innings1.history = clone.innings1.history.slice(-100);
    }
  }
  if (clone.innings2 && typeof clone.innings2 === "object") {
    clone.innings2 = { ...clone.innings2 };
    if (Array.isArray(clone.innings2.commentaryList) && clone.innings2.commentaryList.length > 75) {
      clone.innings2.commentaryList = clone.innings2.commentaryList.slice(-75);
    }
    if (Array.isArray(clone.innings2.history) && clone.innings2.history.length > 100) {
      clone.innings2.history = clone.innings2.history.slice(-100);
    }
  }

  // Strip player photos from squad rosters safely
  if (Array.isArray(clone.teamASquad)) {
    clone.teamASquad = clone.teamASquad.map((p: any) => {
      if (p && typeof p === "object" && p.photo && typeof p.photo === "string" && p.photo.length > 20000) {
        const { photo, ...rest } = p;
        return rest;
      }
      return p;
    });
  }
  if (Array.isArray(clone.teamBSquad)) {
    clone.teamBSquad = clone.teamBSquad.map((p: any) => {
      if (p && typeof p === "object" && p.photo && typeof p.photo === "string" && p.photo.length > 20000) {
        const { photo, ...rest } = p;
        return rest;
      }
      return p;
    });
  }

  return cleanServerUndefined(clone);
}

function cleanServerUndefined(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(cleanServerUndefined);
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      result[k] = cleanServerUndefined(v);
    }
  }
  return result;
}

  // Set Active Match endpoint (switches match to 'live' and retires previous matches to 'completed')
  app.post("/api/cricket/set-active-match", async (req, res) => {
    try {
      const { managerId, matchId, streamKey, matchData } = req.body || {};
      if (!managerId || !matchId) {
        return res.status(400).json({ error: "managerId and matchId are required" });
      }

      const db = await getFirebaseDb();
      if (!db) {
        return res.status(503).json({ error: "Database not available" });
      }

      const { doc, setDoc, collection, query, where, getDocs } = await import("firebase/firestore");

      // 1. Mark target match as 'live' and assign managerId using setDoc with merge: true
      // This guarantees no '5 NOT_FOUND: No document to update' error even if client Firestore write is still pending
      const targetMatchRef = doc(db, "cricket_matches", matchId);
      const matchUpdatePayload: Record<string, any> = {
        id: matchId,
        status: "live",
        managerId,
        streamKey: streamKey || null,
        updatedAt: Date.now()
      };
      if (matchData && typeof matchData === "object") {
        Object.assign(matchUpdatePayload, matchData, {
          id: matchId,
          status: "live",
          managerId,
          streamKey: streamKey || null,
          updatedAt: Date.now()
        });
      }

      // Enforce Firestore 1MB document limit by pruning oversized media before persistence
      const prunedPayload = pruneServerMatchPayload(matchUpdatePayload, 800000);

      try {
        await setDoc(targetMatchRef, prunedPayload, { merge: true });
      } catch (writeErr: any) {
        console.warn("[Cricket API] Full match setDoc failed, attempting minimal core fallback:", writeErr.message);
        const fallbackCore: Record<string, any> = {
          id: matchId,
          status: "live",
          managerId,
          streamKey: streamKey || null,
          teamA: matchData?.teamA || "Team A",
          teamB: matchData?.teamB || "Team B",
          currentInningsNum: matchData?.currentInningsNum || 1,
          oversLimit: matchData?.oversLimit || 10,
          updatedAt: Date.now()
        };
        await setDoc(targetMatchRef, fallbackCore, { merge: true });
      }

      // Warm in-memory match summary cache immediately
      try {
        const summary = extractServerLiveSummary({ id: matchId, ...prunedPayload });
        if (summary) {
          const etag = `W/"match-${matchId}-${Date.now()}-${summary.updatedAt || 0}"`;
          matchSummaryServerCache.set(matchId, { timestamp: Date.now(), etag, data: summary });
        }
      } catch {}

      // 2. Retire any previously 'live' matches for this manager to 'completed'
      try {
        const oldMatchesQ = query(
          collection(db, "cricket_matches"),
          where("managerId", "==", managerId),
          where("status", "==", "live")
        );
        const oldSnaps = await getDocs(oldMatchesQ);
        for (const oldDoc of oldSnaps.docs) {
          if (oldDoc.id !== matchId) {
            await setDoc(doc(db, "cricket_matches", oldDoc.id), {
              status: "completed",
              updatedAt: Date.now()
            }, { merge: true });
          }
        }
      } catch (retireErr) {
        console.warn("[Cricket API] Error retiring old live matches:", retireErr);
      }

      // 3. Update pointer in score_managers
      const managerRef = doc(db, "score_managers", managerId);
      const pointerPayload = {
        managerId,
        streamKey: streamKey || null,
        activeMatchId: matchId,
        status: "live",
        updatedAt: Date.now()
      };
      await setDoc(managerRef, pointerPayload, { merge: true });

      // Keep official_scorer and default in sync so permanent OBS links resolve without delay
      await setDoc(doc(db, "score_managers", "official_scorer"), pointerPayload, { merge: true }).catch(() => {});
      await setDoc(doc(db, "score_managers", "default"), pointerPayload, { merge: true }).catch(() => {});

      if (streamKey) {
        await setDoc(doc(db, "score_managers", streamKey), {
          managerId,
          streamKey,
          activeMatchId: matchId,
          status: "live",
          updatedAt: Date.now()
        }, { merge: true }).catch(() => {});
      }

      return res.json({
        success: true,
        managerId,
        activeMatchId: matchId,
        status: "live",
        message: "Match is now LIVE on the permanent OBS overlay."
      });
    } catch (err: any) {
      console.error("[Cricket API] Error setting active match:", err);
      res.status(500).json({ error: err.message || "Failed to set active match" });
    }
  });

  // Complete match endpoint
  app.post("/api/cricket/complete-match", async (req, res) => {
    try {
      const { managerId, matchId } = req.body || {};
      if (!matchId) {
        return res.status(400).json({ error: "matchId required" });
      }

      const db = await getFirebaseDb();
      if (!db) {
        return res.status(503).json({ error: "Database not available" });
      }

      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "cricket_matches", matchId), {
        status: "completed",
        updatedAt: Date.now()
      }, { merge: true });

      if (managerId) {
        const managerRef = doc(db, "score_managers", managerId);
        await setDoc(managerRef, {
          activeMatchId: null,
          status: "completed",
          updatedAt: Date.now()
        }, { merge: true }).catch(() => {});
      }

      return res.json({ success: true, matchId, status: "completed" });
    } catch (err: any) {
      console.error("[Cricket API] Error completing match:", err);
      res.status(500).json({ error: err.message || "Failed to complete match" });
    }
  });

  // Resilient server-side cricket match save endpoint
  // Provides low-latency server-to-database write proxy when client WebChannel is congested or times out
  app.post("/api/cricket/save-match", async (req, res) => {
    try {
      const { matchId, matchData } = req.body || {};
      if (!matchId || typeof matchId !== "string") {
        return res.status(400).json({ error: "matchId string is required" });
      }

      const db = await getFirebaseDb();
      if (!db) {
        return res.status(503).json({ error: "Database not available" });
      }

      const { doc, setDoc } = await import("firebase/firestore");
      const matchDocRef = doc(db, "cricket_matches", matchId);
      
      const cleaned = cleanServerUndefined(matchData || {});
      const prunedPayload = pruneServerMatchPayload(cleaned, 800000);
      prunedPayload.updatedAt = Date.now();

      try {
        await setDoc(matchDocRef, prunedPayload, { merge: true });
      } catch (writeErr: any) {
        console.warn("[Cricket API] Initial setDoc failed, retrying with deep prune:", writeErr?.message || writeErr);
        const deepPruned = pruneServerMatchPayload(cleaned, 400000);
        deepPruned.updatedAt = Date.now();
        await setDoc(matchDocRef, deepPruned, { merge: true });
      }

      // Warm in-memory match summary cache immediately
      try {
        const summary = extractServerLiveSummary({ id: matchId, ...prunedPayload });
        if (summary) {
          const etag = `W/"match-${matchId}-${Date.now()}-${summary.updatedAt || 0}"`;
          matchSummaryServerCache.set(matchId, { timestamp: Date.now(), etag, data: summary });
        }
      } catch {}

      return res.json({ success: true, matchId, savedAt: Date.now() });
    } catch (err: any) {
      console.error("[Cricket API] Error saving match on server:", err);
      res.status(500).json({ error: err.message || "Failed to save match on server" });
    }
  });

  // Generic server-side document save endpoint for cricket collections
  app.post("/api/cricket/save-doc", async (req, res) => {
    try {
      const { collectionName, docId, data, options } = req.body || {};
      if (!collectionName || !docId) {
        return res.status(400).json({ error: "collectionName and docId are required" });
      }

      // Allowed cricket collections
      const allowedCollections = [
        "cricket_matches", 
        "cricket_tournaments", 
        "cricket_teams", 
        "cricket_players", 
        "cricket_sponsors", 
        "cricket_live_summaries", 
        "cricket_deleted_matches",
        "score_managers"
      ];
      if (!allowedCollections.includes(collectionName)) {
        return res.status(403).json({ error: `Collection ${collectionName} not authorized for proxy write` });
      }

      const db = await getFirebaseDb();
      if (!db) {
        return res.status(503).json({ error: "Database not available" });
      }

      const { doc, setDoc } = await import("firebase/firestore");
      const targetDocRef = doc(db, collectionName, docId);
      const cleaned = cleanServerUndefined(data || {});

      await setDoc(targetDocRef, cleaned, options || { merge: true });
      return res.json({ success: true, collectionName, docId, savedAt: Date.now() });
    } catch (err: any) {
      console.error("[Cricket API] Error saving document via proxy:", err);
      res.status(500).json({ error: err.message || "Failed to save document on server" });
    }
  });

  // Generic server-side document get endpoint for cricket collections (cross-device resilience)
  app.get("/api/cricket/get-doc", async (req, res) => {
    try {
      const collectionName = req.query.collectionName as string;
      const docId = req.query.docId as string;
      if (!collectionName || !docId) {
        return res.status(400).json({ error: "collectionName and docId query params are required" });
      }

      const allowedCollections = [
        "cricket_matches", 
        "cricket_tournaments", 
        "cricket_teams", 
        "cricket_players", 
        "cricket_sponsors", 
        "cricket_live_summaries", 
        "cricket_deleted_matches",
        "score_managers"
      ];
      if (!allowedCollections.includes(collectionName)) {
        return res.status(403).json({ error: `Collection ${collectionName} not authorized` });
      }

      const db = await getFirebaseDb();
      if (!db) {
        return res.status(503).json({ error: "Database not available" });
      }

      const { doc, getDoc } = await import("firebase/firestore");
      const targetDocRef = doc(db, collectionName, docId);
      const snap = await getDoc(targetDocRef);
      if (snap.exists()) {
        return res.json({ success: true, data: snap.data() });
      }
      return res.status(404).json({ error: "Document not found" });
    } catch (err: any) {
      console.error("[Cricket API] Error reading document via proxy:", err);
      res.status(500).json({ error: err.message || "Failed to read document on server" });
    }
  });

  // Heuristic cricket voice command parser for fallback
  function heuristicCricketVoiceParser(raw: string, lang = "mr-IN") {
    let text = (raw || "").toLowerCase().trim();

    // Replace fielding direction "midwicket" with safe token so it doesn't trigger "wicket"
    text = text.replace(/mid[\s-]?wicket/g, "mid_direction");

    // 0. Visual Overlays & TV Graphics (Voice-Activated Broadcast Displays)
    // Clear/Hide Overlay
    if (
      text.includes('hide overlay') || text.includes('close overlay') || text.includes('dismiss overlay') ||
      text.includes('clear overlay') || text.includes('clear graphics') || text.includes('remove overlay') ||
      text.includes('स्क्रीन साफ') || text.includes('ग्राफिक्स हटवा') || text.includes('ओवरले बंद') ||
      text.includes('ओवरले हटाओ') || text.includes('ओवरले हटवा') || text.includes('स्क्रीन क्लियर')
    ) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'overlay',
        overlayType: 'none',
        confidence: 0.98,
        explanation: 'Dismiss Live Broadcast Graphic Overlay'
      };
    }

    // Team vs Team Logo & Matchup Overlay
    if (
      text.includes('team vs team') || text.includes('team versus team') || text.includes('vs logo') ||
      text.includes('versus logo') || text.includes('vs overlay') || text.includes('team logo') ||
      text.includes('match card') || text.includes('matchup') || text.includes('clash') ||
      text.includes('टीम विरुद्ध टीम') || text.includes('दोन्ही टीमचा लोगो') || text.includes('टीम व्हर्सेस टीम') ||
      text.includes('टीम बनाम टीम') || text.includes('दोनों टीम का लोगो') || text.includes('टीम वर्सेस टीम') ||
      (text.includes('logo') && (text.includes('team') || text.includes('show'))) ||
      (text.includes('लोगो') && (text.includes('दाखवा') || text.includes('दिखाओ') || text.includes('टीम')))
    ) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'overlay',
        overlayType: 'team_vs_team',
        confidence: 0.98,
        explanation: 'Show Team VS Team Logo & Matchup Overlay'
      };
    }

    // Both Teams Squad List / Playing 11 Overlay
    if (
      text.includes('squad list') || text.includes('squad') || text.includes('squads') ||
      text.includes('playing 11') || text.includes('playing xi') || text.includes('lineup') || text.includes('lineups') ||
      text.includes('स्क्वॉड') || text.includes('प्लेईंग ११') || text.includes('प्लेइंग इलेव्हन') || text.includes('प्लेइंग 11') ||
      text.includes('खेळाडूंची यादी') || text.includes('दोनों टीम की स्क्वाड') || text.includes('दोन्ही टीमची स्क्वॉड') ||
      text.includes('खिलाड़ियों की सूची') || text.includes('टीम लिस्ट')
    ) {
      const isTeamB = text.includes('team b') || text.includes('टीम b') || text.includes('दुसरी टीम') || text.includes('दूसरी टीम');
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'overlay',
        overlayType: isTeamB ? 'squad_b' : 'squad_a',
        confidence: 0.98,
        explanation: isTeamB ? 'Show Team B Squad List Overlay' : 'Show Both Teams Squad List Overlay'
      };
    }

    // Field Position Overlay
    if (
      text.includes('field position') || text.includes('fielding position') || text.includes('fielding setup') ||
      text.includes('फील्डिंग पोझिशन') || text.includes('फील्डिंग सेट') || text.includes('फील्डिंग दिखाओ') || text.includes('फील्डिंग दाखवा')
    ) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'overlay',
        overlayType: 'field_positions',
        confidence: 0.96,
        explanation: 'Show Field Positions TV Overlay'
      };
    }

    // Batting Summary Overlay
    if (
      text.includes('batting summary') || text.includes('batting scorecard') ||
      text.includes('बॅटिंग सारांश') || text.includes('बैटिंग समरी') || text.includes('बॅटिंग कार्ड')
    ) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'overlay',
        overlayType: 'batting_summary',
        confidence: 0.96,
        explanation: 'Show Batting Summary Overlay'
      };
    }

    // Bowling Summary Overlay
    if (
      text.includes('bowling summary') || text.includes('bowling scorecard') ||
      text.includes('बॉलिंग सारांश') || text.includes('बॉलिंग समरी') || text.includes('बॉलिंग कार्ड')
    ) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'overlay',
        overlayType: 'bowling_summary',
        confidence: 0.96,
        explanation: 'Show Bowling Summary Overlay'
      };
    }

    // Tournament Logo Overlay
    if (
      text.includes('tournament logo') || text.includes('trophy logo') ||
      text.includes('स्पर्धा लोगो') || text.includes('टूर्नामेंट लोगो')
    ) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'overlay',
        overlayType: 'tournament_logo',
        confidence: 0.96,
        explanation: 'Show Tournament Logo Overlay'
      };
    }

    // Helper: Clean up extracted player names
    const cleanSpokenName = (nameStr: string): string => {
      if (!nameStr) return '';
      let cleaned = nameStr.trim();
      cleaned = cleaned.replace(/[.,?!:;]+$/, '').trim();
      cleaned = cleaned.replace(/\s+(आहे|आहेत|येईल|आणा|द्या|करा|खेळेल|खेळतोय|है|हैं|आएगा|लाओ|दो|करेगा|खेलेगा|please|now|is|here|come)$/i, '').trim();
      cleaned = cleaned.replace(/^(नाव|नाम|name|named)\s+/i, '').trim();
      if (/^[a-zA-Z\s]+$/.test(cleaned)) {
        cleaned = cleaned.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
      return cleaned;
    };

    // Opening Pair Detection
    const openersMatch = text.match(/(?:opening\s+pair|openers?|सलामी\s+जोडी(?:दार)?|ओपनर(?:्स)?|सलामी\s+बल्लेबाज)\s+([^\s,]+(?:\s+[^\s,]+)?)\s+(?:and|&|आणि|और|व)\s+([^\s,]+(?:\s+[^\s,]+)?)/i);
    if (openersMatch) {
      const p1 = cleanSpokenName(openersMatch[1]);
      const p2 = cleanSpokenName(openersMatch[2]);
      if (p1 && p2) {
        return {
          rawTranscript: raw,
          detectedLang: lang,
          intent: 'set_openers',
          playerName: p1,
          nonStrikerName: p2,
          confidence: 0.98,
          explanation: `Set Openers: ${p1} & ${p2}`
        };
      }
    }

    // Non-Striker Batsman
    const nonStrikerMatch = text.match(/(?:non[\s-]?striker|नॉन[\s-]?स्ट्रायकर|नॉन[\s-]?स्ट्राइकर|दुसरा\s+बॅट्समन|दूसरा\s+बल्लेबाज)\s+([^\s,]+(?:\s+[^\s,]+)?)/i);
    if (nonStrikerMatch) {
      const p = cleanSpokenName(nonStrikerMatch[1]);
      if (p && !['change', 'swap', 'बदला', 'बदलो'].includes(p.toLowerCase())) {
        return {
          rawTranscript: raw,
          detectedLang: lang,
          intent: 'set_batsman',
          batsmanRole: 'non-striker',
          playerName: p,
          confidence: 0.96,
          explanation: `Set Non-Striker: ${p}`
        };
      }
    }

    // Striker Batsman
    const strikerMatch = text.match(/(?:striker|स्ट्रायकर|स्ट्राइकर)\s+(?:बॅट्समन\s+|बल्लेबाज\s+)?([^\s,]+(?:\s+[^\s,]+)?)/i) ||
      text.match(/([^\s,]+(?:\s+[^\s,]+)?)\s+(?:on\s+strike|स्ट्राइकवर|स्ट्राइक\s+पर)/i);
    if (strikerMatch) {
      const p = cleanSpokenName(strikerMatch[1]);
      if (p && !['change', 'swap', 'बदला', 'बदलो', 'rotate'].includes(p.toLowerCase())) {
        return {
          rawTranscript: raw,
          detectedLang: lang,
          intent: 'set_batsman',
          batsmanRole: 'striker',
          playerName: p,
          confidence: 0.96,
          explanation: `Set Striker: ${p}`
        };
      }
    }

    // New Batsman / Next Batsman (Wicket fall or change)
    const newBatsmanMatch = text.match(/(?:new\s+batsman|next\s+batsman|incoming\s+batsman|नवीन\s+बॅट्समन|नवीन\s+फलंदाज|पुढचा\s+फलंदाज|पुढचा\s+बॅट्समन|नया\s+बल्लेबाज|अगला\s+बल्लेबाज|नया\s+बैट्समैन)\s+([^\s,]+(?:\s+[^\s,]+)?)/i);
    if (newBatsmanMatch) {
      const p = cleanSpokenName(newBatsmanMatch[1]);
      if (p) {
        return {
          rawTranscript: raw,
          detectedLang: lang,
          intent: 'set_batsman',
          batsmanRole: 'new_batsman',
          playerName: p,
          confidence: 0.96,
          explanation: `New Batsman: ${p}`
        };
      }
    }

    // New Bowler / Next Bowler / Change Bowler
    const bowlerMatch = text.match(/(?:new\s+bowler|next\s+bowler|change\s+bowler|opening\s+bowler|bowler|नवीन\s+बॉलर|पुढचा\s+बॉलर|बॉलर\s+बदला|बॉलर\s+बदलो|पहिला\s+बॉलर|नवीन\s+गोलंदाज|पुढचा\s+गोलंदाज|गोलंदाज|बॉलर|नया\s+गेंदबाज|अगला\s+गेंदबाज|गेंदबाज|पहला\s+गेंदबाज)\s+([^\s,]+(?:\s+[^\s,]+)?)/i);
    if (bowlerMatch) {
      const p = cleanSpokenName(bowlerMatch[1]);
      const disallowedWords = ['name', 'change', 'बदला', 'बदलो', 'दाखवा', 'दिखाओ', 'कार्ड', 'समरी', 'summary', 'list', 'यादी'];
      if (p && !disallowedWords.includes(p.toLowerCase())) {
        return {
          rawTranscript: raw,
          detectedLang: lang,
          intent: 'set_bowler',
          playerName: p,
          confidence: 0.96,
          explanation: `Bowler: ${p}`
        };
      }
    }

    // 1. Undo
    if (text.includes('undo') || text.includes('अनडू') || text.includes('मागे') || text.includes('वापस') || text.includes('रद्द')) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'undo',
        confidence: 0.95,
        explanation: 'Undo previous ball'
      };
    }

    // =========================================================================
    // 2. COMPOUND CALLS: NO BALL + BOUNDARY / RUNS (Free Hit next)
    // Checked BEFORE plain boundary to prevent masking!
    // =========================================================================
    if (
      text.includes('no ball') || text.includes('noball') || text.includes('no-ball') ||
      text.includes('नो बॉल') || text.includes('नोबॉल') || text.includes('नो बाल') || 
      text.includes('free hit') || text.includes('फ्री हिट')
    ) {
      let extraRuns = 0;
      if (
        text.includes('6') || text.includes('six') || text.includes('sixer') || 
        text.includes('सहा') || text.includes('छक्का') || text.includes('षटकार') || 
        text.includes('सिक्स') || text.includes('maximum')
      ) {
        extraRuns = 6;
      } else if (
        text.includes('4') || text.includes('four') || text.includes('चार') || 
        text.includes('चौका') || text.includes('चौकार') || text.includes('फोर') || 
        text.includes('boundary') || text.includes('बाउंड्री')
      ) {
        extraRuns = 4;
      } else if (text.includes('3') || text.includes('three') || text.includes('तीन')) {
        extraRuns = 3;
      } else if (text.includes('2') || text.includes('two') || text.includes('दोन') || text.includes('दो')) {
        extraRuns = 2;
      } else if (text.includes('1') || text.includes('one') || text.includes('एक') || text.includes('single')) {
        extraRuns = 1;
      }

      const totalRuns = 1 + extraRuns;
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'noball',
        extraRuns,
        confidence: 0.98,
        explanation: extraRuns > 0 ? `No Ball + ${extraRuns} run(s) [Total +${totalRuns} runs, Free Hit next]` : 'No Ball (+1) [Free Hit next]'
      };
    }

    // =========================================================================
    // 3. COMPOUND CALLS: WIDE + BOUNDARY / RUNS / STUMPED
    // Checked BEFORE plain boundary to prevent masking!
    // =========================================================================
    if (text.includes('wide') || text.includes('वाईड') || text.includes('व्हाईड') || text.includes('वाइड')) {
      if (text.includes('stump') || text.includes('स्टंप')) {
        return {
          rawTranscript: raw,
          detectedLang: lang,
          intent: 'wide',
          extraRuns: 0,
          wicketType: 'stumped',
          confidence: 0.98,
          explanation: 'Wide Delivery + STUMPED OUT'
        };
      }

      let extraRuns = 0;
      if (
        text.includes('4') || text.includes('four') || text.includes('चार') || 
        text.includes('चौका') || text.includes('चौकार') || text.includes('फोर') || 
        text.includes('boundary') || text.includes('बाउंड्री')
      ) {
        extraRuns = 4;
      } else if (text.includes('3') || text.includes('three') || text.includes('तीन')) {
        extraRuns = 3;
      } else if (text.includes('2') || text.includes('two') || text.includes('दोन') || text.includes('दो')) {
        extraRuns = 2;
      } else if (text.includes('1') || text.includes('one') || text.includes('एक') || text.includes('single')) {
        extraRuns = 1;
      }

      const totalWide = 1 + extraRuns;
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'wide',
        extraRuns,
        confidence: 0.98,
        explanation: extraRuns > 0 ? `Wide + ${extraRuns} run(s) [Total +${totalWide} runs]` : 'Wide Ball (+1)'
      };
    }

    // =========================================================================
    // 4. Plain Sixes (6)
    // =========================================================================
    if (
      text.includes('six') || text.includes('sixer') || text.includes('षटकार') || 
      text.includes('छक्का') || text.includes('सहा') || text.includes('छह') || 
      text.includes('सिक्स') || text.includes('maximum') || text === '6'
    ) {
      return { rawTranscript: raw, detectedLang: lang, intent: 'runs', runs: 6, confidence: 0.96, explanation: 'SIX! 6 Runs' };
    }

    // =========================================================================
    // 5. Plain Fours (4)
    // =========================================================================
    if (
      text.includes('four') || text.includes('चौकार') || text.includes('चौका') || 
      text.includes('चार') || text.includes('फोर') || text.includes('boundary') || text === '4'
    ) {
      return { rawTranscript: raw, detectedLang: lang, intent: 'runs', runs: 4, confidence: 0.96, explanation: 'FOUR! 4 Runs' };
    }

    // 6. Genuine Wickets
    if (
      /\b(out|wicket|bowled|caught|lbw|stumped|dismissed)\b/.test(text) || 
      text.includes('बाद') || text.includes('आउट') || text.includes('बोल्ड') ||
      text.includes('झेल') || text.includes('कैच') || text.includes('रन आउट') ||
      text.includes('run out') || text.includes('दांडी') || text.includes('पायचीत') ||
      text.includes('विकेट') || text.includes('क्लीन बोल्ड')
    ) {
      let wicketType = 'caught';
      if (text.includes('bold') || text.includes('bowled') || text.includes('बोल्ड') || text.includes('दांडी')) wicketType = 'bowled';
      else if (text.includes('run out') || text.includes('रन आउट')) wicketType = 'run_out';
      else if (text.includes('stump') || text.includes('स्टंप')) wicketType = 'stumped';
      else if (text.includes('lbw') || text.includes('पायचीत')) wicketType = 'lbw';
      else if (text.includes('hit wicket') || text.includes('हिट')) wicketType = 'hit_wicket';

      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'wicket',
        wicketType,
        confidence: 0.95,
        explanation: `Wicket (${wicketType.toUpperCase()}) recorded`
      };
    }

    // 7. Swap batsmen / strike rotate
    if (text.includes('swap') || text.includes('स्ट्राइक बदला') || text.includes('स्ट्राइक चेंज') || text.includes('strike') || text.includes('रोटेट')) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'swap_batsmen',
        confidence: 0.9,
        explanation: 'Swap striker & non-striker'
      };
    }

    // 8. Leg Bye / Bye
    if (text.includes('leg bye') || text.includes('legbye') || text.includes('लेग बाय') || text.includes('लेगबाई')) {
      let runs = 1;
      if (text.includes('4') || text.includes('four') || text.includes('चार')) runs = 4;
      else if (text.includes('2') || text.includes('two') || text.includes('दोन')) runs = 2;
      return { rawTranscript: raw, detectedLang: lang, intent: 'legbye', runs, confidence: 0.9, explanation: `Leg Bye +${runs}` };
    }
    if (text.includes('bye') || text.includes('बाय') || text.includes('बाई')) {
      let runs = 1;
      if (text.includes('4') || text.includes('four') || text.includes('चार')) runs = 4;
      else if (text.includes('2') || text.includes('two') || text.includes('दोन')) runs = 2;
      return { rawTranscript: raw, detectedLang: lang, intent: 'bye', runs, confidence: 0.9, explanation: `Bye +${runs}` };
    }

    // 7. Dot Ball
    if (
      text.includes('dot') || text.includes('डॉट') || text.includes('निर्धाव') || 
      text.includes('शून्य') || text.includes('zero') || text.includes('no run') || 
      text.includes('खाली') || text === '0'
    ) {
      return { rawTranscript: raw, detectedLang: lang, intent: 'dot', runs: 0, confidence: 0.95, explanation: 'Dot Ball (0 runs)' };
    }

    // 8. Sixes (6)
    if (
      text.includes('six') || text.includes('sixer') || text.includes('षटकार') || 
      text.includes('छक्का') || text.includes('सहा') || text.includes('छह') || 
      text.includes('सिक्स') || text.includes('maximum') || text === '6'
    ) {
      return { rawTranscript: raw, detectedLang: lang, intent: 'runs', runs: 6, confidence: 0.96, explanation: 'SIX! 6 Runs' };
    }

    // 9. Fours (4)
    if (
      text.includes('four') || text.includes('चौकार') || text.includes('चौका') || 
      text.includes('चार') || text.includes('फोर') || text.includes('boundary') || text === '4'
    ) {
      return { rawTranscript: raw, detectedLang: lang, intent: 'runs', runs: 4, confidence: 0.96, explanation: 'FOUR! 4 Runs' };
    }

    // 10. Singles & small runs (1, 2, 3)
    if (text.includes('one') || text.includes('single') || text.includes('एक') || text.includes('सिंगल') || text === '1') {
      return { rawTranscript: raw, detectedLang: lang, intent: 'runs', runs: 1, confidence: 0.92, explanation: 'Single (1 run)' };
    }
    if (text.includes('two') || text.includes('double') || text.includes('दोन') || text.includes('दो') || text.includes('डबल') || text === '2') {
      return { rawTranscript: raw, detectedLang: lang, intent: 'runs', runs: 2, confidence: 0.92, explanation: 'Two runs (2)' };
    }
    if (text.includes('three') || text.includes('triple') || text.includes('तीन') || text === '3') {
      return { rawTranscript: raw, detectedLang: lang, intent: 'runs', runs: 3, confidence: 0.92, explanation: 'Three runs (3)' };
    }

    return {
      rawTranscript: raw,
      detectedLang: lang,
      intent: 'unknown',
      confidence: 0.2,
      explanation: `Could not determine scoring action from: "${raw}". Speak: 1, 2, 4, 6, Dot, Wide, or Out.`
    };
  }

  // AI Voice-Assisted Cricket Scoring Parser Endpoint
  app.post("/api/cricket/parse-voice-score", async (req, res) => {
    try {
      const { transcript, language = "mr-IN", strikerName, bowlerName } = req.body || {};
      if (!transcript || typeof transcript !== "string") {
        return res.status(400).json({ error: "transcript is required" });
      }

      const cleanText = transcript.trim();
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.json({
          ...heuristicCricketVoiceParser(cleanText, language),
          source: "heuristic_no_key"
        });
      }

      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });

        const prompt = `You are a specialized Gully Cricket Scoring and Broadcast AI Assistant.
A cricket scorer spoke a commentary phrase or voice command in Marathi, Hindi, or English.
Spoken phrase: "${cleanText}"
Context:
- Current striker: "${strikerName || 'Batsman'}"
- Current bowler: "${bowlerName || 'Bowler'}"
- Language code: "${language}"

Determine the exact cricket scoring event, player selection, or broadcast overlay request and return ONLY a single JSON object with these fields:
{
  "intent": "runs" | "dot" | "wide" | "noball" | "wicket" | "bye" | "legbye" | "swap_batsmen" | "undo" | "overlay" | "set_batsman" | "set_bowler" | "set_openers" | "unknown",
  "runs": number (0 to 6),
  "extraRuns": number (0 for normal wide/noball, or extra runs taken e.g. 1 if wide+1, 4 if wide+4, 6 if noball+6),
  "wicketType": "bowled" | "caught" | "run_out" | "lbw" | "stumped" | "hit_wicket" | null,
  "overlayType": "team_vs_team" | "squad_a" | "squad_b" | "field_positions" | "batting_summary" | "bowling_summary" | "tournament_logo" | "toss_result" | "none" | null,
  "playerName": string | null,
  "batsmanRole": "striker" | "non-striker" | "new_batsman" | null,
  "nonStrikerName": string | null,
  "confidence": number,
  "explanation": "short friendly summary in English"
}

Player & Team Management Rules:
- "openers Rohit and Virat", "सलामी जोडी सचिन आणि सौरव", "ओपनर रोहित और विराट" -> intent: "set_openers", playerName: "Rohit", nonStrikerName: "Virat", explanation: "Set Opening Pair: Rohit & Virat"
- "striker Rohit", "बॅट्समन रोहित", "स्ट्रायकर रोहित", "स्ट्राइकर रोहित" -> intent: "set_batsman", batsmanRole: "striker", playerName: "Rohit", explanation: "Set Striker: Rohit"
- "non striker Virat", "नॉन स्ट्रायकर विराट", "नॉन स्ट्राइकर विराट" -> intent: "set_batsman", batsmanRole: "non-striker", playerName: "Virat", explanation: "Set Non-Striker: Virat"
- "new batsman Rahul", "next batsman Rahul", "नवीन फलंदाज राहुल", "नया बल्लेबाज राहुल" -> intent: "set_batsman", batsmanRole: "new_batsman", playerName: "Rahul", explanation: "Set Incoming Batsman: Rahul"
- "new bowler Bumrah", "next bowler Shami", "change bowler Bumrah", "नवीन बॉलर बुमराह", "नया गेंदबाज बुमराह", "पुढचा बॉलर शमी" -> intent: "set_bowler", playerName: "Bumrah", explanation: "Set Bowler: Bumrah"

Important Broadcast Overlay Rules:
- "show the team vs team logo", "show team vs team", "टीम विरुद्ध टीम लोगो दाखवा", "टीम वर्सेस टीम लोगो दिखाओ", "versus logo" -> intent: "overlay", overlayType: "team_vs_team", explanation: "Show Team vs Team Logo Overlay"
- "show the both team squad list", "show both squads", "show squad list", "दोन्ही टीमची स्क्वॉड दाखवा", "दोनों टीम की स्क्वाड दिखाओ", "playing 11" -> intent: "overlay", overlayType: "squad_a", explanation: "Show Team Squad List Overlay"
- "show team b squad" -> intent: "overlay", overlayType: "squad_b", explanation: "Show Team B Squad List Overlay"
- "show field position", "फील्डिंग दाखवा" -> intent: "overlay", overlayType: "field_positions", explanation: "Show Field Positions Overlay"
- "show batting summary", "बॅटिंग सारांश दाखवा" -> intent: "overlay", overlayType: "batting_summary", explanation: "Show Batting Summary Overlay"
- "show bowling summary", "बॉलिंग सारांश दाखवा" -> intent: "overlay", overlayType: "bowling_summary", explanation: "Show Bowling Summary Overlay"
- "show tournament logo", "स्पर्धा लोगो दाखवा" -> intent: "overlay", overlayType: "tournament_logo", explanation: "Show Tournament Logo Overlay"
- "hide overlay", "close overlay", "clear graphics", "ओवरले बंद करा", "स्क्रीन साफ करा" -> intent: "overlay", overlayType: "none", explanation: "Dismiss Live Graphic Overlay"

Scoring Rules:
- "चौकार", "चार धावा", "चार रन", "कव्हर ड्राईव्ह चार", "four runs", "boundary" -> intent: "runs", runs: 4
- "षटकार", "सहा धावा", "सहा रन", "सिक्स", "छक्का", "six", "maximum" -> intent: "runs", runs: 6
- "एक धाव", "एक रन", "सिंगल", "single", "one run" -> intent: "runs", runs: 1
- "दोन धावा", "दोन रन", "दो रन", "two runs", "double" -> intent: "runs", runs: 2
- "तीन धावा", "तीन रन", "three runs" -> intent: "runs", runs: 3
- "डॉट बॉल", "निर्धाव चेंडू", "डॉट", "शून्य रन", "dot ball", "no run" -> intent: "dot", runs: 0
- "वाईड", "वाईड बॉल", "वाइड गेंद", "wide" -> intent: "wide", extraRuns: 0
- "वाईड आणि एक", "wide plus 1" -> intent: "wide", extraRuns: 1
- "वाईड चौकार", "wide plus four" -> intent: "wide", extraRuns: 4
- "नो बॉल", "नोबॉल", "no ball", "free hit" -> intent: "noball", extraRuns: 0
- "नो बॉल चौकार", "no ball plus four" -> intent: "noball", extraRuns: 4
- "नो बॉल षटकार", "no ball plus six" -> intent: "noball", extraRuns: 6
- "विकेट", "बाद", "आउट", "बोल्ड", "कॅच", "झेल", "दांडी गुल", "पायचीत", "wicket", "bowled", "caught out" -> intent: "wicket"
- "बाय", "bye" -> intent: "bye", runs: 1
- "लेग बाय", "leg bye" -> intent: "legbye", runs: 1
- "स्ट्राइक बदला", "स्ट्राइक चेंज", "रोटेट स्ट्राइक", "swap strike", "strike change" -> intent: "swap_batsmen"
- "मागे घ्या", "अनडू", "वापस", "undo last ball" -> intent: "undo"

Output ONLY the JSON object without markdown fences.`;

        const response = await generateContentWithFallback(ai, {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            temperature: 0.1,
            maxOutputTokens: 250,
          },
        });

        const rawText = (response.text || "").trim();
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return res.json({
            rawTranscript: cleanText,
            detectedLang: language,
            ...parsed,
            source: "gemini_ai"
          });
        }
      } catch (geminiErr: any) {
        console.warn("[Voice AI Scorer] Gemini fallback to heuristic:", geminiErr.message || geminiErr);
      }

      return res.json({
        ...heuristicCricketVoiceParser(cleanText, language),
        source: "heuristic_fallback"
      });
    } catch (err: any) {
      console.error("[Voice AI Scorer] Error in voice score endpoint:", err);
      res.status(500).json({ error: "Failed to parse voice score command" });
    }
  });

  // Gemini API Proxy Route
  app.post("/api/chat", async (req, res) => {
    console.log("AI Chat request received");
    try {
      const { userMessage, portfolioData, language } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        console.error("GEMINI_API_KEY missing");
        return res.status(500).json({ error: "GEMINI_API_KEY is not set on the server." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
      
      const systemInstruction = `
        You are an AI assistant for Shubham Hingane, a Software Developer and Computer Engineer.
        Your goal is to help visitors learn more about Shubham, his services, skills, and projects.
        
        Current Language: ${language}
        
        PORTFOLIO CONTEXT:
        ${JSON.stringify(portfolioData)}
        
        INSTRUCTIONS:
        - Answer in the same language as the user is asking (${language}).
        - Be professional, friendly, and helpful.
        - If you don't know something, suggest they contact Shubham through the contact form.
        - Keep responses relatively concise but informative.
        - Do not mention that you have context in JSON format. Just act as a knowledgeable assistant.
      `;

      const response = await generateContentWithFallback(ai, {
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        config: {
          systemInstruction,
        },
      });

      res.json({ text: response.text || "I'm sorry, I couldn't generate a response." });
    } catch (error: any) {
      console.warn("Gemini Chat API standby mode triggered:", error.message || error);
      res.json({ 
        text: "I am Shubham's virtual AI assistant. It looks like my high-performance server is currently experiencing a temporary quota or traffic limit event. No worries! Shubham Hingane is a passionate and skilled Software Developer and Computer Science graduate specializing in Full-Stack Web Development, React, Node.js, and Cloud Solutions. He loves building premium applications like GullyScore. Feel free to leave a message in the Contact Section or reach out directly at Shubhamhingane7719@gmail.com!" 
      });
    }
  });

  // Dynamic street/gully style local commentary multilingual generator (English, Hindi, Marathi)
  function getGullyCommentaryMultilingual(
    event: any,
    batsmanName: string,
    bowlerName: string,
    originalDesc: string,
    newBatsmanName?: string,
    contextualTone?: string,
    specialTrigger?: any,
    winProbability?: any,
    tournamentName?: string,
    groundName?: string,
    isCrucialTime?: boolean
  ): { en: string; hi: string; mr: string } {
    const bats = batsmanName || 'The batsman';
    const bowl = bowlerName || 'The bowler';
    const type = event?.type || 'unknown';
    const val = event?.val ?? 0;
    const extraType = event?.extraType || '';
    const oLower = (originalDesc || '').toLowerCase();

    function appendWinProb(result: { en: string; hi: string; mr: string }): { en: string; hi: string; mr: string } {
      // User directive: only show win probability at crucial times ("cryshal time"), never on routine balls!
      if (!isCrucialTime) return result;
      if (!winProbability || !winProbability.teamA || !winProbability.teamB) return result;
      const pA = Math.round(winProbability.probA ?? 50);
      const pB = Math.round(winProbability.probB ?? 50);
      const tagEn = ` [AI Win Probability: ${winProbability.teamA} ${pA}% | ${winProbability.teamB} ${pB}%]`;
      const tagHi = ` [AI जीत की संभावना: ${winProbability.teamA} ${pA}% | ${winProbability.teamB} ${pB}%]`;
      const tagMr = ` [AI विजयाची शक्यता: ${winProbability.teamA} ${pA}% | ${winProbability.teamB} ${pB}%]`;

      return {
        en: result.en.includes('[AI') ? result.en : `${result.en}${tagEn}`,
        hi: result.hi.includes('[AI') ? result.hi : `${result.hi}${tagHi}`,
        mr: result.mr.includes('[AI') ? result.mr : `${result.mr}${tagMr}`
      };
    }

    // Match Start Announcement with Tournament Name and Ground Name
    if (type === 'match_start' || event?.isMatchStart || (oLower.includes('new batsman are come on crease') && oLower.includes('first over'))) {
      const tName = (tournamentName || 'Tournament').trim();
      const gName = (groundName || 'Gully Ground').trim();
      const tournHdr = tName ? `🏆 [${tName}] ` : '';
      return appendWinProb({
        en: `${tournHdr}🏟️ Live from ${gName}: An exhilarating cricket clash is underway! ${bats} and partner are ready on the crease, and ${bowl} is warming up to deliver the first over!`,
        hi: `${tournHdr}🏟️ ${gName} से सीधा लाइव: एक शानदार और रोमांचक मुकाबला शुरू हो चुका है! ${bats} क्रीज पर मौजूद हैं और ${bowl} पहला ओवर फेंकने के लिए तैयार!`,
        mr: `${tournHdr}🏟️ ${gName} येथून थेट प्रक्षेपण: एका अटीतटीच्या रोमांचक सामन्याला सुरुवात झाली आहे! ${bats} क्रीजवर सज्ज असून ${bowl} पहिले षटक टाकण्यासाठी सज्ज आहेत!`
      });
    }

    // Special check for No-Ball with taken runs
    const isNoBallDelivery = type === 'noball' || extraType === 'noball' || oLower.includes('no-ball') || oLower.includes('no ball');
    if (isNoBallDelivery) {
      let batRuns = (val !== undefined && val !== null && !isNaN(val)) ? Number(val) : 0;
      if (!batRuns && originalDesc) {
        const m = originalDesc.match(/(\d+)\s*runs?\s*(?:scored|to\s*batsman|taken)/i) || originalDesc.match(/(?:plus|\+)\s*(\d+)\s*runs?/i);
        if (m) batRuns = parseInt(m[1], 10);
      }
      if (batRuns > 0) {
        return appendWinProb({
          en: `🚨 NO-BALL PLUS ${batRuns} RUN${batRuns > 1 ? 'S' : ''}! ${bowl} oversteps the bowling crease, and ${bats} punishes it taking ${batRuns} run${batRuns > 1 ? 's' : ''}! Free-hit awarded on the very next ball!`,
          hi: `🚨 नो-बॉल और ${batRuns} अतिरिक्त रन! ${bowl} का पैर क्रीज से बाहर और ${bats} ने शानदार तरीके से ${batRuns} रन बटोरे! अगली गेंद पर फ्री-हिट का मौका!`,
          mr: `🚨 नो-बॉल आणि ${batRuns} धावा! ${bowl} चा पाय क्रीजच्या रेषेबाहेर गेला आणि ${bats} ने सुरेख फटका मारून ${batRuns} धावा वसूल केल्या! पुढील चेंडूवर फ्री-हिट!`
        });
      } else {
        return appendWinProb({
          en: `🚨 NO-BALL CALLED! ${bowl} steps over the front bowling crease line! 1 extra run conceded and Free-hit awarded to ${bats}!`,
          hi: `🚨 नो-बॉल! ${bowl} ने क्रीज ओवरस्टेप की! १ अतिरिक्त रन और अगली गेंद पर ${bats} को फ्री-हिट!`,
          mr: `🚨 नो-बॉल! ${bowl} चा पाय क्रीज रेषेबाहेर! १ अतिरिक्त धाव आणि ${bats} ला पुढील चेंडूवर फ्री-हिट!`
        });
      }
    }

    // If a special milestone/wicket trigger is present, deliver an enthusiastic breakdown
    if (specialTrigger) {
      if (specialTrigger.type === 'fifty') {
        const b = specialTrigger.batterName || bats;
        const r = specialTrigger.batterRuns || 50;
        const balls = specialTrigger.batterBalls || 25;
        const sr = specialTrigger.strikeRate || ((r / Math.max(1, balls)) * 100).toFixed(1);
        return {
          en: `🌟 FIFTY BREAKDOWN: Sensational Half-Century for ${b}! 50 runs completed in ${balls} balls with ferocious hitting (Strike Rate: ${sr})! The entire street crowd is on their feet applauding this masterclass!`,
          hi: `🌟 अर्धशतक विश्लेषण: ${b} का धमाकेदार अर्धशतक! मात्र ${balls} गेंदों में ५० रन पूरे (स्ट्राइक रेट: ${sr})! मैदान तालियों की गड़गड़ाहट से गूंज उठा!`,
          mr: `🌟 अर्धशतक विश्लेषण: ${b} चे तुफानी अर्धशतक! अवघ्या ${balls} चेंडूत ५० धावा पूर्ण (स्ट्राईक रेट: ${sr})! संपूर्ण गल्लीतील प्रेक्षकांकडून उभे राहून टाळ्यांचा कडकडाट!`
        };
      }
      if (specialTrigger.type === 'hundred') {
        const b = specialTrigger.batterName || bats;
        const r = specialTrigger.batterRuns || 100;
        const balls = specialTrigger.batterBalls || 45;
        const sr = specialTrigger.strikeRate || ((r / Math.max(1, balls)) * 100).toFixed(1);
        return {
          en: `👑 CENTURY BREAKDOWN: Take a bow, ${b}! A monumental 100 runs in just ${balls} balls (Strike Rate: ${sr})! Pure street masterclass etched in tournament memory forever!`,
          hi: `👑 ऐतिहासिक शतक: सलाम ठोकिए ${b} को! मात्र ${balls} गेंदों में १०० रन ठोक दिए (स्ट्राइक रेट: ${sr})! गली क्रिकेट का जादुई और ऐतिहासिक शतक!`,
          mr: `👑 ऐतिहासिक शतक: मानाचा मुजरा ${b} ला! अवघ्या ${balls} चेंडूत १०० धावांचा महापराक्रम (स्ट्राईक रेट: ${sr})! गल्ली क्रिकेटच्या इतिहासातील सुवर्ण अक्षरांनी कोरलेली खेळी!`
        };
      }
      if (specialTrigger.type === 'hat_trick') {
        const bw = specialTrigger.bowlerName || bowl;
        return {
          en: `🔥 HAT-TRICK BREAKDOWN: A historic moment! ${bw} claims 3 wickets in 3 consecutive deliveries! Absolute pandemonium in the street, fireworks and non-stop cheering!`,
          hi: `🔥 हैट्रिक विश्लेषण: ऐतिहासिक पल! ${bw} ने लगातार ३ गेंदों पर ३ विकेट चटकाकर रचा इतिहास! मैदान में गूंज उठी तालियां, अद्भुत गेंदबाजी का मुजाहिरा!`,
          mr: `🔥 हॅटट्रिक विश्लेषण: ऐतिहासिक पराक्रम! ${bw} ने सलग ३ चेंडूत ३ बळी घेत रचला महाइतिहास! मैदानात एकच जल्लोष, तुफानी गोलंदाजी!`
        };
      }
      if (specialTrigger.type === 'retire_hurt' && specialTrigger.batterName) {
        const b = specialTrigger.batterName;
        const r = specialTrigger.batterRuns ?? 0;
        const balls = specialTrigger.batterBalls ?? 0;
        const sr = specialTrigger.strikeRate || (balls > 0 ? ((r / balls) * 100).toFixed(1) : '0.0');
        const nextPhrase = newBatsmanName ? ` Due to injury, ${b} is retired hurt. ${newBatsmanName} takes the crease.` : '';
        const nextPhraseHi = newBatsmanName ? ` चोट के कारण ${b} रिटायर्ड हर्ट हुए, अब ${newBatsmanName} क्रीज पर आए हैं.` : '';
        const nextPhraseMr = newBatsmanName ? ` दुखापतीमुळे ${b} रिटायर्ड हर्ट झाले, आता ${newBatsmanName} मैदानात आले आहेत.` : '';

        return {
          en: `🩹 RETIRED HURT: ${b} unfortunately suffers an injury and retires hurt on ${r} runs (${balls}b, SR: ${sr}). Wishing them a swift recovery!${nextPhrase}`,
          hi: `🩹 रिटायर्ड हर्ट: दुर्भाग्यवश चोट के चलते ${b} को ${r} रन (${balls} गेंदें, स्ट्राइक रेट: ${sr}) बनाकर मैदान छोड़ना पड़ा! उनके जल्द स्वस्थ होने की कामना!${nextPhraseHi}`,
          mr: `🩹 रिटायर्ड हर्ट: दुर्दैवाने दुखापतीमुळे ${b} यांना ${r} धावांवर (${balls} चेंडू, स्ट्राईक रेट: ${sr}) मैदान सोडावे लागले! ते लवकरात लवकर बरे व्हावेत ही सदिच्छा!${nextPhraseMr}`
        };
      }
      if (specialTrigger.type === 'wicket' && specialTrigger.batterName) {
        const b = specialTrigger.batterName;
        const r = specialTrigger.batterRuns ?? 0;
        const balls = specialTrigger.batterBalls ?? 0;
        const bw = specialTrigger.bowlerName || bowl;
        const how = specialTrigger.howOut || 'Out';
        const sr = specialTrigger.strikeRate || (balls > 0 ? ((r / balls) * 100).toFixed(1) : '0.0');
        const nextPhrase = newBatsmanName ? ` After wicket fell, ${newBatsmanName} new batsman come on crease.` : '';
        const nextPhraseHi = newBatsmanName ? ` विकेट गिरने के बाद, ${newBatsmanName} नए बल्लेबाज क्रीज पर आए हैं.` : '';
        const nextPhraseMr = newBatsmanName ? ` विकेट पडल्यानंतर, ${newBatsmanName} नवीन फलंदाज क्रीजवर आले आहेत.` : '';

        return {
          en: `🚨 WICKET BREAKDOWN: ${b} departs after scoring ${r} runs off ${balls} balls (SR: ${sr})! Dismissal: ${how} by ${bw}!${nextPhrase}`,
          hi: `🚨 विकेट विश्लेषण: ${b} पवेलियन लौटते हुए! ${balls} गेंदों में ${r} रन बनाए (स्ट्राइक रेट: ${sr})! गेंदबाज: ${bw}, प्रकार: ${how}.${nextPhraseHi}`,
          mr: `🚨 विकेट विश्लेषण: ${b} ची खेळी संपुष्टात! ${balls} चेंडूत ${r} धावा (स्ट्राईक रेट: ${sr})! गोलंदाज: ${bw}, बाद प्रकार: ${how}.${nextPhraseMr}`
        };
      }
    }

    // Contextual tone specific generators:
    // HIGH THRILLER: Fast-paced, exclamation-heavy, tense
    if (contextualTone === 'HIGH_THRILLER') {
      const thrillers = [
        {
          en: `EDGE-OF-THE-SEAT THRILLER! ${bats} connects under monstrous pressure off ${bowl}! Hearts are pounding, every ball is life-or-death now!`,
          hi: `सांसें थाम देने वाला रोमांच! भारी दबाव में ${bats} का शॉट! हर एक गेंद पर धड़कनें तेज, गली क्रिकेट का असली रोमांच!`,
          mr: `अंगावर काटा आणणारा थरार! प्रचंड दबावात ${bats} चा फटका! प्रत्येक चेंडूवर छातीचे ठोके वाढलेत, सामन्यात महानाट्य!`
        },
        {
          en: `UNBELIEVABLE DRAMA! ${bowl} charges in with everything on the line, and ${bats} responds! Spectators screaming from rooftops!`,
          hi: `अविश्वसनीय ड्रामा! ${bowl} ने पूरी ताकत झोंक दी और ${bats} का कड़ा प्रहार! दर्शकों का शोर आसमान छू रहा है!`,
          mr: `अविश्वसनीय नाट्य! ${bowl} चा जीवतोड मारा आणि ${bats} चा आक्रमक पवित्रा! आजूबाजूच्या घरांच्या गॅलरीतून लोकांचा प्रचंड जल्लोष!`
        },
        {
          en: `PULSE-POUNDING ACTION! Down to the wire! ${bats} battles ${bowl} in the dying moments of this classic!`,
          hi: `अंतिम ओवरों का महामुकाबला! ${bats} और ${bowl} के बीच आर-पार की जंग! एक-एक रन के लिए महासंग्राम!`,
          mr: `शेवटच्या क्षणांचा थरार! ${bats} आणि ${bowl} यांच्यात चुरशीची लढत! विजयासाठी दोन्ही बाजूने शर्थीचे प्रयत्न!`
        }
      ];
      const pickT = thrillers[Math.floor(Math.random() * thrillers.length)];
      if (newBatsmanName) {
        return {
          en: `${pickT.en} After wicket fell, ${newBatsmanName} new batsman come on crease.`,
          hi: `${pickT.hi} विकेट गिरने के बाद, ${newBatsmanName} नए बल्लेबाज क्रीज पर आए हैं.`,
          mr: `${pickT.mr} विकेट पडल्यानंतर, ${newBatsmanName} नवीन फलंदाज क्रीजवर आले आहेत.`
        };
      }
      return pickT;
    }

    // ANALYTICAL / DRY: Explaining field placements, tactical shifts, spin choke, strike rotation
    if (contextualTone === 'ANALYTICAL_DRY') {
      const analytics = [
        {
          en: `Astute tactical field placement by the captain! Deep cover and a ring field set up by ${bowl} to choke the singles. ${bats} carefully assessing the gap.`,
          hi: `कमाल की रणनीतिक फील्डिंग सजावट! ${bowl} ने डीप कवर और रिंग फील्ड लगाकर सिंगल पर लगाम कसी है. ${bats} संभलकर गैप ढूंढ रहे हैं.`,
          mr: `कर्णधाराचे सुरेख रणनीतिक डावपेच! ${bowl} ने डीप कव्हर आणि रिंग फिल्डिंग लावून धावा रोखल्या आहेत. ${bats} सावधपणे फटका खेळत आहेत.`
        },
        {
          en: `Disciplined channel bowling outside the off-stump from ${bowl}. The fielders are tucked in tightly; maiden pressure is steadily mounting on ${bats}.`,
          hi: `ऑफ स्टंप के बाहर नपी-तुली लाइन पर ${bowl} की गेंदबाजी. फील्डर पास खड़े हैं और ${bats} पर डॉट बॉल का दबाव बढ़ रहा है.`,
          mr: `ऑफ स्टंपच्या बाहेर अचूक टप्प्यावर ${bowl} चा मारा. जवळ क्षेत्ररक्षक तैनात असून ${bats} वर निर्धाव चेंडूंचा दबाव वाढत आहे.`
        },
        {
          en: `Tactical shift in progress during this middle-overs consolidation. ${bats} focusing on working the ball into vacant pockets for smart strike rotation.`,
          hi: `मध्यम ओवरों की समझदारी भरी रणनीति जारी. ${bats} खाली जगहों में गेंद धकेलकर चतुराई से स्ट्राइक रोटेट करने पर ध्यान दे रहे हैं.`,
          mr: `मधल्या षटकांची संयमी रणनीती. ${bats} मोकळ्या जागेत चेंडू टोलवून चपळाईने स्ट्राईक रोटेट करण्यावर भर देत आहेत.`
        }
      ];
      const pickA = analytics[Math.floor(Math.random() * analytics.length)];
      if (newBatsmanName) {
        return {
          en: `${pickA.en} After wicket fell, ${newBatsmanName} new batsman come on crease.`,
          hi: `${pickA.hi} विकेट गिरने के बाद, ${newBatsmanName} नए बल्लेबाज क्रीज पर आए हैं.`,
          mr: `${pickA.mr} विकेट पडल्यानंतर, ${newBatsmanName} नवीन फलंदाज क्रीजवर आले आहेत.`
        };
      }
      return pickA;
    }

    // Multi-language dot ball templates
    const dots = [
      {
        en: `Unbelievable line from ${bowl}! ${bats} is completely clueless, searching for answers!`,
        hi: `शानदार लाइन और लेंथ ${bowl} द्वारा! ${bats} पूरी तरह से बीट हुए, कोई रन नहीं!`,
        mr: `सुरेख मारा ${bowl} चा! ${bats} ला चेंडूचा टप्पा अजिबात समजला नाही, अप्रतिम निर्धाव चेंडू!`
      },
      {
        en: `A solid defensive stroke. ${bats} playing with soft hands, showing respect to ${bowl}.`,
        hi: `मजबूत रक्षात्मक शॉट. ${bats} ने सीधे बल्ले से खेला और सम्मान दिया.`,
        mr: `सुरेख डिफेन्स! ${bats} ने चेंडू जमिनीलगत अडवला, कोणतीही धाव नाही.`
      },
      {
        en: `Straight through to the keeper! ${bowl} is steaming in, expressing some serious pace!`,
        hi: `सीधे विकेटकीपर के दस्तानों में! ${bowl} शानदार रफ्तार से गेंदबाजी कर रहे हैं!`,
        mr: `थेट यष्टिरक्षकाच्या हातात चेंडू! ${bowl} चा वेगवान आणि भेदक मारा!`
      },
      {
        en: `Dot ball! Good field placement there, no room given whatsoever!`,
        hi: `डॉट बॉल! बेहतरीन फील्डिंग सजावट, बल्लेबाज को हाथ खोलने का कोई मौका नहीं मिला!`,
        mr: `निर्धाव चेंडू! उत्कृष्ट क्षेत्ररक्षण, फलंदाजाला धाव घेण्याची अजिबात जागा दिली नाही!`
      }
    ];

    // Singles
    const singles = [
      {
        en: `${bats} tucks it off the hips, stealing a quick single! Great understanding between the runners.`,
        hi: `${bats} ने हल्के हाथों से मोड़कर तेजी से एक रन चुरा लिया! दोनों बल्लेबाजों में कमाल का तालमेल.`,
        mr: `${bats} ने हलक्या हाताने चेंडू ढकलून चपळाईने १ धाव घेतली! दोन्ही फलंदाजांमध्ये सुरेख समन्वय.`
      },
      {
        en: `Just a little push into the gap for one. Excellent rotation of strike!`,
        hi: `गैप में हल्के से धकेला और १ रन पूरा किया. स्ट्राइक रोटेशन जारी!`,
        mr: `गॅपमध्ये चेंडू हळूच ढकलून १ धाव पूर्ण केली. स्ट्राईक सुरेख पद्धतीने बदलली!`
      },
      {
        en: `A quick tap-and-run! That's brilliant street-smart gully running from ${bats}!`,
        hi: `तेज दौड़ लगाकर एक रन पूरा किया! चतुर और सूझबूझ भरी बल्लेबाजी!`,
        mr: `चपळाईने धाव पूर्ण केली! चतुर आणि समयसूचक गल्ली क्रिकेट स्टाइल धाव!`
      }
    ];

    // Doubles
    const doubles = [
      {
        en: `Driven beautifully through the covers! They push hard for the second and achieve it comfortably!`,
        hi: `कवर की तरफ खूबसूरत ड्राइव! तेजी से दौड़कर आसानी से दो रन पूरे किए!`,
        mr: `कव्हरच्या दिशेने सुरेख ड्राईव्ह! वेगाने धावून २ धावा सहज पूर्ण केल्या!`
      },
      {
        en: `Flicked off the pads towards mid-wicket. Superb running between the wickets, that's two!`,
        hi: `मिड-विकेट की दिशा में फ्लिक किया. दोनों विकेटों के बीच शानदार दौड़, दो रन!`,
        mr: `पॅडवरून मिड-विकेटकडे चेंडू वळवला. दोन्ही फलंदाजांची उत्कृष्ट धावपळ, २ धावा!`
      }
    ];

    // Boundaries (4s)
    const boundaries = [
      {
        en: `CRACK! That's an absolute missile from ${bats}! Sent racing through the covers for FOUR!`,
        hi: `शानदार चौका! ${bats} के बल्ले से निकला करारा शॉट, गेंद गोली की रफ्तार से बाउंड्री पार! चार रन!`,
        mr: `खणखणीत चौकार! ${bats} चा तुफानी कव्हर ड्राईव्ह, चेंडू सुसाट सीमारेषेबाहेर ४ धावांसाठी!`
      },
      {
        en: `Shot of the day! A magnificent straight drive that scorches the gully turf for FOUR!`,
        hi: `दिन का सबसे खूबसूरत शॉट! सीधा स्ट्रेट ड्राइव और गेंद बाउंड्री लाइन के बाहर, चौका!`,
        mr: `दिवसातील सर्वोत्तम फटका! सुरेख स्ट्रेट ड्राईव्ह आणि सीमारेषेपलीकडे चौकार!`
      },
      {
        en: `Over the infielder's head and bouncing into the fence! Pure elegance from ${bats} for FOUR!`,
        hi: `फील्डर्स के ऊपर से हवा में और टप्पा खाकर बाउंड्री पार! ${bats} का नजाकत भरा चौका!`,
        mr: `क्षेत्ररक्षकाच्या डोक्यावरून चेंडू थेट सीमारेषेला धडकला! ${bats} चा देखणा चौकार!`
      }
    ];

    // Sixes (6s)
    const sixes = [
      {
        en: `BOOM! That is massive! ${bats} launches ${bowl} deep over mid-wicket into the nearby street! SIX!`,
        hi: `गगनचुंबी छक्का! ${bats} ने ${bowl} की गेंद को सीधे मैदान के बाहर दर्शकों के बीच भेजा! ६ रन!`,
        mr: `उत्तुंग षटकार! ${bats} ने ${bowl} च्या चेंडूवर तुफानी प्रहार करत चेंडू थेट मैदानाबाहेर भिरकावला! ६ धावा!`
      },
      {
        en: `Out of the park! What a phenomenal hit! Absolute power for SIX!`,
        hi: `मैदान के बाहर! क्या लाजवाब शॉट है! ताकत और टाइमिंग का बेहतरीन संगम, छक्का!`,
        mr: `मैदानाबाहेर थेट चेंडू! प्रचंड शक्तीशाली प्रहार आणि दिमाखदार षटकार!`
      },
      {
        en: `A towering sixer! High, deep, and handsome! ${bats} is at his absolute devastating best!`,
        hi: `आसमान छूता हुआ छक्का! गेंद हवा में तैरती हुई दर्शकों में गिरी! कमाल का सिक्सर!`,
        mr: `आकाशाला गवसणी घालणारा षटकार! प्रेक्षकांमध्ये प्रचंड जल्लोष, ${bats} चा अविश्वसनीय सिक्सर!`
      }
    ];

    // Wickets
    const wickets = [
      {
        en: `OUT! ABSOLUTE DRAMA! ${bats} is clean bowled! ${bowl} spins a web and breaks the timber!`,
        hi: `आउट! बड़ा ड्रामा! ${bowl} की जादुई गेंद पर ${bats} क्लीन बोल्ड! डंडे बिखर गए!`,
        mr: `आऊट! मोठा धक्का! ${bowl} च्या भेदक चेंडूवर ${bats} चा त्रिफळा उडाला! तंबूत परतावे लागेल!`
      },
      {
        en: `GOT 'EM! A thick edge taken safely by the keeper! ${bats} has to make the long walk back!`,
        hi: `विकेट! बल्ले का किनारा लगा और विकेटकीपर ने आसान कैच लपका! ${bats} पवेलियन लौटते हुए!`,
        mr: `बाद! चेंडू बॅटची कड घेऊन थेट यष्टिरक्षकाच्या हातात! ${bats} बाद होऊन तंबूकडे रवाना!`
      },
      {
        en: `GONE! In the air and a magnificent, diving catch in the deep! What a stellar breakthrough!`,
        hi: `गया बल्लेबाज! हवा में गेंद और बाउंड्री पर गोता लगाकर शानदार कैच! बहुत बड़ी सफलता!`,
        mr: `बाद! हवेत उडालेला चेंडू आणि सीमारेषेवर जबरदस्त झेल! क्षेत्ररक्षकाची अप्रतिम कामगिरी!`
      },
      {
        en: `TRAPPED! Loud appeal for LBW and the umpire matches it with a raised finger! Plumb!`,
        hi: `एलबीडब्ल्यू आउट! जोरदार अपील और अंपायर की उंगली हवा में! बल्लेबाज पूरी तरह से आउट!`,
        mr: `पायचीत बाद! जोरदार अपील आणि पंचांची बोटे वर! फलंदाजाला माघारी परतावेच लागेल!`
      }
    ];

    // Extras
    const extras = [
      {
        en: `Wide ball! ${bowl} loses control down the leg side, extra conceded.`,
        hi: `वाइड गेंद! ${bowl} लेग स्टंप की दिशा से भटके, अंपायर का इशारा अतिरिक्त रन का!`,
        mr: `वाईड चेंडू! ${bowl} ची दिशा भरकटली, पंचांनी हात पसरवून अतिरिक्त धावेचा इशारा केला!`
      },
      {
        en: `Over-the-line! No-ball declared! Free-hit loading for ${bats}!`,
        hi: `कदम सीमा रेखा से बाहर! नो-बॉल करार! अब अगली गेंद पर फ्री-हिट!`,
        mr: `रेषेबाहेर पाय! नो बॉल घोषित! आता फलंदाजाला पुढच्या चेंडूवर फ्री हिट मिळणार!`
      }
    ];

    const pick = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

    if (type === 'retire_hurt' || oLower.includes('retire') || oLower.includes('injured')) {
      const incoming = newBatsmanName ? ` ${newBatsmanName} walks out to take guard on the crease.` : '';
      const incomingHi = newBatsmanName ? ` उनकी जगह ${newBatsmanName} बल्लेबाजी के लिए क्रीज पर आए हैं.` : '';
      const incomingMr = newBatsmanName ? ` त्यांच्या जागी ${newBatsmanName} फलंदाजीसाठी मैदानात दाखल झाले आहेत.` : '';
      return {
        en: `Injury alert! ${bats} has retired hurt and leaves the field.${incoming}`,
        hi: `चोट के कारण ${bats} रिटायर्ड हर्ट होकर मैदान से बाहर गए हैं!${incomingHi}`,
        mr: `दुखापतीमुळे ${bats} रिटायर्ड हर्ट होऊन मैदानाबाहेर गेले आहेत!${incomingMr}`
      };
    }
    if (type === 'batsman_update' || oLower.includes('batsman name updated') || oLower.includes('new batsman come on crease')) {
      return {
        en: `Player update: ${bats} is now batting at the crease.`,
        hi: `खिलाड़ी अपडेट: ${bats} अब क्रीज पर बल्लेबाजी कर रहे हैं!`,
        mr: `खेळाडू अपडेट: ${bats} आता क्रीजवर फलंदाजी करत आहेत!`
      };
    }
    if (type === 'wicket' || oLower.includes('out') || oLower.includes('wkt') || oLower.includes('gone') || oLower.includes('bowled')) {
      const base = pick(wickets);
      if (newBatsmanName) {
        return appendWinProb({
          en: `${base.en} After wicket fell, ${newBatsmanName} new batsman come on crease.`,
          hi: `${base.hi} विकेट गिरने के बाद, ${newBatsmanName} नए बल्लेबाज क्रीज पर आए हैं.`,
          mr: `${base.mr} विकेट पडल्यानंतर, ${newBatsmanName} नवीन फलंदाज क्रीजवर आले आहेत.`
        });
      }
      return appendWinProb(base);
    }
    if (type === 'boundary' || val === 4 || oLower.includes('four') || oLower.includes('boundary')) {
      return appendWinProb(pick(boundaries));
    }
    if (val === 6 || oLower.includes('six')) {
      return appendWinProb(pick(sixes));
    }
    if (val === 1) {
      return appendWinProb(pick(singles));
    }
    if (val === 2) {
      return appendWinProb(pick(doubles));
    }
    if (type === 'extra' || extraType || oLower.includes('wide') || oLower.includes('no ball') || oLower.includes('free hit')) {
      return appendWinProb(pick(extras));
    }
    if (val === 0) {
      return appendWinProb(pick(dots));
    }

    const defaultEn = originalDesc || "A beautiful ball delivered, keeping the tension sky-high!";
    return appendWinProb({
      en: defaultEn,
      hi: `${bowl} ने ${bats} को गेंद फेंकी, रोमांच अपने चरम पर!`,
      mr: `${bowl} ने ${bats} ला सुरेख चेंडू टाकला, मैदानात सामना रंगतदार स्थितीत!`
    });
  }

  function getGullyCommentaryFallback(
    event: any,
    batsmanName: string,
    bowlerName: string,
    originalDesc: string,
    newBatsmanName?: string,
    contextualTone?: string,
    specialTrigger?: any
  ): string {
    return getGullyCommentaryMultilingual(event, batsmanName, bowlerName, originalDesc, newBatsmanName, contextualTone, specialTrigger).en;
  }

  // AI Cricket Commentary Generator Endpoint (supports both ball-by-ball match deliveries & auction updates)
  app.post("/api/cricket/commentary", async (req, res) => {
    console.log("AI Cricket Commentary request received");
    const { 
      matchState, 
      event, 
      batsman, 
      bowler, 
      originalDescription, 
      eventType, 
      eventData, 
      voiceStyle, 
      additionalContext, 
      newBatsmanName: reqNewBat, 
      language,
      contextualTone,
      specialTrigger,
      winProbability,
      tournamentName,
      groundName,
      isMatchStart,
      isCrucialTime
    } = req.body;

    const incomingNewBatsman = reqNewBat || additionalContext?.newBatsmanName || '';
    const userPreferredLang = (language === 'mr' || language === 'hi' || language === 'en') ? language : 'en';
    const activeTone = contextualTone || additionalContext?.contextualTone || 'BALANCED_CRICKET';
    const finalTournamentName = (tournamentName || additionalContext?.tournamentName || matchState?.tournamentName || '').trim();
    const finalGroundName = (groundName || additionalContext?.groundName || matchState?.groundName || '').trim();
    const isStartOfMatch = Boolean(isMatchStart || event?.type === 'match_start' || additionalContext?.isMatchStart || (originalDescription && originalDescription.includes('new batsman are come on crease') && originalDescription.includes('first over')));
    const isCrucial = Boolean(isCrucialTime || additionalContext?.isCrucialTime);

    // Format AI win probability badges for commentary - ONLY if it's a crucial time!
    const wp = isCrucial ? winProbability : undefined;
    let probTagEn = "";
    let probTagHi = "";
    let probTagMr = "";
    if (wp && wp.teamA && wp.teamB) {
      const pA = Math.round(wp.probA ?? 50);
      const pB = Math.round(wp.probB ?? 50);
      probTagEn = ` [AI Win Probability: ${wp.teamA} ${pA}% | ${wp.teamB} ${pB}%]`;
      probTagHi = ` [AI जीत की संभावना: ${wp.teamA} ${pA}% | ${wp.teamB} ${pB}%]`;
      probTagMr = ` [AI विजयाची शक्यता: ${wp.teamA} ${pA}% | ${wp.teamB} ${pB}%]`;
    }

    // Auction event commentary handling
    if (eventType) {
      const cacheKey = `auction_${eventType}_${JSON.stringify(eventData)}`;
      const cached = getCachedAIResponse(cacheKey);
      if (cached) return res.json(cached);

      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
          const ai = new GoogleGenAI({
            apiKey,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
          });
          const prompt = `You are a charismatic cricket auctioneer and sports commentator. Generate punchy commentary for this auction event in three languages: English, Hindi (Devanagari), and Marathi (Devanagari).
Event Type: ${eventType}
Details: ${JSON.stringify(eventData || {})}
Style: ${voiceStyle || 'Energetic and witty'}
Return ONLY a raw JSON object with keys "en", "hi", "mr":
{"en":"English sentence","hi":"Hindi sentence","mr":"Marathi sentence"}`;

          const response = await generateContentWithFallback(ai, { contents: prompt });
          const rawText = (response.text || "").trim();
          const matchJson = rawText.match(/\{[\s\S]*\}/);
          if (matchJson) {
            const parsed = JSON.parse(matchJson[0]);
            if (parsed.en && parsed.hi && parsed.mr) {
              const result = {
                text: parsed[userPreferredLang] || parsed.en,
                translations: {
                  en: parsed.en,
                  hi: parsed.hi,
                  mr: parsed.mr
                }
              };
              setCachedAIResponse(cacheKey, result);
              return res.json(result);
            }
          }
        }
      } catch (err: any) {
        console.warn("Auction commentary fallback triggered:", err.message || err);
      }

      // Fallback for auction
      let fallbackAuctionEn = "The auction room is buzzing with anticipation as franchises evaluate their squad balance!";
      let fallbackAuctionHi = "नीलामी कक्ष में जबरदस्त उत्साह है क्योंकि फ्रेंचाइजी अपनी टीम की रणनीति बना रही हैं!";
      let fallbackAuctionMr = "लिलावाच्या हॉलमध्ये प्रचंड उत्सुकता आहे, सर्व संघ आपल्या रणनीतीनुसार बोली लावत आहेत!";

      if (eventType === 'BID_PLACED') {
        fallbackAuctionEn = `Aggressive bidding war ignited for ${eventData?.playerName || 'the player'}! The price soars to ₹${(eventData?.amount || 0).toLocaleString('en-IN')}!`;
        fallbackAuctionHi = `${eventData?.playerName || 'खिलाड़ी'} के लिए जबरदस्त बोली का मुकाबला! कीमत ₹${(eventData?.amount || 0).toLocaleString('en-IN')} तक पहुंची!`;
        fallbackAuctionMr = `${eventData?.playerName || 'खेळाडू'} साठी चुरशीची बोली सुरू! किंमत ₹${(eventData?.amount || 0).toLocaleString('en-IN')} वर पोहोचली!`;
      } else if (eventType === 'PLAYER_SOLD') {
        fallbackAuctionEn = `SOLD! ${eventData?.playerName || 'The player'} joins ${eventData?.teamName || 'the franchise'} for a sensational ₹${(eventData?.amount || 0).toLocaleString('en-IN')}!`;
        fallbackAuctionHi = `बिक गए! ${eventData?.playerName || 'खिलाड़ी'} ₹${(eventData?.amount || 0).toLocaleString('en-IN')} में ${eventData?.teamName || 'टीम'} में शामिल हुए!`;
        fallbackAuctionMr = `विक्री झाली! ${eventData?.playerName || 'खेळाडू'} ₹${(eventData?.amount || 0).toLocaleString('en-IN')} मध्ये ${eventData?.teamName || 'संघात'} सामील!`;
      } else if (eventType === 'PLAYER_UNSOLD') {
        fallbackAuctionEn = `Unsold for now! ${eventData?.playerName || 'The player'} goes into the accelerated round pool.`;
        fallbackAuctionHi = `फिलहाल अनसोल्ड! ${eventData?.playerName || 'खिलाड़ी'} अगले त्वरित राउंड में जाएंगे.`;
        fallbackAuctionMr = `सध्या अनसोल्ड! ${eventData?.playerName || 'खेळाडू'} पुढील फेरीमध्ये जातील.`;
      }
      return res.json({
        text: userPreferredLang === 'mr' ? fallbackAuctionMr : userPreferredLang === 'hi' ? fallbackAuctionHi : fallbackAuctionEn,
        translations: {
          en: fallbackAuctionEn,
          hi: fallbackAuctionHi,
          mr: fallbackAuctionMr
        }
      });
    }

    // Match ball-by-ball commentary
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("GEMINI_API_KEY missing. Handing over to local multilingual gully commentator.");
        const fallback = getGullyCommentaryMultilingual(
          event,
          batsman?.name,
          bowler?.name,
          originalDescription,
          incomingNewBatsman,
          activeTone,
          specialTrigger,
          wp,
          finalTournamentName,
          finalGroundName,
          isCrucial
        );
        return res.json({
          text: fallback[userPreferredLang] || fallback.en,
          translations: fallback
        });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      // Extrapolate recent commentaries to enforce unique outputs
      const recentCommentariesList = matchState && Array.isArray(matchState.commentaryList)
        ? matchState.commentaryList.slice(0, 10).map((c: any) => c.description).filter(Boolean)
        : [];

      const previousCommentariesText = recentCommentariesList.length > 0
        ? recentCommentariesList.map((desc: string) => `- "${desc}"`).join("\n")
        : "None";

      // Match Start Tournament and Ground Directive
      let matchStartDirective = "";
      if (isStartOfMatch || event?.type === 'match_start') {
        matchStartDirective = `CRITICAL MATCH START DIRECTIVE:
- Match Status: BRAND NEW MATCH COMMENCING NOW!
- Tournament Name: "${finalTournamentName || 'Tournament / Bilateral Series'}"
- Ground / Venue Name: "${finalGroundName || 'Gully Stadium / Ground'}"
- MANDATORY COMMENTARY REQUIREMENT: Welcome all cricket fans, spectators, and the crowd to the match! In your opening sentence in all three languages (English, Hindi, Marathi), you MUST explicitly announce and incorporate BOTH the Tournament Name ("${finalTournamentName || 'Tournament'}") and the Ground Name ("${finalGroundName || 'Ground'}")!`;
      } else if (finalTournamentName || finalGroundName) {
        matchStartDirective = `TOURNAMENT & VENUE CONTEXT:
- Tournament: "${finalTournamentName || 'Tournament'}"
- Ground / Venue: "${finalGroundName || 'Ground'}"`;
      }

      // Contextual Tone Directive for the AI Commentator
      let toneDirective = "";
      if (activeTone === 'HIGH_THRILLER') {
        toneDirective = `CONTEXTUAL TONE: HIGH THRILLER!
- Match Situation: Final overs with high required run rate or razor-thin winning margin!
- STYLE DIRECTIVE: Fast-paced, breathless, exclamation-heavy text! Emphasize the run rate pressure, the crowd tension, edge-of-seat drama, heartbeats in the street, and life-or-death gully cricket intensity!`;
      } else if (activeTone === 'ANALYTICAL_DRY') {
        toneDirective = `CONTEXTUAL TONE: ANALYTICAL & TACTICAL!
- Match Situation: Middle overs consolidation phase.
- STYLE DIRECTIVE: Astute, tactical, and analytical. Explain field placements (e.g. deep covers, ring field, mid-wicket, fine leg), line-and-length discipline, bowler traps, strike rotation, and run containment strategies in depth!`;
      } else if (activeTone === 'CARNAGE_EXPLOSIVE') {
        toneDirective = `CONTEXTUAL TONE: EXPLOSIVE CARNAGE!
- STYLE DIRECTIVE: Electrifying, thunderous, and awe-struck at the brutal power-hitting and boundaries raining down onto rooftops!`;
      } else if (activeTone === 'TENSE_COLLAPSE') {
        toneDirective = `CONTEXTUAL TONE: TENSE PRESSURE / REBUILDING!
- STYLE DIRECTIVE: Solemn, cautious, and focused on survival, close-in catchers, and the high tension of a batting collapse.`;
      } else {
        toneDirective = `CONTEXTUAL TONE: BALANCED & VIBRANT gully cricket commentary.`;
      }

      // No Ball with Taken Runs Directive
      let noBallDirective = "";
      const isNoBallDelivery = event?.type === 'noball' || event?.extraType === 'noball' || (originalDescription && /no-ball|no ball/i.test(originalDescription));
      const takenRuns = (event?.val !== undefined && event?.val !== null) ? Number(event.val) : 0;
      if (isNoBallDelivery) {
        noBallDirective = `CRITICAL MATCH DELIVERY EVENT: NO-BALL WITH ${takenRuns} RUN${takenRuns === 1 ? '' : 'S'} SCORED!
- Delivery Type: NO-BALL (Illegal delivery, 1 run conceded + Free Hit on next ball)
- Runs hit/taken off the bat by batsman ${batsman?.name || 'Striker'}: ${takenRuns} runs
- Total runs added to score on this ball: ${1 + takenRuns} runs
- MANDATORY COMMENTARY DIRECTIVE: You MUST explicitly mention that the bowler overstepped / bowled a NO-BALL, emphasize that ${takenRuns > 0 ? `${takenRuns} runs were taken by ${batsman?.name || 'the batsman'}` : '1 extra run was conceded'}, and announce that the next ball is a FREE HIT!`;
      }

      // Special Trigger Directive (Wicket, Retire Hurt, 50, 100, Hat-trick)
      let specialDirective = "";
      if (specialTrigger?.type === 'retire_hurt') {
        specialDirective = `MAJOR MATCH EVENT: RETIRED HURT!
- Type: Retired Hurt (Injury Stoppage)
- Details: ${JSON.stringify(specialTrigger)}
- CRITICAL: Batter ${specialTrigger.batterName || batsman?.name} has suffered an injury and has retired hurt after scoring ${specialTrigger.batterRuns ?? 0} runs off ${specialTrigger.batterBalls ?? 0} balls.
- NOTE: This is an injury retirement, NOT an out/dismissal! The bowler did NOT get a wicket, and this was not a counted delivery ball.
- DIRECTIVE: Express genuine sportsmanship and empathy for the injured batter, wish them a speedy recovery, mention their runs and balls faced, and introduce incoming new batsman ${incomingNewBatsman || 'taking the crease'}.`;
      } else if (specialTrigger) {
        specialDirective = `MAJOR ACHIEVEMENT SPECIAL TRIGGER:
- Type: ${specialTrigger.type}
- Details: ${JSON.stringify(specialTrigger)}
- CRITICAL: Provide a highly enthusiastic, detailed breakdown of the achievement, explicitly including the batter's total runs, balls faced, boundaries, strike rate, or bowler's hat-trick feat!`;
      }

      const prompt = `
        You are an exceptionally humorous, creative, and energetic cricket commentator for local gully & tournament matches.
        Generate live commentary for the ongoing ball delivery in THREE languages: English, Hindi, and Marathi.

        ${matchStartDirective}
        ${toneDirective}
        ${noBallDirective}
        ${specialDirective}

        MATCH EVENT SUMMARY:
        - Ball event category: ${event?.type || 'unknown'}
        - Recorded details (runs/extras): ${event?.val ?? '0'}
        - Extra notes if available: ${event?.extraType || 'None'}
        - Batsman facing delivery: ${batsman?.name || 'Batsman'}
        - Bowler delivering: ${bowler?.name || 'Bowler'}
        - Basic description: "${originalDescription || ''}"
        ${incomingNewBatsman ? `- Incoming new batsman: ${incomingNewBatsman} (${specialTrigger?.type === 'retire_hurt' ? `Announce: "Due to injury, ${specialTrigger.batterName || batsman?.name} is retired hurt. ${incomingNewBatsman} takes the crease." / हिंदी: "चोट के कारण ${specialTrigger.batterName || batsman?.name} रिटायर्ड हर्ट हुए, अब ${incomingNewBatsman} क्रीज पर आए हैं." / मराठी: "दुखापतीमुळे ${specialTrigger.batterName || batsman?.name} रिटायर्ड हर्ट झाले, आता ${incomingNewBatsman} मैदानात आले आहेत."` : `Crucial note: announce: "After wicket fell, ${incomingNewBatsman} new batsman come on crease" / हिंदी: "विकेट गिरने के बाद, ${incomingNewBatsman} नए बल्लेबाज क्रीज पर आए हैं." / मराठी: "विकेट पडल्यानंतर, ${incomingNewBatsman} नवीन फलंदाज क्रीजवर आले आहेत."`})` : ''}

        CURRENT INNINGS STATE:
        - Score: ${matchState?.runs ?? 0}/${matchState?.wickets ?? 0}
        - Balls Bowled: ${matchState?.ballsBowled ?? 0}
        - Target Score: ${matchState?.targetRuns ?? 'N/A'}

        ${wp && wp.teamA && wp.teamB ? `CRUCIAL TIME DETECTED - LIVE MATCH AI WIN PROBABILITY METRICS:
        - ${wp.teamA}: ${Math.round(wp.probA)}% vs ${wp.teamB}: ${Math.round(wp.probB)}%
        - Favored side: ${wp.favoredTeam || wp.teamA} (${Math.round(wp.favoredProbability || 50)}%)
        - MANDATORY RULE: Because this is a CRUCIAL match moment, at the very end of your commentary in each language, include the win probability tag:
          * English end tag: "${probTagEn}"
          * Hindi end tag: "${probTagHi}"
          * Marathi end tag: "${probTagMr}"` : `WIN PROBABILITY DISPLAY RULE:
        - This delivery is during NORMAL match play. Do NOT include win probability percentages or tags in the commentary. Keep commentary focused on the delivery action.`}

        RECENT PREVIOUS DELIVERIES COMMENTARY:
        ${previousCommentariesText}

        CRITICAL OUTPUT FORMAT:
        Return ONLY a raw JSON object with exactly three keys: "en", "hi", and "mr".
        - "en": Energetic English cricket commentary adhering strictly to the Contextual Tone (1-2 sentences).
        - "hi": Authentic, lively Hindi cricket commentary in Devanagari script adhering to the Contextual Tone (1-2 sentences).
        - "mr": Energetic, authentic Marathi cricket commentary in Devanagari script (उदा. चौकार, षटकार, बाद, सुरेख मारा, थरार) adhering to the Contextual Tone (1-2 sentences).
        No surrounding markdown code blocks, no backticks, no explanations.
        Example:
        {"en":"Smoked over cover for a sensational FOUR!","hi":"कवर के ऊपर से शानदार चौका!","mr":"कव्हरच्या डोक्यावरून सुरेख फटका आणि खणखणीत चौकार!"}
      `;

      const response = await generateContentWithFallback(ai, {
        contents: prompt,
      });

      const raw = (response.text || "").trim();
      const matchJson = raw.match(/\{[\s\S]*\}/);
      if (matchJson) {
        try {
          const parsed = JSON.parse(matchJson[0]);
          if (parsed.en && parsed.hi && parsed.mr) {
            let parsedEn = parsed.en.trim();
            let parsedHi = parsed.hi.trim();
            let parsedMr = parsed.mr.trim();

            if (!isCrucial) {
              // Strip any win probability tag if model output accidentally contains one during routine play
              parsedEn = parsedEn.replace(/\s*\[AI\s*(?:Win Probability|जीत की संभावना|विजयाची शक्यता)[^\]]*\]/gi, '').trim();
              parsedHi = parsedHi.replace(/\s*\[AI\s*(?:Win Probability|जीत की संभावना|विजयाची शक्यता)[^\]]*\]/gi, '').trim();
              parsedMr = parsedMr.replace(/\s*\[AI\s*(?:Win Probability|जीत की संभावना|विजयाची शक्यता)[^\]]*\]/gi, '').trim();
            }

            const finalEn = (probTagEn && !parsedEn.includes('[AI')) ? `${parsedEn}${probTagEn}` : parsedEn;
            const finalHi = (probTagHi && !parsedHi.includes('[AI')) ? `${parsedHi}${probTagHi}` : parsedHi;
            const finalMr = (probTagMr && !parsedMr.includes('[AI')) ? `${parsedMr}${probTagMr}` : parsedMr;

            return res.json({
              text: userPreferredLang === 'mr' ? finalMr : userPreferredLang === 'hi' ? finalHi : finalEn,
              translations: {
                en: finalEn,
                hi: finalHi,
                mr: finalMr
              }
            });
          }
        } catch {
          // fallback to standard text extraction
        }
      }

      // If single language returned or couldn't parse JSON
      const plainText = raw.replace(/^\{|\}$/g, '').trim();
      const fallback = getGullyCommentaryMultilingual(
        event,
        batsman?.name,
        bowler?.name,
        originalDescription,
        incomingNewBatsman,
        activeTone,
        specialTrigger,
        wp,
        finalTournamentName,
        finalGroundName,
        isCrucial
      );
      const plainEn = (probTagEn && plainText && !plainText.includes('[AI')) ? `${plainText}${probTagEn}` : (plainText || fallback.en);
      res.json({
        text: userPreferredLang === 'mr' ? fallback.mr : userPreferredLang === 'hi' ? fallback.hi : plainEn,
        translations: {
          en: plainEn,
          hi: fallback.hi,
          mr: fallback.mr
        }
      });
    } catch (error: any) {
      console.log("[Cricket Commentary] Gemini temporarily unavailable or experiencing high demand. Seamlessly served local multilingual gully commentator.");
      const fallback = getGullyCommentaryMultilingual(
        event,
        batsman?.name,
        bowler?.name,
        originalDescription,
        incomingNewBatsman,
        activeTone,
        specialTrigger,
        wp,
        finalTournamentName,
        finalGroundName,
        isCrucial
      );
      res.json({
        text: fallback[userPreferredLang] || fallback.en,
        translations: fallback
      });
    }
  });

  // AI Cricket Match Tactical Insights Endpoint
  app.post("/api/cricket/insights", async (req, res) => {
    console.log("AI Cricket Insights request received");
    const { match, question } = req.body;
    const cacheKey = `insights_${match?.id || 'm'}_${question || ''}`;
    const cached = getCachedAIResponse(cacheKey);
    if (cached) return res.json(cached);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const prompt = `You are a World-Class Cricket Analyst. Analyze the ongoing match state and respond insightfully to this spectator inquiry: "${question || 'Provide a deep match analysis and key win factors'}".
Match Details:
- Teams: ${match?.teamA?.name || 'Team A'} vs ${match?.teamB?.name || 'Team B'}
- Innings 1: ${match?.innings1?.runs || 0}/${match?.innings1?.wickets || 0} (${Math.floor((match?.innings1?.ballsBowled || 0)/6)}.${(match?.innings1?.ballsBowled || 0)%6} ov)
- Innings 2: ${match?.innings2?.runs || 0}/${match?.innings2?.wickets || 0} (${Math.floor((match?.innings2?.ballsBowled || 0)/6)}.${(match?.innings2?.ballsBowled || 0)%6} ov)
- Target: ${match?.innings2?.targetRuns || 'N/A'}
- Venue/Format: ${match?.venue || 'Local Stadium'} / ${match?.oversLimit || 10} Overs

Provide a structured 3-bullet analytical overview with run rate demands, bowling impact, and tactical momentum shift.`;

        const response = await generateContentWithFallback(ai, { contents: prompt });
        const text = (response.text || "").trim();
        if (text) {
          setCachedAIResponse(cacheKey, { text });
          return res.json({ text });
        }
      }
    } catch (err: any) {
      console.warn("Cricket Insights fallback triggered:", err.message || err);
    }

    // Deterministic match insight fallback
    const tA = match?.teamA?.name || 'Team A';
    const tB = match?.teamB?.name || 'Team B';
    const inn1 = match?.innings1 || {};
    const inn2 = match?.innings2 || {};
    const currentRuns = inn2.runs || inn1.runs || 0;
    const currentWkts = inn2.wickets || inn1.wickets || 0;
    const balls = inn2.ballsBowled || inn1.ballsBowled || 1;
    const crr = ((currentRuns / balls) * 6).toFixed(2);

    const fallbackInsights = `📊 **Match Analyst Tactical Report:**
• **Run Rate & Scoring Pace:** Current Run Rate stands at **${crr} RPO**. The batting side is maintaining steady rotation, but accelerating boundary frequency in death overs will be pivotal.
• **Wicket In Hand Leverage:** At ${currentRuns}/${currentWkts}, preserving middle-order partnerships while exploiting bowling field gaps will dictate match momentum.
• **Tactical Recommendation:** Tight line-and-length bowling outside off stump will dry up easy singles and induce high-risk attacking shots.`;

    res.json({ text: fallbackInsights });
  });

  // AI Cricket Podcast Summary & Audio Briefing Endpoint
  app.post("/api/cricket/podcast-summary", async (req, res) => {
    console.log("AI Cricket Podcast Summary request received");
    const { match } = req.body;
    const cacheKey = `podcast_${match?.id || 'm'}_${match?.innings2?.runs || match?.innings1?.runs || 0}`;
    const cached = getCachedAIResponse(cacheKey);
    if (cached) return res.json(cached);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const prompt = `You are hosting a 60-second high-energy cricket podcast episode.
Summarize this match in a dynamic two-speaker banter format between Harsha and Ravi:
- Match: ${match?.teamA?.name || 'Team A'} vs ${match?.teamB?.name || 'Team B'}
- Score: ${match?.innings1?.runs || 0}/${match?.innings1?.wickets || 0} vs ${match?.innings2?.runs || 0}/${match?.innings2?.wickets || 0}
- Status: ${match?.isCompleted ? 'Finished Match' : 'Live Ongoing Contest'}

Keep it engaging with iconic catchphrases, turning point highlights, and player praise.`;

        const response = await generateContentWithFallback(ai, { contents: prompt });
        const script = (response.text || "").trim();
        if (script) {
          const result = { script };
          setCachedAIResponse(cacheKey, result);
          return res.json(result);
        }
      }
    } catch (err: any) {
      console.warn("Podcast Summary fallback triggered:", err.message || err);
    }

    const tA = match?.teamA?.name || 'Team A';
    const tB = match?.teamB?.name || 'Team B';
    const inn1 = match?.innings1?.runs || 0;
    const inn2 = match?.innings2?.runs || 0;

    const fallbackScript = `🎙️ **The GullyScore Post-Match Podcast Experience:**

**Harsha:** "Welcome cricket fans! What an electrifying encounter between ${tA} and ${tB}! Both sides gave everything on the turf today."

**Ravi:** "Absolutely Harsha! The pressure was immense. From the very first ball, you could cut the atmosphere with a knife. Big hits, clinical bowling changes, and supreme athletic fielding made this a true spectacle!"

**Harsha:** "The turning point was undoubtedly that crucial middle-over spell which swung the momentum. Top-tier cricket under the lights!"`;

    res.json({ script: fallbackScript });
  });

  // AI Cricket Match Prediction Endpoint
  app.post("/api/cricket/prediction", async (req, res) => {
    console.log("AI Cricket Prediction request received");
    const { match, teamA, teamB } = req.body;
    const cacheKey = `prediction_${teamA?.name || 'A'}_vs_${teamB?.name || 'B'}_${match?.format || 'T20'}`;
    const cached = getCachedAIResponse(cacheKey);
    if (cached) return res.json(cached);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const prompt = `You are an AI cricket prediction algorithm. Predict the outcome of this fixture:
Team A: ${teamA?.name || 'Team A'} (Captain: ${teamA?.captain || 'N/A'}, Players: ${teamA?.players?.length || 11})
Team B: ${teamB?.name || 'Team B'} (Captain: ${teamB?.captain || 'N/A'}, Players: ${teamB?.players?.length || 11})
Format: ${match?.format || 'T20'} at ${match?.venue || 'Stadium'}

Return JSON format:
{
  "winProbabilityA": 54,
  "winProbabilityB": 46,
  "predictedWinner": "${teamA?.name || 'Team A'}",
  "keyFactor": "Stronger top-order batting depth and spin versatility",
  "recommendedStrategy": "Bat first upon winning toss to exploit initial pitch firmness."
}`;

        const response = await generateContentWithFallback(ai, {
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });

        const parsed = JSON.parse(response.text || "{}");
        if (parsed.predictedWinner) {
          setCachedAIResponse(cacheKey, parsed);
          return res.json(parsed);
        }
      }
    } catch (err: any) {
      console.warn("Prediction fallback triggered:", err.message || err);
    }

    // Deterministic prediction fallback
    const tAName = teamA?.name || 'Team A';
    const tBName = teamB?.name || 'Team B';
    const probA = 52 + Math.floor(Math.random() * 6);
    const probB = 100 - probA;

    const fallbackPrediction = {
      winProbabilityA: probA,
      winProbabilityB: probB,
      predictedWinner: probA >= 50 ? tAName : tBName,
      keyFactor: "Balanced combination of aggressive power-hitters and disciplined opening seamers.",
      recommendedStrategy: "Elect to field first under dewy conditions, restricting opponents under 140 runs."
    };

    res.json(fallbackPrediction);
  });

  // AI Cricket Predictive Win Probability Commentary Endpoint
  app.post(["/api/cricket/win-prob-commentary", "/api/cricket/win-probability-commentary"], async (req, res) => {
    console.log("AI Cricket Win Probability Commentary request received");
    const {
      matchId,
      teamA,
      teamB,
      currentInningsNum,
      battingTeam,
      bowlingTeam,
      runs,
      wickets,
      ballsBowled,
      totalBalls,
      ballsRemaining,
      oversRemaining,
      oversBowledText,
      crr,
      target,
      runsNeeded,
      rrr,
      probA,
      probB,
      favoredTeam,
      favoredProbability,
      underdogTeam,
      underdogProbability,
      tiltStatus,
      equationText,
      language
    } = req.body;

    const cacheKey = `winprob_comm_${matchId || 'm'}_inn${currentInningsNum}_${runs}_${wickets}_${ballsBowled}`;
    const cached = getCachedAIResponse(cacheKey);
    if (cached) return res.json(cached);

    const userPreferredLang = (language === 'mr' || language === 'hi' || language === 'en') ? language : 'en';

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const prompt = `You are a world-class cricket statistician and broadcast commentator (like Harsha Bhogle, Ravi Shastri, and Marathi/Hindi sports experts).
Analyze this live match situation and EXPLAIN WHY the match is tilting toward a specific team.

CURRENT MATCH SITUATION:
- Match: ${teamA || 'Team A'} vs ${teamB || 'Team B'}
- Current Innings: Innings ${currentInningsNum || 1} (${battingTeam || 'Batting side'} batting, ${bowlingTeam || 'Bowling side'} bowling)
- Score: ${runs ?? 0}/${wickets ?? 0} in ${oversBowledText || '0.0'} overs (CRR: ${crr ?? 0})
- Target: ${target ? target : '1st Innings benchmark setting'}
- Crunch Equation: ${equationText || 'N/A'} (Balls Left: ${ballsRemaining ?? 0}, Runs Needed: ${runsNeeded ?? 'N/A'}, RRR: ${rrr ?? 'N/A'} RPO)
- Current Win Probability: ${teamA}: ${probA}%, ${teamB}: ${probB}%
- Favored Team: ${favoredTeam} (${favoredProbability}%)
- Tilt Classification: ${tiltStatus}

STYLE DIRECTIVE:
- Explain with high broadcast energy, tactical clarity, and emotion WHY the match is tilting this way.
- Cite the exact equation, balls left, wickets in hand, and required run rate pressure vs bowling control.
- Example tone reference: "With 40 needed off 12, India's win probability has plummeted to 5%. They need a miracle..."
- If it's a tight 50-50, capture the nail-biting suspense.
- If one team is dominating, explain the specific factors (e.g., soaring required rate, top-order collapse, wickets in hand, death over boundary drought).

CRITICAL OUTPUT REQUIREMENT:
Return ONLY a valid raw JSON object with four keys: "en", "hi", "mr", and "keyTacticalReason".
- "en": Punchy English commentary explaining why it's tilting (1-2 sentences).
- "hi": Authentic Hindi commentary in Devanagari script explaining why it's tilting (1-2 sentences).
- "mr": Authentic Marathi commentary in Devanagari script explaining why it's tilting (1-2 sentences).
- "keyTacticalReason": Short 3-6 word summary (e.g. "Mounting RRR Pressure & Dot Ball Squeeze")
No markdown fences, no backticks.`;

        const response = await generateContentWithFallback(ai, {
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });

        const parsed = JSON.parse(response.text || "{}");
        if (parsed.en && parsed.hi && parsed.mr) {
          const result = {
            text: parsed[userPreferredLang] || parsed.en,
            translations: {
              en: parsed.en,
              hi: parsed.hi,
              mr: parsed.mr
            },
            keyTacticalReason: parsed.keyTacticalReason || "Run Rate & Wicket Pressure"
          };
          setCachedAIResponse(cacheKey, result);
          return res.json(result);
        }
      }
    } catch (err: any) {
      console.warn("Win probability commentary fallback triggered:", err.message || err);
    }

    // High quality deterministic fallback matching the user's prompt
    const wicketsLeft = 10 - (wickets || 0);
    let enFallback = "";
    let hiFallback = "";
    let mrFallback = "";
    let reason = "Run Rate Pressure & Wickets in Hand";

    if (currentInningsNum === 2) {
      if (tiltStatus === 'miracle_needed' || (underdogProbability && underdogProbability <= 8)) {
        reason = `Skyrocketing RRR (${rrr} RPO) & Death Over Squeeze`;
        enFallback = `With ${runsNeeded} needed off ${ballsRemaining}, ${underdogTeam}'s win probability has plummeted to ${underdogProbability}%. They need a miracle as the required rate has spiked to ${rrr} RPO with only ${wicketsLeft} wicket${wicketsLeft === 1 ? '' : 's'} left!`;
        hiFallback = `${ballsRemaining} गेंदों में ${runsNeeded} रनों की भारी दरकार के साथ, ${underdogTeam} की जीत की संभावना घटकर मात्र ${underdogProbability}% रह गई है! आवश्यक रन रेट ${rrr} तक पहुंच चुका है और उन्हें मैच बचाने के लिए किसी करिश्मे की दरकार है!`;
        mrFallback = `${ballsRemaining} चेंडूत ${runsNeeded} धावांची अशक्यप्राय गरज असताना, ${underdogTeam} च्या विजयाची शक्यता थेट ${underdogProbability}% वर घसरली आहे! आवश्यक धावगती ${rrr} वर पोहोचल्यामुळे आता केवळ चमत्काराचीच आशा उरली आहे!`;
      } else if (tiltStatus === 'heavy_tilt') {
        reason = favoredTeam === battingTeam ? `Manageable Target (${runsNeeded} off ${ballsRemaining}b)` : `Bowling Squeeze (${rrr} RRR)`;
        enFallback = `${favoredTeam} is in full command with a ${favoredProbability}% win probability, controlling the chase equation with ${wicketsLeft} wickets intact.`;
        hiFallback = `${favoredTeam} ${favoredProbability}% जीत की संभावना के साथ मैच पर पूरी तरह हावी है और मुकाबले का पूरा नियंत्रण उनके पास है।`;
        mrFallback = `${favoredTeam} संघ ${favoredProbability}% विजयाच्या शक्यतेसह सामन्यावर भक्कम पकड मिळवून आहे आणि विजयाचा मार्ग स्पष्ट दिसत आहे.`;
      } else {
        reason = "Evenly Poised Crunch Contest";
        enFallback = `Right down to the wire! Win probability sits poised between ${teamA} and ${teamB}. With ${runsNeeded} needed off ${ballsRemaining} balls, one big over will decide the victor.`;
        hiFallback = `कांटे की टक्कर! दोनों टीमों की जीत की संभावना बराबरी पर टिकी है। ${ballsRemaining} गेंदों में ${runsNeeded} रन चाहिए—मुकाबला किसी भी ओर मुड़ सकता है।`;
        mrFallback = `अटीतटीचा थरार! सामना दोन्ही बाजूंनी खुला आहे. ${ballsRemaining} चेंडूत ${runsNeeded} धावा हव्या असताना पुढचे षटक सामन्याचा फैसला करेल.`;
      }
    } else {
      enFallback = `${favoredTeam} holds a ${favoredProbability}% win probability in the first innings, setting the pace at ${crr} RPO.`;
      hiFallback = `पहली पारी में ${favoredTeam} का पलड़ा ${favoredProbability}% संभावना के साथ भारी है।`;
      mrFallback = `पहिल्या डावात ${favoredTeam} चे पारडे ${favoredProbability}% विजयाच्या शक्यतेसह जड दिसत आहे.`;
    }

    const fallbackResult = {
      text: userPreferredLang === 'mr' ? mrFallback : userPreferredLang === 'hi' ? hiFallback : enFallback,
      translations: {
        en: enFallback,
        hi: hiFallback,
        mr: mrFallback
      },
      keyTacticalReason: reason
    };

    res.json(fallbackResult);
  });

  // AI Agro & Product Smart Search Grounding Endpoint
  app.post("/api/ai/search-grounding", async (req, res) => {
    console.log("AI Search Grounding request received");
    const { query, products } = req.body;
    const cacheKey = `search_grounding_${query}_${(products || []).length}`;
    const cached = getCachedAIResponse(cacheKey);
    if (cached) return res.json(cached);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && Array.isArray(products) && products.length > 0) {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const prompt = `You are an expert Agricultural Agronomist & Inventory Search Assistant.
Query: "${query}"

Product Catalog:
${JSON.stringify(products.slice(0, 30))}

Analyze which products best treat the condition, pest, fertilizer requirement, or query.
Return JSON format:
{
  "results": [
    { "id": "product_id_here", "reason": "Specific technical reason why this product is suitable" }
  ]
}`;

        const response = await generateContentWithFallback(ai, {
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });

        const parsed = JSON.parse(response.text || "{}");
        if (parsed.results) {
          setCachedAIResponse(cacheKey, parsed);
          return res.json(parsed);
        }
      }
    } catch (err: any) {
      console.warn("Search Grounding fallback triggered:", err.message || err);
    }

    // Semantic keyword fuzzy matcher fallback
    const qLower = (query || '').toLowerCase();
    const matched = (products || [])
      .filter((p: any) => {
        const n = (p.name || '').toLowerCase();
        const d = (p.description || '').toLowerCase();
        const c = (p.category || '').toLowerCase();
        const m = (p.manufacturer || '').toLowerCase();
        return n.includes(qLower) || d.includes(qLower) || c.includes(qLower) || m.includes(qLower) ||
          qLower.split(' ').some(word => word.length > 2 && (n.includes(word) || d.includes(word)));
      })
      .slice(0, 5)
      .map((p: any) => ({
        id: p.id,
        reason: `Matched for "${query}" based on product specification, formula grade, and agro crop care classification.`
      }));

    res.json({ results: matched });
  });

  // AI Blog Writing and Metadata Assistant Endpoint (100% resilient with rate limit backoff & deterministic fallbacks)
  app.post("/api/admin/blog-assistant", async (req, res) => {
    console.log("AI Blog Assistant request received");
    const { action, title, desc, prompt } = req.body;
    const cacheKey = `blog_${action}_${title || ''}_${prompt || (desc || '').substring(0, 60)}`;
    const cached = getCachedAIResponse(cacheKey);
    if (cached) return res.json(cached);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        const ai = new GoogleGenAI({ 
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });

        let systemInstruction = "";
        let generatorPrompt = "";

        if (action === "generate_outline") {
          systemInstruction = "You are a professional technical tech writer. Create a detailed blog article outline or starter copy based on the user's prompt.";
          generatorPrompt = `Create a high-quality, professional technical blog post starting draft with headings, markdown formatting, bullet points, and cohesive paragraphs about: "${prompt || title}". Keep it engaging and insightful.`;
        } else if (action === "refine") {
          systemInstruction = "You are an expert copyeditor specializing in business and technology blogs. Upgrade the text's flow, structure, tone, and grammar, while keeping it formatted nicely with markdown headings, bold sections, and paragraphs.";
          generatorPrompt = `Refine and improve the following blog post text. Fix any typos or grammatical mistakes, expand or rephrase brief sentences for a more engaging style, and format it clearly on multiple lines with Markdown (headers, bullet points, bold accents):\n\n"${desc}"`;
        } else if (action === "suggest_meta") {
          systemInstruction = `You are an SEO specialist and content marketer. Analyze the provided title and text, then suggest high-performance metadata in JSON format.
          Return ONLY valid JSON that contains:
          {
            "title": "A highly catchy SEO title",
            "category": "E.g. Technology, Full Stack, Software, Career, or Life",
            "time": "Estimated reading time (e.g. '4 min read')",
            "summary": "150-160 character SEO description"
          }`;
          generatorPrompt = `Analyze this draft to suggest metadata:
          Title: "${title || ""}"
          Description Body: "${desc || ""}"`;
        } else {
          return res.status(400).json({ error: "Unsupported blog action type." });
        }

        const response = await generateContentWithFallback(ai, {
          contents: generatorPrompt,
          config: {
            systemInstruction,
            responseMimeType: action === "suggest_meta" ? "application/json" : undefined,
          },
        });

        const text = (response.text || "").trim();
        if (text) {
          setCachedAIResponse(cacheKey, { text });
          return res.json({ text });
        }
      }
    } catch (error: any) {
      console.warn("AI blog assistant rate limit or temporary error handled. Engaging structured fallback engine:", error.message || error);
    }

    // High quality deterministic fallbacks for blog generator
    if (action === "generate_outline") {
      const mainTopic = prompt || title || "Modern Full-Stack Architecture";
      const fallbackOutline = `# ${mainTopic}

## Executive Summary
In this comprehensive guide, we explore the core engineering principles, practical patterns, and production-ready strategies behind **${mainTopic}**.

### 1. Architectural Foundations
• **High Throughput & Low Latency**: Designing resilient interfaces with predictable caching and sub-100ms response targets.
• **State Isolation & Modularity**: Decoupling presentation layers from business logic to ensure long-term maintainability.
• **Data Integrity & Offline Resilience**: Implementing persistent storage alongside graceful client-side fallbacks.

### 2. Practical Implementation Steps
1. **Define Strong Interfaces**: Establish TypeScript types and contracts early.
2. **Build Scalable Pipelines**: Leverage containerized deployment, CI/CD automation, and automated validation tests.
3. **Optimize User Experience**: Polish animation physics, accessibility contrasts, and responsive layout constraints.

### 3. Key Takeaways & Industry Outlook
Adopting modular paradigms accelerates iteration velocity while keeping technical debt minimal. Explore live demos in our portfolio to see these principles in action!`;

      setCachedAIResponse(cacheKey, { text: fallbackOutline });
      return res.json({ text: fallbackOutline });
    }

    if (action === "refine") {
      const original = (desc || '').trim();
      const cleaned = original
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .join('\n\n');
      
      const refinedText = `### Enhanced Overview\n\n${cleaned}\n\n**Key Highlights:**\n• Streamlined technical terminology and structural flow.\n• Optimized readability with clear paragraph spacing and emphasis.\n• Polished for professional audience engagement.`;
      
      setCachedAIResponse(cacheKey, { text: refinedText });
      return res.json({ text: refinedText });
    }

    if (action === "suggest_meta") {
      const t = title || "Architecting Scalable Full-Stack Systems";
      const words = (desc || "").split(" ").length;
      const readingMinutes = Math.max(2, Math.ceil(words / 200));
      const summaryText = (desc ? desc.substring(0, 150).replace(/\r?\n|\r/g, " ") : `Comprehensive guide on ${t} covering architecture, implementation, and best practices.`).trim() + "...";

      const fallbackMeta = JSON.stringify({
        title: `${t} | In-Depth Developer Guide`,
        category: "Technology",
        time: `${readingMinutes} min read`,
        summary: summaryText
      });

      setCachedAIResponse(cacheKey, { text: fallbackMeta });
      return res.json({ text: fallbackMeta });
    }

    res.json({ text: "Action processed successfully." });
  });

  // Determine production mode:
  // True if NODE_ENV === "production", or if executing the compiled dist/server.cjs bundle,
  // or if running in a container where dist/index.html is pre-built.
  const isProduction =
    process.env.NODE_ENV === "production" ||
    (typeof __filename !== "undefined" && __filename.includes("server.cjs")) ||
    (Boolean(process.argv[1]) && process.argv[1].includes("server.cjs")) ||
    (!process.argv[1]?.endsWith("server.ts") && fs.existsSync(path.join(process.cwd(), "dist", "index.html")));

  if (!isProduction) {
    console.log("Starting in DEVELOPMENT mode");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: process.cwd(),
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in PRODUCTION mode");
    const distPath = fs.existsSync(path.join(process.cwd(), "dist"))
      ? path.join(process.cwd(), "dist")
      : (typeof __dirname !== "undefined" ? __dirname : process.cwd());
    
    // Serve static files with custom cache control headers
    app.use(express.static(distPath, {
      etag: true,
      lastModified: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          // Never cache the index.html file so metadata and builds are updated immediately
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        } else if (filePath.includes('/assets/')) {
          // Cache hashed assets for 1 year
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          // Other static resources (icons, images) cache for 1 hour
          res.setHeader('Cache-Control', 'public, max-age=3600');
        }
      }
    }));

    app.get('*', async (req, res) => {
      const indexPage = path.join(distPath, 'index.html');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');

      const blogId = (req.query.blog_id as string) || (req.path.includes('/blog/') ? req.path.substring(req.path.indexOf('/blog/') + 6) : null);
      const cleanBlogId = blogId ? blogId.split('/')[0].split('?')[0].trim() : null;

      if (cleanBlogId) {
        console.log(`[Meta SEO] Detected blog share request. Parsing document ID: "${cleanBlogId}"`);
        const blogData = await fetchBlogMeta(cleanBlogId);
        
        if (blogData) {
          try {
            if (fs.existsSync(indexPage)) {
              let htmlContent = fs.readFileSync(indexPage, 'utf-8');
              
              const blogTitle = blogData.title || "Shubham Hingane | Blog";
              const blogDescription = blogData.desc ? blogData.desc.substring(0, 160).replace(/\r?\n|\r/g, " ") + "..." : "Read this article on Shubham Hingane's premium full-stack developer portfolio.";
              const blogImage = blogData.image || "https://picsum.photos/seed/blog/600/400";
              
              console.log(`[Meta SEO] Dynamic Injection Active: Replacing title with "${blogTitle}" and image with "${blogImage}"`);
              
              // 1. Replace the <title> tag
              htmlContent = htmlContent.replace(/<title>.*?<\/title>/gi, `<title>${blogTitle}</title>`);
              
              // 2. Helper to set/replace meta tags safely
              const injectOrUpdateMeta = (html: string, nameAttr: string, value: string, isProperty = false) => {
                const attrName = isProperty ? 'property' : 'name';
                // Regex matches a meta tag with the specific name or property attribute
                const regex = new RegExp(`<meta\\s+[^>]*?${attrName}=["']${nameAttr}["'][^>]*?>`, 'gi');
                const cleanValue = value.replace(/"/g, '&quot;');
                const newTag = `<meta ${attrName}="${nameAttr}" content="${cleanValue}" />`;
                
                if (regex.test(html)) {
                  return html.replace(regex, newTag);
                }
                // Prepend to head end
                return html.replace('</head>', `${newTag}\n</head>`);
              };

              // Inject OG tags
              htmlContent = injectOrUpdateMeta(htmlContent, 'og:title', blogTitle, true);
              htmlContent = injectOrUpdateMeta(htmlContent, 'og:description', blogDescription, true);
              htmlContent = injectOrUpdateMeta(htmlContent, 'og:image', blogImage, true);
              htmlContent = injectOrUpdateMeta(htmlContent, 'og:type', 'article', true);
              htmlContent = injectOrUpdateMeta(htmlContent, 'og:url', `https://shubhamhingane.in/?blog_id=${cleanBlogId}`, true);

              // Inject Twitter Card tags
              htmlContent = injectOrUpdateMeta(htmlContent, 'twitter:card', 'summary_large_image');
              htmlContent = injectOrUpdateMeta(htmlContent, 'twitter:title', blogTitle);
              htmlContent = injectOrUpdateMeta(htmlContent, 'twitter:description', blogDescription);
              htmlContent = injectOrUpdateMeta(htmlContent, 'twitter:image', blogImage);

              return res.send(htmlContent);
            }
          } catch (fileError) {
            console.error("[Meta SEO] Failed during server index.html rewriting:", fileError);
          }
        }
      }

      res.sendFile(indexPage);
    });
  }

  // Bind to port 3000 as required by the reverse proxy infrastructure
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

process.on("unhandledRejection", (reason) => {
  console.error("[Server] Unhandled rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[Server] Uncaught exception:", err);
});

startServer();
