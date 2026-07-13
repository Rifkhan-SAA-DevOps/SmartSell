import { prisma } from "../config/prisma.js";
import { createNotification, deliverExternalNotification, notifyAdmins } from "./communication.service.js";

function toNumber(value) {
  if (value === null || value === undefined) return value;
  return Number(value);
}

function ratingStatsFromReviews(reviews = []) {
  const approved = reviews.filter((review) => review.status === "approved");
  const reviewCount = approved.length;
  const ratingAverage = reviewCount
    ? approved.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewCount
    : 0;

  return {
    reviewCount,
    ratingAverage: Number(ratingAverage.toFixed(1)),
  };
}

function enumFromHyphen(value) {
  return String(value || "").replaceAll("-", "_");
}

function makeSlug(value = "item") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") || "item";
}

function productTypeToDb(type) {
  const normalized = enumFromHyphen(type);
  const allowed = ["own_product", "seller_product", "shop_product", "used_product"];
  return allowed.includes(normalized) ? normalized : "seller_product";
}

function productConditionToDb(condition) {
  const normalized = enumFromHyphen(String(condition || "new").toLowerCase());
  const allowed = ["new", "like_new", "good", "used", "needs_repair"];
  return allowed.includes(normalized) ? normalized : "new";
}

function approvalStatusToDb(status) {
  const normalized = String(status || "");
  const allowed = ["draft", "pending", "approved", "rejected", "archived"];
  return allowed.includes(normalized) ? normalized : undefined;
}

function requestStatusToDb(status) {
  const normalized = String(status || "");
  const allowed = ["new", "pending", "quoted", "accepted", "in_progress", "completed", "cancelled"];
  return allowed.includes(normalized) ? normalized : undefined;
}

function imagePayload(payload) {
  const images = [];

  if (payload.imageUrl) images.push(String(payload.imageUrl).trim());
  if (Array.isArray(payload.images)) {
    for (const item of payload.images) {
      const url = typeof item === "string" ? item : item?.url;
      if (url) images.push(String(url).trim());
    }
  }

  return [...new Set(images)].filter(Boolean).slice(0, 8);
}

async function findOrCreateCategory(categoryName, type = "product") {
  const cleanName = String(categoryName || "").trim();
  if (!cleanName) return null;

  const slug = makeSlug(cleanName);
  return prisma.category.upsert({
    where: { slug },
    update: { name: cleanName, type },
    create: { name: cleanName, slug, type },
  });
}

async function getSellerProfileForUser(user) {
  if (!user?.id) return null;
  return prisma.sellerProfile.findUnique({ where: { userId: user.id } });
}

async function getServiceProviderProfileForUser(user) {
  if (!user?.id) return null;
  return prisma.serviceProviderProfile.findUnique({ where: { userId: user.id } });
}

export function serializeProduct(product) {
  if (!product) return null;
  const primaryImage = product.images?.[0]?.url || null;
  const stats = ratingStatsFromReviews(product.reviews || []);
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    category: product.category?.name || null,
    categorySlug: product.category?.slug || null,
    type: product.type,
    price: toNumber(product.price),
    sku: product.sku || null,
    brand: product.brand || null,
    model: product.model || null,
    condition: product.condition,
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold ?? 5,
    isStockTracked: product.isStockTracked !== false,
    allowBackorder: Boolean(product.allowBackorder),
    listingExpiresAt: product.listingExpiresAt || null,
    stockStatus: product.isStockTracked === false ? "not_tracked" : Number(product.stock || 0) <= 0 ? "out_of_stock" : Number(product.stock || 0) <= Number(product.lowStockThreshold || 5) ? "low_stock" : "in_stock",
    location: product.location,
    status: product.status,
    isFeatured: Boolean(product.isFeatured),
    sellerId: product.sellerId || null,
    sellerType: product.seller?.sellerType || null,
    sellerName: product.seller?.businessName || product.seller?.shopName || product.createdBy?.businessName || product.createdBy?.name || null,
    image: primaryImage,
    badge: product.type === "used_product" ? "Used" : product.type === "shop_product" ? "Shop" : product.type === "own_product" ? "SmartSell" : "Seller",
    images: product.images || [],
    variants: (product.variants || []).map((variant) => ({
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      priceAdjustment: toNumber(variant.priceAdjustment),
      stock: variant.stock,
      attributes: variant.attributes || {},
      isActive: Boolean(variant.isActive),
    })),
    createdAt: product.createdAt,
    reviewCount: stats.reviewCount,
    ratingAverage: stats.ratingAverage,
    updatedAt: product.updatedAt,
  };
}

export function serializeService(service) {
  if (!service) return null;
  const primaryImage = service.images?.[0]?.url || null;
  const stats = ratingStatsFromReviews(service.reviews || []);
  return {
    id: service.id,
    title: service.title,
    slug: service.slug,
    description: service.description,
    category: service.category?.name || null,
    categorySlug: service.category?.slug || null,
    priceFrom: toNumber(service.priceFrom),
    serviceArea: service.serviceArea || null,
    availabilityNote: service.availabilityNote || null,
    estimatedDuration: service.estimatedDuration || null,
    minNoticeHours: service.minNoticeHours || 0,
    bookingMode: service.bookingMode || "quote_only",
    serviceTags: service.serviceTags || [],
    status: service.status,
    isFeatured: Boolean(service.isFeatured),
    providerId: service.providerId || null,
    providerType: service.providerType || service.provider?.businessName || null,
    providerName: service.provider?.businessName || service.createdBy?.businessName || service.createdBy?.name || service.providerType || null,
    image: primaryImage,
    time: "Quote based",
    images: service.images || [],
    createdAt: service.createdAt,
    reviewCount: stats.reviewCount,
    ratingAverage: stats.ratingAverage,
    updatedAt: service.updatedAt,
  };
}

export function serializeRequest(request) {
  if (!request) return null;
  return {
    id: request.id,
    name: request.name,
    phone: request.phone,
    email: request.email,
    requestType: request.requestType,
    budget: toNumber(request.budget),
    location: request.location,
    message: request.message,
    status: request.status,
    quotation: toNumber(request.quotation),
    assignedTo: request.assignedTo,
    adminNote: request.adminNote,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

export function serializeSeller(profile) {
  if (!profile) return null;
  return {
    id: profile.id,
    userId: profile.userId,
    name: profile.user?.name || profile.businessName || profile.shopName || "Seller",
    email: profile.user?.email || null,
    phone: profile.phone || profile.user?.phone || null,
    sellerType: profile.sellerType,
    businessName: profile.businessName || profile.user?.businessName || profile.shopName || "",
    location: profile.location || "",
    status: profile.status,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}


const productInclude = {
  category: true,
  seller: true,
  images: { orderBy: { sortOrder: "asc" } },
  createdBy: true,
  reviews: { where: { status: "approved" }, select: { rating: true, status: true } },
  variants: { orderBy: { createdAt: "asc" } },
};

const serviceInclude = {
  category: true,
  provider: true,
  images: { orderBy: { sortOrder: "asc" } },
  createdBy: true,
  reviews: { where: { status: "approved" }, select: { rating: true, status: true } },
};

function numericFilter(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function sortListings(items, sort) {
  const mode = String(sort || "newest");
  const list = [...items];
  if (mode === "price_asc") return list.sort((a, b) => Number(a.price || a.priceFrom || 0) - Number(b.price || b.priceFrom || 0));
  if (mode === "price_desc") return list.sort((a, b) => Number(b.price || b.priceFrom || 0) - Number(a.price || a.priceFrom || 0));
  if (mode === "rating") return list.sort((a, b) => Number(b.ratingAverage || 0) - Number(a.ratingAverage || 0));
  if (mode === "featured") return list.sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)));
  return list;
}

export async function listProducts(filters = {}) {
  const where = {};

  if (filters.status === "all") {
    // Admin/internal callers can request all statuses.
  } else if (filters.status) {
    const status = approvalStatusToDb(filters.status);
    if (status) where.status = status;
  } else {
    where.status = "approved";
  }

  if (filters.type && filters.type !== "all") where.type = productTypeToDb(filters.type);
  if (filters.condition && filters.condition !== "all") where.condition = productConditionToDb(filters.condition);
  if (filters.featured === "true") where.isFeatured = true;
  if (filters.category && filters.category !== "all") {
    where.category = { is: { OR: [{ slug: String(filters.category) }, { name: { equals: String(filters.category), mode: "insensitive" } }] } };
  }
  if (filters.location) where.location = { contains: String(filters.location), mode: "insensitive" };
  if (filters.brand) where.brand = { contains: String(filters.brand), mode: "insensitive" };
  if (filters.inStock === "true") where.stock = { gt: 0 };
  if (filters.lowStock === "true") where.AND = [...(where.AND || []), { stock: { lte: 5 } }, { stock: { gt: 0 } }];
  if (!filters.includeExpired || filters.includeExpired !== "true") {
    where.OR = [ ...(where.OR || []), { listingExpiresAt: null }, { listingExpiresAt: { gte: new Date() } } ];
  }

  const minPrice = numericFilter(filters.minPrice);
  const maxPrice = numericFilter(filters.maxPrice);
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    };
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
          { description: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
          { category: { is: { name: { contains: search, mode: "insensitive" } } } },
        ],
      },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    include: productInclude,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: numericFilter(filters.limit) || 80,
  });

  return sortListings(products.map(serializeProduct), filters.sort);
}

export async function getProduct(id) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });
  return serializeProduct(product);
}

export async function createProduct(payload, user = null) {
  const name = String(payload.name || "").trim();
  if (!name) throw new Error("Product name is required.");

  const category = await findOrCreateCategory(payload.category || payload.categoryName, "product");
  const seller = await getSellerProfileForUser(user);
  const images = imagePayload(payload);
  const statusFromPayload = approvalStatusToDb(payload.status);
  const isAdmin = ["admin", "super_admin"].includes(user?.role);

  const product = await prisma.product.create({
    data: {
      name,
      slug: `${makeSlug(name)}-${Date.now()}`,
      description: payload.description || null,
      categoryId: category?.id || null,
      type: productTypeToDb(payload.type),
      price: Number(payload.price || 0),
      sku: payload.sku ? String(payload.sku).trim() : null,
      brand: payload.brand ? String(payload.brand).trim() : null,
      model: payload.model ? String(payload.model).trim() : null,
      condition: productConditionToDb(payload.condition),
      stock: Number(payload.stock || 1),
      lowStockThreshold: Number(payload.lowStockThreshold || 5),
      isStockTracked: payload.isStockTracked === undefined ? true : Boolean(payload.isStockTracked),
      allowBackorder: Boolean(payload.allowBackorder),
      listingExpiresAt: payload.listingExpiresAt ? new Date(payload.listingExpiresAt) : null,
      location: payload.location || null,
      status: isAdmin && statusFromPayload ? statusFromPayload : "pending",
      sellerId: seller?.id || null,
      createdById: user?.id || null,
      variants: Array.isArray(payload.variants) && payload.variants.length
        ? {
            create: payload.variants.slice(0, 20).map((variant) => ({
              name: String(variant.name || "Variant").trim(),
              sku: variant.sku ? String(variant.sku).trim() : null,
              priceAdjustment: Number(variant.priceAdjustment || 0),
              stock: Number(variant.stock || 0),
              attributes: variant.attributes || {},
              isActive: variant.isActive === undefined ? true : Boolean(variant.isActive),
            })),
          }
        : undefined,
      images: images.length
        ? {
            create: images.map((url, index) => ({
              url,
              alt: name,
              sortOrder: index,
            })),
          }
        : undefined,
    },
    include: productInclude,
  });

  if (!isAdmin) {
    await notifyAdmins({
      title: "Product waiting for approval",
      message: `${name} was submitted by ${user?.businessName || user?.name || "a seller"}.`,
      type: "approval",
      link: "/admin",
    });
  }

  return serializeProduct(product);
}

export async function updateProduct(id, payload) {
  try {
    const category = payload.category || payload.categoryName
      ? await findOrCreateCategory(payload.category || payload.categoryName, "product")
      : null;

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(payload.name !== undefined ? { name: String(payload.name) } : {}),
        ...(payload.description !== undefined ? { description: payload.description || null } : {}),
        ...(category ? { categoryId: category.id } : {}),
        ...(payload.type !== undefined ? { type: productTypeToDb(payload.type) } : {}),
        ...(payload.price !== undefined ? { price: Number(payload.price || 0) } : {}),
        ...(payload.sku !== undefined ? { sku: payload.sku ? String(payload.sku).trim() : null } : {}),
        ...(payload.brand !== undefined ? { brand: payload.brand ? String(payload.brand).trim() : null } : {}),
        ...(payload.model !== undefined ? { model: payload.model ? String(payload.model).trim() : null } : {}),
        ...(payload.condition !== undefined ? { condition: productConditionToDb(payload.condition) } : {}),
        ...(payload.stock !== undefined ? { stock: Number(payload.stock || 0) } : {}),
        ...(payload.lowStockThreshold !== undefined ? { lowStockThreshold: Number(payload.lowStockThreshold || 5) } : {}),
        ...(payload.isStockTracked !== undefined ? { isStockTracked: Boolean(payload.isStockTracked) } : {}),
        ...(payload.allowBackorder !== undefined ? { allowBackorder: Boolean(payload.allowBackorder) } : {}),
        ...(payload.listingExpiresAt !== undefined ? { listingExpiresAt: payload.listingExpiresAt ? new Date(payload.listingExpiresAt) : null } : {}),
        ...(payload.location !== undefined ? { location: payload.location || null } : {}),
        ...(approvalStatusToDb(payload.status) ? { status: approvalStatusToDb(payload.status) } : {}),
        ...(payload.isFeatured !== undefined ? { isFeatured: Boolean(payload.isFeatured) } : {}),
      },
      include: productInclude,
    });
    return serializeProduct(product);
  } catch (error) {
    if (error.code === "P2025") return null;
    throw error;
  }
}

export async function deleteProduct(id) {
  try {
    await prisma.product.delete({ where: { id } });
    return true;
  } catch (error) {
    if (error.code === "P2025") return false;
    throw error;
  }
}

export async function listServices(filters = {}) {
  const where = {};

  if (filters.status === "all") {
    // Admin/internal callers can request all statuses.
  } else if (filters.status) {
    const status = approvalStatusToDb(filters.status);
    if (status) where.status = status;
  } else {
    where.status = "approved";
  }

  if (filters.featured === "true") where.isFeatured = true;
  if (filters.category && filters.category !== "all") {
    where.category = { is: { OR: [{ slug: String(filters.category) }, { name: { equals: String(filters.category), mode: "insensitive" } }] } };
  }

  const minPrice = numericFilter(filters.minPrice);
  const maxPrice = numericFilter(filters.maxPrice);
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.priceFrom = {
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    };
  }

  const search = String(filters.q || filters.search || "").trim();
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { providerType: { contains: search, mode: "insensitive" } },
      { serviceArea: { contains: search, mode: "insensitive" } },
      { availabilityNote: { contains: search, mode: "insensitive" } },
      { category: { is: { name: { contains: search, mode: "insensitive" } } } },
    ];
  }

  const services = await prisma.service.findMany({
    where,
    include: serviceInclude,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: numericFilter(filters.limit) || 80,
  });
  return sortListings(services.map(serializeService), filters.sort);
}

export async function getService(id) {
  const service = await prisma.service.findUnique({
    where: { id },
    include: serviceInclude,
  });
  return serializeService(service);
}

export async function createService(payload, user = null) {
  const title = String(payload.title || "").trim();
  if (!title) throw new Error("Service title is required.");

  const category = await findOrCreateCategory(payload.category || payload.categoryName, "service");
  const provider = await getServiceProviderProfileForUser(user);
  const images = imagePayload(payload);
  const statusFromPayload = approvalStatusToDb(payload.status);
  const isAdmin = ["admin", "super_admin"].includes(user?.role);

  const service = await prisma.service.create({
    data: {
      title,
      slug: `${makeSlug(title)}-${Date.now()}`,
      description: payload.description || null,
      categoryId: category?.id || null,
      priceFrom: payload.priceFrom === undefined || payload.priceFrom === "" ? null : Number(payload.priceFrom),
      serviceArea: payload.serviceArea || null,
      availabilityNote: payload.availabilityNote || null,
      estimatedDuration: payload.estimatedDuration || null,
      minNoticeHours: Number(payload.minNoticeHours || 0),
      bookingMode: payload.bookingMode || "quote_only",
      serviceTags: Array.isArray(payload.serviceTags) ? payload.serviceTags.map(String).slice(0, 20) : String(payload.serviceTags || "").split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 20),
      status: isAdmin && statusFromPayload ? statusFromPayload : "pending",
      providerId: provider?.id || null,
      providerType: payload.providerType || user?.businessName || user?.name || null,
      createdById: user?.id || null,
      images: images.length
        ? {
            create: images.map((url, index) => ({
              url,
              alt: title,
              sortOrder: index,
            })),
          }
        : undefined,
    },
    include: serviceInclude,
  });

  if (!isAdmin) {
    await notifyAdmins({
      title: "Service waiting for approval",
      message: `${title} was submitted by ${user?.businessName || user?.name || "a provider"}.`,
      type: "approval",
      link: "/admin",
    });
  }

  return serializeService(service);
}

export async function updateService(id, payload) {
  try {
    const category = payload.category || payload.categoryName
      ? await findOrCreateCategory(payload.category || payload.categoryName, "service")
      : null;

    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(payload.title !== undefined ? { title: String(payload.title) } : {}),
        ...(payload.description !== undefined ? { description: payload.description || null } : {}),
        ...(category ? { categoryId: category.id } : {}),
        ...(payload.priceFrom !== undefined ? { priceFrom: payload.priceFrom === "" ? null : Number(payload.priceFrom) } : {}),
        ...(payload.serviceArea !== undefined ? { serviceArea: payload.serviceArea || null } : {}),
        ...(payload.availabilityNote !== undefined ? { availabilityNote: payload.availabilityNote || null } : {}),
        ...(payload.estimatedDuration !== undefined ? { estimatedDuration: payload.estimatedDuration || null } : {}),
        ...(payload.minNoticeHours !== undefined ? { minNoticeHours: Number(payload.minNoticeHours || 0) } : {}),
        ...(payload.bookingMode !== undefined ? { bookingMode: payload.bookingMode || "quote_only" } : {}),
        ...(payload.serviceTags !== undefined ? { serviceTags: Array.isArray(payload.serviceTags) ? payload.serviceTags.map(String).slice(0, 20) : String(payload.serviceTags || "").split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 20) } : {}),
        ...(payload.providerType !== undefined ? { providerType: payload.providerType || null } : {}),
        ...(approvalStatusToDb(payload.status) ? { status: approvalStatusToDb(payload.status) } : {}),
        ...(payload.isFeatured !== undefined ? { isFeatured: Boolean(payload.isFeatured) } : {}),
      },
      include: serviceInclude,
    });
    return serializeService(service);
  } catch (error) {
    if (error.code === "P2025") return null;
    throw error;
  }
}

export async function listRequests(filters = {}) {
  const where = {};
  if (filters.status && filters.status !== "all") {
    const status = requestStatusToDb(filters.status);
    if (status) where.status = status;
  }
  const requests = await prisma.customRequest.findMany({ where, orderBy: { createdAt: "desc" } });
  return requests.map(serializeRequest);
}


export async function listMyRequests(user) {
  if (!user?.id) return [];

  const contactMatches = [];
  if (user.email) contactMatches.push({ email: user.email });
  if (user.phone) contactMatches.push({ phone: user.phone });

  const requests = await prisma.customRequest.findMany({
    where: {
      OR: [
        { userId: user.id },
        ...contactMatches,
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return requests.map(serializeRequest);
}

function customerRequestActionToDb(action) {
  const normalized = String(action || "").toLowerCase();
  const allowed = ["accepted", "cancelled"];
  return allowed.includes(normalized) ? normalized : undefined;
}

export async function updateMyRequest(id, payload, user) {
  if (!user?.id) return null;

  const contactMatches = [];
  if (user.email) contactMatches.push({ email: user.email });
  if (user.phone) contactMatches.push({ phone: user.phone });

  const existing = await prisma.customRequest.findFirst({
    where: {
      id,
      OR: [
        { userId: user.id },
        ...contactMatches,
      ],
    },
  });

  if (!existing) return null;

  const status = customerRequestActionToDb(payload.status || payload.action);
  if (!status) throw new Error("Customer can only accept or cancel a request.");

  if (status === "accepted" && existing.status !== "quoted") {
    throw new Error("Only quoted requests can be accepted.");
  }

  if (status === "cancelled" && ["completed", "cancelled"].includes(existing.status)) {
    throw new Error("This request cannot be cancelled now.");
  }

  const request = await prisma.customRequest.update({
    where: { id },
    data: { status },
  });

  return serializeRequest(request);
}

export async function createRequest(payload, user = null) {
  const request = await prisma.customRequest.create({
    data: {
      userId: user?.id || null,
      name: String(payload.name || "").trim(),
      phone: String(payload.phone || "").trim(),
      email: payload.email || null,
      requestType: payload.requestType || payload.type || null,
      budget: payload.budget === undefined || payload.budget === "" ? null : Number(payload.budget),
      location: payload.location || null,
      message: String(payload.message || "").trim(),
      status: "new",
    },
  });

  await notifyAdmins({
    title: "New custom request",
    message: `${request.name} requested ${request.requestType || "custom help"}.`,
    type: "request",
    link: "/admin",
  });

  const customerMessage = "Your request was submitted to SmartSell. Admin will review it and contact you with the next update or quotation.";
  if (user?.id) {
    await createNotification({
      userId: user.id,
      title: "Request submitted",
      message: customerMessage,
      type: "request",
      link: "/my-requests",
    });
  } else {
    deliverExternalNotification({
      email: request.email,
      phone: request.phone,
      title: "SmartSell request submitted",
      message: customerMessage,
      link: "/request-anything",
    }).catch((error) => console.error("Guest request notification failed:", error.message));
  }

  return serializeRequest(request);
}


export async function createServiceQuoteRequest(serviceId, payload, user = null) {
  const service = await prisma.service.findFirst({
    where: { id: String(serviceId), status: "approved" },
    include: {
      category: true,
      provider: { include: { user: true } },
      createdBy: true,
      images: { orderBy: { sortOrder: "asc" } },
      reviews: { where: { status: "approved" }, select: { rating: true, status: true } },
    },
  });

  if (!service) return null;

  const customerName = String(payload.name || user?.name || "").trim();
  const customerPhone = String(payload.phone || user?.phone || "").trim();
  const customerEmail = String(payload.email || user?.email || "").trim();
  const message = String(payload.message || payload.details || "").trim();

  if (!customerName || !customerPhone || !message) {
    throw new Error("Name, phone, and service requirement details are required.");
  }

  const preferredDate = String(payload.preferredDate || "").trim();
  const preferredTime = String(payload.preferredTime || "").trim();
  const budget = payload.budget === undefined || payload.budget === "" ? null : Number(payload.budget);
  const providerName = service.provider?.businessName || service.providerType || service.createdBy?.businessName || service.createdBy?.name || "SmartSell provider";

  const structuredMessage = [
    `Service quote request for: ${service.title}`,
    service.category?.name ? `Category: ${service.category.name}` : null,
    providerName ? `Preferred provider: ${providerName}` : null,
    preferredDate ? `Preferred date: ${preferredDate}` : null,
    preferredTime ? `Preferred time: ${preferredTime}` : null,
    payload.location ? `Location: ${payload.location}` : null,
    budget !== null ? `Customer budget: Rs. ${budget}` : null,
    "",
    "Customer requirement:",
    message,
  ].filter((line) => line !== null).join("\n");

  const request = await prisma.customRequest.create({
    data: {
      userId: user?.id || null,
      name: customerName,
      phone: customerPhone,
      email: customerEmail || null,
      requestType: "service_quote",
      budget,
      location: payload.location || null,
      message: structuredMessage,
      assignedTo: providerName,
      status: "new",
      adminNote: `Linked service: ${service.title}`,
    },
  });

  await notifyAdmins({
    title: "New service quote request",
    message: `${customerName} requested a quote for ${service.title}.`,
    type: "request",
    link: "/admin",
  });

  if (service.provider?.userId) {
    await createNotification({
      userId: service.provider.userId,
      title: "New quote interest",
      message: `${customerName} requested a quotation for your service: ${service.title}.`,
      type: "request",
      link: "/business",
    });
  }

  if (user?.id) {
    await createNotification({
      userId: user.id,
      title: "Service quote request submitted",
      message: `Your quotation request for ${service.title} was submitted to SmartSell.`,
      type: "request",
      link: "/my-requests",
    });
  } else {
    deliverExternalNotification({
      email: customerEmail,
      phone: customerPhone,
      title: "SmartSell service quote submitted",
      message: `Your quotation request for ${service.title} was submitted to SmartSell.`,
      link: "/services",
    }).catch((error) => console.error("Guest service quote notification failed:", error.message));
  }

  return { request: serializeRequest(request), service: serializeService(service) };
}

export async function updateRequest(id, payload) {
  try {
    const request = await prisma.customRequest.update({
      where: { id },
      data: {
        ...(requestStatusToDb(payload.status) ? { status: requestStatusToDb(payload.status) } : {}),
        ...(payload.quotation !== undefined ? { quotation: payload.quotation === "" ? null : Number(payload.quotation) } : {}),
        ...(payload.assignedTo !== undefined ? { assignedTo: payload.assignedTo || null } : {}),
        ...(payload.adminNote !== undefined ? { adminNote: payload.adminNote || null } : {}),
      },
    });
    return serializeRequest(request);
  } catch (error) {
    if (error.code === "P2025") return null;
    throw error;
  }
}

export async function listSellers(filters = {}) {
  const where = {};
  if (filters.status && filters.status !== "all") {
    const status = approvalStatusToDb(filters.status);
    if (status) where.status = status;
  }

  const sellers = await prisma.sellerProfile.findMany({
    where,
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
  return sellers.map(serializeSeller);
}

export async function createSeller(payload) {
  const seller = await prisma.sellerProfile.create({
    data: {
      sellerType: payload.sellerType === "shop" || payload.sellerType === "shop_seller" ? "shop_seller" : "individual_seller",
      businessName: payload.businessName || payload.name || null,
      phone: payload.phone || null,
      location: payload.location || null,
      status: "pending",
    },
    include: { user: true },
  });
  return serializeSeller(seller);
}

export async function updateSeller(id, payload) {
  try {
    const status = approvalStatusToDb(payload.status);
    const seller = await prisma.$transaction(async (tx) => {
      const updatedSeller = await tx.sellerProfile.update({
        where: { id },
        data: {
          ...(payload.businessName !== undefined ? { businessName: payload.businessName || null } : {}),
          ...(payload.phone !== undefined ? { phone: payload.phone || null } : {}),
          ...(payload.location !== undefined ? { location: payload.location || null } : {}),
          ...(status ? { status } : {}),
        },
        include: { user: true },
      });

      if (updatedSeller.userId && status) {
        await tx.user.update({
          where: { id: updatedSeller.userId },
          data: { status: status === "approved" ? "active" : status === "rejected" ? "blocked" : "pending_approval" },
        });

        if (updatedSeller.sellerType === "service_provider") {
          await tx.serviceProviderProfile.updateMany({
            where: { userId: updatedSeller.userId },
            data: { status },
          });
        }
      }

      return updatedSeller;
    });

    return serializeSeller(seller);
  } catch (error) {
    if (error.code === "P2025") return null;
    throw error;
  }
}
