import { Router } from "express";
import { prisma } from "../config/prisma.js";

const router = Router();

const routeGroups = [
  { group: "health", base: "/api", routes: ["GET /health", "GET /ready", "GET /routes"] },
  { group: "auth", base: "/api/auth", routes: ["POST /register", "POST /login", "GET /me"] },
  { group: "marketplace", base: "/api/products", routes: ["GET /", "GET /:id", "POST /", "PATCH /:id", "DELETE /:id"] },
  { group: "services", base: "/api/services", routes: ["GET /", "GET /:id", "POST /", "PATCH /:id"] },
  { group: "requests", base: "/api/requests", routes: ["GET /mine", "GET /", "POST /", "POST /service-quote/:serviceId", "PATCH /:id/customer", "PATCH /:id"] },
  { group: "orders", base: "/api/orders", routes: ["GET /", "POST /", "GET /:id", "PATCH /:id/status"] },
  { group: "business", base: "/api/business", routes: ["GET /me", "PATCH /products/:id", "PATCH /services/:id", "PATCH /requests/:id/status"] },
  { group: "admin", base: "/api/admin", routes: ["GET /overview", "PATCH /products/:id/status", "PATCH /services/:id/status", "PATCH /sellers/:id/status", "PATCH /requests/:id/status", "PATCH /reviews/:id/status"] },
  { group: "communication", base: "/api/communication", routes: ["GET /summary", "GET /notifications", "PATCH /notifications/read-all", "PATCH /notifications/:id/read", "GET /recipients", "GET /threads", "POST /threads", "POST /context-threads", "GET /threads/:id", "POST /threads/:id/messages"] },
  { group: "delivery", base: "/api/delivery", routes: ["GET /mine", "PATCH /orders/:id/status"] },
  { group: "settings", base: "/api/settings", routes: ["GET /public", "GET /admin", "PATCH /admin"] },
  { group: "security", base: "/api/security", routes: ["GET /summary", "GET /audit"] },
];

router.get("/health", (_req, res) => {
  res.json({ success: true, service: "SmartSell API", status: "healthy" });
});

router.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, ready: true, database: "postgresql", message: "SmartSell backend is ready" });
  } catch (error) {
    res.status(503).json({
      success: false,
      ready: false,
      database: "postgresql",
      message: "Database is not ready",
      error: error.message,
    });
  }
});

router.get("/routes", (_req, res) => {
  res.json({
    success: true,
    message: "SmartSell route audit helper",
    data: routeGroups,
  });
});

export default router;
