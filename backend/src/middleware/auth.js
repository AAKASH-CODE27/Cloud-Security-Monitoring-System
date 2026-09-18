const User = require("../models/User");
const { extractUsername, validateToken } = require("../utils/jwt");

// ============================================================
// authenticate
// Equivalent to JwtAuthenticationFilter + CustomUserDetailsService
// Reads "Authorization: Bearer <token>", validates it, and
// attaches req.user (the Mongo user doc, minus password).
// ============================================================

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  let token = null;
  let email = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);

    try {
      email = extractUsername(token);
    } catch (e) {
      // Invalid/expired token — fall through, req.user stays unset
    }
  }

  if (!email) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  if (!validateToken(token, email)) {
    return res.status(401).json({ message: "Token expired or invalid" });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  req.user = user;

  next();
}

// ============================================================
// authorize
// Equivalent to @PreAuthorize("hasAnyRole('ADMIN','ITSM')") etc.
// Usage: authorize("ADMIN", "ITSM")
// ============================================================

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
}

module.exports = { authenticate, authorize };
