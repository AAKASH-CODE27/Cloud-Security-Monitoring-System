const { Server } = require("socket.io");
const User = require("../models/User");
const { extractUsername, validateToken } = require("../utils/jwt");

let io = null;

function initSocket(httpServer) {
  const allowedOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // JWT Authentication Middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token && socket.handshake.headers?.authorization) {
        const authHeader = socket.handshake.headers.authorization;
        if (authHeader.startsWith("Bearer ")) {
          token = authHeader.substring(7);
        }
      }

      if (!token) {
        return next(new Error("Authentication error: Token missing"));
      }

      let email = null;
      try {
        email = extractUsername(token);
      } catch (err) {
        return next(new Error("Authentication error: Invalid token"));
      }

      if (!email || !validateToken(token, email)) {
        return next(new Error("Authentication error: Token expired or invalid"));
      }

      const user = await User.findOne({ email }).select("-password");
      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.user = {
        _id: user._id,
        email: user.email,
        role: user.role,
        username: user.username || user.name || user.email,
      };

      next();
    } catch (error) {
      console.error("[Socket.IO] Auth error:", error.message);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const { email, role } = socket.user || {};
    console.log(`[Socket.IO] Client connected: ${socket.id} (${email}, Role: ${role})`);

    // Join role-specific room (e.g. role:ADMIN, role:ITSM, role:USER)
    if (role) {
      socket.join(`role:${role}`);
    }

    // Join personal room for targeted notifications
    if (socket.user?._id) {
      socket.join(`user:${socket.user._id}`);
    }

    socket.on("disconnect", (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (${email}) - ${reason}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    console.warn("[Socket.IO] getIO called before initSocket or socket is null");
  }
  return io;
}

/**
 * Emit event to specific role rooms (e.g. ["ADMIN", "ITSM"])
 * Prevents information leakage to unprivileged USER sockets
 */
function emitToRoles(roles, event, data) {
  if (!io) return;
  const roleList = Array.isArray(roles) ? roles : [roles];
  let target = io;
  roleList.forEach((role) => {
    target = target.to(`role:${role}`);
  });
  target.emit(event, data);
}

/**
 * Emit event to a specific user's private room
 */
function emitToUser(userId, event, data) {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit(event, data);
}

module.exports = { initSocket, getIO, emitToRoles, emitToUser };
