const rateLimitMap = new Map();

/**
 * Lightweight in-memory rate limiter middleware.
 * @param {Object} options - { windowMs, maxRequests, message }
 */
function createRateLimiter({ windowMs = 15 * 60 * 1000, maxRequests = 10, message = "Too many requests. Please try again later." }) {
  return (req, res, next) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "global";
    const now = Date.now();

    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const record = rateLimitMap.get(ip);

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({ success: false, message });
    }

    record.count++;
    next();
  };
}

module.exports = { createRateLimiter };
