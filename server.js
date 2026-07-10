// server.js — Gig Worker Form Spammer — HTTP Server
import { runBatch, generateResponse, PROFILES, FORM_ACTION } from "./form-engine.js";
import fs from "fs";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4567;
const LOG_FILE = "logs/submissions.json";

if (!fs.existsSync("logs")) fs.mkdirSync("logs");
if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, "[]");

const sseClients = new Set();
let currentBatch = null;
let abortController = null;

function broadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try { client.res.write(msg); } catch {}
  }
}

function readLog() {
  try { return JSON.parse(fs.readFileSync(LOG_FILE, "utf-8")); }
  catch { return []; }
}

function appendLog(entries) {
  const existing = readLog();
  fs.writeFileSync(LOG_FILE, JSON.stringify([...existing, ...entries], null, 2));
}

function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); }
      catch (e) { reject(e); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const method = req.method;

  // Auth
  const USERNAME = "admin";
  const PASSWORD = "gigspam2024";
  const auth = req.headers.authorization;
  if (!auth) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Gig Spammer"');
    res.writeHead(401); res.end("Auth required"); return;
  }
  const [user, pass] = Buffer.from(auth.split(" ")[1], "base64").toString().split(":");
  if (user !== USERNAME || pass !== PASSWORD) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Gig Spammer"');
    res.writeHead(401); res.end("Invalid credentials"); return;
  }

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (method === "OPTIONS") { res.writeHead(204, corsHeaders); res.end(); return; }

  function json(data, status = 200) {
    res.writeHead(status, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  }

  // Static files
  if (method === "GET" && !url.pathname.startsWith("/api/")) {
    let filePath = url.pathname === "/" ? "/public/index.html" : "/public" + url.pathname;
    const fullPath = path.join(__dirname, filePath);
    try {
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        const ext = path.extname(fullPath);
        const mime = { ".html": "text/html", ".css": "text/css", ".js": "application/javascript", ".json": "application/json" }[ext] || "text/plain";
        res.writeHead(200, { "Content-Type": mime });
        fs.createReadStream(fullPath).pipe(res); return;
      }
    } catch {}
    res.writeHead(404); res.end("Not Found"); return;
  }

  // SSE
  if (url.pathname === "/api/events") {
    res.writeHead(200, { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" });
    const client = { res };
    sseClients.add(client);
    req.on("close", () => sseClients.delete(client));
    res.write(`event: status\ndata: ${JSON.stringify({ running: currentBatch !== null })}\n\n`);
    return;
  }

  // Profiles
  if (url.pathname === "/api/profiles" && method === "GET") {
    return json(PROFILES);
  }

  // Preview
  if (url.pathname === "/api/preview" && method === "POST") {
    const body = await getBody(req);
    const profile = PROFILES.find((p) => p.id === body.profileId) || PROFILES[0];
    const params = generateResponse(profile, body.noiseLevel ?? null);
    const obj = {};
    for (const [k, v] of params) {
      if (obj[k]) obj[k] = Array.isArray(obj[k]) ? [...obj[k], v] : [obj[k], v];
      else obj[k] = v;
    }
    return json({ profile: profile.name, data: obj });
  }

  // Start batch
  if (url.pathname === "/api/start" && method === "POST") {
    if (currentBatch) return json({ error: "Already running" }, 409);
    const body = await getBody(req);
    const { totalCount = 50, delayMin = 1500, delayMax = 4000, noiseLevel = null } = body;
    abortController = { aborted: false };
    const batchResults = [];

    currentBatch = runBatch({
      profiles: PROFILES,
      totalCount,
      delayMin,
      delayMax,
      noiseLevel,
      abortSignal: abortController,
      onProgress(progress) {
        batchResults.push(progress.result);
        broadcast("progress", progress);
      },
    }).then(({ results, successCount, failCount }) => {
      currentBatch = null;
      appendLog(results);
      broadcast("done", { successCount, failCount, total: results.length });
    }).catch((err) => {
      currentBatch = null;
      broadcast("error", { message: err.message });
    });

    return json({ ok: true, message: `Đang gửi ${totalCount} form...` });
  }

  // Stop
  if (url.pathname === "/api/stop" && method === "POST") {
    if (abortController) abortController.aborted = true;
    currentBatch = null;
    return json({ ok: true });
  }

  // Status
  if (url.pathname === "/api/status" && method === "GET") {
    return json({ running: currentBatch !== null });
  }

  // Logs
  if (url.pathname === "/api/logs" && method === "GET") {
    return json(readLog());
  }
  if (url.pathname === "/api/logs" && method === "DELETE") {
    fs.writeFileSync(LOG_FILE, "[]");
    return json({ ok: true });
  }

  json({ error: "Not found" }, 404);
});

server.listen(PORT, () => {
  console.log(`\n🚀 Gig Worker Spammer chạy tại: http://localhost:${PORT}`);
  console.log(`   Tài khoản: admin / gigspam2024\n`);
});
