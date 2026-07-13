import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { getPublicUser } from "../services/auth.service.js";
import { serializeOrder } from "../services/order.service.js";
import { createNotification } from "../services/communication.service.js";
import { serializeReview } from "../services/review.service.js";
import {
  serializeProduct,
  serializeRequest,
  serializeSeller,
  serializeService,
  updateProduct,
  updateRequest,
  updateSeller,
  updateService,
} from "../services/marketplace.service.js";
import { httpError } from "../utils/httpError.js";

const router = Router();

const approvalStatuses = ["pending", "approved", "rejected", "archived"];
const requestStatuses = ["new", "pending", "quoted", "accepted", "in_progress", "completed", "cancelled"];

router.use(requireAuth, requireRoles("admin", "super_admin"));

async function logAdminAction(adminId, action, targetType, targetId, note = null) {
  await prisma.adminAction.create({
    data: { adminId, action, targetType, targetId, note },
  }).catch(() => null);
}

router.get("/overview", async (_req, res, next) => {
  try {
    const [
      users,
      sellers,
      requests,
      products,
      services,
      totalProducts,
      totalServices,
      totalUsers,
      pendingProducts,
      pendingServices,
      pendingSellers,
      pendingRequests,
      totalOrders,
      pendingOrders,
      pendingReviews,
      orders,
      reviews,
    ] = await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.sellerProfile.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } }),
      prisma.customRequest.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.product.findMany({
        where: { status: { in: ["pending", "rejected"] } },
        include: { category: true, seller: true, images: { orderBy: { sortOrder: "asc" } }, createdBy: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.service.findMany({
        where: { status: { in: ["pending", "rejected"] } },
        include: { category: true, provider: true, images: { orderBy: { sortOrder: "asc" } }, createdBy: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.product.count(),
      prisma.service.count(),
      prisma.user.count(),
      prisma.product.count({ where: { status: "pending" } }),
      prisma.service.count({ where: { status: "pending" } }),
      prisma.sellerProfile.count({ where: { status: "pending" } }),
      prisma.customRequest.count({ where: { status: { in: ["new", "pending"] } } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: { in: ["pending", "confirmed", "processing"] } } }),
      prisma.review.count({ where: { status: "pending" } }),
      prisma.order.findMany({
        include: {
          customer: true,
          items: {
            include: { product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } } },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.review.findMany({
        where: { status: { in: ["pending", "rejected"] } },
        include: {
          user: true,
          product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
          service: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    const assignees = users
      .filter((user) => ["seller", "shop", "service_provider", "admin", "super_admin"].includes(user.role) && user.status !== "blocked")
      .map((user) => ({
        value: user.email,
        label: `${user.businessName || user.name} (${user.role.replaceAll("_", " ")})`,
        email: user.email,
        role: user.role,
      }));

    res.json({
      success: true,
      data: {
        users: users.map(getPublicUser),
        sellers: sellers.map(serializeSeller),
        assignees,
        requests: requests.map(serializeRequest),
        products: products.map(serializeProduct),
        services: services.map(serializeService),
        orders: orders.map(serializeOrder),
        reviews: reviews.map(serializeReview),
        stats: {
          totalProducts,
          totalServices,
          totalUsers,
          pendingProducts,
          pendingServices,
          pendingSellers,
          pendingRequests,
          totalOrders,
          pendingOrders,
          pendingReviews,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/products/:id/status", async (req, res, next) => {
  try {
    const { status, note } = req.body;
    if (!approvalStatuses.includes(status)) return next(httpError(400, "Invalid product status."));

    const product = await updateProduct(req.params.id, { status });
    if (!product) return next(httpError(404, "Product not found."));
    await logAdminAction(req.user.id, `product_${status}`, "product", req.params.id, note || null);

    const rawProduct = await prisma.product.findUnique({ where: { id: req.params.id }, select: { createdById: true, name: true } });
    if (rawProduct?.createdById) {
      await createNotification({
        userId: rawProduct.createdById,
        title: `Product ${status}`,
        message: `${rawProduct.name} has been ${status}.`,
        type: "approval",
        link: "/business",
      });
    }

    res.json({ success: true, message: `Product ${status}.`, data: product });
  } catch (error) {
    next(error);
  }
});

router.patch("/services/:id/status", async (req, res, next) => {
  try {
    const { status, note } = req.body;
    if (!approvalStatuses.includes(status)) return next(httpError(400, "Invalid service status."));

    const service = await updateService(req.params.id, { status });
    if (!service) return next(httpError(404, "Service not found."));
    await logAdminAction(req.user.id, `service_${status}`, "service", req.params.id, note || null);

    const rawService = await prisma.service.findUnique({ where: { id: req.params.id }, select: { createdById: true, title: true } });
    if (rawService?.createdById) {
      await createNotification({
        userId: rawService.createdById,
        title: `Service ${status}`,
        message: `${rawService.title} has been ${status}.`,
        type: "approval",
        link: "/business",
      });
    }

    res.json({ success: true, message: `Service ${status}.`, data: service });
  } catch (error) {
    next(error);
  }
});

router.patch("/sellers/:id/status", async (req, res, next) => {
  try {
    const { status, note } = req.body;
    if (!approvalStatuses.includes(status)) return next(httpError(400, "Invalid seller status."));

    const seller = await updateSeller(req.params.id, { status });
    if (!seller) return next(httpError(404, "Seller not found."));
    await logAdminAction(req.user.id, `seller_${status}`, "seller", req.params.id, note || null);

    if (seller.userId) {
      await createNotification({
        userId: seller.userId,
        title: `Seller profile ${status}`,
        message: `Your SmartSell seller profile has been ${status}.`,
        type: "approval",
        link: "/profile",
      });
    }

    res.json({ success: true, message: `Seller ${status}.`, data: seller });
  } catch (error) {
    next(error);
  }
});

router.patch("/requests/:id/status", async (req, res, next) => {
  try {
    const { status, quotation, assignedTo, adminNote } = req.body;
    if (!requestStatuses.includes(status)) return next(httpError(400, "Invalid request status."));

    const request = await updateRequest(req.params.id, { status, quotation, assignedTo, adminNote });
    if (!request) return next(httpError(404, "Request not found."));
    await logAdminAction(req.user.id, `request_${status}`, "custom_request", req.params.id, adminNote || null);

    const rawRequest = await prisma.customRequest.findUnique({ where: { id: req.params.id } });
    if (rawRequest?.userId) {
      await createNotification({
        userId: rawRequest.userId,
        title: `Request ${status}`,
        message: rawRequest.quotation ? `Your request has a quotation of Rs. ${Number(rawRequest.quotation).toLocaleString()}.` : `Your request status is now ${status}.`,
        type: "request",
        link: "/my-requests",
      });
    }
    if (assignedTo) {
      const assignedUser = await prisma.user.findFirst({ where: { email: assignedTo } });
      if (assignedUser) {
        await createNotification({
          userId: assignedUser.id,
          title: "New assigned custom request",
          message: `${rawRequest?.name || "Customer"} request has been assigned to you.`,
          type: "request",
          link: "/business",
        });
      }
    }

    res.json({ success: true, message: `Request moved to ${status}.`, data: request });
  } catch (error) {
    next(error);
  }
});


router.patch("/reviews/:id/status", async (req, res, next) => {
  try {
    const { status, note } = req.body;
    if (!approvalStatuses.includes(status)) return next(httpError(400, "Invalid review status."));

    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        user: true,
        product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
        service: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
      },
    }).catch((error) => {
      if (error.code === "P2025") return null;
      throw error;
    });

    if (!review) return next(httpError(404, "Review not found."));
    await logAdminAction(req.user.id, `review_${status}`, "review", req.params.id, note || null);

    if (review.userId) {
      await createNotification({
        userId: review.userId,
        title: `Review ${status}`,
        message: `Your SmartSell review has been ${status}.`,
        type: "review",
        link: "/my-reviews",
      });
    }

    res.json({ success: true, message: `Review ${status}.`, data: serializeReview(review) });
  } catch (error) {
    next(error);
  }
});

export default router;
