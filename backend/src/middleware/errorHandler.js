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

  const status = err.statusCode || err.status || 500;

  res.status(status).json({
    message: err.message || "Internal Server Error",
  });
}

module.exports = errorHandler;
