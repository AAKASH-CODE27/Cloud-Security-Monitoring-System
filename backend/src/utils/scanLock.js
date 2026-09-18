/**
 * In-memory scan job lock registry to prevent duplicate concurrent scans
 * on the same resource (e.g., subnet or filesystem target).
 */
const activeLocks = new Set();

function acquireLock(resourceKey) {
  if (activeLocks.has(resourceKey)) {
    return false;
  }
  activeLocks.add(resourceKey);
  return true;
}

function releaseLock(resourceKey) {
  activeLocks.delete(resourceKey);
}

function isLocked(resourceKey) {
  return activeLocks.has(resourceKey);
}

module.exports = { acquireLock, releaseLock, isLocked };
