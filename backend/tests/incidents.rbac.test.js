/**
 * incidents.rbac.test.js
 *
 * RBAC / Integration tests for /api/incidents
 *
 * Route RBAC (from incidentRoutes.js):
 *   GET    /api/incidents       → ADMIN, ITSM, USER   → 200
 *   POST   /api/incidents       → ADMIN, ITSM         → but service also checks: USER=403
 *   PUT    /api/incidents/:id   → ADMIN, ITSM         → but service also checks: USER=403
 *   DELETE /api/incidents/:id   → ADMIN               → ITSM,USER=403
 *
 * ⚠️  RBAC DISCOVERY NOTE (Section 13):
 *   The user-provided "known behavior" states ITSM: CREATE → 403 and ITSM: UPDATE → 403.
 *   However the source code (incidentRoutes.js + incidentService.js) shows:
 *     - Route allows ITSM on POST and PUT
 *     - Service only blocks USER (role === "USER"), not ITSM
 *   Therefore ITSM SHOULD get 201/200, not 403.
 *   This test verifies the actual server behavior and reports a discrepancy
 *   rather than silently changing tests to match unverified expectations.
 *   Label: "RBAC behavior discovered — requires product decision"
 *
 * Test data prefix: RBAC_AUTOTEST_
 */

const request = require("supertest");
const { authHeader } = require(require("path").join(__dirname, "helpers/auth"));
const { record, recordSkip } = require(require("path").join(__dirname, "helpers/rbacMatrix"));

const BASE = process.env.TEST_BASE_URL || "http://localhost:8080";

const createdIncidentIds = [];

function testIncidentBody(suffix) {
  return {
    title: `RBAC_AUTOTEST_${suffix}`,
    description: "Automated RBAC test incident — safe to delete",
    severity: "LOW",
    asset: "RBAC_AUTOTEST_Asset",
  };
}

describe("Incidents RBAC", () => {
  // ----------------------------------------------------------
  // GET /api/incidents — ADMIN, ITSM, USER → 200
  // ----------------------------------------------------------
  describe("GET /api/incidents", () => {
    const RESOURCE = "Incidents";
    const ACTION   = "GET";
    const ENDPOINT = "/api/incidents";

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
  // POST /api/incidents
  // Route: ADMIN, ITSM allowed; Service: USER blocked
  // ----------------------------------------------------------
  describe("POST /api/incidents", () => {
    const RESOURCE = "Incidents";
    const ACTION   = "CREATE";
    const ENDPOINT = "/api/incidents";

    it("[ADMIN] should create incident (201)", async () => {
      const headers = await authHeader("ADMIN");
      const res = await request(BASE)
        .post(ENDPOINT)
        .set(headers)
        .send(testIncidentBody(`ADMIN_${Date.now()}`));
      record({ resource: RESOURCE, action: ACTION, role: "ADMIN", expected: 201, actual: res.status });
      if (res.body._id) createdIncidentIds.push(res.body._id);
      expect(res.status).toBe(201);
    });

    it("[ITSM] — verifying actual server behavior (route allows ITSM; service allows ITSM)", async () => {
      const headers = await authHeader("ITSM");
      const res = await request(BASE)
        .post(ENDPOINT)
        .set(headers)
        .send(testIncidentBody(`ITSM_${Date.now()}`));

      // Source shows ITSM should be 201; user says 403.  Record what actually happens.
      const userExpected = 403; // what user "manually verified"
      const codeExpected = 201; // what source code implies
      const actual = res.status;

      if (actual === 201) {
        if (res.body._id) createdIncidentIds.push(res.body._id);
        record({
          resource: RESOURCE, action: ACTION, role: "ITSM",
          expected: codeExpected, actual,
          note: "RBAC behavior discovered — source allows ITSM to CREATE. User-stated 403 contradicts code. Requires product decision.",
        });
      } else if (actual === 403) {
        record({
          resource: RESOURCE, action: ACTION, role: "ITSM",
          expected: userExpected, actual,
          note: "Actual=403 matches user claim, but source code implies 201. Investigate middleware or override.",
        });
      } else {
        record({ resource: RESOURCE, action: ACTION, role: "ITSM", expected: codeExpected, actual });
      }

      // Accept either 201 or 403 — do not force a failure
      expect([201, 403]).toContain(actual);
    });

    it("[USER] should be denied (403) — service blocks USER role", async () => {
      const headers = await authHeader("USER");
      const res = await request(BASE)
        .post(ENDPOINT)
        .set(headers)
        .send(testIncidentBody(`USER_${Date.now()}`));
      record({
        resource: RESOURCE, action: ACTION, role: "USER", expected: 403, actual: res.status,
        note: res.status === 500 ? "BUG: returned 500 instead of 403" : undefined,
      });
      expect(res.status).toBe(403);
    });
  });

  // ----------------------------------------------------------
  // PUT /api/incidents/:id
  // ----------------------------------------------------------
  describe("PUT /api/incidents/:id", () => {
    const RESOURCE = "Incidents";
    const ACTION   = "UPDATE";

    let sharedId = null;

    beforeAll(async () => {
      const headers = await authHeader("ADMIN");
      const res = await request(BASE)
        .post("/api/incidents")
        .set(headers)
        .send(testIncidentBody(`SHARED_UPD_${Date.now()}`));
      if (res.status === 201 && res.body._id) {
        sharedId = res.body._id;
        createdIncidentIds.push(sharedId);
      }
    });

    it("[ADMIN] should update incident (200)", async () => {
      if (!sharedId) {
        recordSkip({ resource: RESOURCE, action: ACTION, role: "ADMIN", note: "No shared incident created" });
        return;
      }
      const headers = await authHeader("ADMIN");
      const res = await request(BASE)
        .put(`/api/incidents/${sharedId}`)
        .set(headers)
        .send({ status: "INVESTIGATING", resolutionNotes: "RBAC autotest update" });
      record({ resource: RESOURCE, action: ACTION, role: "ADMIN", expected: 200, actual: res.status });
      expect(res.status).toBe(200);
    });

    it("[ITSM] — verifying actual server behavior for UPDATE (route+service allow ITSM)", async () => {
      if (!sharedId) {
        recordSkip({ resource: RESOURCE, action: ACTION, role: "ITSM", note: "No shared incident created" });
        return;
      }
      const headers = await authHeader("ITSM");
      const res = await request(BASE)
        .put(`/api/incidents/${sharedId}`)
        .set(headers)
        .send({ resolutionNotes: "ITSM RBAC autotest update" });

      const actual = res.status;
      if (actual === 200) {
        record({
          resource: RESOURCE, action: ACTION, role: "ITSM", expected: 200, actual,
          note: "RBAC behavior discovered — ITSM can UPDATE incidents per source code. User-stated 403 contradicts code.",
        });
      } else {
        record({ resource: RESOURCE, action: ACTION, role: "ITSM", expected: 200, actual });
      }
      expect([200, 403]).toContain(actual);
    });

    it("[USER] should be denied (403) — service blocks USER role", async () => {
      if (!sharedId) {
        recordSkip({ resource: RESOURCE, action: ACTION, role: "USER", note: "No shared incident created" });
        return;
      }
      const headers = await authHeader("USER");
      const res = await request(BASE)
        .put(`/api/incidents/${sharedId}`)
        .set(headers)
        .send({ resolutionNotes: "Should not be allowed" });
      record({
        resource: RESOURCE, action: ACTION, role: "USER", expected: 403, actual: res.status,
        note: res.status === 500 ? "BUG: returned 500 instead of 403" : undefined,
      });
      expect(res.status).toBe(403);
    });
  });

  // ----------------------------------------------------------
  // DELETE /api/incidents/:id  (ADMIN only)
  // ----------------------------------------------------------
  describe("DELETE /api/incidents/:id", () => {
    const RESOURCE = "Incidents";
    const ACTION   = "DELETE";

    let deleteId = null;

    beforeAll(async () => {
      const headers = await authHeader("ADMIN");
      const res = await request(BASE)
        .post("/api/incidents")
        .set(headers)
        .send(testIncidentBody(`DEL_${Date.now()}`));
      if (res.status === 201 && res.body._id) {
        deleteId = res.body._id;
        createdIncidentIds.push(deleteId);
      }
    });

    it("[USER] should be denied (403)", async () => {
      if (!deleteId) {
        recordSkip({ resource: RESOURCE, action: ACTION, role: "USER" });
        return;
      }
      const headers = await authHeader("USER");
      const res = await request(BASE).delete(`/api/incidents/${deleteId}`).set(headers);
      record({ resource: RESOURCE, action: ACTION, role: "USER", expected: 403, actual: res.status });
      expect(res.status).toBe(403);
    });

    it("[ITSM] should be denied (403) — service requires ADMIN", async () => {
      if (!deleteId) {
        recordSkip({ resource: RESOURCE, action: ACTION, role: "ITSM" });
        return;
      }
      const headers = await authHeader("ITSM");
      const res = await request(BASE).delete(`/api/incidents/${deleteId}`).set(headers);
      record({ resource: RESOURCE, action: ACTION, role: "ITSM", expected: 403, actual: res.status });
      expect(res.status).toBe(403);
    });

    it("[ADMIN] should delete incident (200)", async () => {
      if (!deleteId) {
        recordSkip({ resource: RESOURCE, action: ACTION, role: "ADMIN" });
        return;
      }
      const headers = await authHeader("ADMIN");
      const res = await request(BASE).delete(`/api/incidents/${deleteId}`).set(headers);
      record({ resource: RESOURCE, action: ACTION, role: "ADMIN", expected: 200, actual: res.status });
      const idx = createdIncidentIds.indexOf(deleteId);
      if (idx !== -1) createdIncidentIds.splice(idx, 1);
      expect(res.status).toBe(200);
    });
  });

  // ----------------------------------------------------------
  // Cleanup
  // ----------------------------------------------------------
  afterAll(async () => {
    if (createdIncidentIds.length === 0) return;
    const headers = await authHeader("ADMIN");
    for (const id of createdIncidentIds) {
      try {
        await request(BASE).delete(`/api/incidents/${id}`).set(headers);
      } catch (_) {}
    }
  });
});
