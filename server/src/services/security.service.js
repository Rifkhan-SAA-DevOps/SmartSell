import { prisma } from "../config/prisma.js";

function safeNumber(value) {
  return Number(value || 0);
}

export async function securitySummary() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [totalActions, actions24h, blockedUsers, pendingUsers, recentActions] = await Promise.all([
    prisma.adminAction.count(),
    prisma.adminAction.count({ where: { createdAt: { gte: since24h } } }),
    prisma.user.count({ where: { status: "blocked" } }),
    prisma.user.count({ where: { status: "pending_approval" } }),
    prisma.adminAction.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { admin: { select: { id: true, name: true, email: true, role: true } } },
    }),
  ]);

  return {
    totalActions: safeNumber(totalActions),
    actions24h: safeNumber(actions24h),
    blockedUsers: safeNumber(blockedUsers),
    pendingUsers: safeNumber(pendingUsers),
    recentActions,
    checklist: [
      { key: "rate_limits", label: "Rate limiting enabled", status: "active" },
      { key: "auth_limits", label: "Login/register protection enabled", status: "active" },
      { key: "upload_limits", label: "Upload size/type protection enabled", status: "active" },
      { key: "audit_logs", label: "Admin write actions are audited", status: "active" },
      { key: "helmet", label: "Helmet security headers enabled", status: "active" },
    ],
  };
}

export async function listAuditLogs({ page = 1, limit = 30, targetType, adminId }) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(10, Number(limit) || 30));
  const where = {
    ...(targetType ? { targetType } : {}),
    ...(adminId ? { adminId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.adminAction.findMany({
      where,
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      orderBy: { createdAt: "desc" },
      include: { admin: { select: { id: true, name: true, email: true, role: true } } },
    }),
    prisma.adminAction.count({ where }),
  ]);

  return {
    items,
    total,
    page: safePage,
    limit: safeLimit,
    pages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}
