import dotenv from "dotenv";

dotenv.config();

const splitList = (value = "") =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const boolValue = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  return ["true", "1", "yes", "on"].includes(String(value).trim().toLowerCase());
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || "change-this-smartsell-dev-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigins: splitList(
    process.env.CORS_ORIGINS ||
      process.env.CLIENT_URLS ||
      "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174"
  ),
  clientUrl: process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5174",
  brandName: process.env.BRAND_NAME || "SmartSell",
  notifications: {
    emailEnabled: boolValue(process.env.NOTIFY_EMAIL_ENABLED),
    whatsappEnabled: boolValue(process.env.NOTIFY_WHATSAPP_ENABLED),
    smtp: {
      host: process.env.SMTP_HOST || "",
      port: Number(process.env.SMTP_PORT || 587),
      secure: boolValue(process.env.SMTP_SECURE),
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
      from: process.env.SMTP_FROM || process.env.SMTP_USER || "",
    },
    whatsapp: {
      webhookUrl: process.env.WHATSAPP_WEBHOOK_URL || "",
      bearerToken: process.env.WHATSAPP_BEARER_TOKEN || "",
      from: process.env.WHATSAPP_FROM || "SmartSell",
    },
  },
};
