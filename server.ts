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
    serverFirebaseDb = getFirestore(app);
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
  const status = err.status || err.statusCode || (err.response && err.response.status);
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
    msg.includes("exceeded")
  );
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
    // Official valid Gemini models ordered for maximum rate-limit tolerance and speed
    const modelsToTry = [
      "gemini-3.1-flash-lite",
      "gemini-3.7-flash",
      "gemini-flash-latest",
      "gemini-2.5-flash"
    ];
    let lastError: any = null;

    for (const model of modelsToTry) {
      // Allow up to 2 retries with exponential backoff + jitter per model for rate limits
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          console.log(`[Gemini] Attempting generation with model: ${model} (attempt ${attempt + 1})`);
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
          console.warn(`[Gemini] Model ${model} attempt ${attempt + 1} failed:`, err.message || err);

          if (isRateLimitOrTemporaryError(err) && attempt === 0) {
            const backoffMs = 600 + Math.floor(Math.random() * 400);
            console.log(`[Gemini] Rate limit / quota detected. Backing off for ${backoffMs}ms before retry...`);
            await sleep(backoffMs);
            continue;
          }
          break; // Move to next fallback model
        }
      }
    }

    throw lastError || new Error("All fallback Gemini models encountered rate limits or errors.");
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
  app.get("/api/health", (req, res) => {
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

  // Dynamic street/gully style local commentary fallback generator
  function getGullyCommentaryFallback(
    event: any,
    batsmanName: string,
    bowlerName: string,
    originalDesc: string
  ): string {
    const bats = batsmanName || 'The batsman';
    const bowl = bowlerName || 'The bowler';
    const type = event?.type || 'unknown';
    const val = event?.val ?? 0;
    const extraType = event?.extraType || '';

    const dots = [
      `Unbelievable line from ${bowl}! ${bats} is completely clueless, searching for answers!`,
      `A solid defensive stroke. ${bats} playing with soft hands, showing respect to ${bowl}.`,
      `Straight through to the keeper! ${bowl} is steaming in, expressing some serious pace!`,
      `Swing and a miss! ${bats} tried to execute a wild heave but only met the cool gully breeze!`,
      `Dot ball! Good field placement there, no room given whatsoever!`,
      `Superb delivery, pitching exactly on the spot. ${bats} plays it carefully.`,
      `Well played but straight to the fielder. No run! Great pressure here!`,
      `Absolute beauty! Just beats the outside edge. ${bowl} looks fired up!`
    ];

    const singles = [
      `${bats} tucks it off the hips, stealing a quick single! Great understanding between the runners.`,
      `Just a little push into the gap for one. Excellent rotation of strike!`,
      `Gently nudged to long-on. They easily stroll through for a single.`,
      `Driven down the ground. Well fielded, keeping it down to just a single!`,
      `A quick tap-and-run! That's brilliant street-smart gully running from ${bats}!`
    ];

    const doubles = [
      `Driven beautifully through the covers! They push hard for the second and achieve it comfortably!`,
      `Flicked off the pads towards mid-wicket. Superb running between the wickets, that's two!`,
      `Slashed past point. Excellent athletic fielding keeps it to a brace.`,
      `In the air... but lands safely in the vacant deep region! They scamper back for two runs.`
    ];

    const boundaries = [
      `CRACK! That's an absolute missile from ${bats}! Sent racing through the covers for FOUR!`,
      `Shot of the day! A magnificent straight drive that scorches the gully turf for FOUR!`,
      `A delicate late cut! Guided perfectly between third man and slip for a majestic boundary!`,
      `Over the infielder's head and bouncing into the fence! Pure elegance from ${bats} for FOUR!`
    ];

    const sixes = [
      `BOOM! That is massive! ${bats} launches ${bowl} deep over mid-wicket into the nearby street! SIX!`,
      `Out of the stadium, out of the park! What a phenomenal hit! Absolute power for SIX!`,
      `A towering sixer! High, deep, and handsome! ${bats} is at his absolute devastating best!`,
      `CRUNCHED! Clean as a whistle, sailed over the fence with yards to spare! That's a gully classic!`
    ];

    const wickets = [
      `OUT! ABSOLUTE DRAMA! ${bats} is clean bowled! ${bowl} spins a web and breaks the timber!`,
      `GOT 'EM! A thick edge taken safely by the keeper! ${bats} has to make the long walk back!`,
      `GONE! In the air and a magnificent, diving catch in the deep! What a stellar breakthrough!`,
      `OUT! A direct hit at the bowler's end and ${bats} is caught well short of the crease! Brilliant run out!`,
      `TRAPPED! Loud appeal for LBW and the umpire matches it with a raised finger! Absolutely plumb!`
    ];

    const extras = [
      `Wide ball! ${bowl} trying to bowl too fast and loses control down the leg side.`,
      `Over-the-line! No-ball declared! Free-hit loading for ${bats}!`,
      `Wide ball! A bit too wide outside off-stump, standard extra conceded.`,
      `Bye runs conceded! Slipped past both the batsman and the keeper for an extra.`
    ];

    // Priority logic matching
    const oLower = (originalDesc || '').toLowerCase();
    if (type === 'wicket' || oLower.includes('out') || oLower.includes('wkt') || oLower.includes('gone') || oLower.includes('bowled')) {
      return wickets[Math.floor(Math.random() * wickets.length)];
    }
    if (type === 'boundary' || val === 4 || oLower.includes('four') || oLower.includes('boundary')) {
      return boundaries[Math.floor(Math.random() * boundaries.length)];
    }
    if (val === 6 || oLower.includes('six')) {
      return sixes[Math.floor(Math.random() * sixes.length)];
    }
    if (val === 1) {
      return singles[Math.floor(Math.random() * singles.length)];
    }
    if (val === 2) {
      return doubles[Math.floor(Math.random() * doubles.length)];
    }
    if (type === 'extra' || extraType || oLower.includes('wide') || oLower.includes('no ball') || oLower.includes('free hit')) {
      return extras[Math.floor(Math.random() * extras.length)];
    }
    if (val === 0) {
      return dots[Math.floor(Math.random() * dots.length)];
    }

    return originalDesc || "A beautiful ball delivered, keeping the tension sky-high!";
  }

  // AI Cricket Commentary Generator Endpoint (supports both ball-by-ball match deliveries & auction updates)
  app.post("/api/cricket/commentary", async (req, res) => {
    console.log("AI Cricket Commentary request received");
    const { matchState, event, batsman, bowler, originalDescription, eventType, eventData, voiceStyle } = req.body;

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
          const prompt = `You are a charismatic cricket auctioneer and sports commentator. Generate a single energetic, punchy sentence of commentary for this auction event:
Event Type: ${eventType}
Details: ${JSON.stringify(eventData || {})}
Style: ${voiceStyle || 'Energetic and witty'}
Output only the plain commentary sentence without extra labels.`;

          const response = await generateContentWithFallback(ai, { contents: prompt });
          const text = (response.text || "").trim();
          if (text) {
            setCachedAIResponse(cacheKey, { text });
            return res.json({ text });
          }
        }
      } catch (err: any) {
        console.warn("Auction commentary fallback triggered:", err.message || err);
      }

      // Fallback for auction
      let fallbackAuctionText = "The auction room is buzzing with anticipation as franchises evaluate their squad balance!";
      if (eventType === 'BID_PLACED') {
        fallbackAuctionText = `Aggressive bidding war ignited for ${eventData?.playerName || 'the player'}! The price soars to ₹${(eventData?.amount || 0).toLocaleString('en-IN')}!`;
      } else if (eventType === 'PLAYER_SOLD') {
        fallbackAuctionText = `SOLD! ${eventData?.playerName || 'The player'} joins ${eventData?.teamName || 'the franchise'} for a sensational ₹${(eventData?.amount || 0).toLocaleString('en-IN')}!`;
      } else if (eventType === 'PLAYER_UNSOLD') {
        fallbackAuctionText = `Unsold for now! ${eventData?.playerName || 'The player'} goes into the accelerated round pool.`;
      }
      return res.json({ text: fallbackAuctionText });
    }

    // Match ball-by-ball commentary
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("GEMINI_API_KEY missing. Handing over to local gully commentator.");
        const fallbackText = getGullyCommentaryFallback(event, batsman?.name, bowler?.name, originalDescription);
        return res.json({ text: fallbackText });
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

      const prompt = `
        You are an exceptionally humorous, creative, and energetic cricket commentator (such as Harsha Bhogle, Ravi Shastri, or a passionate local street/gully cricket organizer).
        Your mission is to write a unique, descriptive, and fun entry for the ongoing ball.

        MATCH EVENT SUMMARY:
        - Ball event category: ${event?.type || 'unknown'}
        - Recorded details (runs/extras): ${event?.val ?? '0'}
        - Extra notes if available: ${event?.extraType || 'None'}
        - Batsman facing delivery: ${batsman?.name || 'Batsman'}
        - Bowler delivering: ${bowler?.name || 'Bowler'}
        - Basic description: "${originalDescription || ''}"

        CURRENT INNINGS STATE:
        - Score: ${matchState?.runs ?? 0}/${matchState?.wickets ?? 0}
        - Balls Bowled: ${matchState?.ballsBowled ?? 0}
        - Target Score: ${matchState?.targetRuns ?? 'N/A'}

        RECENT PREVIOUS DELIVERIES COMMENTARY (DO NOT USE SIMILAR SENTENCE STRUCTURES OR WORDS):
        ${previousCommentariesText}

        CRITICAL AND ABSOLUTE REQUIREMENTS:
        - Return EXACTLY one or two short, highly vivid, punchy sentences of commentary.
        - NEVER repeat the exact same verbs, metaphors, or phrases used in the recent previous commentaries shown above.
        - Ensure extreme variance: use cricket slang, crowd descriptions, local street tournament humor ("What a shot!", "Spun a web!", "Treat to watch!", "Absolute gold!", "Oh my goodness, clean as a whistle!"), and rich adjectives.
        - Keep comments strictly relevant to the current delivery's event category (e.g. if dot ball, don't say they scored; if wicket, make sure to sound shocked or dramatic!).
        - Output ONLY the plain text commentary. No markdown formatting, no surrounding quotation marks, and no introductory labeling text.
      `;

      const response = await generateContentWithFallback(ai, {
        contents: prompt,
      });

      res.json({ text: (response.text || "").trim() || originalDescription });
    } catch (error: any) {
      console.warn("Gemini Commentary API Quota limit or error triggered. Reverting to local gully commentator:", error.message || error);
      const fallbackText = getGullyCommentaryFallback(event, batsman?.name, bowler?.name, originalDescription);
      res.json({ text: fallbackText });
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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
    const distPath = path.join(process.cwd(), 'dist');
    
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
