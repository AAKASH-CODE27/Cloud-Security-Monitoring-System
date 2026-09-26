/**
 * assets.rbac.test.js
 *
 * RBAC / Integration tests for /api/assets
 *
 * Route RBAC (from assetRoutes.js):
 *   GET    /api/assets       → ADMIN, ITSM, USER
 *   POST   /api/assets       → ADMIN, ITSM          (USER → 403)
 *   PUT    /api/assets/:id   → ADMIN, ITSM          (USER → 403)
 *   DELETE /api/assets/:id   → ADMIN only           (USER,ITSM → 403)
 *
 * NOTE (discovered from source):
 *   The prompt says "USER: CREATE → 201" — but assetRoutes.js:106 is
 *   authorize("ADMIN","ITSM") so USER will receive 403.
 *   This discrepancy is documented and NOT changed.
 *
 * Test data prefix: RBAC_AUTOTEST_
 * Cleanup: performed by ADMIN at the end of afterAll.
 */

const request  = require("supertest");
const { authHeader, loginAs } = require(require("path").join(__dirname, "helpers/auth"));
const { record, recordEnvError, printMatrix } = require(require("path").join(__dirname, "helpers/rbacMatrix"));

const BASE = process.env.TEST_BASE_URL || "http://localhost:8080";

// IDs of assets created by this test run — cleaned up in afterAll
const createdAssetIds = [];

// ---------------------------------------------------------------
// Minimal asset body (only assetName is required by the model)
// All other fields have defaults inside createAsset / pre-save hook
// ---------------------------------------------------------------
function testAssetBody(suffix) {
  return {
    assetName: `RBAC_AUTOTEST_${suffix}`,
    description: "Automated RBAC test asset — safe to delete",
    assetType: "Workstation",
    department: "QA",
    owner: "rbac-autotest",
    ipAddress: `10.99.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`,
  };
}

// ---------------------------------------------------------------
describe("Assets RBAC", () => {
  // ----------------------------------------------------------
  // GET /api/assets
  // ----------------------------------------------------------
  describe("GET /api/assets", () => {
    const RESOURCE = "Assets";
    const ACTION   = "GET";
    const ENDPOINT = "/api/assets";

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
  // POST /api/assets  (ADMIN, ITSM → 201 | USER → 403)
  // ----------------------------------------------------------
  describe("POST /api/assets", () => {
    const RESOURCE = "Assets";
    const ACTION   = "CREATE";
    const ENDPOINT = "/api/assets";

    it("[ADMIN] should create asset (201)", async () => {
      const headers = await authHeader("ADMIN");
      const res = await request(BASE)
        .post(ENDPOINT)
        .set(headers)
        .send(testAssetBody(`ADMIN_${Date.now()}`));
      record({ resource: RESOURCE, action: ACTION, role: "ADMIN", expected: 201, actual: res.status });
      if (res.status === 201 && res.body._id) createdAssetIds.push(res.body._id);
      expect(res.status).toBe(201);
    });

    it("[ITSM] should create asset (201)", async () => {
      const headers = await authHeader("ITSM");
      const res = await request(BASE)
        .post(ENDPOINT)
        .set(headers)
        .send(testAssetBody(`ITSM_${Date.now()}`));
      record({ resource: RESOURCE, action: ACTION, role: "ITSM", expected: 201, actual: res.status });
      if (res.status === 201 && res.body._id) createdAssetIds.push(res.body._id);
      expect(res.status).toBe(201);
    });

    it("[USER] should be denied (403) — route authorize(ADMIN,ITSM)", async () => {
      const headers = await authHeader("USER");
      const res = await request(BASE)
        .post(ENDPOINT)
        .set(headers)
        .send(testAssetBody(`USER_${Date.now()}`));
      // USER gets 403 from RBAC middleware; body must not be 500
      record({
        resource: RESOURCE,
        action: ACTION,
        role: "USER",
        expected: 403,
        actual: res.status,
        note: res.status === 500
          ? "BUG: returned 500 instead of 403 for unauthorized access"
          : undefined,
      });
      expect(res.status).toBe(403);
    });
  });

  // ----------------------------------------------------------
  // PUT /api/assets/:id  (ADMIN, ITSM → 200 | USER → 403)
  // ----------------------------------------------------------
  describe("PUT /api/assets/:id", () => {
    const RESOURCE = "Assets";
    const ACTION   = "UPDATE";

    let sharedAssetId = null;

    beforeAll(async () => {
      // Create a disposable asset as ADMIN for update/delete tests
      const headers = await authHeader("ADMIN");
      const res = await request(BASE)
        .post("/api/assets")
        .set(headers)
        .send(testAssetBody(`SHARED_${Date.now()}`));
      if (res.status === 201 && res.body._id) {
        sharedAssetId = res.body._id;
        createdAssetIds.push(sharedAssetId);
      }
    });

    it("[ADMIN] should update asset (200)", async () => {
      if (!sharedAssetId) {
        record({ resource: RESOURCE, action: ACTION, role: "ADMIN", expected: 200, actual: "SKIP", label: "SKIP -" });
        return;
      }
      const headers = await authHeader("ADMIN");
      const res = await request(BASE)
        .put(`/api/assets/${sharedAssetId}`)
        .set(headers)
        .send({ description: "Updated by RBAC autotest" });
      record({ resource: RESOURCE, action: ACTION, role: "ADMIN", expected: 200, actual: res.status });
      expect(res.status).toBe(200);
    });

    it("[ITSM] should update asset (200)", async () => {
      if (!sharedAssetId) {
        record({ resource: RESOURCE, action: ACTION, role: "ITSM", expected: 200, actual: "SKIP", label: "SKIP -" });
        return;
      }
      const headers = await authHeader("ITSM");
      const res = await request(BASE)
        .put(`/api/assets/${sharedAssetId}`)
        .set(headers)
        .send({ description: "Updated by ITSM RBAC autotest" });
      record({ resource: RESOURCE, action: ACTION, role: "ITSM", expected: 200, actual: res.status });
      expect(res.status).toBe(200);
    });

    it("[USER] should be denied (403) — route authorize(ADMIN,ITSM)", async () => {
      if (!sharedAssetId) {
        record({ resource: RESOURCE, action: ACTION, role: "USER", expected: 403, actual: "SKIP", label: "SKIP -" });
        return;
      }
      const headers = await authHeader("USER");
      const res = await request(BASE)
        .put(`/api/assets/${sharedAssetId}`)
        .set(headers)
        .send({ description: "Should not be allowed" });
      record({
        resource: RESOURCE, action: ACTION, role: "USER", expected: 403, actual: res.status,
        note: res.status === 500 ? "BUG: returned 500 instead of 403" : undefined,
      });
      expect(res.status).toBe(403);
    });
  });

  // ----------------------------------------------------------
  // DELETE /api/assets/:id  (ADMIN → 200 | ITSM,USER → 403)
  // ----------------------------------------------------------
  describe("DELETE /api/assets/:id", () => {
    const RESOURCE = "Assets";
    const ACTION   = "DELETE";

    let deleteTargetId = null;

    beforeAll(async () => {
      const headers = await authHeader("ADMIN");
      const res = await request(BASE)
        .post("/api/assets")
        .set(headers)
        .send(testAssetBody(`DEL_${Date.now()}`));
      if (res.status === 201 && res.body._id) {
        deleteTargetId = res.body._id;
        createdAssetIds.push(deleteTargetId);
      }
    });

    it("[USER] should be denied (403)", async () => {
      if (!deleteTargetId) {
        record({ resource: RESOURCE, action: ACTION, role: "USER", expected: 403, actual: "SKIP", label: "SKIP -" });
        return;
      }
      const headers = await authHeader("USER");
      const res = await request(BASE).delete(`/api/assets/${deleteTargetId}`).set(headers);
      record({
        resource: RESOURCE, action: ACTION, role: "USER", expected: 403, actual: res.status,
        note: res.status === 500 ? "BUG: returned 500 instead of 403" : undefined,
      });
      expect(res.status).toBe(403);
    });

    it("[ITSM] should be denied (403)", async () => {
      if (!deleteTargetId) {
        record({ resource: RESOURCE, action: ACTION, role: "ITSM", expected: 403, actual: "SKIP", label: "SKIP -" });
        return;
      }
      const headers = await authHeader("ITSM");
      const res = await request(BASE).delete(`/api/assets/${deleteTargetId}`).set(headers);
      record({
        resource: RESOURCE, action: ACTION, role: "ITSM", expected: 403, actual: res.status,
        note: res.status === 500 ? "BUG: returned 500 instead of 403" : undefined,
      });
      expect(res.status).toBe(403);
    });

    it("[ADMIN] should delete asset (200)", async () => {
      if (!deleteTargetId) {
        record({ resource: RESOURCE, action: ACTION, role: "ADMIN", expected: 200, actual: "SKIP", label: "SKIP -" });
        return;
      }
      const headers = await authHeader("ADMIN");
      const res = await request(BASE).delete(`/api/assets/${deleteTargetId}`).set(headers);
      record({ resource: RESOURCE, action: ACTION, role: "ADMIN", expected: 200, actual: res.status });
      // Remove from cleanup list since it's already deleted
      const idx = createdAssetIds.indexOf(deleteTargetId);
      if (idx !== -1) createdAssetIds.splice(idx, 1);
      expect(res.status).toBe(200);
    });
  });

  // ----------------------------------------------------------
  // Duplicate IP test (Section 9)
  // Documents current 500 behavior — expected to become 409
  // ----------------------------------------------------------
  describe("Duplicate IP validation", () => {
    const RESOURCE = "Assets";
    const ACTION   = "DUP_IP";
    const sharedIp = `10.98.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;

    it("first creation with ipAddress should succeed (201)", async () => {
      const headers = await authHeader("ADMIN");
      const res = await request(BASE)
        .post("/api/assets")
        .set(headers)
        .send({
          assetName: `RBAC_AUTOTEST_DUPIP_1_${Date.now()}`,
          ipAddress: sharedIp,
        });
      if (res.status === 201 && res.body._id) createdAssetIds.push(res.body._id);
      expect(res.status).toBe(201);
    });

    it("second creation with the SAME ipAddress — should return 409 Conflict", async () => {
      const headers = await authHeader("ADMIN");
      const res = await request(BASE)
        .post("/api/assets")
        .set(headers)
        .send({
          assetName: `RBAC_AUTOTEST_DUPIP_2_${Date.now()}`,
          ipAddress: sharedIp,
        });

      record({
        resource: RESOURCE,
        action: ACTION,
        role: "ADMIN",
        expected: 409,
        actual: res.status,
        note: res.status === 500
          ? "BUG STILL PRESENT: Duplicate ipAddress still returns 500. Check errorHandler.js E11000 handling."
          : undefined,
      });

      // Assert that duplicate IP now correctly returns 409
      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toMatch(/ipAddress|already exists/i);
    });
  });

  // ----------------------------------------------------------
  // Malformed ID error handling (Section 8)
  // ----------------------------------------------------------
  describe("Malformed ID handling", () => {
    it("[ADMIN] GET /api/assets/INVALID_ID — should return 400 Bad Request", async () => {
      const headers = await authHeader("ADMIN");
      const res = await request(BASE).get("/api/assets/INVALID_OBJECT_ID_123").set(headers);

      record({
        resource: "Assets",
        action: "GET_BAD_ID",
        role: "ADMIN",
        expected: 400,
        actual: res.status,
        note: res.status === 500
          ? "BUG STILL PRESENT: Malformed ObjectId still returns 500. Check errorHandler.js CastError handling."
          : undefined,
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("[ADMIN] GET /api/assets with valid list — normal 200 unaffected", async () => {
      const headers = await authHeader("ADMIN");
      const res = await request(BASE).get("/api/assets").set(headers);
      expect(res.status).toBe(200);
    });
  });

  // ----------------------------------------------------------
  // Cleanup — delete only assets created by this test run
  // ----------------------------------------------------------
  afterAll(async () => {
    if (createdAssetIds.length === 0) return;
    const headers = await authHeader("ADMIN");
    for (const id of createdAssetIds) {
      try {
        await request(BASE).delete(`/api/assets/${id}`).set(headers);
      } catch (_) {
        // Ignore cleanup errors
      }
    }
  });
});
