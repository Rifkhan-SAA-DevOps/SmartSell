import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { httpError } from "../utils/httpError.js";
import { getPublicUser } from "./auth.service.js";

const managementRoles = ["seller", "shop", "service_provider", "admin", "super_admin"];

function cleanString(value) {
  const text = String(value ?? "").trim();
  return text || null;
}

function normalizeProfile(user) {
  return {
    user: getPublicUser(user),
    canUseManagementProfile: managementRoles.includes(user.role),
    sellerProfile: user.sellerProfile
      ? {
          id: user.sellerProfile.id,
          sellerType: user.sellerProfile.sellerType,
          businessName: user.sellerProfile.businessName,
          shopName: user.sellerProfile.shopName,
          description: user.sellerProfile.description,
          phone: user.sellerProfile.phone,
          location: user.sellerProfile.location,
          status: user.sellerProfile.status,
        }
      : null,
    serviceProviderProfile: user.serviceProviderProfile
      ? {
          id: user.serviceProviderProfile.id,
          businessName: user.serviceProviderProfile.businessName,
          description: user.serviceProviderProfile.description,
          phone: user.serviceProviderProfile.phone,
          location: user.serviceProviderProfile.location,
          status: user.serviceProviderProfile.status,
        }
      : null,
  };
}

async function readFullUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      sellerProfile: true,
      serviceProviderProfile: true,
    },
  });

  if (!user) throw httpError(404, "User account was not found.");
  return user;
}

export async function getMyProfile(userId) {
  const user = await readFullUser(userId);
  return normalizeProfile(user);
}

export async function updateMyProfile(userId, payload) {
  const existingUser = await readFullUser(userId);

  const name = cleanString(payload.name);
  const phone = cleanString(payload.phone);
  const businessName = cleanString(payload.businessName);
  const location = cleanString(payload.location);
  const description = cleanString(payload.description);
  const shopName = cleanString(payload.shopName);

  if (!name) throw httpError(400, "Name is required.");

  const updatedUser = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        name,
        phone,
        businessName: businessName || null,
      },
    });

    if (["seller", "shop"].includes(existingUser.role)) {
      await tx.sellerProfile.upsert({
        where: { userId },
        update: {
          businessName: businessName || null,
          shopName: existingUser.role === "shop" ? shopName || businessName || name : null,
          description,
          phone,
          location,
        },
        create: {
          userId,
          sellerType: existingUser.role === "shop" ? "shop_seller" : "individual_seller",
          businessName: businessName || null,
          shopName: existingUser.role === "shop" ? shopName || businessName || name : null,
          description,
          phone,
          location,
          status: "pending",
        },
      });
    }

    if (existingUser.role === "service_provider") {
      await tx.serviceProviderProfile.upsert({
        where: { userId },
        update: {
          businessName: businessName || null,
          description,
          phone,
          location,
        },
        create: {
          userId,
          businessName: businessName || null,
          description,
          phone,
          location,
          status: "pending",
        },
      });

      // Service providers also keep a lightweight seller profile for assignment/listing workflows.
      await tx.sellerProfile.upsert({
        where: { userId },
        update: {
          businessName: businessName || null,
          description,
          phone,
          location,
        },
        create: {
          userId,
          sellerType: "service_provider",
          businessName: businessName || null,
          description,
          phone,
          location,
          status: "pending",
        },
      });
    }

    return tx.user.findUnique({
      where: { id: userId },
      include: {
        sellerProfile: true,
        serviceProviderProfile: true,
      },
    });
  });

  return normalizeProfile(updatedUser);
}

export async function changeMyPassword(userId, payload) {
  const currentPassword = String(payload.currentPassword || "");
  const newPassword = String(payload.newPassword || "");
  const confirmPassword = String(payload.confirmPassword || "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw httpError(400, "Current password, new password, and confirm password are required.");
  }

  if (newPassword.length < 8) {
    throw httpError(400, "New password must be at least 8 characters.");
  }

  if (newPassword !== confirmPassword) {
    throw httpError(400, "New password and confirm password do not match.");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw httpError(404, "User account was not found.");

  const currentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!currentPasswordValid) throw httpError(401, "Current password is incorrect.");

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return { changed: true };
}
