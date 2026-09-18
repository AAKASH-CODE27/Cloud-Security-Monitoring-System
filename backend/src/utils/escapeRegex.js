/**
 * Safely escapes user-supplied strings for use in RegExp constructors
 * to prevent ReDoS and Regex Injection attacks.
 */
function escapeRegex(text) {
  if (text == null) return "";
  return String(text).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = { escapeRegex };
