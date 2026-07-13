import { Router } from "express";
import {
  createRequest,
  createServiceQuoteRequest,
  listMyRequests,
  listRequests,
  updateMyRequest,
  updateRequest,
} from "../services/marketplace.service.js";
import { optionalAuth, requireAuth, requireRoles } from "../middleware/auth.js";
import { httpError } from "../utils/httpError.js";

const router = Router();

router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const requests = await listMyRequests(req.user);
    res.json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
});

router.get("/", requireAuth, requireRoles("admin", "super_admin"), async (req, res, next) => {
  try {
    const requests = await listRequests(req.query);
    res.json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
});


router.post("/service-quote/:serviceId", optionalAuth, async (req, res, next) => {
  try {
    const result = await createServiceQuoteRequest(req.params.serviceId, req.body, req.user || null);
    if (!result) return next(httpError(404, "Approved service was not found."));

    res.status(201).json({
      success: true,
      message: "Service quotation request submitted. SmartSell admin can now review and send a quote.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", optionalAuth, async (req, res, next) => {
  try {
    const { name, phone, message } = req.body;
    if (!name || !phone || !message) {
      return next(httpError(400, "Name, phone, and message are required"));
    }

    const request = await createRequest(req.body, req.user || null);
    res.status(201).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/customer", requireAuth, async (req, res, next) => {
  try {
    const request = await updateMyRequest(req.params.id, req.body, req.user);
    if (!request) return next(httpError(404, "Request not found for this customer."));
    res.json({ success: true, message: `Request ${request.status}.`, data: request });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAuth, requireRoles("admin", "super_admin"), async (req, res, next) => {
  try {
    const request = await updateRequest(req.params.id, req.body);
    if (!request) return next(httpError(404, "Request not found"));
    res.json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
});

export default router;
