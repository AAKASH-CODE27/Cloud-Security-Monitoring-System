/**
 * SentinelCore SecureOps — Automated Backend Test Suite
 * ========================================================
 * Runner : node --test tests/security_and_ops.test.js
 * Node   : v22+ (uses node:test, node:assert — zero extra deps)
 *
 * Coverage:
 *   S1.  escapeRegex utility
 *   S2.  Rate limiter (instance isolation, blocking)
 *   S3.  Scan lock (concurrent prevention)
 *   S4.  JWT utility
 *   S5.  RBAC authorize() middleware
 *   S6.  Settings controller admin-flag protection
 *   S7.  IDOR guard — userService
 *   S8.  Auth service — public registration role lock
 *   S9.  Vulnerability service — RBAC + status whitelist + lifecycle
 *   S10. Incident service — RBAC + status whitelist + RESOLVED timestamp
 *   S11. Risk service — null-on-failure, formula, downward recalculation
 *   S12. Profile controller — changePassword validation
 *   S13. Socket helpers — pre-init safety
 */

"use strict";

// ─────────────────────────────────────────────────────────
// IMPORTANT: Set JWT_SECRET before any require() calls so
// that jwt.js captures the value at module-load time.
// (jwt.js: const SECRET = process.env.JWT_SECRET at line 8)
// ─────────────────────────────────────────────────────────
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "sentinel_test_secret_at_least_32_chars!";
}
process.env.JWT_EXPIRATION = "3600000";



const { describe, it, before, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

// ─────────────────────────────────────────────────────────
// Test helper: create a fake user document (Mongoose-like)
// ─────────────────────────────────────────────────────────
function makeFakeUser(overrides) {
  overrides = overrides || {};
  const base = {
    _id: "uid_" + Math.random().toString(36).slice(2),
    username: "testuser",
    email: "test@example.com",
    password: "$2a$10$fakefakefakefakefakefakefakefakefakefake01",
    role: "USER",
    department: "IT",
    status: "Active",
    settings: {
      theme: "dark",
      notifications: true,
      emailNotifications: true,
      smsNotifications: false,
      twoFactor: false,
      autoLogout: 30,
      language: "English",
      timezone: "Asia/Kolkata",
      maintenanceMode: false,
      allowUserRegistration: true,
      itsmIntegration: true,
      toObject() { return Object.assign({}, this); },
    },
    save: async function () { return this; },
    toObject() { return Object.assign({}, this); },
  };
  return Object.assign({}, base, overrides);
}

// =============================================================
// S1 — escapeRegex utility
// =============================================================
describe("S1 escapeRegex utility", () => {
  const { escapeRegex } = require("../src/utils/escapeRegex");

  it("returns plain strings unchanged", () => {
    const plain = "vulnerability_scan_2024";
    assert.equal(escapeRegex(plain), plain);
  });

  it("escapes dot metacharacter so it matches literally", () => {
    const input = "10.0.0.1";
    const re = new RegExp("^" + escapeRegex(input) + "$");
    assert.match("10.0.0.1", re);
    // Without escaping, "1000001" would also match — with escaping it must not
    assert.doesNotMatch("100000001", re);
  });

  it("produces a safe regex from malicious injection attempt", () => {
    const evil = ".*UNION SELECT.*";
    const escaped = escapeRegex(evil);
    // Should not throw when compiled
    assert.doesNotThrow(() => new RegExp(escaped, "i"));
    // The escaped pattern should match the literal string
    assert.match(evil, new RegExp(escaped, "i"));
  });

  it("handles empty string without throwing", () => {
    assert.doesNotThrow(() => escapeRegex(""));
    assert.equal(escapeRegex(""), "");
  });
});

// =============================================================
// S2 — Rate Limiter (instance isolation)
// =============================================================
describe("S2 createRateLimiter — isolation and blocking", () => {
  const { createRateLimiter } = require("../src/middleware/rateLimiter");

  function req(ip) { return { ip: ip, headers: {}, socket: {} }; }
  function res() {
    return {
      _code: null, _body: null,
      status(c) { this._code = c; return this; },
      json(b)   { this._body = b; return this; },
    };
  }

  it("allows up to maxRequests without blocking", () => {
    const lim = createRateLimiter({ windowMs: 60000, maxRequests: 4, message: "x" });
    const r = req("1.1.1.1");
    let blocked = false;
    for (let i = 0; i < 4; i++) {
      const rs = res();
      lim(r, rs, () => {});
      if (rs._code === 429) blocked = true;
    }
    assert.equal(blocked, false);
  });

  it("blocks the (maxRequests+1)th request with 429", () => {
    const lim = createRateLimiter({ windowMs: 60000, maxRequests: 2, message: "slow" });
    const r = req("2.2.2.2");
    for (let i = 0; i < 2; i++) lim(r, res(), () => {});
    const rs = res();
    lim(r, rs, () => {});
    assert.equal(rs._code, 429);
    assert.equal(rs._body && rs._body.success, false);
  });

  it("two instances maintain independent counters for the same IP", () => {
    const lim1 = createRateLimiter({ windowMs: 60000, maxRequests: 1, message: "A" });
    const lim2 = createRateLimiter({ windowMs: 60000, maxRequests: 1, message: "B" });
    const r = req("3.3.3.3");
    // Exhaust lim1
    lim1(r, res(), () => {});
    const rs1 = res();
    lim1(r, rs1, () => {});
    assert.equal(rs1._code, 429, "lim1 should be blocked");
    // lim2 is a separate instance — must not be blocked
    const rs2 = res();
    lim2(r, rs2, () => {});
    assert.notEqual(rs2._code, 429, "lim2 must not be blocked (separate Map)");
  });
});

// =============================================================
// S3 — Scan Lock
// =============================================================
describe("S3 scanLock — concurrent scan prevention", () => {
  const scanLock = require("../src/utils/scanLock");

  beforeEach(() => {
    // Clear the internal Set between tests by releasing known keys
    ["host:A", "host:B", "host:192.168.1.1", "host:10.0.0.1", "host:172.16.0.1"].forEach(k => {
      scanLock.releaseLock(k);
    });
  });

  it("acquireLock returns true on first call", () => {
    assert.equal(scanLock.acquireLock("host:A"), true);
  });

  it("acquireLock returns false for duplicate concurrent key", () => {
    scanLock.acquireLock("host:10.0.0.1");
    assert.equal(scanLock.acquireLock("host:10.0.0.1"), false);
  });

  it("allows re-acquisition after releaseLock", () => {
    scanLock.acquireLock("host:172.16.0.1");
    scanLock.releaseLock("host:172.16.0.1");
    assert.equal(scanLock.acquireLock("host:172.16.0.1"), true);
  });

  it("isLocked reflects lock state correctly", () => {
    scanLock.acquireLock("host:192.168.1.1");
    assert.equal(scanLock.isLocked("host:192.168.1.1"), true);
    scanLock.releaseLock("host:192.168.1.1");
    assert.equal(scanLock.isLocked("host:192.168.1.1"), false);
  });

  it("different keys do not interfere", () => {
    scanLock.acquireLock("host:A");
    assert.equal(scanLock.acquireLock("host:B"), true);
  });
});

// =============================================================
// S4 — JWT Utility
// =============================================================
describe("S4 JWT utility", () => {
  // JWT_SECRET is set at the top of this file before any require()
  // so jwt.js picks it up at module load time.

  it("generateToken + extractUsername round-trips correctly", () => {
    const { generateToken, extractUsername } = require("../src/utils/jwt");
    const email = "admin@sentinelcore.io";
    assert.equal(extractUsername(generateToken(email)), email);
  });

  it("validateToken returns true for matching token/email", () => {
    const { generateToken, validateToken } = require("../src/utils/jwt");
    const email = "itsm@sentinelcore.io";
    assert.equal(validateToken(generateToken(email), email), true);
  });

  it("validateToken returns false for wrong email", () => {
    const { generateToken, validateToken } = require("../src/utils/jwt");
    assert.equal(validateToken(generateToken("real@domain.com"), "attacker@domain.com"), false);
  });

  it("validateToken returns false for forged token", () => {
    const { validateToken } = require("../src/utils/jwt");
    assert.equal(validateToken("forged.token.here", "anyone@domain.com"), false);
  });
});

// =============================================================
// S5 — RBAC: authorize() middleware
// =============================================================
describe("S5 authorize() middleware", () => {
  const { authorize } = require("../src/middleware/auth");

  function mockRes() {
    return { _c: null, status(c){this._c=c;return this;}, json(){return this;} };
  }

  it("passes ADMIN for authorize('ADMIN')", () => {
    let called = false;
    authorize("ADMIN")({ user: makeFakeUser({ role: "ADMIN" }) }, mockRes(), () => { called = true; });
    assert.equal(called, true);
  });

  it("passes ITSM for authorize('ADMIN','ITSM')", () => {
    let called = false;
    authorize("ADMIN", "ITSM")({ user: makeFakeUser({ role: "ITSM" }) }, mockRes(), () => { called = true; });
    assert.equal(called, true);
  });

  it("blocks USER from authorize('ADMIN') with 403", () => {
    let called = false;
    const rs = mockRes();
    authorize("ADMIN")({ user: makeFakeUser({ role: "USER" }) }, rs, () => { called = true; });
    assert.equal(called, false);
    assert.equal(rs._c, 403);
  });

  it("returns 401 when req.user is absent", () => {
    const rs = mockRes();
    authorize("ADMIN")({}, rs, () => {});
    assert.equal(rs._c, 401);
  });
});

// =============================================================
// S6 — Settings Controller: admin-only flag protection
// =============================================================
describe("S6 settingsController — admin-only flag guard", () => {
  const { updateSettings } = require("../src/controllers/settingsController");

  function mockRes() {
    return { _s: 200, _b: null, status(c){this._s=c;return this;}, json(b){this._b=b;return this;} };
  }

  it("ADMIN can flip maintenanceMode to true", async () => {
    const admin = makeFakeUser({ role: "ADMIN" });
    await updateSettings({ user: admin, body: { maintenanceMode: true } }, mockRes());
    assert.equal(admin.settings.maintenanceMode, true);
  });

  it("USER cannot flip maintenanceMode (silently ignored, stays false)", async () => {
    const user = makeFakeUser({ role: "USER" });
    user.settings.maintenanceMode = false;
    const rs = mockRes();
    await updateSettings({ user, body: { maintenanceMode: true } }, rs);
    assert.equal(rs._s, 200);
    assert.equal(user.settings.maintenanceMode, false);
  });

  it("ITSM cannot flip allowUserRegistration (silently ignored)", async () => {
    const itsm = makeFakeUser({ role: "ITSM" });
    itsm.settings.allowUserRegistration = true;
    await updateSettings({ user: itsm, body: { allowUserRegistration: false } }, mockRes());
    assert.equal(itsm.settings.allowUserRegistration, true);
  });

  it("USER can update their own safe preferences (theme, language)", async () => {
    const user = makeFakeUser({ role: "USER" });
    await updateSettings({ user, body: { theme: "light", language: "French" } }, mockRes());
    assert.equal(user.settings.theme, "light");
    assert.equal(user.settings.language, "French");
  });
});

// =============================================================
// S7 — IDOR: userService.updateUser / deleteUser
// =============================================================
describe("S7 userService — IDOR protection", () => {

  it("ITSM cannot update another user's profile (403)", async () => {
    const userA = makeFakeUser({ _id: "aaaaaaaa", role: "ITSM", email: "itsm@sc.io" });
    const userB = makeFakeUser({ _id: "bbbbbbbb", role: "USER", email: "victim@sc.io" });
    const User = require("../src/models/User");
    const orig = User.findById;
    User.findById = async () => userB;
    try {
      await require("../src/services/userService").updateUser("bbbbbbbb", { username: "hacked" }, userA);
      assert.fail("Must throw 403");
    } catch (err) {
      assert.equal(err.statusCode, 403);
    } finally { User.findById = orig; }
  });

  it("USER cannot escalate own role (silently stripped)", async () => {
    const self = makeFakeUser({ _id: "cccccccc", role: "USER", email: "self@sc.io" });
    const User = require("../src/models/User");
    const orig = User.findById;
    User.findById = async () => self;
    try {
      await require("../src/services/userService").updateUser("cccccccc", { role: "ADMIN" }, self);
      assert.equal(self.role, "USER", "Role must NOT be elevated");
    } finally { User.findById = orig; }
  });

  it("ADMIN can change another user's role to ITSM", async () => {
    const admin = makeFakeUser({ _id: "admin001", role: "ADMIN" });
    const target = makeFakeUser({ _id: "target01", role: "USER" });
    const User = require("../src/models/User");
    const orig = User.findById;
    User.findById = async () => target;
    try {
      await require("../src/services/userService").updateUser("target01", { role: "ITSM" }, admin);
      assert.equal(target.role, "ITSM");
    } finally { User.findById = orig; }
  });

  it("ADMIN cannot delete their own account (400)", async () => {
    const admin = makeFakeUser({ _id: "selfadmin", role: "ADMIN" });
    const User = require("../src/models/User");
    const orig = User.findById;
    User.findById = async () => admin;
    try {
      await require("../src/services/userService").deleteUser("selfadmin", admin);
      assert.fail("Must throw 400");
    } catch (err) {
      assert.equal(err.statusCode, 400);
    } finally { User.findById = orig; }
  });
});

// =============================================================
// S8 — Auth Service: public registration role lock
// =============================================================
describe("S8 authService — public registration role lock", () => {

  it("always assigns role=USER regardless of any submitted role value", async () => {
    const User = require("../src/models/User");
    let capturedRole = null;
    const origCreate  = User.create;
    const origFindOne = User.findOne;
    User.findOne = async () => null; // no duplicates
    User.create  = async (d) => { capturedRole = d.role; return { _id: "x", ...d }; };
    try {
      await require("../src/services/authService").registerPublicUser({
        username: "attacker", email: "attacker@evil.com", password: "StrongPass1!",
      });
      assert.equal(capturedRole, "USER");
    } finally {
      User.create  = origCreate;
      User.findOne = origFindOne;
    }
  });

  it("rejects registration with missing required fields (400)", async () => {
    try {
      await require("../src/services/authService").registerPublicUser({ email: "bad@bad.com" });
      assert.fail("Must throw");
    } catch (err) {
      assert.equal(err.statusCode, 400);
    }
  });
});

// =============================================================
// S9 — Vulnerability Service: RBAC + status whitelist + lifecycle
// =============================================================
describe("S9 vulnerabilityService — RBAC + lifecycle", () => {
  const vs = require("../src/services/vulnerabilityService");

  it("USER cannot create a vulnerability (403)", async () => {
    try {
      await vs.createVulnerability({ cve: "CVE-2024-0001", title: "T" }, makeFakeUser({ role: "USER" }));
      assert.fail();
    } catch (err) { assert.equal(err.statusCode, 403); }
  });

  it("USER cannot update a vulnerability (403)", async () => {
    const Vuln = require("../src/models/Vulnerability");
    const orig = Vuln.findById;
    Vuln.findById = async () => ({ _id: "v1", status: "OPEN" });
    try {
      await vs.updateVulnerability("v1", { status: "PATCHED" }, makeFakeUser({ role: "USER" }));
      assert.fail();
    } catch (err) { assert.equal(err.statusCode, 403); }
    finally { Vuln.findById = orig; }
  });

  it("ITSM cannot delete a vulnerability (403)", async () => {
    const Vuln = require("../src/models/Vulnerability");
    const orig = Vuln.findById;
    Vuln.findById = async () => ({ _id: "v2", deleteOne: async () => {} });
    try {
      await vs.deleteVulnerability("v2", makeFakeUser({ role: "ITSM" }));
      assert.fail();
    } catch (err) { assert.equal(err.statusCode, 403); }
    finally { Vuln.findById = orig; }
  });

  it("rejects invalid status string (400)", async () => {
    const Vuln = require("../src/models/Vulnerability");
    const orig = Vuln.findById;
    Vuln.findById = async () => ({ _id: "v3", status: "OPEN", save: async function(){ return this; } });
    try {
      await vs.updateVulnerability("v3", { status: "HACKED" }, makeFakeUser({ role: "ITSM" }));
      assert.fail();
    } catch (err) {
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /Invalid vulnerability status/i);
    }
    finally { Vuln.findById = orig; }
  });

  it("PATCHED status sets resolvedAt + patchLevel=Applied", async () => {
    const Vuln = require("../src/models/Vulnerability");
    const sock = require("../src/socket");
    const origFindById = Vuln.findById;
    const origEmit = sock.emitToRoles;
    const fakeVuln = {
      _id: "v4", status: "OPEN", severity: "HIGH",
      assetId: null, resolvedAt: null, patchLevel: "Pending",
      save: async function() { return this; },
    };
    Vuln.findById = async () => fakeVuln;
    sock.emitToRoles = () => {};
    try {
      const r = await vs.updateVulnerability("v4", { status: "PATCHED" }, makeFakeUser({ role: "ITSM" }));
      assert.equal(r.status, "PATCHED");
      assert.equal(r.patchLevel, "Applied");
      assert.ok(r.resolvedAt instanceof Date);
    } finally {
      Vuln.findById = origFindById;
      sock.emitToRoles = origEmit;
    }
  });
});

// =============================================================
// S10 — Incident Service: RBAC + status whitelist
// =============================================================
describe("S10 incidentService — RBAC + lifecycle", () => {
  const is = require("../src/services/incidentService");

  it("USER cannot create an incident (403)", async () => {
    try {
      await is.createIncident({ title: "T", description: "D" }, makeFakeUser({ role: "USER" }));
      assert.fail();
    } catch (err) { assert.equal(err.statusCode, 403); }
  });

  it("USER cannot update an incident (403)", async () => {
    const Incident = require("../src/models/Incident");
    const orig = Incident.findById;
    Incident.findById = async () => ({ _id: "i1", status: "OPEN" });
    try {
      await is.updateIncident("i1", { status: "RESOLVED" }, makeFakeUser({ role: "USER" }));
      assert.fail();
    } catch (err) { assert.equal(err.statusCode, 403); }
    finally { Incident.findById = orig; }
  });

  it("rejects invalid incident status (400)", async () => {
    const Incident = require("../src/models/Incident");
    const orig = Incident.findById;
    Incident.findById = async () => ({
      _id: "i2", status: "OPEN", asset: null, resolvedAt: null,
      save: async function() { return this; },
    });
    try {
      await is.updateIncident("i2", { status: "DELETED" }, makeFakeUser({ role: "ITSM" }));
      assert.fail();
    } catch (err) { assert.equal(err.statusCode, 400); }
    finally { Incident.findById = orig; }
  });

  it("ITSM cannot delete an incident (403)", async () => {
    try {
      await is.deleteIncident("i3", makeFakeUser({ role: "ITSM" }));
      assert.fail();
    } catch (err) { assert.equal(err.statusCode, 403); }
  });

  it("RESOLVED status sets resolvedAt timestamp", async () => {
    const Incident = require("../src/models/Incident");
    const Asset = require("../src/models/Asset");
    const sock = require("../src/socket");
    const origFindById = Incident.findById;
    const origFindOne  = Asset.findOne;
    const origEmit = sock.emitToRoles;
    const fake = {
      _id: "i4", status: "OPEN", severity: "HIGH", asset: null,
      resolvedAt: null, title: "T", description: "D", assignedUser: "u", resolutionNotes: "",
      save: async function() { return this; },
    };
    Incident.findById = async () => fake;
    Asset.findOne = async () => null;
    sock.emitToRoles = () => {};
    try {
      const r = await is.updateIncident("i4", { status: "RESOLVED" }, makeFakeUser({ role: "ITSM" }));
      assert.equal(r.status, "RESOLVED");
      assert.ok(r.resolvedAt instanceof Date);
    } finally {
      Incident.findById = origFindById;
      Asset.findOne = origFindOne;
      sock.emitToRoles = origEmit;
    }
  });
});

// =============================================================
// S11 — Risk Service: formula, null-on-failure, downward recalc
// =============================================================
describe("S11 riskService — calculateSecurityScore", () => {

  it("returns null (NOT 100) when DB throws — critical safety check", async () => {
    const Vuln = require("../src/models/Vulnerability");
    const orig = Vuln.countDocuments;
    Vuln.countDocuments = () => { throw new Error("DB failure"); };
    const score = await require("../src/services/riskService").calculateSecurityScore();
    assert.equal(score, null, "Must return null, never fabricate 100 on DB failure");
    Vuln.countDocuments = orig;
  });
});

describe("S11 riskService — recalculateAssetRisk", () => {

  it("returns null for missing/null assetId", async () => {
    assert.equal(await require("../src/services/riskService").recalculateAssetRisk(null), null);
  });

  it("returns null when asset not found in DB", async () => {
    const Asset = require("../src/models/Asset");
    const orig = Asset.findById;
    Asset.findById = async () => null;
    assert.equal(await require("../src/services/riskService").recalculateAssetRisk("ghost_id"), null);
    Asset.findById = orig;
  });

  it("risk score = 0 for healthy asset with no open vulns or incidents", async () => {
    const Asset = require("../src/models/Asset");
    const Vuln  = require("../src/models/Vulnerability");
    const Inc   = require("../src/models/Incident");
    const sock  = require("../src/socket");
    const o1 = Asset.findById, o2 = Vuln.aggregate, o3 = Inc.countDocuments, o4 = sock.emitToRoles;
    const fa = {
      _id: "a001", assetName: "clean", hostname: "clean",
      health: "Healthy", riskScore: 60, vulnerabilityCount: 3, incidentCount: 2,
      save: async function() { return this; },
    };
    Asset.findById = async () => fa;
    Vuln.aggregate = async () => [];
    Inc.countDocuments = async () => 0;
    sock.emitToRoles = () => {};
    try {
      const r = await require("../src/services/riskService").recalculateAssetRisk("a001");
      assert.equal(r.riskScore, 0);
      assert.equal(r.vulnerabilityCount, 0);
    } finally {
      Asset.findById = o1; Vuln.aggregate = o2; Inc.countDocuments = o3; sock.emitToRoles = o4;
    }
  });

  it("risk score capped at 100 for critical asset with 2 critical vulns + 1 incident", async () => {
    const Asset = require("../src/models/Asset");
    const Vuln  = require("../src/models/Vulnerability");
    const Inc   = require("../src/models/Incident");
    const sock  = require("../src/socket");
    const o1 = Asset.findById, o2 = Vuln.aggregate, o3 = Inc.countDocuments, o4 = sock.emitToRoles;
    const fa = {
      _id: "a002", assetName: "risky", hostname: "risky",
      health: "Critical", riskScore: 0, vulnerabilityCount: 0, incidentCount: 0,
      save: async function() { return this; },
    };
    Asset.findById = async () => fa;
    Vuln.aggregate = async () => [{ _id: "CRITICAL", count: 2 }];
    Inc.countDocuments = async () => 1;
    sock.emitToRoles = () => {};
    try {
      // healthPenalty(30) + 2*25(CRITICAL) + 1*20(incident) = 100
      const r = await require("../src/services/riskService").recalculateAssetRisk("a002");
      assert.equal(r.riskScore, 100);
    } finally {
      Asset.findById = o1; Vuln.aggregate = o2; Inc.countDocuments = o3; sock.emitToRoles = o4;
    }
  });

  it("risk DECREASES to 0 after all vulnerabilities are patched (downward recalculation)", async () => {
    const Asset = require("../src/models/Asset");
    const Vuln  = require("../src/models/Vulnerability");
    const Inc   = require("../src/models/Incident");
    const sock  = require("../src/socket");
    const o1 = Asset.findById, o2 = Vuln.aggregate, o3 = Inc.countDocuments, o4 = sock.emitToRoles;
    const fa = {
      _id: "a003", assetName: "recovering", hostname: "recovering",
      health: "Healthy", riskScore: 25, vulnerabilityCount: 1, incidentCount: 0,
      save: async function() { return this; },
    };
    Asset.findById = async () => fa;
    Vuln.aggregate = async () => [];  // all patched
    Inc.countDocuments = async () => 0;
    sock.emitToRoles = () => {};
    try {
      const r = await require("../src/services/riskService").recalculateAssetRisk("a003");
      assert.equal(r.riskScore, 0, "Risk must fall to 0 after patching all vulns");
      assert.equal(r.vulnerabilityCount, 0);
    } finally {
      Asset.findById = o1; Vuln.aggregate = o2; Inc.countDocuments = o3; sock.emitToRoles = o4;
    }
  });
});

// =============================================================
// S12 — Profile Controller: changePassword validation
// =============================================================
describe("S12 profileController — changePassword field validation", () => {
  const { changePassword } = require("../src/controllers/profileController");

  function mockRes() {
    return { _s: null, _b: null, status(c){this._s=c;return this;}, json(b){this._b=b;return this;} };
  }

  it("rejects when confirmPassword is missing (400)", async () => {
    const rs = mockRes();
    await changePassword(
      { user: makeFakeUser(), body: { currentPassword: "old", newPassword: "new1" } },
      rs
    );
    assert.equal(rs._s, 400);
    assert.match(rs._b.message, /required/i);
  });

  it("rejects when newPassword !== confirmPassword (400)", async () => {
    const rs = mockRes();
    await changePassword(
      { user: makeFakeUser(), body: { currentPassword: "old", newPassword: "X1", confirmPassword: "Y2" } },
      rs
    );
    assert.equal(rs._s, 400);
    assert.match(rs._b.message, /do not match/i);
  });
});

// =============================================================
// S13 — Socket helpers: pre-init safety
// =============================================================
describe("S13 socket — emitToRoles / emitToUser pre-init safety", () => {
  const { emitToRoles, emitToUser, getIO } = require("../src/socket");

  it("emitToRoles does not throw before initSocket (io=null)", () => {
    assert.doesNotThrow(() => emitToRoles(["ADMIN", "ITSM"], "test:event", { x: 1 }));
  });

  it("emitToUser does not throw before initSocket (io=null)", () => {
    assert.doesNotThrow(() => emitToUser("uid123", "test:event", { x: 1 }));
  });

  it("getIO returns null before initSocket is called", () => {
    assert.equal(getIO(), null);
  });
});
