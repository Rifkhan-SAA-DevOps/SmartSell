import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { getPublicUser } from "../services/auth.service.js";
import { serializeOrder } from "../services/order.service.js";
import { createNotification } from "../services/communication.service.js";
import { serializeReview } from "../services/review.service.js";
import {
  listProducts,
  listServices,
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
      .filter((user) => ["seller", "shop", "shop_seller", "service_provider", "admin", "super_admin"].includes(user.role) && user.status !== "blocked")
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


router.get("/home-merchandising/products", async (req, res, next) => {
  try {
    const requestedLimit = Number(req.query.limit || 250);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 250)
      : 250;

    const products = await listProducts({
      status: "approved",
      q: req.query.q || req.query.search || undefined,
      category: req.query.category && req.query.category !== "all" ? req.query.category : undefined,
      location: req.query.location && req.query.location !== "all" ? req.query.location : undefined,
      minPrice: req.query.minPrice || undefined,
      maxPrice: req.query.maxPrice || undefined,
      sort: req.query.sort || "featured",
      includeExpired: "false",
      limit,
    });

    const availableProducts = products.filter((product) => product.status === "approved");
    const categories = [...new Set(availableProducts.map((product) => product.category).filter(Boolean))]
      .sort((a, b) => String(a).localeCompare(String(b)));
    const locations = [...new Set(availableProducts.map((product) => product.location || "Sri Lanka").filter(Boolean))]
      .sort((a, b) => String(a).localeCompare(String(b)));

    res.json({
      success: true,
      data: {
        products: availableProducts,
        total: availableProducts.length,
        categories,
        locations,
      },
    });
  } catch (error) {
    next(error);
  }
});


router.get("/listings", async (req, res, next) => {
  try {
    const requestedLimit = Number(req.query.limit || 200);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 250)
      : 200;
    const query = String(req.query.q || req.query.search || "").trim().toLowerCase();
    const filters = {
      status: req.query.status && req.query.status !== "all" ? req.query.status : "all",
      featured: req.query.featured === "true" ? "true" : undefined,
      limit,
    };

    const [allProducts, allServices] = await Promise.all([
      listProducts(filters),
      listServices(filters),
    ]);

    const matchesQuery = (values) => !query || values.some((value) =>
      String(value || "").toLowerCase().includes(query)
    );

    const products = allProducts
      .filter((item) => item.status !== "draft")
      .filter((item) => matchesQuery([
        item.name, item.category, item.sellerName, item.location, item.type, item.condition, item.sku, item.brand, item.model,
      ]));
    const services = allServices
      .filter((item) => item.status !== "draft")
      .filter((item) => matchesQuery([
        item.title, item.category, item.providerName, item.providerType, item.serviceArea, item.availabilityNote,
      ]));

    res.json({
      success: true,
      data: { products, services },
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


router.patch("/products/:id/featured", async (req, res, next) => {
  try {
    if (typeof req.body.isFeatured !== "boolean") {
      return next(httpError(400, "isFeatured must be true or false."));
    }

    const product = await updateProduct(req.params.id, { isFeatured: req.body.isFeatured });
    if (!product) return next(httpError(404, "Product not found."));

    await logAdminAction(
      req.user.id,
      req.body.isFeatured ? "product_featured" : "product_unfeatured",
      "product",
      req.params.id,
      req.body.note || null
    );

    const rawProduct = await prisma.product.findUnique({
      where: { id: req.params.id },
      select: { createdById: true, name: true },
    });

    if (rawProduct?.createdById) {
      await createNotification({
        userId: rawProduct.createdById,
        title: req.body.isFeatured ? "Product featured" : "Product feature removed",
        message: req.body.isFeatured
          ? `${rawProduct.name} is now featured in SmartSell discovery.`
          : `${rawProduct.name} is no longer featured in SmartSell discovery.`,
        type: "approval",
        link: "/business",
      });
    }

    res.json({
      success: true,
      message: req.body.isFeatured ? "Product marked as featured." : "Product removed from featured listings.",
      data: product,
    });
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


router.patch("/services/:id/featured", async (req, res, next) => {
  try {
    if (typeof req.body.isFeatured !== "boolean") {
      return next(httpError(400, "isFeatured must be true or false."));
    }

    const service = await updateService(req.params.id, { isFeatured: req.body.isFeatured });
    if (!service) return next(httpError(404, "Service not found."));

    await logAdminAction(
      req.user.id,
      req.body.isFeatured ? "service_featured" : "service_unfeatured",
      "service",
      req.params.id,
      req.body.note || null
    );

    const rawService = await prisma.service.findUnique({
      where: { id: req.params.id },
      select: { createdById: true, title: true },
    });

    if (rawService?.createdById) {
      await createNotification({
        userId: rawService.createdById,
        title: req.body.isFeatured ? "Service featured" : "Service feature removed",
        message: req.body.isFeatured
          ? `${rawService.title} is now featured in SmartSell discovery.`
          : `${rawService.title} is no longer featured in SmartSell discovery.`,
        type: "approval",
        link: "/business",
      });
    }

    res.json({
      success: true,
      message: req.body.isFeatured ? "Service marked as featured." : "Service removed from featured listings.",
      data: service,
    });
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
