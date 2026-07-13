import { prisma } from "../config/prisma.js";
import { createNotification, notifyAdmins } from "./communication.service.js";

function toNumber(value) {
  if (value === null || value === undefined) return value;
  return Number(value);
}

function readableStatus(status) {
  return String(status || "pending").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function makeOfferNo() {
  return `OFF-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
}

function validStatus(status) {
  const normalized = String(status || "").toLowerCase();
  const allowed = ["pending", "accepted", "rejected", "countered", "cancelled", "expired"];
  return allowed.includes(normalized) ? normalized : undefined;
}

function isAdmin(user) {
  return ["admin", "super_admin"].includes(user?.role);
}

function isBusiness(user) {
  return ["seller", "shop", "service_provider", "admin", "super_admin"].includes(user?.role);
}

const offerInclude = {
  buyer: { select: { id: true, name: true, email: true, phone: true, role: true } },
  seller: { select: { id: true, name: true, email: true, phone: true, role: true, businessName: true } },
  product: {
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      createdBy: { select: { id: true, name: true, email: true, phone: true, businessName: true } },
      seller: { include: { user: { select: { id: true, name: true, email: true, phone: true, businessName: true } } } },
    },
  },
};

function serializeOffer(offer) {
  if (!offer) return null;
  const image = offer.product?.images?.[0]?.url || null;
  const sellerUser = offer.seller || offer.product?.seller?.user || offer.product?.createdBy || null;

  return {
    id: offer.id,
    offerNo: offer.offerNo,
    productId: offer.productId,
    buyerId: offer.buyerId,
    sellerId: offer.sellerId,
    customerName: offer.customerName,
    customerPhone: offer.customerPhone,
    customerEmail: offer.customerEmail,
    offeredAmount: toNumber(offer.offeredAmount),
    counterAmount: toNumber(offer.counterAmount),
    message: offer.message,
    sellerNote: offer.sellerNote,
    adminNote: offer.adminNote,
    status: offer.status,
    statusLabel: readableStatus(offer.status),
    expiresAt: offer.expiresAt,
    createdAt: offer.createdAt,
    updatedAt: offer.updatedAt,
    buyer: offer.buyer,
    seller: sellerUser,
    product: offer.product ? {
      id: offer.product.id,
      name: offer.product.name,
      price: toNumber(offer.product.price),
      type: offer.product.type,
      condition: offer.product.condition,
      location: offer.product.location,
      status: offer.product.status,
      image,
      category: offer.product.category?.name || null,
    } : null,
  };
}

export async function createProductOffer(productId, payload, user) {
  if (!user?.id) throw new Error("Login is required before making an offer.");

  const product = await prisma.product.findFirst({
    where: { id: String(productId), status: "approved" },
    include: {
      createdBy: true,
      seller: { include: { user: true } },
      images: true,
      category: true,
    },
  });

  if (!product) return null;

  const offerAmount = Number(payload.offeredAmount || payload.amount || 0);
  if (!Number.isFinite(offerAmount) || offerAmount <= 0) {
    throw new Error("Offer amount must be greater than zero.");
  }

  const customerName = String(payload.customerName || payload.name || user.name || "").trim();
  const customerPhone = String(payload.customerPhone || payload.phone || user.phone || "").trim();
  const customerEmail = String(payload.customerEmail || payload.email || user.email || "").trim();

  if (!customerName || !customerPhone) {
    throw new Error("Customer name and phone are required for an offer.");
  }

  const sellerId = product.createdById || product.seller?.userId || null;

  if (sellerId && sellerId === user.id) {
    throw new Error("You cannot make an offer on your own product.");
  }

  const offer = await prisma.productOffer.create({
    data: {
      offerNo: makeOfferNo(),
      productId: product.id,
      buyerId: user.id,
      sellerId,
      customerName,
      customerPhone,
      customerEmail: customerEmail || null,
      offeredAmount: offerAmount,
      message: payload.message || null,
      status: "pending",
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
    },
    include: offerInclude,
  });

  if (sellerId) {
    await createNotification({
      userId: sellerId,
      title: "New product offer",
      message: `${customerName} offered Rs. ${offerAmount.toLocaleString("en-LK")} for ${product.name}.`,
      type: "offer",
      link: "/offers",
    });
  }

  await createNotification({
    userId: user.id,
    title: "Offer submitted",
    message: `Your offer for ${product.name} was sent to the seller/admin for review.`,
    type: "offer",
    link: "/offers",
  });

  await notifyAdmins({
    title: "New product offer submitted",
    message: `${customerName} made an offer for ${product.name}.`,
    type: "offer",
    link: "/offers",
  });

  return serializeOffer(offer);
}

export async function listProductOffers(user, filters = {}) {
  if (!user?.id) return [];

  const where = {};
  if (filters.status && filters.status !== "all") {
    const status = validStatus(filters.status);
    if (status) where.status = status;
  }

  if (!isAdmin(user)) {
    if (isBusiness(user)) {
      where.OR = [{ sellerId: user.id }, { buyerId: user.id }];
    } else {
      where.buyerId = user.id;
    }
  }

  const search = String(filters.q || filters.search || "").trim();
  if (search) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { offerNo: { contains: search, mode: "insensitive" } },
          { customerName: { contains: search, mode: "insensitive" } },
          { customerPhone: { contains: search, mode: "insensitive" } },
          { product: { is: { name: { contains: search, mode: "insensitive" } } } },
        ],
      },
    ];
  }

  const offers = await prisma.productOffer.findMany({
    where,
    include: offerInclude,
    orderBy: { createdAt: "desc" },
    take: 150,
  });

  return offers.map(serializeOffer);
}

export async function updateProductOffer(offerId, payload, user) {
  if (!user?.id) throw new Error("Login is required.");

  const existing = await prisma.productOffer.findUnique({
    where: { id: String(offerId) },
    include: offerInclude,
  });

  if (!existing) return null;

  const userIsAdmin = isAdmin(user);
  const userIsSeller = existing.sellerId === user.id;
  const userIsBuyer = existing.buyerId === user.id;

  if (!userIsAdmin && !userIsSeller && !userIsBuyer) {
    throw new Error("You do not have permission to update this offer.");
  }

  const requestedStatus = validStatus(payload.status || payload.action);
  const data = {};

  if (requestedStatus) {
    if (userIsBuyer && !["cancelled"].includes(requestedStatus)) {
      throw new Error("Customer can only cancel their own offer.");
    }

    if ((userIsSeller || userIsAdmin) && !["accepted", "rejected", "countered", "pending", "expired"].includes(requestedStatus)) {
      throw new Error("Invalid offer status for seller/admin.");
    }

    data.status = requestedStatus;
  }

  if ((userIsSeller || userIsAdmin) && payload.counterAmount !== undefined) {
    data.counterAmount = payload.counterAmount === "" ? null : Number(payload.counterAmount);
    if (data.counterAmount !== null && (!Number.isFinite(Number(data.counterAmount)) || Number(data.counterAmount) <= 0)) {
      throw new Error("Counter offer amount must be greater than zero.");
    }
    if (!data.status && data.counterAmount) data.status = "countered";
  }

  if ((userIsSeller || userIsAdmin) && payload.sellerNote !== undefined) {
    data.sellerNote = payload.sellerNote || null;
  }

  if (userIsAdmin && payload.adminNote !== undefined) {
    data.adminNote = payload.adminNote || null;
  }

  if (!Object.keys(data).length) {
    throw new Error("Nothing to update.");
  }

  const updated = await prisma.productOffer.update({
    where: { id: existing.id },
    data,
    include: offerInclude,
  });

  const productName = updated.product?.name || "product";
  const statusText = readableStatus(updated.status).toLowerCase();

  if (updated.buyerId && (userIsSeller || userIsAdmin)) {
    await createNotification({
      userId: updated.buyerId,
      title: "Product offer updated",
      message: `Your offer for ${productName} was ${statusText}.`,
      type: "offer",
      link: "/offers",
    });
  }

  if (updated.sellerId && userIsBuyer) {
    await createNotification({
      userId: updated.sellerId,
      title: "Product offer cancelled",
      message: `${updated.customerName} cancelled an offer for ${productName}.`,
      type: "offer",
      link: "/offers",
    });
  }

  return serializeOffer(updated);
}
