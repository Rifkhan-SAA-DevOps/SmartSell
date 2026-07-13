import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  assignDeliveryPartner,
  getDeliverySummary,
  listDeliveryPartners,
  listDeliveryTasks,
  updateDeliveryTaskStatus,
} from "../services/delivery.service.js";

const router = Router();
router.use(requireAuth);

router.get("/summary", async (req, res, next) => {
  try {
    const data = await getDeliverySummary(req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get("/partners", async (req, res, next) => {
  try {
    const data = await listDeliveryPartners(req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get("/tasks", async (req, res, next) => {
  try {
    const data = await listDeliveryTasks(req.user, req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.patch("/orders/:id/assign", async (req, res, next) => {
  try {
    const data = await assignDeliveryPartner(req.user, req.params.id, req.body);
    res.json({ success: true, message: "Delivery partner assignment updated.", data });
  } catch (error) {
    next(error);
  }
});

router.patch("/orders/:id/status", async (req, res, next) => {
  try {
    const data = await updateDeliveryTaskStatus(req.user, req.params.id, req.body);
    res.json({ success: true, message: "Delivery status updated.", data });
  } catch (error) {
    next(error);
  }
});

export default router;
