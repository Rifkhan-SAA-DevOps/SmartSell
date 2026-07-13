import { prisma } from "../config/prisma.js";

function moneyNumber(value) {
  if (value === null || value === undefined) return null;
  return Number(value);
}

function makeSlug(value = "category") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") || "category";
}

function cleanCode(code = "") {
  return String(code).trim().toUpperCase().replace(/\s+/g, "");
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeDiscountType(value) {
  const type = String(value || "percentage").toLowerCase();
  return ["percentage", "fixed"].includes(type) ? type : "percentage";
}

export function serializeCategory(category) {
  if (!category) return null;
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    type: category.type,
    description: category.description,
    icon: category.icon || "◈",
    isActive: category.isActive,
    isFeatured: category.isFeatured,
    sortOrder: category.sortOrder,
    productCount: category._count?.products || 0,
    serviceCount: category._count?.services || 0,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

export function serializeCoupon(coupon) {
  if (!coupon) return null;
  return {
    id: coupon.id,
    code: coupon.code,
    title: coupon.title,
    description: coupon.description,
    discountType: coupon.discountType,
    discountValue: moneyNumber(coupon.discountValue),
    minimumAmount: moneyNumber(coupon.minimumAmount),
    maxDiscount: moneyNumber(coupon.maxDiscount),
    usageLimit: coupon.usageLimit,
    usageCount: coupon.usageCount,
    isActive: coupon.isActive,
    startsAt: coupon.startsAt,
    endsAt: coupon.endsAt,
    createdAt: coupon.createdAt,
    updatedAt: coupon.updatedAt,
  };
}

export async function listCategories(filters = {}) {
  const where = {};
  if (filters.type && filters.type !== "all") where.type = String(filters.type);
  if (filters.active === "true") where.isActive = true;
  if (filters.featured === "true") where.isFeatured = true;

  const categories = await prisma.category.findMany({
    where,
    include: { _count: { select: { products: true, services: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return categories.map(serializeCategory);
}

export async function createCategory(payload) {
  const name = String(payload.name || "").trim();
  if (!name) throw new Error("Category name is required.");
  const slug = makeSlug(payload.slug || name);

  const category = await prisma.category.upsert({
    where: { slug },
    update: {
      name,
      type: payload.type || "product",
      description: payload.description || null,
      icon: payload.icon || null,
      isActive: payload.isActive === undefined ? true : Boolean(payload.isActive),
      isFeatured: Boolean(payload.isFeatured),
      sortOrder: Number(payload.sortOrder || 0),
    },
    create: {
      name,
      slug,
      type: payload.type || "product",
      description: payload.description || null,
      icon: payload.icon || null,
      isActive: payload.isActive === undefined ? true : Boolean(payload.isActive),
      isFeatured: Boolean(payload.isFeatured),
      sortOrder: Number(payload.sortOrder || 0),
    },
    include: { _count: { select: { products: true, services: true } } },
  });

  return serializeCategory(category);
}

export async function updateCategory(id, payload) {
  try {
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(payload.name !== undefined ? { name: String(payload.name || "").trim() } : {}),
        ...(payload.slug !== undefined ? { slug: makeSlug(payload.slug || payload.name) } : {}),
        ...(payload.type !== undefined ? { type: payload.type || "product" } : {}),
        ...(payload.description !== undefined ? { description: payload.description || null } : {}),
        ...(payload.icon !== undefined ? { icon: payload.icon || null } : {}),
        ...(payload.isActive !== undefined ? { isActive: Boolean(payload.isActive) } : {}),
        ...(payload.isFeatured !== undefined ? { isFeatured: Boolean(payload.isFeatured) } : {}),
        ...(payload.sortOrder !== undefined ? { sortOrder: Number(payload.sortOrder || 0) } : {}),
      },
      include: { _count: { select: { products: true, services: true } } },
    });
    return serializeCategory(category);
  } catch (error) {
    if (error.code === "P2025") return null;
    throw error;
  }
}

export async function listCoupons(filters = {}) {
  const where = {};
  if (filters.active === "true") where.isActive = true;
  const coupons = await prisma.coupon.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return coupons.map(serializeCoupon);
}

export async function createCoupon(payload) {
  const code = cleanCode(payload.code);
  if (!code) throw new Error("Coupon code is required.");
  const discountValue = Number(payload.discountValue || 0);
  if (!discountValue || discountValue <= 0) throw new Error("Discount value must be greater than zero.");

  const coupon = await prisma.coupon.upsert({
    where: { code },
    update: {
      title: payload.title || code,
      description: payload.description || null,
      discountType: normalizeDiscountType(payload.discountType),
      discountValue,
      minimumAmount: payload.minimumAmount === "" || payload.minimumAmount === undefined ? null : Number(payload.minimumAmount || 0),
      maxDiscount: payload.maxDiscount === "" || payload.maxDiscount === undefined ? null : Number(payload.maxDiscount || 0),
      usageLimit: payload.usageLimit === "" || payload.usageLimit === undefined ? null : Number(payload.usageLimit || 0),
      isActive: payload.isActive === undefined ? true : Boolean(payload.isActive),
      startsAt: parseDate(payload.startsAt),
      endsAt: parseDate(payload.endsAt),
    },
    create: {
      code,
      title: payload.title || code,
      description: payload.description || null,
      discountType: normalizeDiscountType(payload.discountType),
      discountValue,
      minimumAmount: payload.minimumAmount === "" || payload.minimumAmount === undefined ? null : Number(payload.minimumAmount || 0),
      maxDiscount: payload.maxDiscount === "" || payload.maxDiscount === undefined ? null : Number(payload.maxDiscount || 0),
      usageLimit: payload.usageLimit === "" || payload.usageLimit === undefined ? null : Number(payload.usageLimit || 0),
      isActive: payload.isActive === undefined ? true : Boolean(payload.isActive),
      startsAt: parseDate(payload.startsAt),
      endsAt: parseDate(payload.endsAt),
    },
  });

  return serializeCoupon(coupon);
}

export async function updateCoupon(id, payload) {
  try {
    const data = {
      ...(payload.code !== undefined ? { code: cleanCode(payload.code) } : {}),
      ...(payload.title !== undefined ? { title: payload.title || cleanCode(payload.code) } : {}),
      ...(payload.description !== undefined ? { description: payload.description || null } : {}),
      ...(payload.discountType !== undefined ? { discountType: normalizeDiscountType(payload.discountType) } : {}),
      ...(payload.discountValue !== undefined ? { discountValue: Number(payload.discountValue || 0) } : {}),
      ...(payload.minimumAmount !== undefined ? { minimumAmount: payload.minimumAmount === "" ? null : Number(payload.minimumAmount || 0) } : {}),
      ...(payload.maxDiscount !== undefined ? { maxDiscount: payload.maxDiscount === "" ? null : Number(payload.maxDiscount || 0) } : {}),
      ...(payload.usageLimit !== undefined ? { usageLimit: payload.usageLimit === "" ? null : Number(payload.usageLimit || 0) } : {}),
      ...(payload.isActive !== undefined ? { isActive: Boolean(payload.isActive) } : {}),
      ...(payload.startsAt !== undefined ? { startsAt: parseDate(payload.startsAt) } : {}),
      ...(payload.endsAt !== undefined ? { endsAt: parseDate(payload.endsAt) } : {}),
    };

    const coupon = await prisma.coupon.update({ where: { id }, data });
    return serializeCoupon(coupon);
  } catch (error) {
    if (error.code === "P2025") return null;
    throw error;
  }
}

export async function validateCouponCode(code, subtotal) {
  const clean = cleanCode(code);
  if (!clean) throw new Error("Coupon code is required.");

  const coupon = await prisma.coupon.findUnique({ where: { code: clean } });
  if (!coupon || !coupon.isActive) throw new Error("Coupon is not active or does not exist.");

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) throw new Error("Coupon is not active yet.");
  if (coupon.endsAt && coupon.endsAt < now) throw new Error("Coupon has expired.");
  if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.usageCount >= coupon.usageLimit) {
    throw new Error("Coupon usage limit reached.");
  }

  const amount = Number(subtotal || 0);
  if (Number(coupon.minimumAmount || 0) > amount) {
    throw new Error(`Minimum order amount is Rs. ${Number(coupon.minimumAmount).toLocaleString("en-LK")}.`);
  }

  let discountAmount = 0;
  if (coupon.discountType === "fixed") {
    discountAmount = Number(coupon.discountValue || 0);
  } else {
    discountAmount = (amount * Number(coupon.discountValue || 0)) / 100;
  }

  if (coupon.maxDiscount !== null && coupon.maxDiscount !== undefined) {
    discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
  }

  discountAmount = Math.max(0, Math.min(amount, Math.round(discountAmount)));

  return {
    coupon,
    couponCode: coupon.code,
    discountAmount,
    finalAmount: Math.max(0, amount - discountAmount),
    message: `${coupon.code} applied. You saved Rs. ${discountAmount.toLocaleString("en-LK")}.`,
  };
}

export async function markCouponUsed(couponId, tx = prisma) {
  if (!couponId) return;
  await tx.coupon.update({
    where: { id: couponId },
    data: { usageCount: { increment: 1 } },
  });
}
