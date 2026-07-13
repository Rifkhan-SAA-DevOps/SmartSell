import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { httpError } from "../utils/httpError.js";
import { createNotification } from "./communication.service.js";

const ADMIN_ROLES = ["admin", "super_admin"];
const MANAGEABLE_ROLES = ["customer", "seller", "shop", "service_provider", "delivery_partner", "admin", "super_admin"];
const MANAGEABLE_STATUSES = ["active", "pending_approval", "blocked"];
const PROFILE_STATUSES = ["pending", "approved", "rejected", "archived"];

function cleanUser(user) {
  if (!user) return null;
  const sellerProfile = user.sellerProfile
    ? {
        id: user.sellerProfile.id,
        sellerType: user.sellerProfile.sellerType,
        businessName: user.sellerProfile.businessName,
        shopName: user.sellerProfile.shopName,
        phone: user.sellerProfile.phone,
        location: user.sellerProfile.location,
        status: user.sellerProfile.status,
        createdAt: user.sellerProfile.createdAt,
      }
    : null;

  const serviceProviderProfile = user.serviceProviderProfile
    ? {
        id: user.serviceProviderProfile.id,
        businessName: user.serviceProviderProfile.businessName,
        phone: user.serviceProviderProfile.phone,
        location: user.serviceProviderProfile.location,
        status: user.serviceProviderProfile.status,
        createdAt: user.serviceProviderProfile.createdAt,
      }
    : null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    phone: user.phone,
    businessName: user.businessName,
    sellerProfile,
    serviceProviderProfile,
    counts: user._count || {},
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function requireAdminUser(currentUser) {
  if (!currentUser || !ADMIN_ROLES.includes(currentUser.role)) {
    throw httpError(403, "Admin access is required.");
  }
}

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function generateTemporaryPassword() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SmartSell@${suffix}`;
}

const userInclude = {
  sellerProfile: true,
  serviceProviderProfile: true,
  _count: {
    select: {
      products: true,
      services: true,
      orders: true,
      reviews: true,
      supportTickets: true,
      payoutRequests: true,
    },
  },
};

export async function getUserManagementOverview(currentUser) {
  requireAdminUser(currentUser);

  const [
    totalUsers,
    activeUsers,
    pendingUsers,
    blockedUsers,
    customers,
    sellers,
    shops,
    providers,
    deliveryPartners,
    admins,
    pendingSellerProfiles,
    pendingProviderProfiles,
    openSupportTickets,
    pendingPayouts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "active" } }),
    prisma.user.count({ where: { status: "pending_approval" } }),
    prisma.user.count({ where: { status: "blocked" } }),
    prisma.user.count({ where: { role: "customer" } }),
    prisma.user.count({ where: { role: "seller" } }),
    prisma.user.count({ where: { role: "shop" } }),
    prisma.user.count({ where: { role: "service_provider" } }),
    prisma.user.count({ where: { role: "delivery_partner" } }),
    prisma.user.count({ where: { role: { in: ADMIN_ROLES } } }),
    prisma.sellerProfile.count({ where: { status: "pending" } }),
    prisma.serviceProviderProfile.count({ where: { status: "pending" } }),
    prisma.supportTicket.count({ where: { status: { in: ["open", "in_review", "waiting_customer"] } } }).catch(() => 0),
    prisma.payoutRequest.count({ where: { status: "pending" } }).catch(() => 0),
  ]);

  return {
    totalUsers,
    activeUsers,
    pendingUsers,
    blockedUsers,
    customers,
    sellers,
    shops,
    providers,
    deliveryPartners,
    admins,
    pendingBusinessApprovals: pendingSellerProfiles + pendingProviderProfiles,
    openSupportTickets,
    pendingPayouts,
  };
}

export async function listManagedUsers(currentUser, query = {}) {
  requireAdminUser(currentUser);

  const role = String(query.role || "all");
  const status = String(query.status || "all");
  const search = String(query.search || "").trim();
  const businessStatus = String(query.businessStatus || "all");

  const where = {};
  if (role !== "all") {
    if (!MANAGEABLE_ROLES.includes(role)) throw httpError(400, "Invalid role filter.");
    where.role = role;
  }
  if (status !== "all") {
    if (!MANAGEABLE_STATUSES.includes(status)) throw httpError(400, "Invalid status filter.");
    where.status = status;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { businessName: { contains: search, mode: "insensitive" } },
      { sellerProfile: { businessName: { contains: search, mode: "insensitive" } } },
      { sellerProfile: { shopName: { contains: search, mode: "insensitive" } } },
      { serviceProviderProfile: { businessName: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (businessStatus !== "all") {
    if (!PROFILE_STATUSES.includes(businessStatus)) throw httpError(400, "Invalid business status filter.");
    where.OR = [
      ...(where.OR || []),
      { sellerProfile: { status: businessStatus } },
      { serviceProviderProfile: { status: businessStatus } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    include: userInclude,
    orderBy: [{ createdAt: "desc" }],
    take: 120,
  });

  return users.map(cleanUser);
}

export async function getManagedUser(currentUser, userId) {
  requireAdminUser(currentUser);
  const user = await prisma.user.findUnique({ where: { id: userId }, include: userInclude });
  if (!user) throw httpError(404, "User account was not found.");
  return cleanUser(user);
}

export async function createAdminAccount(currentUser, payload) {
  requireAdminUser(currentUser);

  const name = String(payload.name || "").trim();
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || generateTemporaryPassword());
  const role = String(payload.role || "customer");
  const status = String(payload.status || "active");
  const phone = String(payload.phone || "").trim() || null;
  const businessName = String(payload.businessName || "").trim() || null;
  const location = String(payload.location || "").trim() || null;
  const description = String(payload.description || "").trim() || null;

  if (!name || !email) throw httpError(400, "Name and email are required.");
  if (!MANAGEABLE_ROLES.includes(role)) throw httpError(400, "Invalid role selected.");
  if (!MANAGEABLE_STATUSES.includes(status)) throw httpError(400, "Invalid account status selected.");
  if (role === "super_admin" && currentUser.role !== "super_admin") {
    throw httpError(403, "Only a super admin can create a super admin account.");
  }
  if (password.length < 8) throw httpError(400, "Password must be at least 8 characters.");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw httpError(409, "An account already exists with this email.");

  const passwordHash = await bcrypt.hash(password, 12);

  const createdUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        status,
        phone,
        businessName,
      },
    });

    if (role === "seller" || role === "shop") {
      await tx.sellerProfile.create({
        data: {
          userId: user.id,
          sellerType: role === "shop" ? "shop_seller" : "individual_seller",
          businessName: businessName || name,
          shopName: role === "shop" ? businessName || name : null,
          description,
          phone,
          location,
          status: status === "active" ? "approved" : "pending",
        },
      });
    }

    if (role === "service_provider") {
      await tx.serviceProviderProfile.create({
        data: {
          userId: user.id,
          businessName: businessName || name,
          description,
          phone,
          location,
          status: status === "active" ? "approved" : "pending",
        },
      });

      await tx.sellerProfile.create({
        data: {
          userId: user.id,
          sellerType: "service_provider",
          businessName: businessName || name,
          description,
          phone,
          location,
          status: status === "active" ? "approved" : "pending",
        },
      }).catch(() => null);
    }

    return tx.user.findUnique({ where: { id: user.id }, include: userInclude });
  });

  await createNotification({
    userId: createdUser.id,
    title: "SmartSell account created",
    message: `An account was created for you as ${role.replaceAll("_", " ")}. Please login and update your profile.`,
    type: "account",
    link: "/profile",
  });

  await prisma.adminAction.create({
    data: {
      adminId: currentUser.id,
      action: "create_user_account",
      targetType: "user",
      targetId: createdUser.id,
      note: `Created ${role} account for ${email}`,
    },
  }).catch(() => null);

  return { user: cleanUser(createdUser), temporaryPassword: password };
}

async function assertCanChangeTarget(currentUser, targetUser, requestedRole = null) {
  if (targetUser.id === currentUser.id && requestedRole && requestedRole !== targetUser.role) {
    throw httpError(400, "You cannot change your own role while logged in.");
  }

  if (targetUser.role === "super_admin" && currentUser.role !== "super_admin") {
    throw httpError(403, "Only a super admin can manage another super admin.");
  }

  if (requestedRole === "super_admin" && currentUser.role !== "super_admin") {
    throw httpError(403, "Only a super admin can assign the super admin role.");
  }

  if (targetUser.role === "super_admin") {
    const superAdminCount = await prisma.user.count({ where: { role: "super_admin", status: { not: "blocked" } } });
    if (superAdminCount <= 1 && (requestedRole && requestedRole !== "super_admin")) {
      throw httpError(400, "At least one active super admin must remain.");
    }
  }
}

export async function updateUserStatus(currentUser, userId, payload) {
  requireAdminUser(currentUser);
  const status = String(payload.status || "");
  if (!MANAGEABLE_STATUSES.includes(status)) throw httpError(400, "Invalid user status.");

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) throw httpError(404, "User account was not found.");
  if (targetUser.id === currentUser.id && status === "blocked") throw httpError(400, "You cannot block your own account.");
  await assertCanChangeTarget(currentUser, targetUser);

  const updated = await prisma.user.update({ where: { id: userId }, data: { status }, include: userInclude });

  await prisma.adminAction.create({
    data: {
      adminId: currentUser.id,
      action: "update_user_status",
      targetType: "user",
      targetId: userId,
      note: `Changed status to ${status}`,
    },
  }).catch(() => null);

  return cleanUser(updated);
}

export async function updateUserRole(currentUser, userId, payload) {
  requireAdminUser(currentUser);
  const role = String(payload.role || "");
  if (!MANAGEABLE_ROLES.includes(role)) throw httpError(400, "Invalid role.");

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) throw httpError(404, "User account was not found.");
  await assertCanChangeTarget(currentUser, targetUser, role);

  const updated = await prisma.$transaction(async (tx) => {
    const nextUser = await tx.user.update({ where: { id: userId }, data: { role }, include: userInclude });

    if ((role === "seller" || role === "shop") && !nextUser.sellerProfile) {
      await tx.sellerProfile.create({
        data: {
          userId,
          sellerType: role === "shop" ? "shop_seller" : "individual_seller",
          businessName: nextUser.businessName || nextUser.name,
          shopName: role === "shop" ? nextUser.businessName || nextUser.name : null,
          phone: nextUser.phone,
          status: nextUser.status === "active" ? "approved" : "pending",
        },
      });
    }

    if (role === "service_provider" && !nextUser.serviceProviderProfile) {
      await tx.serviceProviderProfile.create({
        data: {
          userId,
          businessName: nextUser.businessName || nextUser.name,
          phone: nextUser.phone,
          status: nextUser.status === "active" ? "approved" : "pending",
        },
      });
      if (!nextUser.sellerProfile) {
        await tx.sellerProfile.create({
          data: {
            userId,
            sellerType: "service_provider",
            businessName: nextUser.businessName || nextUser.name,
            phone: nextUser.phone,
            status: nextUser.status === "active" ? "approved" : "pending",
          },
        });
      }
    }

    return tx.user.findUnique({ where: { id: userId }, include: userInclude });
  });

  await prisma.adminAction.create({
    data: {
      adminId: currentUser.id,
      action: "update_user_role",
      targetType: "user",
      targetId: userId,
      note: `Changed role to ${role}`,
    },
  }).catch(() => null);

  return cleanUser(updated);
}

export async function updateBusinessApproval(currentUser, userId, payload) {
  requireAdminUser(currentUser);
  const status = String(payload.status || "");
  if (!PROFILE_STATUSES.includes(status)) throw httpError(400, "Invalid business approval status.");

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { sellerProfile: true, serviceProviderProfile: true },
  });
  if (!targetUser) throw httpError(404, "User account was not found.");
  await assertCanChangeTarget(currentUser, targetUser);

  const userStatus = status === "approved" ? "active" : status === "rejected" ? "pending_approval" : targetUser.status;

  const updated = await prisma.$transaction(async (tx) => {
    if (targetUser.sellerProfile) {
      await tx.sellerProfile.update({ where: { id: targetUser.sellerProfile.id }, data: { status } });
    }
    if (targetUser.serviceProviderProfile) {
      await tx.serviceProviderProfile.update({ where: { id: targetUser.serviceProviderProfile.id }, data: { status } });
    }
    return tx.user.update({ where: { id: userId }, data: { status: userStatus }, include: userInclude });
  });

  await createNotification({
    userId,
    title: status === "approved" ? "Business profile approved" : `Business profile ${status}`,
    message: status === "approved"
      ? "Your SmartSell business account is approved. You can now manage listings and business work."
      : `Your SmartSell business profile status was updated to ${status.replaceAll("_", " ")}.`,
    type: "account",
    link: "/dashboard",
  });

  await prisma.adminAction.create({
    data: {
      adminId: currentUser.id,
      action: "update_business_approval",
      targetType: "user",
      targetId: userId,
      note: `Business approval changed to ${status}`,
    },
  }).catch(() => null);

  return cleanUser(updated);
}

export async function resetUserPassword(currentUser, userId, payload = {}) {
  requireAdminUser(currentUser);

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) throw httpError(404, "User account was not found.");
  await assertCanChangeTarget(currentUser, targetUser);

  const temporaryPassword = String(payload.temporaryPassword || generateTemporaryPassword());
  if (temporaryPassword.length < 8) throw httpError(400, "Temporary password must be at least 8 characters.");

  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  await createNotification({
    userId,
    title: "Password reset by SmartSell admin",
    message: "Your password was reset by SmartSell admin. Please login with the temporary password and change it from Profile Management.",
    type: "account",
    link: "/profile",
  });

  await prisma.adminAction.create({
    data: {
      adminId: currentUser.id,
      action: "reset_user_password",
      targetType: "user",
      targetId: userId,
      note: "Temporary password generated by admin",
    },
  }).catch(() => null);

  return { temporaryPassword };
}
