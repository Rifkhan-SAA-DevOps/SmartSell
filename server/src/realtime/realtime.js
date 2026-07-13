import { Server } from "socket.io";
import { findUserById, verifyToken } from "../services/auth.service.js";

let io = null;
const onlineUsers = new Map();

function roomForUser(userId) {
  return `user:${userId}`;
}

function roleRoom(role) {
  return `role:${role}`;
}

function readToken(socket) {
  const authToken = socket.handshake.auth?.token;
  const header = socket.handshake.headers?.authorization || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : null;
  return authToken || bearer || null;
}

function publicSocketUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    businessName: user.businessName,
  };
}

export function attachRealtime(httpServer, corsOptions) {
  io = new Server(httpServer, {
    path: "/socket.io",
    cors: {
      origin: corsOptions.origin,
      credentials: true,
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = readToken(socket);
      if (!token) return next(new Error("Authentication token is required for realtime connection."));

      const payload = verifyToken(token);
      const user = await findUserById(payload.id);

      if (!user) return next(new Error("User account was not found."));
      if (user.status === "blocked") return next(new Error("This account has been blocked."));

      socket.user = user;
      return next();
    } catch {
      return next(new Error("Invalid or expired realtime token."));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    const userRoom = roomForUser(user.id);

    socket.join(userRoom);
    socket.join(roleRoom(user.role));
    if (["admin", "super_admin"].includes(user.role)) socket.join("role:admin");

    const currentSockets = onlineUsers.get(user.id) || new Set();
    currentSockets.add(socket.id);
    onlineUsers.set(user.id, currentSockets);

    socket.emit("realtime:ready", {
      connected: true,
      user: publicSocketUser(user),
      onlineCount: onlineUsers.size,
    });

    socket.broadcast.emit("presence:update", {
      userId: user.id,
      isOnline: true,
      onlineCount: onlineUsers.size,
    });

    socket.on("thread:join", (threadId) => {
      if (threadId) socket.join(`thread:${threadId}`);
    });

    socket.on("thread:leave", (threadId) => {
      if (threadId) socket.leave(`thread:${threadId}`);
    });

    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(user.id);
      if (sockets) {
        sockets.delete(socket.id);
        if (!sockets.size) onlineUsers.delete(user.id);
      }

      socket.broadcast.emit("presence:update", {
        userId: user.id,
        isOnline: onlineUsers.has(user.id),
        onlineCount: onlineUsers.size,
      });
    });
  });

  return io;
}

export function getRealtime() {
  return io;
}

export function getOnlineUserIds() {
  return Array.from(onlineUsers.keys());
}

export function isUserOnline(userId) {
  return onlineUsers.has(userId);
}

export function emitToUser(userId, eventName, payload) {
  if (!io || !userId || !eventName) return;
  io.to(roomForUser(userId)).emit(eventName, payload);
}

export function emitToUsers(userIds = [], eventName, payload) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  uniqueIds.forEach((userId) => emitToUser(userId, eventName, payload));
}

export function emitToAdmins(eventName, payload) {
  if (!io || !eventName) return;
  io.to("role:admin").emit(eventName, payload);
}

export function emitToThread(threadId, eventName, payload) {
  if (!io || !threadId || !eventName) return;
  io.to(`thread:${threadId}`).emit(eventName, payload);
}
