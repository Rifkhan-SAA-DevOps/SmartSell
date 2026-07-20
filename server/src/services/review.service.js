import { prisma } from "../config/prisma.js";

function toNumber(value) {
  if (value === null || value === undefined) return value;
  return Number(value);
}

function normalizeRating(value) {
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be a whole number from 1 to 5.");
  }
  return rating;
}

function approvalStatusToDb(status) {
  const normalized = String(status || "");
  const allowed = ["pending", "approved", "rejected", "archived"];
  return allowed.includes(normalized) ? normalized : undefined;
}

export function serializeReview(review) {
  if (!review) return null;

  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    status: review.status,
    user: review.user
      ? {
          id: review.user.id,
          name: review.user.name,
          email: review.user.email,
        }
      : null,
    product: review.product
      ? {
          id: review.product.id,
          name: review.product.name,
          image: review.product.images?.[0]?.url || null,
        }
      : null,
    service: review.service
      ? {
          id: review.service.id,
          title: review.service.title,
          image: review.service.images?.[0]?.url || null,
        }
      : null,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

const reviewInclude = {
  user: true,
  product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
  service: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
};

export async function listPublicReviews(filters = {}) {
  const where = { status: "approved" };
  if (filters.productId) where.productId = String(filters.productId);
  if (filters.serviceId) where.serviceId = String(filters.serviceId);

  const reviews = await prisma.review.findMany({
    where,
    include: reviewInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return reviews.map(serializeReview);
}


export async function listBusinessReviews(user) {
  const isAdmin = ["admin", "super_admin"].includes(user?.role);
  const where = isAdmin
    ? {}
    : {
        OR: [
          {
            product: {
              is: {
                OR: [
                  { createdById: user.id },
                  { seller: { is: { userId: user.id } } },
                ],
              },
            },
          },
          {
            service: {
              is: {
                OR: [
                  { createdById: user.id },
                  { provider: { is: { userId: user.id } } },
                ],
              },
            },
          },
        ],
      };

  const reviews = await prisma.review.findMany({
    where,
    include: reviewInclude,
    orderBy: { createdAt: "desc" },
    take: 120,
  });

  return reviews.map(serializeReview);
}

export async function listMyReviews(user) {
  const reviews = await prisma.review.findMany({
    where: { userId: user.id },
    include: reviewInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return reviews.map(serializeReview);
}

export async function listAdminReviews() {
  const reviews = await prisma.review.findMany({
    where: { status: { in: ["pending", "rejected"] } },
    include: reviewInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return reviews.map(serializeReview);
}

async function customerHasDeliveredProduct(userId, productId) {
  const item = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        customerId: userId,
        status: "delivered",
      },
    },
    select: { id: true },
  });

  return Boolean(item);
}

export async function createReview(payload, user) {
  const productId = payload.productId ? String(payload.productId) : null;
  const serviceId = payload.serviceId ? String(payload.serviceId) : null;

  if (!productId && !serviceId) throw new Error("Product or service is required for a review.");
  if (productId && serviceId) throw new Error("Review only one product or one service at a time.");

  const rating = normalizeRating(payload.rating);
  const comment = String(payload.comment || "").trim();
  if (!comment) throw new Error("Review comment is required.");

  if (productId) {
    const product = await prisma.product.findFirst({ where: { id: productId, status: "approved" } });
    if (!product) throw new Error("Product was not found or is not approved yet.");

    const isAdmin = ["admin", "super_admin"].includes(user.role);
    const hasDeliveredProduct = await customerHasDeliveredProduct(user.id, productId);

    if (!isAdmin && !hasDeliveredProduct) {
      throw new Error("You can review this product after the order is marked delivered by admin.");
    }
  }

  if (serviceId) {
    const service = await prisma.service.findFirst({ where: { id: serviceId, status: "approved" } });
    if (!service) throw new Error("Service was not found or is not approved yet.");
  }

  const review = await prisma.review.create({
    data: {
      userId: user.id,
      productId,
      serviceId,
      rating,
      comment,
      status: ["admin", "super_admin"].includes(user.role) ? "approved" : "pending",
    },
    include: reviewInclude,
  });

  return serializeReview(review);
}

export async function updateReviewStatus(reviewId, status) {
  const nextStatus = approvalStatusToDb(status);
  if (!nextStatus) throw new Error("Invalid review status.");

  try {
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { status: nextStatus },
      include: reviewInclude,
    });

    return serializeReview(review);
  } catch (error) {
    if (error.code === "P2025") return null;
    throw error;
  }
}

export function reviewStatsFromReviews(reviews = []) {
  const approved = reviews.filter((review) => review.status === "approved");
  const reviewCount = approved.length;
  const ratingAverage = reviewCount
    ? approved.reduce((sum, review) => sum + toNumber(review.rating), 0) / reviewCount
    : 0;

  return {
    reviewCount,
    ratingAverage: Number(ratingAverage.toFixed(1)),
  };
}
