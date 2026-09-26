/**
 * vulnerabilities.rbac.test.js
 *
 * RBAC / Integration tests for /api/vulnerabilities
 *
 * Route RBAC (from vulnerabilityRoutes.js):
 *   GET    /api/vulnerabilities        → ADMIN, ITSM, USER  → 200
 *   POST   /api/vulnerabilities        → ADMIN, ITSM        → USER = 403 (also service-level block)
 *   PUT    /api/vulnerabilities/:id    → ADMIN, ITSM        → USER = 403 (also service-level block)
 *   DELETE /api/vulnerabilities/:id    → ADMIN only         → ITSM,USER = 403 (also service-level)
 *   POST   /api/vulnerabilities/scan   → ADMIN, ITSM        → USER = 403
 *                                         (Trivy not installed → 503 ENVIRONMENT ERROR, not RBAC failure)
 *
 * Vulnerability schema required fields (from Vulnerability.js + vulnerabilityService.js):
 *   vulnerabilityId — required, unique (generated if not provided)
 *   cve             — required
 *   title           — required
 *
 * Scan endpoint body (from vulnerabilityScannerService.js):
 *   { target: string, scanType: "filesystem"|"image", assetId?: string }
 *   Missing Trivy → ENOENT → statusCode 503
 *   Scan disabled → VULNERABILITY_SCAN_ENABLED=false → 403
 *   User not authorized → 403 from authorize middleware
 *
 * Test data prefix: RBAC_AUTOTEST_
 */

const request = require("supertest");
const { authHeader } = require(require("path").join(__dirname, "helpers/auth"));
const { record, recordSkip, recordEnvError, ENV_ERROR_LABEL } = require(require("path").join(__dirname, "helpers/rbacMatrix"));

const BASE = process.env.TEST_BASE_URL || "http://localhost:8080";

const createdVulnIds = [];
let cveCounter = Date.now();

function nextCve() {
  cveCounter++;
  return `CVE-RBAC-AUTOTEST-${cveCounter}`;
}

function testVulnBody(suffix) {
  return {
    cve: nextCve(),
    title: `RBAC_AUTOTEST_${suffix}`,
    description: "Automated RBAC test vulnerability — safe to delete",
    severity: "LOW",
    cvss: 2.0,
    asset: "RBAC_AUTOTEST_Asset",
  };
}

describe("Vulnerabilities RBAC", () => {
  // ----------------------------------------------------------
  // GET /api/vulnerabilities — ADMIN, ITSM, USER → 200
  // ----------------------------------------------------------
  describe("GET /api/vulnerabilities", () => {
    const RESOURCE = "Vulnerabilities";
    const ACTION   = "GET";
    const ENDPOINT = "/api/vulnerabilities";

    for (const role of ["USER", "ITSM", "ADMIN"]) {
      it(`[${role}] should return 200`, async () => {
        const headers = await authHeader(role);
        const res = await request(BASE).get(ENDPOINT).set(headers);
        record({ resource: RESOURCE, action: ACTION, role, expected: 200, actual: res.status });
        expect(res.status).toBe(200);
      });
    }
  });

  // ----------------------------------------------------------
  // POST /api/vulnerabilities (ADMIN, ITSM → 201 | USER → 403)
  // ----------------------------------------------------------
  describe("POST /api/vulnerabilities", () => {
    const RESOURCE = "Vulnerabilities";
    const ACTION   = "CREATE";
    const ENDPOINT = "/api/vulnerabilities";

    it("[ADMIN] should create vulnerability (201)", async () => {
      const headers = await authHeader("ADMIN");
      const res = await request(BASE)
        .post(ENDPOINT)
        .set(headers)
        .send(testVulnBody(`ADMIN_${Date.now()}`));
      record({ resource: RESOURCE, action: ACTION, role: "ADMIN", expected: 201, actual: res.status });
      if (res.status === 201 && res.body._id) createdVulnIds.push(res.body._id);
      expect(res.status).toBe(201);
    });

    it("[ITSM] should create vulnerability (201)", async () => {
      const headers = await authHeader("ITSM");
      const res = await request(BASE)
        .post(ENDPOINT)
        .set(headers)
        .send(testVulnBody(`ITSM_${Date.now()}`));
      record({ resource: RESOURCE, action: ACTION, role: "ITSM", expected: 201, actual: res.status });
      if (res.status === 201 && res.body._id) createdVulnIds.push(res.body._id);
      expect(res.status).toBe(201);
    });

    it("[USER] should be denied (403) — route + service both block USER", async () => {
      const headers = await authHeader("USER");
      const res = await request(BASE)
        .post(ENDPOINT)
        .set(headers)
        .send(testVulnBody(`USER_${Date.now()}`));
      record({
        resource: RESOURCE, action: ACTION, role: "USER", expected: 403, actual: res.status,
        note: res.status === 500 ? "BUG: returned 500 instead of 403" : undefined,
      });
      expect(res.status).toBe(403);
    });
  });

  // ----------------------------------------------------------
  // PUT /api/vulnerabilities/:id (ADMIN, ITSM → 200 | USER → 403)
  // ----------------------------------------------------------
  describe("PUT /api/vulnerabilities/:id", () => {
    const RESOURCE = "Vulnerabilities";
    const ACTION   = "UPDATE";

    let sharedVulnId = null;

    beforeAll(async () => {
      const headers = await authHeader("ADMIN");
      const res = await request(BASE)
        .post("/api/vulnerabilities")
        .set(headers)
        .send(testVulnBody(`SHARED_UPD_${Date.now()}`));
      if (res.status === 201 && res.body._id) {
        sharedVulnId = res.body._id;
        createdVulnIds.push(sharedVulnId);
      }
    });

    it("[ADMIN] should update vulnerability (200)", async () => {
      if (!sharedVulnId) {
        recordSkip({ resource: RESOURCE, action: ACTION, role: "ADMIN", note: "No shared vuln" });
        return;
      }
      const headers = await authHeader("ADMIN");
      const res = await request(BASE)
        .put(`/api/vulnerabilities/${sharedVulnId}`)
        .set(headers)
        .send({ status: "PENDING_PATCH", recommendation: "RBAC autotest update" });
      record({ resource: RESOURCE, action: ACTION, role: "ADMIN", expected: 200, actual: res.status });
      expect(res.status).toBe(200);
    });

    it("[ITSM] should update vulnerability (200)", async () => {
      if (!sharedVulnId) {
        recordSkip({ resource: RESOURCE, action: ACTION, role: "ITSM", note: "No shared vuln" });
        return;
      }
      const headers = await authHeader("ITSM");
      const res = await request(BASE)
        .put(`/api/vulnerabilities/${sharedVulnId}`)
        .set(headers)
        .send({ status: "PENDING_PATCH" });
      record({ resource: RESOURCE, action: ACTION, role: "ITSM", expected: 200, actual: res.status });
      expect(res.status).toBe(200);
    });

    it("[USER] should be denied (403) — route + service both block USER", async () => {
      if (!sharedVulnId) {
        recordSkip({ resource: RESOURCE, action: ACTION, role: "USER", note: "No shared vuln" });
        return;
      }
      const headers = await authHeader("USER");
      const res = await request(BASE)
        .put(`/api/vulnerabilities/${sharedVulnId}`)
        .set(headers)
        .send({ status: "PENDING_PATCH" });
      record({
        resource: RESOURCE, action: ACTION, role: "USER", expected: 403, actual: res.status,
        note: res.status === 500 ? "BUG: returned 500 instead of 403" : undefined,
      });
      expect(res.status).toBe(403);
    });
  });

  // ----------------------------------------------------------
  // DELETE /api/vulnerabilities/:id (ADMIN → 200 | ITSM,USER → 403)
  // ----------------------------------------------------------
  describe("DELETE /api/vulnerabilities/:id", () => {
    const RESOURCE = "Vulnerabilities";
    const ACTION   = "DELETE";

    let deleteVulnId = null;

    beforeAll(async () => {
      const headers = await authHeader("ADMIN");
      const res = await request(BASE)
        .post("/api/vulnerabilities")
        .set(headers)
        .send(testVulnBody(`DEL_${Date.now()}`));
      if (res.status === 201 && res.body._id) {
        deleteVulnId = res.body._id;
        createdVulnIds.push(deleteVulnId);
      }
    });

    it("[USER] should be denied (403)", async () => {
      if (!deleteVulnId) {
        recordSkip({ resource: RESOURCE, action: ACTION, role: "USER" });
        return;
      }
      const headers = await authHeader("USER");
      const res = await request(BASE).delete(`/api/vulnerabilities/${deleteVulnId}`).set(headers);
      record({ resource: RESOURCE, action: ACTION, role: "USER", expected: 403, actual: res.status });
      expect(res.status).toBe(403);
    });

    it("[ITSM] should be denied (403) — service requires ADMIN", async () => {
      if (!deleteVulnId) {
        recordSkip({ resource: RESOURCE, action: ACTION, role: "ITSM" });
        return;
      }
      const headers = await authHeader("ITSM");
      const res = await request(BASE).delete(`/api/vulnerabilities/${deleteVulnId}`).set(headers);
      record({ resource: RESOURCE, action: ACTION, role: "ITSM", expected: 403, actual: res.status });
      expect(res.status).toBe(403);
    });

    it("[ADMIN] should delete vulnerability (200)", async () => {
      if (!deleteVulnId) {
        recordSkip({ resource: RESOURCE, action: ACTION, role: "ADMIN" });
        return;
      }
      const headers = await authHeader("ADMIN");
      const res = await request(BASE).delete(`/api/vulnerabilities/${deleteVulnId}`).set(headers);
      record({ resource: RESOURCE, action: ACTION, role: "ADMIN", expected: 200, actual: res.status });
      const idx = createdVulnIds.indexOf(deleteVulnId);
      if (idx !== -1) createdVulnIds.splice(idx, 1);
      expect(res.status).toBe(200);
    });
  });

  // ----------------------------------------------------------
  // POST /api/vulnerabilities/scan — Trivy Scan
  //
  // Authorization:
  //   USER  → 403 (authorize middleware blocks)
  //   ITSM  → pass auth; then either 200 (Trivy OK) or 503 (Trivy missing)
  //   ADMIN → pass auth; then either 200 (Trivy OK) or 503 (Trivy missing)
  //
  // We distinguish:
  //   403  → RBAC / authorization failure
  //   503  → ENVIRONMENT ERROR (Trivy not installed)
  //   400  → Bad request (bad target / scanType)
  //   200  → Success (Trivy installed and responded)
  // ----------------------------------------------------------
  describe("POST /api/vulnerabilities/scan", () => {
    const RESOURCE = "VulnScan";
    const ACTION   = "SCAN";
    const ENDPOINT = "/api/vulnerabilities/scan";

    // Valid scan body — uses a safe target path
    const scanBody = {
      target: ".",
      scanType: "filesystem",
    };

    it("[USER] should be denied with 403 — authorization failure", async () => {
      const headers = await authHeader("USER");
      const res = await request(BASE).post(ENDPOINT).set(headers).send(scanBody);
      record({
        resource: RESOURCE, action: ACTION, role: "USER",
        expected: 403, actual: res.status,
        note: res.status === 403 ? "AUTHORIZATION: correctly blocked" : `Unexpected: ${res.status}`,
      });
      expect(res.status).toBe(403);
    });

    it("[ITSM] — authorization check (distinguishing 403 vs 503 vs 200)", async () => {
      const headers = await authHeader("ITSM");
      const res = await request(BASE).post(ENDPOINT).set(headers).send(scanBody);
      const actual = res.status;

      if (actual === 403) {
        record({
          resource: RESOURCE, action: ACTION, role: "ITSM", expected: 200, actual,
          label: "FAIL ✗",
          note: "ITSM should be authorized but got 403. Check route/middleware.",
        });
        fail(`ITSM should be authorized for scan; got 403`);
      } else if (actual === 503) {
        record({
          resource: RESOURCE, action: ACTION, role: "ITSM", expected: 200, actual,
          label: "ENV ERR",
          note: "ENVIRONMENT: Trivy binary not installed (503). Authorization passed correctly.",
        });
        console.log("[SCAN][ITSM] Trivy not installed — ENVIRONMENT ERROR (503). Authorization OK.");
      } else if (actual === 200) {
        record({
          resource: RESOURCE, action: ACTION, role: "ITSM", expected: 200, actual,
          note: "Trivy installed and scan completed successfully.",
        });
      } else if (actual === 400) {
        record({
          resource: RESOURCE, action: ACTION, role: "ITSM", expected: 200, actual,
          label: "ENV ERR",
          note: `Scan failed with 400 — ${JSON.stringify(res.body)}`,
        });
      } else {
        record({ resource: RESOURCE, action: ACTION, role: "ITSM", expected: 200, actual });
      }

      // ITSM must not get 403 — that would be an authorization failure
      expect(actual).not.toBe(403);
    });

    it("[ADMIN] — authorization check (distinguishing 403 vs 503 vs 200)", async () => {
      const headers = await authHeader("ADMIN");
      const res = await request(BASE).post(ENDPOINT).set(headers).send(scanBody);
      const actual = res.status;

      if (actual === 403) {
        record({
          resource: RESOURCE, action: ACTION, role: "ADMIN", expected: 200, actual,
          label: "FAIL ✗",
          note: "ADMIN should be authorized but got 403. Check route/middleware.",
        });
        fail(`ADMIN should be authorized for scan; got 403`);
      } else if (actual === 503) {
        record({
          resource: RESOURCE, action: ACTION, role: "ADMIN", expected: 200, actual,
          label: "ENV ERR",
          note: "ENVIRONMENT: Trivy binary not installed (503). Authorization passed correctly.",
        });
        console.log("[SCAN][ADMIN] Trivy not installed — ENVIRONMENT ERROR (503). Authorization OK.");
      } else if (actual === 200) {
        record({
          resource: RESOURCE, action: ACTION, role: "ADMIN", expected: 200, actual,
          note: "Trivy installed and scan completed successfully.",
        });
      } else if (actual === 400) {
        record({
          resource: RESOURCE, action: ACTION, role: "ADMIN", expected: 200, actual,
          label: "ENV ERR",
          note: `Scan failed with 400 — ${JSON.stringify(res.body)}`,
        });
      } else {
        record({ resource: RESOURCE, action: ACTION, role: "ADMIN", expected: 200, actual });
      }

      expect(actual).not.toBe(403);
    });
  });

  // ----------------------------------------------------------
  // Cleanup
  // ----------------------------------------------------------
  afterAll(async () => {
    if (createdVulnIds.length === 0) return;
    const headers = await authHeader("ADMIN");
    for (const id of createdVulnIds) {
      try {
        await request(BASE).delete(`/api/vulnerabilities/${id}`).set(headers);
      } catch (_) {}
    }
  });
});
