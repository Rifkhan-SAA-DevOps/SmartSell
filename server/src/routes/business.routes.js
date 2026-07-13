import { Router } from "express";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import {
  getBusinessOverview,
  updateAssignedRequestStatus,
  updateOwnProduct,
  updateOwnService,
} from "../services/business.service.js";
import { httpError } from "../utils/httpError.js";

const router = Router();

router.use(requireAuth);
router.use(requireRoles("seller", "shop", "service_provider", "admin", "super_admin"));

router.get("/me", async (req, res, next) => {
  try {
    const overview = await getBusinessOverview(req.user);
    res.json({ success: true, data: overview });
  } catch (error) {
    next(error);
  }
});

router.patch("/products/:id", async (req, res, next) => {
  try {
    const product = await updateOwnProduct(req.params.id, req.body, req.user);
    if (!product) return next(httpError(404, "Product not found for this business account."));
    res.json({ success: true, message: "Product updated successfully.", data: product });
  } catch (error) {
    next(error);
  }
});

router.patch("/services/:id", async (req, res, next) => {
  try {
    const service = await updateOwnService(req.params.id, req.body, req.user);
    if (!service) return next(httpError(404, "Service not found for this business account."));
    res.json({ success: true, message: "Service updated successfully.", data: service });
  } catch (error) {
    next(error);
  }
});

router.patch("/requests/:id/status", async (req, res, next) => {
  try {
    const request = await updateAssignedRequestStatus(req.params.id, req.body, req.user);
    if (!request) return next(httpError(404, "Assigned request not found for this business account."));
    res.json({ success: true, message: `Request moved to ${request.status}.`, data: request });
  } catch (error) {
    next(error);
  }
});

export default router;
