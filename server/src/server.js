import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { uploadsRoot } from "./config/upload.js";

import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import healthRoutes from "./routes/health.routes.js";
import productRoutes from "./routes/product.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import requestRoutes from "./routes/request.routes.js";
import sellerRoutes from "./routes/seller.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import orderRoutes from "./routes/order.routes.js";
import businessRoutes from "./routes/business.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import financeRoutes from "./routes/finance.routes.js";
import communicationRoutes from "./routes/communication.routes.js";
import promotionRoutes from "./routes/promotion.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import supportRoutes from "./routes/support.routes.js";
import userRoutes from "./routes/user.routes.js";
import storefrontRoutes from "./routes/storefront.routes.js";
import offerRoutes from "./routes/offer.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import deliveryRoutes from "./routes/delivery.routes.js";
import securityRoutes from "./routes/security.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import galleryRoutes from "./routes/gallery.routes.js";
import { attachRealtime } from "./realtime/realtime.js";
import { adminAuditLogger } from "./middleware/adminAudit.js";
import {
  apiRateLimiter,
  apiSecurityHeaders,
  attachRequestId,
  authRateLimiter,
  sanitizeRequestBody,
  uploadRateLimiter,
  writeRateLimiter,
} from "./middleware/security.js";

const app = express();

const isLocalDevOrigin = (origin = "") =>
  /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

const corsOptions = {
  origin(origin, callback) {
    // Allow Postman, curl, server-to-server requests, and same-origin requests.
    if (!origin) return callback(null, true);

    // During local development, allow any Vite localhost port such as 5173/5174/5175.
    if (env.nodeEnv !== "production" && isLocalDevOrigin(origin)) {
      return callback(null, true);
    }

    if (env.corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-auth-token", "x-request-id"],
  optionsSuccessStatus: 204,
};

app.use(attachRequestId);

// CORS must be before Helmet, body parsers, static files, and routes.
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Local image uploads are served here. Later this can be replaced with AWS S3 URLs.
app.use("/uploads", express.static(uploadsRoot));

// API-wide protection. More specific auth/upload limits are applied below.
app.use("/api", apiSecurityHeaders, apiRateLimiter, writeRateLimiter, sanitizeRequestBody, adminAuditLogger);

if (env.nodeEnv !== "test") {
  app.use(morgan("dev"));
}

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "SmartSell API is running",
    nodeEnv: env.nodeEnv,
    allowedOrigins: env.corsOrigins,
    localDevOriginsAllowed: env.nodeEnv !== "production",
    uploads: "/uploads/listings",
    security: {
      requestIds: true,
      rateLimits: true,
      adminAudit: true,
      uploadProtection: true,
    },
  });
});

app.use("/api", healthRoutes);
app.use("/api/auth", authRateLimiter, authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRateLimiter, uploadRoutes);
app.use("/api/products", productRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/communication", communicationRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/storefronts", storefrontRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/gallery", galleryRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    requestId: req.requestId,
  });
});

app.use((error, req, res, _next) => {
  console.error(error);

  if (error.message?.startsWith("CORS blocked")) {
    return res.status(403).json({
      success: false,
      message: error.message,
      allowedOrigins: env.corsOrigins,
      localDevOriginsAllowed: env.nodeEnv !== "production",
      requestId: req.requestId,
    });
  }

  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "Image is too large. Maximum upload size is 3MB per image.",
      requestId: req.requestId,
    });
  }

  if (error.code === "LIMIT_FILE_COUNT") {
    return res.status(413).json({
      success: false,
      message: "Too many images selected. Maximum 8 images are allowed.",
      requestId: req.requestId,
    });
  }

  if (error.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request body is too large.",
      requestId: req.requestId,
    });
  }

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal server error",
    requestId: req.requestId,
  });
});

const httpServer = http.createServer(app);
attachRealtime(httpServer, corsOptions);

httpServer.listen(env.port, () => {
  console.log(`SmartSell API + Realtime running on http://localhost:${env.port}`);
  console.log(`CORS configured origins: ${env.corsOrigins.join(", ")}`);
  console.log(`Local uploads served from: ${uploadsRoot}`);
  console.log("Realtime Socket.IO path: /socket.io");
  console.log("Security: rate limits, request IDs, upload protection, and admin audit enabled");
  console.log(
    env.nodeEnv !== "production"
      ? "CORS local development mode: any localhost/127.0.0.1 port is allowed"
      : "CORS production mode: only configured CORS_ORIGINS are allowed"
  );
});
