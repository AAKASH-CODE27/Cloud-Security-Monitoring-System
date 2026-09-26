/**
 * jest.rbac.config.js
 *
 * Jest configuration for the RBAC/API integration test suite.
 *
 * - Runs only files matching tests/*.rbac.test.js
 * - testEnvironment: "node" (no DOM needed)
 * - globalSetup validates backend connectivity before any test
 * - testTimeout: 30s per test (API calls + DB operations)
 * - runInBand: true — runs tests serially to avoid race conditions
 *   when creating/deleting shared test data
 */

module.exports = {
  displayName: "RBAC-Integration",
  testEnvironment: "node",
  testMatch: ["**/tests/*.rbac.test.js"],
  globalSetup: "./tests/setup/globalSetup.js",
  globalTeardown: "./tests/setup/globalTeardown.js",
  testTimeout: 30000,
  // Verbose output so each test result is clearly visible
  verbose: true,
  // Do not collect coverage by default (this is integration, not unit)
  collectCoverage: false,
};
