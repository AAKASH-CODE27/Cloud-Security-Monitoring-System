/**
 * auth.js — RBAC Test Auth Helpers
 *
 * Strategy:
 *   1. Read pre-fetched tokens from the temp file written by globalSetup.js
 *      (this happens in every test file, zero extra login calls).
 *   2. Fall back to a live login call only if the token file is missing
 *      (e.g., running a single test file in isolation).
 *
 * Login endpoint: POST /api/auth/login
 * Request body:   { email, password }
 * Response body:  { success: true, token: "<jwt>", user: { ... } }
 * JWT used as:    Authorization: Bearer <token>
 *
 * Source verified from:
 *   authRoutes.js  → POST /api/auth/login
 *   authController.js → login() → authService.loginUser()
 *   authService.js    → returns { success, token, user }
 *   jwt.js            → generateToken(email) → { sub: email }
 *   auth.js middleware → reads Authorization: Bearer <token>
 */

const http = require("http");
const fs   = require("fs");
const os   = require("os");
const path = require("path");

const BASE_URL   = process.env.TEST_BASE_URL  || "http://localhost:8080";
const TOKEN_FILE = process.env.RBAC_TOKEN_FILE ||
                   path.join(os.tmpdir(), "sentinelcore_rbac_tokens.json");

// ── Seeded credentials (from seed.js — all share Admin@123) ─────────────────
const CREDENTIALS = {
  USER:  { email: "user@sentinelcore.com",  password: "Admin@123" },
  ITSM:  { email: "itsm@sentinelcore.com",  password: "Admin@123" },
  ADMIN: { email: "admin@sentinelcore.com", password: "Admin@123" },
};

// In-memory cache as a last resort (within a single worker)
const tokenCache = {};

// ── Load pre-fetched tokens from globalSetup ──────────────────────────────────
function loadCachedTokens() {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8"));
      Object.assign(tokenCache, parsed);
    }
  } catch (_) {
    // Ignore — will fall back to live login
  }
}

loadCachedTokens(); // executed once when the module is first required

// ── Live login fallback ───────────────────────────────────────────────────────
function httpPost(urlPath, body) {
  return new Promise((resolve, reject) => {
    const url  = new URL(urlPath, BASE_URL);
    const data = JSON.stringify(body);
    const opts = {
      hostname: url.hostname,
      port:     url.port || 80,
      path:     url.pathname,
      method:   "POST",
      headers: {
        "Content-Type":   "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
      timeout: 10000,
    };
    const req = http.request(opts, (res) => {
      let raw = "";
      res.on("data", (c) => { raw += c; });
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Request timed out")); });
    req.write(data);
    req.end();
  });
}

/**
 * loginAs(role) → returns a JWT string for the given role.
 *
 * Prefers the cached token from globalSetup.
 * Falls back to a live login only if the cache is empty.
 */
async function loginAs(role) {
  // Re-load from file each call (in case another worker wrote it after startup)
  if (!tokenCache[role]) {
    loadCachedTokens();
  }

  if (tokenCache[role]) return tokenCache[role];

  // Live login fallback
  const creds = CREDENTIALS[role];
  if (!creds) throw new Error(`Unknown role: ${role}`);

  const resp = await httpPost("/api/auth/login", creds);
  if (resp.status !== 200 || !resp.body.token) {
    throw new Error(
      `Login failed for role ${role}: HTTP ${resp.status} — ${JSON.stringify(resp.body)}\n` +
      `Check that ${creds.email} exists in the DB with password Admin@123`
    );
  }

  tokenCache[role] = resp.body.token;
  return tokenCache[role];
}

/** Returns an Authorization header object for use with supertest. */
async function authHeader(role) {
  const token = await loginAs(role);
  return { Authorization: `Bearer ${token}` };
}

/** Clears the in-memory token cache (forces re-login on next call). */
function clearTokenCache() {
  for (const key of Object.keys(tokenCache)) {
    delete tokenCache[key];
  }
}

module.exports = { loginAs, authHeader, clearTokenCache, CREDENTIALS };
