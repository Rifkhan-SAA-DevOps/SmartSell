import { prisma } from "../config/prisma.js";

const adminRoles = new Set(["admin", "super_admin"]);
const writeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function targetFromPath(req) {
  const parts = req.originalUrl.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  return {
    targetType: parts[0] || "api",
    targetId: req.params?.id || req.params?.userId || req.params?.orderId || req.body?.id || null,
  };
}

export function adminAuditLogger(req, res, next) {
  res.on("finish", () => {
    if (!req.user || !adminRoles.has(req.user.role)) return;
    if (!writeMethods.has(req.method)) return;
    if (res.statusCode >= 400) return;

    const { targetType, targetId } = targetFromPath(req);
    const action = `${req.method} ${req.originalUrl}`.slice(0, 180);
    const note = `Status ${res.statusCode}${req.requestId ? ` • Request ${req.requestId}` : ""}`;

    prisma.adminAction
      .create({
        data: {
          adminId: req.user.id,
          action,
          targetType,
          targetId: targetId ? String(targetId) : null,
          note,
        },
      })
      .catch((error) => {
        console.error("Admin audit log failed:", error.message);
      });
  });

  next();
}
