/**
 * rbacMatrix.js — Final RBAC Matrix Reporter
 *
 * Accumulates per-test results and prints a formatted matrix
 * at the end of the test run.  Call record() from each test,
 * then printMatrix() in a global afterAll.
 */

const results = [];

const PASS_LABEL        = "PASS ✓";
const FAIL_LABEL        = "FAIL ✗";
const SKIPPED_LABEL     = "SKIP -";
const ENV_ERROR_LABEL   = "ENV ERR";
const EXPECTED_ERR      = "EXPECTED";

/**
 * record(entry)
 *
 * @param {object} entry
 *   resource    {string}  e.g. "Assets"
 *   action      {string}  e.g. "GET"
 *   role        {string}  "USER" | "ITSM" | "ADMIN"
 *   expected    {number}  expected HTTP status
 *   actual      {number}  actual HTTP status
 *   label       {string}  optional override label
 */
function record({ resource, action, role, expected, actual, label, note }) {
  let verdict;
  if (label) {
    verdict = label;
  } else if (actual === expected) {
    verdict = PASS_LABEL;
  } else {
    verdict = FAIL_LABEL;
  }
  results.push({ resource, action, role, expected, actual, verdict, note });
}

function recordEnvError({ resource, action, role, note }) {
  results.push({ resource, action, role, expected: "N/A", actual: "N/A", verdict: ENV_ERROR_LABEL, note });
}

function recordSkip({ resource, action, role, note }) {
  results.push({ resource, action, role, expected: "N/A", actual: "N/A", verdict: SKIPPED_LABEL, note });
}

function printMatrix() {
  console.log("\n");
  console.log("═".repeat(90));
  console.log("  SENTINELCORE SECUREOPS — AUTOMATED RBAC / API INTEGRATION TEST MATRIX");
  console.log("═".repeat(90));

  const resources = [...new Set(results.map((r) => r.resource))];
  const actions   = [...new Set(results.map((r) => r.action))];
  const roles     = ["USER", "ITSM", "ADMIN"];

  // Header
  const COL = 22;
  const pad = (s, n) => String(s).padEnd(n);

  console.log(
    pad("  Resource/Action", 28) +
    pad("USER", COL) +
    pad("ITSM", COL) +
    "ADMIN"
  );
  console.log("─".repeat(90));

  for (const resource of resources) {
    const resourceActions = [...new Set(
      results.filter((r) => r.resource === resource).map((r) => r.action)
    )];

    for (const action of resourceActions) {
      let line = pad(`  ${resource} ${action}`, 28);
      for (const role of roles) {
        const entry = results.find(
          (r) => r.resource === resource && r.action === action && r.role === role
        );
        if (entry) {
          const cell = `${entry.verdict} (${entry.actual}/${entry.expected})`;
          line += pad(cell, COL);
        } else {
          line += pad("-", COL);
        }
      }
      console.log(line);
    }
    console.log("─".repeat(90));
  }

  // Summary
  const total    = results.length;
  const passed   = results.filter((r) => r.verdict === PASS_LABEL).length;
  const failed   = results.filter((r) => r.verdict === FAIL_LABEL).length;
  const skipped  = results.filter((r) => r.verdict === SKIPPED_LABEL).length;
  const envErr   = results.filter((r) => r.verdict === ENV_ERROR_LABEL).length;
  const expected = results.filter((r) => r.verdict === EXPECTED_ERR).length;

  console.log("\n  SUMMARY");
  console.log(`  Total   : ${total}`);
  console.log(`  Passed  : ${passed}`);
  console.log(`  Failed  : ${failed}`);
  console.log(`  Skipped : ${skipped}`);
  console.log(`  Env Err : ${envErr}`);
  console.log(`  Expected: ${expected}`);

  // Failures detail
  const failures = results.filter((r) => r.verdict === FAIL_LABEL);
  if (failures.length > 0) {
    console.log("\n  FAILURES DETAIL");
    for (const f of failures) {
      console.log(
        `  ✗ [${f.role}] ${f.resource} ${f.action} — expected ${f.expected}, got ${f.actual}` +
        (f.note ? ` [${f.note}]` : "")
      );
    }
  }

  // Notes / issues
  const noted = results.filter((r) => r.note);
  if (noted.length > 0) {
    console.log("\n  NOTES / DISCOVERED ISSUES");
    for (const n of noted) {
      console.log(`  • [${n.role}] ${n.resource} ${n.action}: ${n.note}`);
    }
  }

  console.log("═".repeat(90));
  console.log("\n");
}

module.exports = { record, recordEnvError, recordSkip, printMatrix, PASS_LABEL, FAIL_LABEL, ENV_ERROR_LABEL };
