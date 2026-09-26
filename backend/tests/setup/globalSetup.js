/**
 * globalSetup.js — Jest global setup
 *
 * 1. Validates that the backend is reachable before tests run.
 * 2. Pre-logs-in all three roles (USER, ITSM, ADMIN) and writes the JWT tokens
 *    to a temp file so all test workers share one set of tokens.
 *    This means only 3 login HTTP calls total per test run, well within the
 *    rate-limiter window of 10 per 15 minutes.
 */

const http = require("http");
const fs   = require("fs");
const path = require("path");
const os   = require("os");

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:8080";

const TOKEN_FILE = path.join(os.tmpdir(), "sentinelcore_rbac_tokens.json");

const CREDENTIALS = {
  USER:  { email: "user@sentinelcore.com",  password: "Admin@123" },
  ITSM:  { email: "itsm@sentinelcore.com",  password: "Admin@123" },
  ADMIN: { email: "admin@sentinelcore.com", password: "Admin@123" },
};

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const data = JSON.stringify(body);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: parsed.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
      timeout: 10000,
    };
    const req = http.request(options, (res) => {
      let raw = "";
      res.on("data", (c) => { raw += c; });
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Login request timed out")); });
    req.write(data);
    req.end();
  });
}

module.exports = async function globalSetup() {
  console.log(`\n[RBAC Test Suite] Checking backend connectivity at ${BASE_URL} ...`);

  // ── 1. Connectivity check ────────────────────────────────────────────────
  await new Promise((resolve, reject) => {
    const parsed = new URL(BASE_URL);
    const req = http.get(
      { hostname: parsed.hostname, port: parsed.port || 8080, path: "/", timeout: 8000 },
      (res) => {
        console.log(`[RBAC Test Suite] Backend responded HTTP ${res.statusCode} — OK`);
        resolve();
      }
    );
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(
        `\n[RBAC Test Suite] FATAL: Backend not reachable at ${BASE_URL}\n` +
        `Start the backend with: npm run dev\n`
      ));
    });
    req.on("error", (err) => {
      reject(new Error(
        `\n[RBAC Test Suite] FATAL: Cannot connect to ${BASE_URL} — ${err.message}\n` +
        `Start the backend with: npm run dev\n`
      ));
    });
  });

  // ── 2. Pre-login all roles ───────────────────────────────────────────────
  // Only 3 login calls total for the entire test run.
  // Tokens are saved to a temp file and read by auth.js in each test file.
  console.log("[RBAC Test Suite] Pre-authenticating USER, ITSM, ADMIN ...");
  const tokens = {};

  for (const [role, creds] of Object.entries(CREDENTIALS)) {
    const resp = await httpPost(`${BASE_URL}/api/auth/login`, creds);
    if (resp.status !== 200 || !resp.body.token) {
      throw new Error(
        `[RBAC Test Suite] FATAL: Login failed for ${role} (${creds.email})\n` +
        `HTTP ${resp.status}: ${JSON.stringify(resp.body)}\n` +
        `Ensure the user exists in the DB with password Admin@123\n`
      );
    }
    tokens[role] = resp.body.token;
    console.log(`[RBAC Test Suite]   ✓ ${role} authenticated (${creds.email})`);
  }

  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2), "utf8");
  process.env.RBAC_TOKEN_FILE = TOKEN_FILE;
  console.log(`[RBAC Test Suite] Tokens cached at: ${TOKEN_FILE}\n`);
};
