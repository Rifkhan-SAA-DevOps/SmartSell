import { Router } from "express";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { createOrder, getOrder, listOrders, updateOrderStatus } from "../services/order.service.js";
import { httpError } from "../utils/httpError.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const orders = await listOrders(req.user);
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireRoles("customer", "admin", "super_admin"), async (req, res, next) => {
  try {
    const order = await createOrder(req.body, req.user);
    res.status(201).json({
      success: true,
      message: "Order placed successfully. Admin will confirm the order.",
      data: order,
    });
  } catch (error) {
    next(httpError(400, error.message));
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const order = await getOrder(req.params.id, req.user);
    if (!order) return next(httpError(404, "Order not found."));
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", requireRoles("admin", "super_admin"), async (req, res, next) => {
  try {
    const order = await updateOrderStatus(req.params.id, req.body);
    if (!order) return next(httpError(404, "Order not found."));
    res.json({ success: true, message: "Order updated.", data: order });
  } catch (error) {
    next(httpError(400, error.message));
  }
});

export default router;
