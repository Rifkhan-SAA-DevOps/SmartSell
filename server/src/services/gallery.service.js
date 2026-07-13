import { prisma } from "../config/prisma.js";

function isAdmin(user) {
  return ["admin", "super_admin"].includes(user?.role);
}

function isProductBusinessRole(user) {
  return ["seller", "shop", "shop_seller"].includes(user?.role);
}

function isServiceBusinessRole(user) {
  return user?.role === "service_provider";
}

function cleanText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function canManageProduct(user, product) {
  if (!user || !product) return false;
  if (isAdmin(user)) return true;
  if (!isProductBusinessRole(user)) return false;
  return product.createdById === user.id || product.seller?.userId === user.id;
}

function canManageService(user, service) {
  if (!user || !service) return false;
  if (isAdmin(user)) return true;
  if (!isServiceBusinessRole(user)) return false;
  return service.createdById === user.id || service.provider?.userId === user.id;
}

function imageOrder(a, b) {
  return Number(a.sortOrder || 0) - Number(b.sortOrder || 0) || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

function serializeImage(image) {
  return {
    id: image.id,
    url: image.url,
    alt: image.alt || "",
    sortOrder: Number(image.sortOrder || 0),
    isPrimary: Number(image.sortOrder || 0) === 0,
    createdAt: image.createdAt,
  };
}

function serializeProductGallery(product) {
  const images = [...(product.images || [])].sort(imageOrder).map(serializeImage);
  return {
    id: product.id,
    name: product.name,
    type: "product",
    status: product.status,
    price: product.price === null || product.price === undefined ? null : Number(product.price),
    stock: product.stock,
    category: product.category?.name || "Uncategorized",
    owner: product.seller?.businessName || product.seller?.shopName || product.createdBy?.businessName || product.createdBy?.name || "SmartSell",
    primaryImage: images[0]?.url || null,
    imageCount: images.length,
    images,
    updatedAt: product.updatedAt,
  };
}

function serializeServiceGallery(service) {
  const images = [...(service.images || [])].sort(imageOrder).map(serializeImage);
  return {
    id: service.id,
    title: service.title,
    name: service.title,
    type: "service",
    status: service.status,
    priceFrom: service.priceFrom === null || service.priceFrom === undefined ? null : Number(service.priceFrom),
    category: service.category?.name || "Uncategorized",
    owner: service.provider?.businessName || service.createdBy?.businessName || service.createdBy?.name || "Service provider",
    primaryImage: images[0]?.url || null,
    imageCount: images.length,
    images,
    updatedAt: service.updatedAt,
  };
}

function productInclude() {
  return {
    category: true,
    seller: true,
    createdBy: true,
    images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
  };
}

function serviceInclude() {
  return {
    category: true,
    provider: true,
    createdBy: true,
    images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
  };
}

function productWhereForUser(user) {
  if (isAdmin(user)) return {};
  return {
    OR: [
      { createdById: user.id },
      { seller: { is: { userId: user.id } } },
    ],
  };
}

function serviceWhereForUser(user) {
  if (isAdmin(user)) return {};
  return {
    OR: [
      { createdById: user.id },
      { provider: { is: { userId: user.id } } },
    ],
  };
}

function applyProductSearch(where, search) {
  const q = cleanText(search);
  if (!q) return where;
  return {
    AND: [
      where,
      {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
          { brand: { contains: q, mode: "insensitive" } },
          { category: { is: { name: { contains: q, mode: "insensitive" } } } },
        ],
      },
    ],
  };
}

function applyServiceSearch(where, search) {
  const q = cleanText(search);
  if (!q) return where;
  return {
    AND: [
      where,
      {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { serviceArea: { contains: q, mode: "insensitive" } },
          { category: { is: { name: { contains: q, mode: "insensitive" } } } },
        ],
      },
    ],
  };
}

export async function listGalleryProducts(user, filters = {}) {
  const where = applyProductSearch(productWhereForUser(user), filters.q || filters.search);
  const items = await prisma.product.findMany({
    where,
    include: productInclude(),
    orderBy: [{ updatedAt: "desc" }],
    take: Math.min(Number(filters.limit || 120), 250),
  });
  return items.map(serializeProductGallery);
}

export async function listGalleryServices(user, filters = {}) {
  const where = applyServiceSearch(serviceWhereForUser(user), filters.q || filters.search);
  const items = await prisma.service.findMany({
    where,
    include: serviceInclude(),
    orderBy: [{ updatedAt: "desc" }],
    take: Math.min(Number(filters.limit || 120), 250),
  });
  return items.map(serializeServiceGallery);
}

async function getProductForGallery(productId, user) {
  const product = await prisma.product.findUnique({ where: { id: productId }, include: productInclude() });
  if (!product) return null;
  if (!canManageProduct(user, product)) {
    const error = new Error("You do not have permission to manage this product gallery.");
    error.statusCode = 403;
    throw error;
  }
  return product;
}

async function getServiceForGallery(serviceId, user) {
  const service = await prisma.service.findUnique({ where: { id: serviceId }, include: serviceInclude() });
  if (!service) return null;
  if (!canManageService(user, service)) {
    const error = new Error("You do not have permission to manage this service gallery.");
    error.statusCode = 403;
    throw error;
  }
  return service;
}

async function nextProductSortOrder(productId) {
  const last = await prisma.productImage.findFirst({ where: { productId }, orderBy: { sortOrder: "desc" } });
  return Number(last?.sortOrder ?? -1) + 1;
}

async function nextServiceSortOrder(serviceId) {
  const last = await prisma.serviceImage.findFirst({ where: { serviceId }, orderBy: { sortOrder: "desc" } });
  return Number(last?.sortOrder ?? -1) + 1;
}

export async function getProductGallery(productId, user) {
  const product = await getProductForGallery(productId, user);
  return product ? serializeProductGallery(product) : null;
}

export async function getServiceGallery(serviceId, user) {
  const service = await getServiceForGallery(serviceId, user);
  return service ? serializeServiceGallery(service) : null;
}

export async function addProductImage(productId, payload, user) {
  await getProductForGallery(productId, user);
  const url = cleanText(payload.url);
  if (!url) {
    const error = new Error("Image URL is required.");
    error.statusCode = 400;
    throw error;
  }

  await prisma.productImage.create({
    data: {
      productId,
      url,
      alt: cleanText(payload.alt),
      sortOrder: payload.sortOrder === undefined ? await nextProductSortOrder(productId) : Number(payload.sortOrder || 0),
    },
  });

  return getProductGallery(productId, user);
}

export async function addServiceImage(serviceId, payload, user) {
  await getServiceForGallery(serviceId, user);
  const url = cleanText(payload.url);
  if (!url) {
    const error = new Error("Image URL is required.");
    error.statusCode = 400;
    throw error;
  }

  await prisma.serviceImage.create({
    data: {
      serviceId,
      url,
      alt: cleanText(payload.alt),
      sortOrder: payload.sortOrder === undefined ? await nextServiceSortOrder(serviceId) : Number(payload.sortOrder || 0),
    },
  });

  return getServiceGallery(serviceId, user);
}

export async function updateProductImage(productId, imageId, payload, user) {
  await getProductForGallery(productId, user);
  const image = await prisma.productImage.findFirst({ where: { id: imageId, productId } });
  if (!image) return null;

  await prisma.productImage.update({
    where: { id: imageId },
    data: {
      ...(payload.url !== undefined ? { url: cleanText(payload.url, image.url) } : {}),
      ...(payload.alt !== undefined ? { alt: cleanText(payload.alt) } : {}),
      ...(payload.sortOrder !== undefined ? { sortOrder: Number(payload.sortOrder || 0) } : {}),
    },
  });

  return getProductGallery(productId, user);
}

export async function updateServiceImage(serviceId, imageId, payload, user) {
  await getServiceForGallery(serviceId, user);
  const image = await prisma.serviceImage.findFirst({ where: { id: imageId, serviceId } });
  if (!image) return null;

  await prisma.serviceImage.update({
    where: { id: imageId },
    data: {
      ...(payload.url !== undefined ? { url: cleanText(payload.url, image.url) } : {}),
      ...(payload.alt !== undefined ? { alt: cleanText(payload.alt) } : {}),
      ...(payload.sortOrder !== undefined ? { sortOrder: Number(payload.sortOrder || 0) } : {}),
    },
  });

  return getServiceGallery(serviceId, user);
}

export async function deleteProductImage(productId, imageId, user) {
  await getProductForGallery(productId, user);
  const image = await prisma.productImage.findFirst({ where: { id: imageId, productId } });
  if (!image) return null;
  await prisma.productImage.delete({ where: { id: imageId } });
  await normalizeProductImageOrder(productId);
  return getProductGallery(productId, user);
}

export async function deleteServiceImage(serviceId, imageId, user) {
  await getServiceForGallery(serviceId, user);
  const image = await prisma.serviceImage.findFirst({ where: { id: imageId, serviceId } });
  if (!image) return null;
  await prisma.serviceImage.delete({ where: { id: imageId } });
  await normalizeServiceImageOrder(serviceId);
  return getServiceGallery(serviceId, user);
}

async function normalizeProductImageOrder(productId) {
  const images = await prisma.productImage.findMany({ where: { productId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  await prisma.$transaction(images.map((image, index) => prisma.productImage.update({ where: { id: image.id }, data: { sortOrder: index } })));
}

async function normalizeServiceImageOrder(serviceId) {
  const images = await prisma.serviceImage.findMany({ where: { serviceId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  await prisma.$transaction(images.map((image, index) => prisma.serviceImage.update({ where: { id: image.id }, data: { sortOrder: index } })));
}

export async function setPrimaryProductImage(productId, imageId, user) {
  await getProductForGallery(productId, user);
  const images = await prisma.productImage.findMany({ where: { productId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  if (!images.some((image) => image.id === imageId)) return null;
  const reordered = [images.find((image) => image.id === imageId), ...images.filter((image) => image.id !== imageId)].filter(Boolean);
  await prisma.$transaction(reordered.map((image, index) => prisma.productImage.update({ where: { id: image.id }, data: { sortOrder: index } })));
  return getProductGallery(productId, user);
}

export async function setPrimaryServiceImage(serviceId, imageId, user) {
  await getServiceForGallery(serviceId, user);
  const images = await prisma.serviceImage.findMany({ where: { serviceId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  if (!images.some((image) => image.id === imageId)) return null;
  const reordered = [images.find((image) => image.id === imageId), ...images.filter((image) => image.id !== imageId)].filter(Boolean);
  await prisma.$transaction(reordered.map((image, index) => prisma.serviceImage.update({ where: { id: image.id }, data: { sortOrder: index } })));
  return getServiceGallery(serviceId, user);
}

export async function reorderProductImages(productId, payload, user) {
  await getProductForGallery(productId, user);
  const order = Array.isArray(payload.images) ? payload.images : [];
  if (!order.length) return getProductGallery(productId, user);
  const updates = order
    .filter((item) => item?.id)
    .map((item, index) => prisma.productImage.updateMany({ where: { id: item.id, productId }, data: { sortOrder: Number(item.sortOrder ?? index) } }));
  await prisma.$transaction(updates);
  await normalizeProductImageOrder(productId);
  return getProductGallery(productId, user);
}

export async function reorderServiceImages(serviceId, payload, user) {
  await getServiceForGallery(serviceId, user);
  const order = Array.isArray(payload.images) ? payload.images : [];
  if (!order.length) return getServiceGallery(serviceId, user);
  const updates = order
    .filter((item) => item?.id)
    .map((item, index) => prisma.serviceImage.updateMany({ where: { id: item.id, serviceId }, data: { sortOrder: Number(item.sortOrder ?? index) } }));
  await prisma.$transaction(updates);
  await normalizeServiceImageOrder(serviceId);
  return getServiceGallery(serviceId, user);
}
