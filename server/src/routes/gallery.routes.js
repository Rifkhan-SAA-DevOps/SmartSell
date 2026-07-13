import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { httpError } from "../utils/httpError.js";
import {
  addProductImage,
  addServiceImage,
  deleteProductImage,
  deleteServiceImage,
  getProductGallery,
  getServiceGallery,
  listGalleryProducts,
  listGalleryServices,
  reorderProductImages,
  reorderServiceImages,
  setPrimaryProductImage,
  setPrimaryServiceImage,
  updateProductImage,
  updateServiceImage,
} from "../services/gallery.service.js";

const router = Router();
router.use(requireAuth);

router.get("/products", async (req, res, next) => {
  try {
    const products = await listGalleryProducts(req.user, req.query);
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
});

router.get("/services", async (req, res, next) => {
  try {
    const services = await listGalleryServices(req.user, req.query);
    res.json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
});

router.get("/products/:productId", async (req, res, next) => {
  try {
    const gallery = await getProductGallery(req.params.productId, req.user);
    if (!gallery) return next(httpError(404, "Product not found"));
    res.json({ success: true, data: gallery });
  } catch (error) {
    next(error);
  }
});

router.get("/services/:serviceId", async (req, res, next) => {
  try {
    const gallery = await getServiceGallery(req.params.serviceId, req.user);
    if (!gallery) return next(httpError(404, "Service not found"));
    res.json({ success: true, data: gallery });
  } catch (error) {
    next(error);
  }
});

router.post("/products/:productId/images", async (req, res, next) => {
  try {
    const gallery = await addProductImage(req.params.productId, req.body, req.user);
    res.status(201).json({ success: true, message: "Product image added.", data: gallery });
  } catch (error) {
    next(error);
  }
});

router.post("/services/:serviceId/images", async (req, res, next) => {
  try {
    const gallery = await addServiceImage(req.params.serviceId, req.body, req.user);
    res.status(201).json({ success: true, message: "Service image added.", data: gallery });
  } catch (error) {
    next(error);
  }
});

router.patch("/products/:productId/images/:imageId", async (req, res, next) => {
  try {
    const gallery = await updateProductImage(req.params.productId, req.params.imageId, req.body, req.user);
    if (!gallery) return next(httpError(404, "Product image not found"));
    res.json({ success: true, message: "Product image updated.", data: gallery });
  } catch (error) {
    next(error);
  }
});

router.patch("/services/:serviceId/images/:imageId", async (req, res, next) => {
  try {
    const gallery = await updateServiceImage(req.params.serviceId, req.params.imageId, req.body, req.user);
    if (!gallery) return next(httpError(404, "Service image not found"));
    res.json({ success: true, message: "Service image updated.", data: gallery });
  } catch (error) {
    next(error);
  }
});

router.delete("/products/:productId/images/:imageId", async (req, res, next) => {
  try {
    const gallery = await deleteProductImage(req.params.productId, req.params.imageId, req.user);
    if (!gallery) return next(httpError(404, "Product image not found"));
    res.json({ success: true, message: "Product image removed.", data: gallery });
  } catch (error) {
    next(error);
  }
});

router.delete("/services/:serviceId/images/:imageId", async (req, res, next) => {
  try {
    const gallery = await deleteServiceImage(req.params.serviceId, req.params.imageId, req.user);
    if (!gallery) return next(httpError(404, "Service image not found"));
    res.json({ success: true, message: "Service image removed.", data: gallery });
  } catch (error) {
    next(error);
  }
});

router.post("/products/:productId/images/:imageId/primary", async (req, res, next) => {
  try {
    const gallery = await setPrimaryProductImage(req.params.productId, req.params.imageId, req.user);
    if (!gallery) return next(httpError(404, "Product image not found"));
    res.json({ success: true, message: "Primary product image updated.", data: gallery });
  } catch (error) {
    next(error);
  }
});

router.post("/services/:serviceId/images/:imageId/primary", async (req, res, next) => {
  try {
    const gallery = await setPrimaryServiceImage(req.params.serviceId, req.params.imageId, req.user);
    if (!gallery) return next(httpError(404, "Service image not found"));
    res.json({ success: true, message: "Primary service image updated.", data: gallery });
  } catch (error) {
    next(error);
  }
});

router.post("/products/:productId/images/reorder", async (req, res, next) => {
  try {
    const gallery = await reorderProductImages(req.params.productId, req.body, req.user);
    res.json({ success: true, message: "Product gallery order saved.", data: gallery });
  } catch (error) {
    next(error);
  }
});

router.post("/services/:serviceId/images/reorder", async (req, res, next) => {
  try {
    const gallery = await reorderServiceImages(req.params.serviceId, req.body, req.user);
    res.json({ success: true, message: "Service gallery order saved.", data: gallery });
  } catch (error) {
    next(error);
  }
});

export default router;
