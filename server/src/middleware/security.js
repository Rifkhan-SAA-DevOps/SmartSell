import crypto from "crypto";
import rateLimit from "express-rate-limit";

const isWriteMethod = (req) => ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);

function makeLimiter({ windowMs, max, message, skip }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        message,
      });
    },
  });
}

export const apiRateLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 900,
  message: "Too many requests. Please slow down and try again shortly.",
});

export const authRateLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 35,
  message: "Too many login/register attempts. Please wait a few minutes and try again.",
});

export const writeRateLimiter = makeLimiter({
  windowMs: 10 * 60 * 1000,
  max: 180,
  message: "Too many create/update actions. Please wait a moment and try again.",
  skip: (req) => !isWriteMethod(req),
});

export const uploadRateLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many upload attempts. Please wait and try again.",
});

function cleanString(value) {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "")
    .trim();
}

function sanitizeValue(value, depth = 0) {
  if (depth > 8) return value;
  if (typeof value === "string") return cleanString(value);
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(item, depth + 1));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, sanitizeValue(nested, depth + 1)])
    );
  }
  return value;
}

export function attachRequestId(req, res, next) {
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();
  req.requestId = String(requestId);
  res.setHeader("X-Request-Id", req.requestId);
  next();
}

export function sanitizeRequestBody(req, _res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }
  next();
}

export function apiSecurityHeaders(_req, res, next) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  next();
}
