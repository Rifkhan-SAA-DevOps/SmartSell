import { Router } from "express";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import {
  adjustProductStock,
  createProductVariant,
  getInventorySummary,
  listAdvancedServices,
  listInventoryProducts,
  listStockMovements,
  bulkCreateProductVariants,
  duplicateProduct,
  duplicateService,
  getCatalogImportTemplate,
  updateAdvancedProduct,
  updateAdvancedService,
  updateProductCatalogStatus,
  updateProductVariant,
  updateServiceCatalogStatus,
} from "../services/inventory.service.js";
import { httpError } from "../utils/httpError.js";

const router = Router();
const managerRoles = ["seller", "shop", "service_provider", "admin", "super_admin"];
const productRoles = ["seller", "shop", "admin", "super_admin"];

router.use(requireAuth);
router.use(requireRoles(...managerRoles));

router.get("/summary", async (req, res, next) => {
  try {
    const summary = await getInventorySummary(req.user);
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
});

router.get("/products", async (req, res, next) => {
  try {
    const products = await listInventoryProducts(req.user, req.query);
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
});

router.get("/services", async (req, res, next) => {
  try {
    const services = await listAdvancedServices(req.user, req.query);
    res.json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
});

router.get("/movements", async (req, res, next) => {
  try {
    const movements = await listStockMovements(req.user, req.query);
    res.json({ success: true, data: movements });
  } catch (error) {
    next(error);
  }
});


router.get("/catalog-template", async (req, res, next) => {
  try {
    res.json({ success: true, data: getCatalogImportTemplate() });
  } catch (error) {
    next(error);
  }
});

router.patch("/products/:id/stock", requireRoles(...productRoles), async (req, res, next) => {
  try {
    const product = await adjustProductStock(req.params.id, req.body, req.user);
    if (!product) return next(httpError(404, "Product not found."));
    res.json({ success: true, message: "Stock updated.", data: product });
  } catch (error) {
    next(httpError(400, error.message));
  }
});

router.patch("/products/:id/advanced", requireRoles(...productRoles), async (req, res, next) => {
  try {
    const product = await updateAdvancedProduct(req.params.id, req.body, req.user);
    if (!product) return next(httpError(404, "Product not found."));
    res.json({ success: true, message: "Advanced product details updated.", data: product });
  } catch (error) {
    next(httpError(400, error.message));
  }
});

router.patch("/products/:id/status", requireRoles(...productRoles), async (req, res, next) => {
  try {
    const product = await updateProductCatalogStatus(req.params.id, req.body, req.user);
    if (!product) return next(httpError(404, "Product not found."));
    res.json({ success: true, message: "Product listing status updated.", data: product });
  } catch (error) {
    next(httpError(400, error.message));
  }
});

router.post("/products/:id/duplicate", requireRoles(...productRoles), async (req, res, next) => {
  try {
    const product = await duplicateProduct(req.params.id, req.body || {}, req.user);
    if (!product) return next(httpError(404, "Product not found."));
    res.status(201).json({ success: true, message: "Product duplicated as draft.", data: product });
  } catch (error) {
    next(httpError(400, error.message));
  }
});

router.post("/products/:id/variants", requireRoles(...productRoles), async (req, res, next) => {
  try {
    const variant = await createProductVariant(req.params.id, req.body, req.user);
    if (!variant) return next(httpError(404, "Product not found."));
    res.status(201).json({ success: true, message: "Variant created.", data: variant });
  } catch (error) {
    next(httpError(400, error.message));
  }
});

router.post("/products/:id/variants/bulk", requireRoles(...productRoles), async (req, res, next) => {
  try {
    const variants = await bulkCreateProductVariants(req.params.id, req.body || {}, req.user);
    if (!variants) return next(httpError(404, "Product not found."));
    res.status(201).json({ success: true, message: "Bulk variants created.", data: variants });
  } catch (error) {
    next(httpError(400, error.message));
  }
});

router.patch("/products/:id/variants/:variantId", requireRoles(...productRoles), async (req, res, next) => {
  try {
    const variant = await updateProductVariant(req.params.id, req.params.variantId, req.body, req.user);
    if (!variant) return next(httpError(404, "Variant not found."));
    res.json({ success: true, message: "Variant updated.", data: variant });
  } catch (error) {
    next(httpError(400, error.message));
  }
});

router.patch("/services/:id/advanced", requireRoles("service_provider", "admin", "super_admin"), async (req, res, next) => {
  try {
    const service = await updateAdvancedService(req.params.id, req.body, req.user);
    if (!service) return next(httpError(404, "Service not found."));
    res.json({ success: true, message: "Advanced service details updated.", data: service });
  } catch (error) {
    next(httpError(400, error.message));
  }
});

router.patch("/services/:id/status", requireRoles("service_provider", "admin", "super_admin"), async (req, res, next) => {
  try {
    const service = await updateServiceCatalogStatus(req.params.id, req.body, req.user);
    if (!service) return next(httpError(404, "Service not found."));
    res.json({ success: true, message: "Service listing status updated.", data: service });
  } catch (error) {
    next(httpError(400, error.message));
  }
});

router.post("/services/:id/duplicate", requireRoles("service_provider", "admin", "super_admin"), async (req, res, next) => {
  try {
    const service = await duplicateService(req.params.id, req.body || {}, req.user);
    if (!service) return next(httpError(404, "Service not found."));
    res.status(201).json({ success: true, message: "Service duplicated as draft.", data: service });
  } catch (error) {
    next(httpError(400, error.message));
  }
});

export default router;
