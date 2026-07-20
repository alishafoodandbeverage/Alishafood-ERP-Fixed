import express, { type Request, type Response, type NextFunction } from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { db } from "./src/db/db.js";
import { appState } from "./src/db/schema.js";
import { eq } from "drizzle-orm";

type Session = { email: string; expiresAt: number };
const sessions = new Map<string, Session>();
const SESSION_COOKIE = "alisha_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const STATE_ID = "main";

function env(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

function safeEqual(a: string, b: string): boolean {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function createSession(email: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { email, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

function getSession(req: Request): Session | null {
  const token = req.headers.cookie?.split(";").map(v => v.trim()).find(v => v.startsWith(`${SESSION_COOKIE}=`))?.split("=")[1];
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) sessions.delete(token);
    return null;
  }
  return session;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: "Unauthorized" });
  (req as Request & { userEmail?: string }).userEmail = session.email;
  next();
}

function setSessionCookie(res: Response, token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure}`);
}

function clearSessionCookie(res: Response) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

function stripSecrets(value: any): any {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(stripSecrets);
  const out: any = {};
  for (const [key, val] of Object.entries(value)) {
    if (key === "loginPassword") continue;
    out[key] = stripSecrets(val);
  }
  return out;
}

async function loadState() {
  const result = await db.select().from(appState).where(eq(appState.id, STATE_ID));
  return result.length ? result[0].state : null;
}

async function saveState(state: any) {
  const sanitizedState = stripSecrets(state);
  await db.insert(appState).values({ id: STATE_ID, state: sanitizedState, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appState.id, set: { state: sanitizedState, updatedAt: new Date() } });
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  app.disable("x-powered-by");
  app.use(express.json({ limit: "50mb" }));

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.post("/api/auth/login", async (req, res) => {
    try {
      const email = String(req.body?.email || "").trim().toLowerCase();
      const password = String(req.body?.password || "");
      const adminEmail = env("ADMIN_EMAIL")?.toLowerCase();
      const adminPassword = env("ADMIN_PASSWORD");
      if (!adminEmail || !adminPassword) return res.status(503).json({ error: "Server authentication is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD." });
      if (!email || !password || !safeEqual(email, adminEmail) || !safeEqual(password, adminPassword)) {
        return res.status(401).json({ error: "Invalid email or password." });
      }
      const token = createSession(adminEmail);
      setSessionCookie(res, token);
      res.json({ success: true, email: adminEmail });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Unable to sign in." });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    const session = getSession(req);
    if (!session) return res.status(401).json({ authenticated: false });
    res.json({ authenticated: true, email: session.email });
  });

  app.post("/api/auth/logout", (req, res) => {
    const token = req.headers.cookie?.split(";").map(v => v.trim()).find(v => v.startsWith(`${SESSION_COOKIE}=`))?.split("=")[1];
    if (token) sessions.delete(token);
    clearSessionCookie(res);
    res.json({ success: true });
  });

  app.post("/api/auth/reset-request", (_req, res) => {
    // No fake success message: a real email provider must be configured before reset emails are sent.
    res.status(501).json({ error: "Password reset email is not configured. Set up an email provider before enabling this feature." });
  });

  app.get("/api/state", requireAuth, async (_req, res) => {
    try {
      const state = await loadState();
      res.json(stripSecrets(state));
    } catch (error: any) {
      console.error("State load error:", error);
      res.status(500).json({ error: "Unable to load application data." });
    }
  });

  app.post("/api/state", requireAuth, async (req, res) => {
    try {
      if (!req.body || typeof req.body !== "object") return res.status(400).json({ error: "Invalid state payload." });
      await saveState(req.body);
      res.json({ success: true });
    } catch (error: any) {
      console.error("State save error:", error);
      res.status(500).json({ error: "Unable to save application data." });
    }
  });

  app.post("/api/tts", requireAuth, async (req, res) => {
    try {
      const apiKey = env("GEMINI_API_KEY");
      if (!apiKey) return res.status(503).json({ error: "Gemini API key is not configured." });
      const { text, language = "bn-IN", voice = "Aoede" } = req.body;
      if (!text || typeof text !== "string") return res.status(400).json({ error: "Text is required." });
      const ai = new GoogleGenAI({ apiKey });
      const interaction = await ai.interactions.create({ model: "gemini-3.1-flash-tts-preview", input: text, response_modalities: ["AUDIO"], generation_config: { speech_config: { language, voice } } });
      let audioBase64 = "";
      for (const step of interaction.steps) {
        if (step.type === "model_output") {
          const audioContent = step.content?.find((c: any) => c.type === "audio");
          if (audioContent?.data) { audioBase64 = audioContent.data; break; }
        }
      }
      if (!audioBase64) return res.status(502).json({ error: "Failed to generate audio." });
      res.json({ audio: audioBase64 });
    } catch (error: any) {
      console.error("TTS API Error:", error);
      res.status(500).json({ error: "TTS request failed." });
    }
  });

  app.post("/api/gemini/chat", requireAuth, async (req, res) => {
    try {
      const apiKey = env("GEMINI_API_KEY");
      if (!apiKey) return res.status(503).json({ error: "Gemini API key is not configured." });
      const { prompt, branchData, history = [], image } = req.body;
      if (!prompt && !image) return res.status(400).json({ error: "Prompt or image is required." });
      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "alisha-erp" } } });
      let branchContext = "No branch data is currently available.";
      if (branchData) {
        const itemsSummary = branchData.items?.length ? branchData.items.map((i: any) => `- ${i.name} (SKU: ${i.sku}): Cost ${i.cost} BDT, Price ${i.price} BDT, Stock: ${i.stock} ${i.unit}`).join("\n") : "No items listed.";
        const productionSummary = branchData.production?.length ? branchData.production.map((p: any) => `- Batch: ${p.itemName}, Cost: ${p.productionCost} BDT, Date: ${p.date}`).join("\n") : "No production runs logged.";
        const salesSummary = branchData.salesList?.length ? branchData.salesList.slice(-10).map((s: any) => `- Sold ${s.quantity} units of ${s.itemName} for ${s.amount} BDT on ${s.date}`).join("\n") : "No sales transactions logged recently.";
        const customersSummary = branchData.customers?.length ? branchData.customers.map((c: any) => `- ${c.name}: Due ${c.due} BDT, Sales ${c.totalSales} BDT`).join("\n") : "No customer accounts registered.";
        const suppliersSummary = branchData.suppliers?.length ? branchData.suppliers.map((s: any) => `- ${s.name}: Outstanding ${s.outstanding} BDT`).join("\n") : "No suppliers registered.";
        const expensesSummary = branchData.expensesList?.length ? branchData.expensesList.slice(-10).map((e: any) => `- ${e.category}: ${e.amount} BDT, Date: ${e.date} (${e.description})`).join("\n") : "No operational expenses logged.";
        branchContext = `Active Factory/Branch Name: ${branchData.name}\nLocation: ${branchData.location}\nFinancial Aggregates:\n- Total Sales: ${branchData.sales?.toLocaleString()} BDT\n- Total Outstanding Due from Dealers: ${branchData.due?.toLocaleString()} BDT\n- Raw Materials Purchases: ${branchData.purchases?.toLocaleString()} BDT\n- Operational Expenses: ${branchData.expenses?.toLocaleString()} BDT\n- Estimated Stock/Inventory Asset Valuation: ${branchData.stockValue?.toLocaleString()} BDT\n\nActive Product & Inventory Directory:\n${itemsSummary}\n\nRecent Production Run History:\n${productionSummary}\n\nRecent Sales Log:\n${salesSummary}\n\nDealer & Customers Accounts:\n${customersSummary}\n\nRaw Material Suppliers:\n${suppliersSummary}\n\nRecent Expenses List:\n${expensesSummary}`;
      }
      const systemInstruction = `You are Alisha Factory AI, the intelligent virtual co-pilot for the Alisha Food & Beverage ERP. Use only the supplied factory context. Do not invent values. Provide concise, professional, business-focused analysis in markdown.`;
      const promptParts: any[] = [];
      if (image) {
        const match = String(image).match(/^data:(.*?);base64,(.*)$/);
        if (match) promptParts.push({ inlineData: { data: match[2], mimeType: match[1] } });
      }
      if (prompt) promptParts.push({ text: prompt });
      const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: [{ role: "user", parts: [{ text: `CONTEXT DATA ABOUT THE FACTORY:\n${branchContext}` }] }, ...history.map((h: any) => ({ role: h.role, parts: [{ text: h.text }] })), { role: "user", parts: promptParts }], config: { systemInstruction, temperature: 0.7 } });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini route error:", error);
      res.status(500).json({ error: "AI request failed." });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
}

startServer().catch((error) => { console.error("Fatal server startup error:", error); process.exit(1); });
