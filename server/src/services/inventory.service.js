import { prisma } from "../config/prisma.js";
import { serializeProduct, serializeService, updateProduct, updateService } from "./marketplace.service.js";

function toNumber(value) {
  if (value === null || value === undefined) return value;
  return Number(value);
}

function isAdmin(user) {
  return ["admin", "super_admin"].includes(user?.role);
}

function canManageProduct(user, product) {
  if (isAdmin(user)) return true;
  if (!["seller", "shop", "shop_seller"].includes(user?.role)) return false;
  return product?.createdById === user.id || product?.seller?.userId === user.id;
}

function canManageService(user, service) {
  if (isAdmin(user)) return true;
  if (user?.role !== "service_provider") return false;
  return service?.createdById === user.id || service?.provider?.userId === user.id;
}


function normalizeCatalogStatus(value, user, currentStatus = "draft") {
  const status = String(value || currentStatus || "draft").trim().toLowerCase();
  const allowed = ["draft", "pending", "approved", "rejected", "archived"];
  if (!allowed.includes(status)) return currentStatus;
  if (isAdmin(user)) return status;
  const ownerAllowed = ["draft", "pending", "archived"];
  return ownerAllowed.includes(status) ? status : currentStatus;
}

function copyName(value, fallback = "Listing") {
  const name = String(value || fallback).trim();
  return name.toLowerCase().startsWith("copy of ") ? `${name} Copy` : `Copy of ${name}`;
}

function copyServiceTitle(value, fallback = "Service") {
  const title = String(value || fallback).trim();
  return title.toLowerCase().startsWith("copy of ") ? `${title} Copy` : `Copy of ${title}`;
}

function parseVariantLines(input) {
  if (Array.isArray(input)) return input;
  const text = String(input || "").trim();
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, sku, priceAdjustment, stock, attributesText] = line.split("|").map((item) => item?.trim());
      let attributes = {};
      if (attributesText) {
        try { attributes = JSON.parse(attributesText); } catch { attributes = { note: attributesText }; }
      }
      return { name, sku, priceAdjustment, stock, attributes };
    });
}

function normalizeAdjustmentType(value) {
  const type = String(value || "adjustment").trim().toLowerCase();
  const allowed = ["adjustment", "restock", "sale", "return", "damage", "correction"];
  return allowed.includes(type) ? type : "adjustment";
}

function serializeMovement(item) {
  return {
    id: item.id,
    productId: item.productId,
    variantId: item.variantId,
    orderId: item.orderId,
    type: item.type,
    quantity: item.quantity,
    previousStock: item.previousStock,
    newStock: item.newStock,
    reason: item.reason,
    reference: item.reference,
    productName: item.product?.name || item.variant?.product?.name || null,
    variantName: item.variant?.name || null,
    createdBy: item.createdBy ? { id: item.createdBy.id, name: item.createdBy.name, email: item.createdBy.email } : null,
    createdAt: item.createdAt,
  };
}

export async function listInventoryProducts(user, filters = {}) {
  const where = {};
  if (!isAdmin(user)) {
    where.OR = [
      { createdById: user.id },
      { seller: { is: { userId: user.id } } },
    ];
  }

  const search = String(filters.q || filters.search || "").trim();
  if (search) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
          { brand: { contains: search, mode: "insensitive" } },
          { category: { is: { name: { contains: search, mode: "insensitive" } } } },
        ],
      },
    ];
  }

  if (filters.stockStatus === "out") where.stock = { lte: 0 };
  if (filters.stockStatus === "low") where.AND = [...(where.AND || []), { stock: { gt: 0 } }, { stock: { lte: 5 } }];
  if (filters.stockStatus === "available") where.stock = { gt: 0 };

  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      seller: true,
      createdBy: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: { orderBy: { createdAt: "asc" } },
      reviews: { where: { status: "approved" }, select: { rating: true, status: true } },
    },
    orderBy: [{ stock: "asc" }, { updatedAt: "desc" }],
    take: Number(filters.limit || 150),
  });

  return products.map(serializeProduct);
}

export async function getInventorySummary(user) {
  const products = await listInventoryProducts(user, { limit: 500 });
  const totalProducts = products.length;
  const stockTracked = products.filter((product) => product.isStockTracked).length;
  const lowStock = products.filter((product) => product.stockStatus === "low_stock").length;
  const outOfStock = products.filter((product) => product.stockStatus === "out_of_stock").length;
  const totalUnits = products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
  const totalStockValue = products.reduce((sum, product) => sum + Number(product.stock || 0) * Number(product.price || 0), 0);

  return {
    totalProducts,
    stockTracked,
    lowStock,
    outOfStock,
    totalUnits,
    totalStockValue,
    lowStockProducts: products.filter((product) => ["low_stock", "out_of_stock"].includes(product.stockStatus)).slice(0, 20),
  };
}

export async function adjustProductStock(productId, payload, user) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { seller: true },
  });

  if (!product) return null;
  if (!canManageProduct(user, product)) throw new Error("You do not have permission to adjust this product stock.");

  const mode = String(payload.mode || "set").toLowerCase();
  const amount = Number(payload.quantity ?? payload.stock ?? 0);
  if (!Number.isFinite(amount)) throw new Error("Valid stock quantity is required.");

  const previousStock = Number(product.stock || 0);
  const newStock = mode === "add"
    ? previousStock + Math.abs(Math.trunc(amount))
    : mode === "subtract"
      ? previousStock - Math.abs(Math.trunc(amount))
      : Math.max(0, Math.trunc(amount));

  if (newStock < 0 && !product.allowBackorder) {
    throw new Error("Stock cannot go below zero unless backorder is enabled.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const changed = await tx.product.update({
      where: { id: product.id },
      data: {
        stock: newStock,
        ...(payload.lowStockThreshold !== undefined ? { lowStockThreshold: Number(payload.lowStockThreshold || 5) } : {}),
        ...(payload.isStockTracked !== undefined ? { isStockTracked: Boolean(payload.isStockTracked) } : {}),
        ...(payload.allowBackorder !== undefined ? { allowBackorder: Boolean(payload.allowBackorder) } : {}),
      },
      include: {
        category: true,
        seller: true,
        createdBy: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { createdAt: "asc" } },
        reviews: { where: { status: "approved" }, select: { rating: true, status: true } },
      },
    });

    await tx.stockMovement.create({
      data: {
        productId: product.id,
        type: normalizeAdjustmentType(payload.type),
        quantity: newStock - previousStock,
        previousStock,
        newStock,
        reason: payload.reason || null,
        reference: payload.reference || null,
        createdById: user?.id || null,
      },
    });

    return changed;
  });

  return serializeProduct(updated);
}

export async function createProductVariant(productId, payload, user) {
  const product = await prisma.product.findUnique({ where: { id: productId }, include: { seller: true } });
  if (!product) return null;
  if (!canManageProduct(user, product)) throw new Error("You do not have permission to manage this product variants.");

  const name = String(payload.name || "").trim();
  if (!name) throw new Error("Variant name is required.");

  return prisma.productVariant.create({
    data: {
      productId,
      name,
      sku: payload.sku ? String(payload.sku).trim() : null,
      priceAdjustment: Number(payload.priceAdjustment || 0),
      stock: Number(payload.stock || 0),
      attributes: payload.attributes || {},
      isActive: payload.isActive === undefined ? true : Boolean(payload.isActive),
    },
  });
}

export async function updateProductVariant(productId, variantId, payload, user) {
  const product = await prisma.product.findUnique({ where: { id: productId }, include: { seller: true } });
  if (!product) return null;
  if (!canManageProduct(user, product)) throw new Error("You do not have permission to manage this product variants.");

  try {
    return await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...(payload.name !== undefined ? { name: String(payload.name || "Variant").trim() } : {}),
        ...(payload.sku !== undefined ? { sku: payload.sku ? String(payload.sku).trim() : null } : {}),
        ...(payload.priceAdjustment !== undefined ? { priceAdjustment: Number(payload.priceAdjustment || 0) } : {}),
        ...(payload.stock !== undefined ? { stock: Number(payload.stock || 0) } : {}),
        ...(payload.attributes !== undefined ? { attributes: payload.attributes || {} } : {}),
        ...(payload.isActive !== undefined ? { isActive: Boolean(payload.isActive) } : {}),
      },
    });
  } catch (error) {
    if (error.code === "P2025") return null;
    throw error;
  }
}

export async function listStockMovements(user, filters = {}) {
  const where = {};
  if (!isAdmin(user)) {
    where.product = {
      OR: [
        { createdById: user.id },
        { seller: { is: { userId: user.id } } },
      ],
    };
  }

  if (filters.productId) where.productId = String(filters.productId);
  if (filters.type && filters.type !== "all") where.type = String(filters.type);

  const movements = await prisma.stockMovement.findMany({
    where,
    include: {
      product: true,
      variant: { include: { product: true } },
      createdBy: true,
    },
    orderBy: { createdAt: "desc" },
    take: Number(filters.limit || 100),
  });

  return movements.map(serializeMovement);
}

export async function updateAdvancedProduct(productId, payload, user) {
  const product = await prisma.product.findUnique({ where: { id: productId }, include: { seller: true } });
  if (!product) return null;
  if (!canManageProduct(user, product)) throw new Error("You do not have permission to update this product.");
  return updateProduct(productId, payload);
}

export async function updateAdvancedService(serviceId, payload, user) {
  const service = await prisma.service.findUnique({ where: { id: serviceId }, include: { provider: true } });
  if (!service) return null;
  if (!canManageService(user, service)) throw new Error("You do not have permission to update this service.");
  return updateService(serviceId, payload);
}

export async function listAdvancedServices(user, filters = {}) {
  const where = {};
  if (!isAdmin(user)) {
    where.OR = [
      { createdById: user.id },
      { provider: { is: { userId: user.id } } },
    ];
  }
  const search = String(filters.q || "").trim();
  if (search) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { serviceArea: { contains: search, mode: "insensitive" } },
          { providerType: { contains: search, mode: "insensitive" } },
        ],
      },
    ];
  }

  const services = await prisma.service.findMany({
    where,
    include: {
      category: true,
      provider: true,
      createdBy: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      reviews: { where: { status: "approved" }, select: { rating: true, status: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: Number(filters.limit || 120),
  });

  return services.map(serializeService);
}


export async function updateProductCatalogStatus(productId, payload, user) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      seller: true,
      category: true,
      createdBy: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { createdAt: "asc" } },
      reviews: { where: { status: "approved" }, select: { rating: true, status: true } },
    },
  });
  if (!product) return null;
  if (!canManageProduct(user, product)) throw new Error("You do not have permission to change this product listing status.");

  const status = normalizeCatalogStatus(payload.status, user, product.status);
  const updated = await prisma.product.update({
    where: { id: productId },
    data: { status },
    include: {
      category: true,
      seller: true,
      createdBy: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { createdAt: "asc" } },
      reviews: { where: { status: "approved" }, select: { rating: true, status: true } },
    },
  });
  return serializeProduct(updated);
}

export async function updateServiceCatalogStatus(serviceId, payload, user) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      provider: true,
      category: true,
      createdBy: true,
      images: { orderBy: { sortOrder: "asc" } },
      reviews: { where: { status: "approved" }, select: { rating: true, status: true } },
    },
  });
  if (!service) return null;
  if (!canManageService(user, service)) throw new Error("You do not have permission to change this service listing status.");

  const status = normalizeCatalogStatus(payload.status, user, service.status);
  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: { status },
    include: {
      category: true,
      provider: true,
      createdBy: true,
      images: { orderBy: { sortOrder: "asc" } },
      reviews: { where: { status: "approved" }, select: { rating: true, status: true } },
    },
  });
  return serializeService(updated);
}

export async function duplicateProduct(productId, payload, user) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      seller: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!product) return null;
  if (!canManageProduct(user, product)) throw new Error("You do not have permission to duplicate this product.");

  const duplicateImages = payload.includeImages !== false;
  const duplicateVariants = payload.includeVariants !== false;

  const created = await prisma.product.create({
    data: {
      name: payload.name || copyName(product.name, "Product"),
      description: product.description,
      categoryId: product.categoryId,
      type: product.type,
      price: product.price,
      brand: product.brand,
      model: product.model,
      condition: product.condition,
      stock: Number(payload.stock ?? 0),
      lowStockThreshold: product.lowStockThreshold,
      isStockTracked: product.isStockTracked,
      allowBackorder: product.allowBackorder,
      listingExpiresAt: null,
      location: product.location,
      status: "draft",
      isFeatured: false,
      sellerId: product.sellerId,
      createdById: user?.id || product.createdById,
      ...(duplicateImages && product.images?.length
        ? { images: { create: product.images.map((image, index) => ({ url: image.url, alt: image.alt, sortOrder: index })) } }
        : {}),
      ...(duplicateVariants && product.variants?.length
        ? {
            variants: {
              create: product.variants.map((variant) => ({
                name: variant.name,
                sku: null,
                priceAdjustment: variant.priceAdjustment,
                stock: Number(payload.variantStock ?? 0),
                attributes: variant.attributes || {},
                isActive: variant.isActive,
              })),
            },
          }
        : {}),
    },
    include: {
      category: true,
      seller: true,
      createdBy: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { createdAt: "asc" } },
      reviews: { where: { status: "approved" }, select: { rating: true, status: true } },
    },
  });

  return serializeProduct(created);
}

export async function duplicateService(serviceId, payload, user) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      provider: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!service) return null;
  if (!canManageService(user, service)) throw new Error("You do not have permission to duplicate this service.");

  const duplicateImages = payload.includeImages !== false;

  const created = await prisma.service.create({
    data: {
      title: payload.title || copyServiceTitle(service.title, "Service"),
      description: service.description,
      categoryId: service.categoryId,
      priceFrom: service.priceFrom,
      serviceArea: service.serviceArea,
      availabilityNote: service.availabilityNote,
      estimatedDuration: service.estimatedDuration,
      minNoticeHours: service.minNoticeHours,
      bookingMode: service.bookingMode,
      serviceTags: service.serviceTags || [],
      status: "draft",
      isFeatured: false,
      providerId: service.providerId,
      providerType: service.providerType,
      createdById: user?.id || service.createdById,
      ...(duplicateImages && service.images?.length
        ? { images: { create: service.images.map((image, index) => ({ url: image.url, alt: image.alt, sortOrder: index })) } }
        : {}),
    },
    include: {
      category: true,
      provider: true,
      createdBy: true,
      images: { orderBy: { sortOrder: "asc" } },
      reviews: { where: { status: "approved" }, select: { rating: true, status: true } },
    },
  });

  return serializeService(created);
}

export async function bulkCreateProductVariants(productId, payload, user) {
  const product = await prisma.product.findUnique({ where: { id: productId }, include: { seller: true } });
  if (!product) return null;
  if (!canManageProduct(user, product)) throw new Error("You do not have permission to manage this product variants.");

  const variants = parseVariantLines(payload.variants || payload.lines || payload.text);
  const cleanVariants = variants
    .map((variant) => ({
      productId,
      name: String(variant.name || "").trim(),
      sku: variant.sku ? String(variant.sku).trim() : null,
      priceAdjustment: Number(variant.priceAdjustment || 0),
      stock: Number(variant.stock || 0),
      attributes: variant.attributes || {},
      isActive: variant.isActive === undefined ? true : Boolean(variant.isActive),
    }))
    .filter((variant) => variant.name);

  if (!cleanVariants.length) throw new Error("At least one valid variant is required.");

  await prisma.productVariant.createMany({
    data: cleanVariants,
    skipDuplicates: true,
  });

  return prisma.productVariant.findMany({
    where: { productId },
    orderBy: { createdAt: "asc" },
  });
}

export function getCatalogImportTemplate() {
  return {
    productFields: [
      "name",
      "description",
      "categorySlug",
      "type",
      "price",
      "sku",
      "brand",
      "model",
      "condition",
      "stock",
      "lowStockThreshold",
      "location",
      "listingExpiresAt",
    ],
    serviceFields: [
      "title",
      "description",
      "categorySlug",
      "priceFrom",
      "serviceArea",
      "estimatedDuration",
      "minNoticeHours",
      "bookingMode",
      "serviceTags",
    ],
    variantLineFormat: "Variant name | Variant SKU | Price adjustment | Stock | JSON attributes",
    variantExample: 'Blue / 128GB | PHONE-BLUE-128 | 5000 | 10 | {"color":"Blue","storage":"128GB"}',
    note: "Bulk product/service import execution should be added after final CSV validation rules are confirmed. This template is safe for preparing data now.",
  };
}
