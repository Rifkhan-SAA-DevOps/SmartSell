import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { httpError } from "../utils/httpError.js";

const PUBLIC_USER_FIELDS = ["id", "name", "email", "role", "status", "businessName", "phone", "createdAt"];

function cleanUser(user) {
  if (!user) return null;
  return PUBLIC_USER_FIELDS.reduce((acc, key) => {
    if (user[key] !== undefined) acc[key] = user[key];
    return acc;
  }, {});
}

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function normalizeRole(role = "customer") {
  const allowedRoles = ["customer", "seller", "shop", "service_provider"];
  return allowedRoles.includes(role) ? role : null;
}

export function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

export async function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
}

export async function findUserById(id) {
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

export async function registerUser(payload) {
  const name = String(payload.name || "").trim();
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "");
  const role = normalizeRole(payload.role || "customer");

  if (!name || !email || !password) {
    throw httpError(400, "Name, email, and password are required.");
  }

  if (password.length < 8) {
    throw httpError(400, "Password must be at least 8 characters.");
  }

  if (!role) {
    throw httpError(400, "Invalid registration role.");
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw httpError(409, "An account already exists with this email.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const status = role === "customer" ? "active" : "pending_approval";

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        phone: payload.phone || null,
        businessName: payload.businessName || null,
        status,
      },
    });

    if (role === "seller" || role === "shop") {
      await tx.sellerProfile.create({
        data: {
          userId: createdUser.id,
          sellerType: role === "shop" ? "shop_seller" : "individual_seller",
          businessName: payload.businessName || null,
          shopName: role === "shop" ? payload.businessName || name : null,
          phone: payload.phone || null,
          status: "pending",
        },
      });
    }

    if (role === "service_provider") {
      await tx.serviceProviderProfile.create({
        data: {
          userId: createdUser.id,
          businessName: payload.businessName || null,
          phone: payload.phone || null,
          status: "pending",
        },
      });

      await tx.sellerProfile.create({
        data: {
          userId: createdUser.id,
          sellerType: "service_provider",
          businessName: payload.businessName || null,
          phone: payload.phone || null,
          status: "pending",
        },
      });
    }

    return createdUser;
  });

  return { user: cleanUser(user), token: signToken(user) };
}

export async function loginUser(payload) {
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "");
  const user = await findUserByEmail(email);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw httpError(401, "Invalid email or password.");
  }

  if (user.status === "blocked") {
    throw httpError(403, "This account has been blocked.");
  }

  return { user: cleanUser(user), token: signToken(user) };
}

export function getPublicUser(user) {
  return cleanUser(user);
}
