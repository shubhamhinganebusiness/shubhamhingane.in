import express from "express";
import path from "path";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

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
      "gemini-3.1-flash-lite",
      "gemini-3.6-flash",
      "gemini-3.8-flash",
      "gemini-flash-latest",
      "gemini-3.7-flash"
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

      // Allow up to 2 attempts for standard transient blips, but immediately switch on 503 high demand
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          console.log(`[Gemini] Calling model: ${model}${attempt > 0 ? ` (retry ${attempt + 1})` : ''}`);
          const response = await ai.models.generateContent({
            ...params,
            model,
          });
          if (response && response.text) {
            console.log(`[Gemini] Success using model: ${model}`);
            return response;
          }
        } catch (err: any) {
          lastError = err;

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

  app.use(cors());
  app.use(express.json());

  // API routes go here FIRST
  app.get(["/api/health", "/health", "/healthz"], (req, res) => {
    res.json({ status: "ok" });
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
      'test-realtime-check'
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

      // Also attempt to delete doc in Firestore if possible
      try {
        const db = await getFirebaseDb();
        if (db) {
          const { doc, deleteDoc } = await import("firebase/firestore");
          deleteDoc(doc(db, "cricket_matches", matchId)).catch(() => {});
        }
      } catch (_) {}

      res.json({ success: true, deletedId: matchId, count: ids.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to mark match deleted" });
    }
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
      const managerRef = doc(db, "score_managers", managerId);
      const managerSnap = await getDoc(managerRef);
      if (managerSnap.exists()) {
        const mgrData = managerSnap.data();
        if (mgrData.status === 'live' && mgrData.activeMatchId) {
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
      }

      // 2. Query cricket_matches for any live match by managerId or streamKey
      const q = query(
        collection(db, "cricket_matches"),
        where("managerId", "==", managerId),
        where("status", "==", "live"),
        limit(1)
      );
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        const matchDoc = qSnap.docs[0];
        return res.json({
          active: true,
          managerId,
          matchId: matchDoc.id,
          match: matchDoc.data()
        });
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

  // Set Active Match endpoint (switches match to 'live' and retires previous matches to 'completed')
  app.post("/api/cricket/set-active-match", async (req, res) => {
    try {
      const { managerId, matchId, streamKey } = req.body || {};
      if (!managerId || !matchId) {
        return res.status(400).json({ error: "managerId and matchId are required" });
      }

      const db = await getFirebaseDb();
      if (!db) {
        return res.status(503).json({ error: "Database not available" });
      }

      const { doc, setDoc, updateDoc, collection, query, where, getDocs } = await import("firebase/firestore");

      // 1. Mark target match as 'live' and assign managerId
      const targetMatchRef = doc(db, "cricket_matches", matchId);
      await updateDoc(targetMatchRef, {
        status: "live",
        managerId,
        streamKey: streamKey || null,
        updatedAt: Date.now()
      });

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
            await updateDoc(doc(db, "cricket_matches", oldDoc.id), {
              status: "completed",
              updatedAt: Date.now()
            });
          }
        }
      } catch (retireErr) {
        console.warn("[Cricket API] Error retiring old live matches:", retireErr);
      }

      // 3. Update pointer in score_managers
      const managerRef = doc(db, "score_managers", managerId);
      await setDoc(managerRef, {
        managerId,
        streamKey: streamKey || null,
        activeMatchId: matchId,
        status: "live",
        updatedAt: Date.now()
      }, { merge: true });

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

      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "cricket_matches", matchId), {
        status: "completed",
        updatedAt: Date.now()
      });

      if (managerId) {
        const managerRef = doc(db, "score_managers", managerId);
        await updateDoc(managerRef, {
          activeMatchId: null,
          status: "completed",
          updatedAt: Date.now()
        }).catch(() => {});
      }

      return res.json({ success: true, matchId, status: "completed" });
    } catch (err: any) {
      console.error("[Cricket API] Error completing match:", err);
      res.status(500).json({ error: err.message || "Failed to complete match" });
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
    specialTrigger?: any
  ): { en: string; hi: string; mr: string } {
    const bats = batsmanName || 'The batsman';
    const bowl = bowlerName || 'The bowler';
    const type = event?.type || 'unknown';
    const val = event?.val ?? 0;
    const extraType = event?.extraType || '';

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

    const oLower = (originalDesc || '').toLowerCase();
    if (type === 'wicket' || oLower.includes('out') || oLower.includes('wkt') || oLower.includes('gone') || oLower.includes('bowled')) {
      const base = pick(wickets);
      if (newBatsmanName) {
        return {
          en: `${base.en} After wicket fell, ${newBatsmanName} new batsman come on crease.`,
          hi: `${base.hi} विकेट गिरने के बाद, ${newBatsmanName} नए बल्लेबाज क्रीज पर आए हैं.`,
          mr: `${base.mr} विकेट पडल्यानंतर, ${newBatsmanName} नवीन फलंदाज क्रीजवर आले आहेत.`
        };
      }
      return base;
    }
    if (type === 'boundary' || val === 4 || oLower.includes('four') || oLower.includes('boundary')) {
      return pick(boundaries);
    }
    if (val === 6 || oLower.includes('six')) {
      return pick(sixes);
    }
    if (val === 1) {
      return pick(singles);
    }
    if (val === 2) {
      return pick(doubles);
    }
    if (type === 'extra' || extraType || oLower.includes('wide') || oLower.includes('no ball') || oLower.includes('free hit')) {
      return pick(extras);
    }
    if (val === 0) {
      return pick(dots);
    }

    const defaultEn = originalDesc || "A beautiful ball delivered, keeping the tension sky-high!";
    return {
      en: defaultEn,
      hi: `${bowl} ने ${bats} को गेंद फेंकी, रोमांच अपने चरम पर!`,
      mr: `${bowl} ने ${bats} ला सुरेख चेंडू टाकला, मैदानात सामना रंगतदार स्थितीत!`
    };
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
      specialTrigger 
    } = req.body;

    const incomingNewBatsman = reqNewBat || additionalContext?.newBatsmanName || '';
    const userPreferredLang = (language === 'mr' || language === 'hi' || language === 'en') ? language : 'en';
    const activeTone = contextualTone || additionalContext?.contextualTone || 'BALANCED_CRICKET';

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
        const fallback = getGullyCommentaryMultilingual(event, batsman?.name, bowler?.name, originalDescription, incomingNewBatsman, activeTone, specialTrigger);
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

      // Special Trigger Directive (Wicket, 50, 100, Hat-trick)
      let specialDirective = "";
      if (specialTrigger) {
        specialDirective = `MAJOR ACHIEVEMENT SPECIAL TRIGGER:
- Type: ${specialTrigger.type}
- Details: ${JSON.stringify(specialTrigger)}
- CRITICAL: Provide a highly enthusiastic, detailed breakdown of the achievement, explicitly including the batter's total runs, balls faced, boundaries, strike rate, or bowler's hat-trick feat!`;
      }

      const prompt = `
        You are an exceptionally humorous, creative, and energetic cricket commentator for local gully & tournament matches.
        Generate live commentary for the ongoing ball delivery in THREE languages: English, Hindi, and Marathi.

        ${toneDirective}
        ${specialDirective}

        MATCH EVENT SUMMARY:
        - Ball event category: ${event?.type || 'unknown'}
        - Recorded details (runs/extras): ${event?.val ?? '0'}
        - Extra notes if available: ${event?.extraType || 'None'}
        - Batsman facing delivery: ${batsman?.name || 'Batsman'}
        - Bowler delivering: ${bowler?.name || 'Bowler'}
        - Basic description: "${originalDescription || ''}"
        ${incomingNewBatsman ? `- Incoming new batsman: ${incomingNewBatsman} (Crucial note: announce: "After wicket fell, ${incomingNewBatsman} new batsman come on crease" / हिंदी: "विकेट गिरने के बाद, ${incomingNewBatsman} नए बल्लेबाज क्रीज पर आए हैं." / मराठी: "विकेट पडल्यानंतर, ${incomingNewBatsman} नवीन फलंदाज क्रीजवर आले आहेत.")` : ''}

        CURRENT INNINGS STATE:
        - Score: ${matchState?.runs ?? 0}/${matchState?.wickets ?? 0}
        - Balls Bowled: ${matchState?.ballsBowled ?? 0}
        - Target Score: ${matchState?.targetRuns ?? 'N/A'}

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
            return res.json({
              text: parsed[userPreferredLang] || parsed.en,
              translations: {
                en: parsed.en.trim(),
                hi: parsed.hi.trim(),
                mr: parsed.mr.trim()
              }
            });
          }
        } catch {
          // fallback to standard text extraction
        }
      }

      // If single language returned or couldn't parse JSON
      const plainText = raw.replace(/^\{|\}$/g, '').trim();
      const fallback = getGullyCommentaryMultilingual(event, batsman?.name, bowler?.name, originalDescription, incomingNewBatsman, activeTone, specialTrigger);
      res.json({
        text: plainText || fallback[userPreferredLang] || fallback.en,
        translations: {
          en: plainText || fallback.en,
          hi: fallback.hi,
          mr: fallback.mr
        }
      });
    } catch (error: any) {
      console.warn("Gemini Commentary API Quota limit or error triggered. Reverting to local gully commentator:", error.message || error);
      const fallback = getGullyCommentaryMultilingual(event, batsman?.name, bowler?.name, originalDescription, incomingNewBatsman, activeTone, specialTrigger);
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
