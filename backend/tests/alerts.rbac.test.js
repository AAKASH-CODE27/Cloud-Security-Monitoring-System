/**
 * alerts.rbac.test.js
 *
 * RBAC / Integration tests for /api/alerts
 *
 * Route RBAC (from alertRoutes.js):
 *   GET    /api/alerts       → ADMIN, ITSM, USER   → 200
 *   POST   /api/alerts       → ADMIN, ITSM         → USER = 403
 *   PUT    /api/alerts/:id   → ADMIN, ITSM         → USER = 403
 *                              (alertService.updateAlertStatus — no additional role check, route handles it)
 *   DELETE /api/alerts/:id   → ADMIN only
 *                              (alertService.deleteAlert checks user.role !== "ADMIN" → 403)
 *
 * Alert schema required fields (from Alert.js + alertService.js):
 *   description — required
 *   severity    — enum LOW|MEDIUM|HIGH|CRITICAL (default LOW)
 *   status      — enum OPEN|ACKNOWLEDGED|RESOLVED (default OPEN)
 *   asset, assetName, category, assignedTo, source — optional strings
 *
 * Alert UPDATE body:
 *   alertController calls alertService.updateAlertStatus(id, req.body.status || "ACKNOWLEDGED", req.user)
 *   Only "status" field is updated (OPEN / ACKNOWLEDGED / RESOLVED).
 *
 * Test data prefix: RBAC_AUTOTEST_
 */

const request = require("supertest");
const { authHeader } = require(require("path").join(__dirname, "helpers/auth"));
const { record, recordSkip } = require(require("path").join(__dirname, "helpers/rbacMatrix"));

const BASE = process.env.TEST_BASE_URL || "http://localhost:8080";

const createdAlertIds = [];

function testAlertBody(suffix) {
  return {
    description: `RBAC_AUTOTEST_${suffix} — Automated RBAC test alert`,
    severity: "LOW",
    category: "RBAC_AUTOTEST",
    asset: "RBAC_AUTOTEST_Asset",
    assetName: "RBAC_AUTOTEST_Asset",
    assignedTo: "rbac-autotest",
    source: "RBAC_AUTOTEST",
  };
}

describe("Alerts RBAC", () => {
  // ----------------------------------------------------------
  // GET /api/alerts — ADMIN, ITSM, USER → 200
  // ----------------------------------------------------------
  describe("GET /api/alerts", () => {
    const RESOURCE = "Alerts";
    const ACTION   = "GET";
    const ENDPOINT = "/api/alerts";

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
  // POST /api/alerts  (ADMIN, ITSM → 201 | USER → 403)
  // ----------------------------------------------------------
  describe("POST /api/alerts", () => {
    const RESOURCE = "Alerts";
    const ACTION   = "CREATE";
    const ENDPOINT = "/api/alerts";

    it("[ADMIN] should create alert (201)", async () => {
      const headers = await authHeader("ADMIN");
      const res = await request(BASE)
        .post(ENDPOINT)
        .set(headers)
        .send(testAlertBody(`ADMIN_${Date.now()}`));
      record({ resource: RESOURCE, action: ACTION, role: "ADMIN", expected: 201, actual: res.status });
      if (res.status === 201 && res.body._id) createdAlertIds.push(res.body._id);
      expect(res.status).toBe(201);
    });

    it("[ITSM] should create alert (201)", async () => {
      const headers = await authHeader("ITSM");
      const res = await request(BASE)
        .post(ENDPOINT)
        .set(headers)
        .send(testAlertBody(`ITSM_${Date.now()}`));
      record({ resource: RESOURCE, action: ACTION, role: "ITSM", expected: 201, actual: res.status });
      if (res.status === 201 && res.body._id) createdAlertIds.push(res.body._id);
      expect(res.status).toBe(201);
    });

    it("[USER] should be denied (403) — route authorize(ADMIN,ITSM)", async () => {
      const headers = await authHeader("USER");
      const res = await request(BASE)
        .post(ENDPOINT)
        .set(headers)
        .send(testAlertBody(`USER_${Date.now()}`));
      record({
        resource: RESOURCE, action: ACTION, role: "USER", expected: 403, actual: res.status,
        note: res.status === 500 ? "BUG: returned 500 instead of 403" : undefined,
      });
      expect(res.status).toBe(403);
    });
  });

  // ----------------------------------------------------------
  // PUT /api/alerts/:id  (ADMIN, ITSM → 200 | USER → 403)
  // The update only changes the status field.
  // ----------------------------------------------------------
  describe("PUT /api/alerts/:id", () => {
    const RESOURCE = "Alerts";
    const ACTION   = "UPDATE";

    let sharedAlertId = null;

    beforeAll(async () => {
      const headers = await authHeader("ADMIN");
      const res = await request(BASE)
        .post("/api/alerts")
        .set(headers)
        .send(testAlertBody(`SHARED_UPD_${Date.now()}`));
      if (res.status === 201 && res.body._id) {
        sharedAlertId = res.body._id;
        createdAlertIds.push(sharedAlertId);
      }
    });

    it("[ADMIN] should update alert status (200)", async () => {
      if (!sharedAlertId) {
        recordSkip({ resource: RESOURCE, action: ACTION, role: "ADMIN", note: "No shared alert" });
        return;
      }
      const headers = await authHeader("ADMIN");
      const res = await request(BASE)
        .put(`/api/alerts/${sharedAlertId}`)
        .set(headers)
        .send({ status: "ACKNOWLEDGED" });
      record({ resource: RESOURCE, action: ACTION, role: "ADMIN", expected: 200, actual: res.status });
      expect(res.status).toBe(200);
    });

    it("[ITSM] should update alert status (200)", async () => {
      if (!sharedAlertId) {
        recordSkip({ resource: RESOURCE, action: ACTION, role: "ITSM", note: "No shared alert" });
        return;
      }
      const headers = await authHeader("ITSM");
      const res = await request(BASE)
        .put(`/api/alerts/${sharedAlertId}`)
        .set(headers)
        .send({ status: "ACKNOWLEDGED" });
      record({ resource: RESOURCE, action: ACTION, role: "ITSM", expected: 200, actual: res.status });
      expect(res.status).toBe(200);
    });

    it("[USER] should be denied (403)", async () => {
      if (!sharedAlertId) {
        recordSkip({ resource: RESOURCE, action: ACTION, role: "USER", note: "No shared alert" });
        return;
      }
      const headers = await authHeader("USER");
      const res = await request(BASE)
        .put(`/api/alerts/${sharedAlertId}`)
        .set(headers)
        .send({ status: "ACKNOWLEDGED" });
      record({
        resource: RESOURCE, action: ACTION, role: "USER", expected: 403, actual: res.status,
        note: res.status === 500 ? "BUG: returned 500 instead of 403" : undefined,
      });
      expect(res.status).toBe(403);
    });
  });

  // ----------------------------------------------------------
  // DELETE /api/alerts/:id  (ADMIN → 200 | ITSM,USER → 403)
  // Route: authorize(ADMIN) — but alertService.deleteAlert also checks role
  // ----------------------------------------------------------
  describe("DELETE /api/alerts/:id", () => {
    const RESOURCE = "Alerts";
    const ACTION   = "DELETE";

    let deleteAlertId = null;

    beforeAll(async () => {
      const headers = await authHeader("ADMIN");
      const res = await request(BASE)
        .post("/api/alerts")
        .set(headers)
        .send(testAlertBody(`DEL_${Date.now()}`));
      if (res.status === 201 && res.body._id) {
        deleteAlertId = res.body._id;
        createdAlertIds.push(deleteAlertId);
      }
    });

    it("[USER] should be denied (403)", async () => {
      if (!deleteAlertId) {
        recordSkip({ resource: RESOURCE, action: ACTION, role: "USER" });
        return;
      }
      const headers = await authHeader("USER");
      const res = await request(BASE).delete(`/api/alerts/${deleteAlertId}`).set(headers);
      record({ resource: RESOURCE, action: ACTION, role: "USER", expected: 403, actual: res.status });
      expect(res.status).toBe(403);
    });

    it("[ITSM] should be denied (403)", async () => {
      if (!deleteAlertId) {
        recordSkip({ resource: RESOURCE, action: ACTION, role: "ITSM" });
        return;
      }
      const headers = await authHeader("ITSM");
      const res = await request(BASE).delete(`/api/alerts/${deleteAlertId}`).set(headers);
      record({ resource: RESOURCE, action: ACTION, role: "ITSM", expected: 403, actual: res.status });
      expect(res.status).toBe(403);
    });

    it("[ADMIN] should delete alert (200)", async () => {
      if (!deleteAlertId) {
        recordSkip({ resource: RESOURCE, action: ACTION, role: "ADMIN" });
        return;
      }
      const headers = await authHeader("ADMIN");
      const res = await request(BASE).delete(`/api/alerts/${deleteAlertId}`).set(headers);
      record({ resource: RESOURCE, action: ACTION, role: "ADMIN", expected: 200, actual: res.status });
      const idx = createdAlertIds.indexOf(deleteAlertId);
      if (idx !== -1) createdAlertIds.splice(idx, 1);
      expect(res.status).toBe(200);
    });
  });

  // ----------------------------------------------------------
  // Cleanup
  // ----------------------------------------------------------
  afterAll(async () => {
    if (createdAlertIds.length === 0) return;
    const headers = await authHeader("ADMIN");
    for (const id of createdAlertIds) {
      try {
        await request(BASE).delete(`/api/alerts/${id}`).set(headers);
      } catch (_) {}
    }
  });
});
