import { prisma } from "../config/prisma.js";

function toNumber(value) {
  if (value === null || value === undefined) return value;
  return Number(value);
}

function canManageBusiness(user) {
  return ["seller", "shop", "service_provider", "admin", "super_admin"].includes(user?.role);
}

function isAdmin(user) {
  return ["admin", "super_admin"].includes(user?.role);
}

function approvalStatusToDb(status) {
  const normalized = String(status || "");
  const allowed = ["draft", "pending", "approved", "rejected", "archived"];
  return allowed.includes(normalized) ? normalized : undefined;
}

function ownerListingStatus(status) {
  const normalized = approvalStatusToDb(status);
  return ["draft", "pending", "archived"].includes(normalized) ? normalized : undefined;
}

function productConditionToDb(condition) {
  const normalized = String(condition || "").replaceAll("-", "_");
  const allowed = ["new", "like_new", "good", "used", "needs_repair"];
  return allowed.includes(normalized) ? normalized : undefined;
}

function normalizeMoney(value) {
  if (value === "" || value === null || value === undefined) return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function normalizeStock(value) {
  if (value === "" || value === null || value === undefined) return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : undefined;
}

function serializeProduct(product) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category?.name || null,
    type: product.type,
    price: toNumber(product.price),
    condition: product.condition,
    stock: product.stock,
    location: product.location,
    status: product.status,
    image: product.images?.[0]?.url || null,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function serializeService(service) {
  return {
    id: service.id,
    title: service.title,
    description: service.description,
    category: service.category?.name || null,
    priceFrom: toNumber(service.priceFrom),
    providerType: service.providerType,
    status: service.status,
    image: service.images?.[0]?.url || null,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
}

function serializeSellerOrder(item) {
  return {
    id: item.id,
    orderId: item.orderId,
    orderNo: item.order.orderNo,
    status: item.order.status,
    paymentStatus: item.order.paymentStatus,
    quantity: item.quantity,
    price: toNumber(item.price),
    lineTotal: toNumber(item.price) * item.quantity,
    productName: item.name,
    productId: item.productId,
    customer: item.order.customer
      ? {
          name: item.order.customer.name,
          email: item.order.customer.email,
          phone: item.order.customer.phone,
        }
      : null,
    deliveryName: item.order.deliveryName,
    deliveryPhone: item.order.deliveryPhone,
    deliveryAddress: item.order.deliveryAddress,
    createdAt: item.order.createdAt,
  };
}

function serializeRequest(request) {
  return {
    id: request.id,
    name: request.name,
    phone: request.phone,
    email: request.email,
    requestType: request.requestType,
    budget: toNumber(request.budget),
    quotation: toNumber(request.quotation),
    location: request.location,
    message: request.message,
    status: request.status,
    assignedTo: request.assignedTo,
    adminNote: request.adminNote,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

function productOwnerWhere(user) {
  if (isAdmin(user)) return {};
  return {
    OR: [
      { createdById: user.id },
      { seller: { userId: user.id } },
    ],
  };
}

function serviceOwnerWhere(user) {
  if (isAdmin(user)) return {};
  return {
    OR: [
      { createdById: user.id },
      { provider: { userId: user.id } },
    ],
  };
}

async function getSellerProfile(user) {
  if (!user?.id) return null;
  return prisma.sellerProfile.findUnique({ where: { userId: user.id } });
}

async function getServiceProviderProfile(user) {
  if (!user?.id) return null;
  return prisma.serviceProviderProfile.findUnique({ where: { userId: user.id } });
}

function summarizeStatuses(items) {
  return items.reduce(
    (summary, item) => {
      summary.total += 1;
      summary[item.status] = (summary[item.status] || 0) + 1;
      return summary;
    },
    { total: 0, pending: 0, approved: 0, rejected: 0, archived: 0 }
  );
}


function requestAssigneeValues(user, sellerProfile = null, serviceProviderProfile = null) {
  return [
    user?.id,
    user?.name,
    user?.email,
    user?.businessName,
    sellerProfile?.businessName,
    sellerProfile?.shopName,
    serviceProviderProfile?.businessName,
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function requestStatusToDb(status) {
  const normalized = String(status || "");
  const allowed = ["accepted", "in_progress", "completed", "cancelled"];
  return allowed.includes(normalized) ? normalized : undefined;
}

const BUSINESS_REQUEST_TRANSITIONS = {
  new: ["accepted", "cancelled"],
  pending: ["accepted", "cancelled"],
  quoted: ["accepted", "cancelled"],
  accepted: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

function assertBusinessRequestTransition(currentStatus, nextStatus, user) {
  if (isAdmin(user)) return;
  if (currentStatus === nextStatus) {
    throw Object.assign(new Error(`Request is already ${String(nextStatus).replaceAll("_", " ")}.`), { statusCode: 409 });
  }
  const allowed = BUSINESS_REQUEST_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw Object.assign(
      new Error(`Request cannot move from ${String(currentStatus).replaceAll("_", " ")} to ${String(nextStatus).replaceAll("_", " ")}.`),
      { statusCode: 409 }
    );
  }
}

export async function getBusinessOverview(user) {
  if (!canManageBusiness(user)) {
    throw Object.assign(new Error("Business dashboard is available only for sellers, shops, service providers, and admins."), { statusCode: 403 });
  }

  const [sellerProfile, serviceProviderProfile] = await Promise.all([
    getSellerProfile(user),
    getServiceProviderProfile(user),
  ]);

  const [products, services, sellerOrderItems, assignedRequests] = await Promise.all([
    prisma.product.findMany({
      where: productOwnerWhere(user),
      include: { category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.service.findMany({
      where: serviceOwnerWhere(user),
      include: { category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.orderItem.findMany({
      where: isAdmin(user)
        ? {}
        : {
            product: { is: productOwnerWhere(user) },
          },
      include: {
        product: true,
        order: { include: { customer: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.customRequest.findMany({
      where: isAdmin(user)
        ? {}
        : {
            assignedTo: { in: requestAssigneeValues(user, sellerProfile, serviceProviderProfile) },
          },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const serializedProducts = products.map(serializeProduct);
  const serializedServices = services.map(serializeService);
  const serializedOrders = sellerOrderItems.map(serializeSellerOrder);
  const serializedRequests = assignedRequests.map(serializeRequest);

  const totalRevenue = serializedOrders.reduce((sum, item) => {
    if (["cancelled"].includes(item.status)) return sum;
    return sum + item.lineTotal;
  }, 0);

  return {
    profile: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        businessName: user.businessName,
      },
      sellerProfile: sellerProfile
        ? {
            id: sellerProfile.id,
            sellerType: sellerProfile.sellerType,
            businessName: sellerProfile.businessName,
            shopName: sellerProfile.shopName,
            phone: sellerProfile.phone,
            location: sellerProfile.location,
            status: sellerProfile.status,
          }
        : null,
      serviceProviderProfile: serviceProviderProfile
        ? {
            id: serviceProviderProfile.id,
            businessName: serviceProviderProfile.businessName,
            phone: serviceProviderProfile.phone,
            location: serviceProviderProfile.location,
            status: serviceProviderProfile.status,
          }
        : null,
    },
    stats: {
      products: summarizeStatuses(serializedProducts),
      services: summarizeStatuses(serializedServices),
      orders: {
        total: serializedOrders.length,
        pending: serializedOrders.filter((item) => item.status === "pending").length,
        processing: serializedOrders.filter((item) => item.status === "processing").length,
        delivered: serializedOrders.filter((item) => item.status === "delivered").length,
        totalRevenue,
      },
      requests: {
        total: serializedRequests.length,
        new: serializedRequests.filter((item) => item.status === "new").length,
        quoted: serializedRequests.filter((item) => item.status === "quoted").length,
        inProgress: serializedRequests.filter((item) => item.status === "in_progress").length,
        completed: serializedRequests.filter((item) => item.status === "completed").length,
      },
    },
    products: serializedProducts,
    services: serializedServices,
    orders: serializedOrders,
    assignedRequests: serializedRequests,
  };
}

async function findOwnedProduct(id, user) {
  return prisma.product.findFirst({
    where: { id, ...productOwnerWhere(user) },
    include: { category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });
}

async function findOwnedService(id, user) {
  return prisma.service.findFirst({
    where: { id, ...serviceOwnerWhere(user) },
    include: { category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });
}

export async function updateOwnProduct(productId, payload, user) {
  const product = await findOwnedProduct(productId, user);
  if (!product) return null;

  const nextStatus = isAdmin(user) ? approvalStatusToDb(payload.status) : ownerListingStatus(payload.status);
  const price = normalizeMoney(payload.price);
  const stock = normalizeStock(payload.stock);
  const condition = productConditionToDb(payload.condition);

  const data = {
    ...(payload.name !== undefined ? { name: String(payload.name).trim() || product.name } : {}),
    ...(payload.description !== undefined ? { description: String(payload.description || "").trim() || null } : {}),
    ...(payload.location !== undefined ? { location: String(payload.location || "").trim() || null } : {}),
    ...(price !== undefined ? { price } : {}),
    ...(stock !== undefined ? { stock } : {}),
    ...(condition ? { condition } : {}),
  };

  if (nextStatus) {
    data.status = nextStatus;
  } else if (!isAdmin(user) && ["approved", "rejected"].includes(product.status)) {
    // When a seller edits an approved/rejected listing, send it back to admin review.
    data.status = "pending";
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data,
    include: { category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });

  return serializeProduct(updated);
}

export async function updateOwnService(serviceId, payload, user) {
  const service = await findOwnedService(serviceId, user);
  if (!service) return null;

  const nextStatus = isAdmin(user) ? approvalStatusToDb(payload.status) : ownerListingStatus(payload.status);
  const priceFrom = normalizeMoney(payload.priceFrom);

  const data = {
    ...(payload.title !== undefined ? { title: String(payload.title).trim() || service.title } : {}),
    ...(payload.description !== undefined ? { description: String(payload.description || "").trim() || null } : {}),
    ...(payload.providerType !== undefined ? { providerType: String(payload.providerType || "").trim() || null } : {}),
    ...(priceFrom !== undefined ? { priceFrom } : {}),
  };

  if (nextStatus) {
    data.status = nextStatus;
  } else if (!isAdmin(user) && ["approved", "rejected"].includes(service.status)) {
    data.status = "pending";
  }

  const updated = await prisma.service.update({
    where: { id: serviceId },
    data,
    include: { category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });

  return serializeService(updated);
}


export async function updateAssignedRequestStatus(requestId, payload, user) {
  if (!canManageBusiness(user)) {
    throw Object.assign(new Error("You do not have permission to update assigned requests."), { statusCode: 403 });
  }

  const status = requestStatusToDb(payload.status);
  if (!status) {
    throw Object.assign(new Error("Invalid request status for business dashboard."), { statusCode: 400 });
  }

  const [sellerProfile, serviceProviderProfile] = await Promise.all([
    getSellerProfile(user),
    getServiceProviderProfile(user),
  ]);

  const where = isAdmin(user)
    ? { id: requestId }
    : {
        id: requestId,
        assignedTo: { in: requestAssigneeValues(user, sellerProfile, serviceProviderProfile) },
      };

  const existing = await prisma.customRequest.findFirst({ where });
  if (!existing) return null;

  assertBusinessRequestTransition(existing.status, status, user);

  const request = await prisma.customRequest.update({
    where: { id: requestId },
    data: {
      status,
      ...(payload.providerNote !== undefined
        ? {
            adminNote: existing.adminNote
              ? `${existing.adminNote}\nProvider note: ${String(payload.providerNote || "").trim()}`
              : `Provider note: ${String(payload.providerNote || "").trim()}`,
          }
        : {}),
    },
  });

  return serializeRequest(request);
}
