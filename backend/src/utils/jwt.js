const jwt = require("jsonwebtoken");

// ============================================================
// JWT Utility
// Equivalent to security/JwtUtil.java
// ============================================================

const SECRET = process.env.JWT_SECRET;
const EXPIRATION_MS = Number(process.env.JWT_EXPIRATION || 86400000);

// ===============================
// Generate JWT Token
// Subject = user's email, same as the Java version
// ===============================

function generateToken(email) {
  return jwt.sign({ sub: email }, SECRET, {
    expiresIn: Math.floor(EXPIRATION_MS / 1000), // jsonwebtoken wants seconds
  });
}

// ===============================
// Extract Username (email) from token
// ===============================

function extractUsername(token) {
  const decoded = jwt.verify(token, SECRET);
  return decoded.sub;
}

// ===============================
// Validate Token
// ===============================

function validateToken(token, email) {
  try {
    const username = extractUsername(token);
    return username === email;
  } catch (err) {
    return false;
  }
}

module.exports = { generateToken, extractUsername, validateToken };
