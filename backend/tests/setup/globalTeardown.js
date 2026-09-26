/**
 * globalTeardown.js — Jest global teardown
 *
 * Prints the final RBAC matrix after all test suites complete.
 * The matrix is populated by individual test files via rbacMatrix.record().
 */

// Note: Jest global teardown runs in a separate Node process from the tests,
// so the in-memory rbacMatrix state is not directly accessible.
// The matrix is printed within each test file's afterAll instead.
// This teardown prints a final summary banner.

module.exports = async function globalTeardown() {
  console.log("\n");
  console.log("═".repeat(70));
  console.log("  SENTINELCORE RBAC TEST RUN COMPLETE");
  console.log("  See RBAC matrix output in each test suite above.");
  console.log("═".repeat(70));
  console.log("\n");
};
