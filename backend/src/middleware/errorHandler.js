// ============================================================
// Global Error Handler
// Equivalent to Spring's default exception -> ResponseEntity
// handling (server.error.include-message=always, etc.)
// ============================================================

function errorHandler(err, req, res, next) {
  console.error("========================================");
  console.error("REQUEST FAILED");
  console.error("METHOD:", req.method);
  console.error("URL:", req.originalUrl);
  console.error("MESSAGE:", err.message);
  console.error("========================================");

  // ── Fix 1: MongoDB duplicate key error (E11000) → 409 Conflict ───────────
  // Mongoose surfaces this as err.code === 11000 on the original MongoError.
  // We catch it here centrally so no service needs its own try/catch for this.
  if (err.code === 11000) {
    // Extract the duplicate field name from keyPattern, e.g. { ipAddress: 1 }
    const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : "field";
    const value = err.keyValue ? err.keyValue[field] : "";
    return res.status(409).json({
      message: `An asset with this ${field}${value ? ` (${value})` : ""} already exists.`,
    });
  }

  // ── Fix 2: Mongoose CastError (malformed ObjectId) → 400 Bad Request ─────
  // Triggered when Express/Mongoose tries to cast an invalid string to ObjectId
  // e.g. GET /api/assets/not-a-valid-id
  // We must NOT convert arbitrary cast errors into 400; CastError on path "_id"
  // is the canonical malformed-ID case.  Other cast errors (e.g. bad enum) are
  // left as-is and bubble through to 500 unless they already have a statusCode.
  if (err.name === "CastError" && err.path === "_id") {
    return res.status(400).json({
      message: `Invalid ID format: "${err.value}" is not a valid resource identifier.`,
    });
  }

  // ── Default: preserve existing behavior ──────────────────────────────────
  const status = err.statusCode || err.status || 500;

  res.status(status).json({
    message: err.message || "Internal Server Error",
  });
}

module.exports = errorHandler;

