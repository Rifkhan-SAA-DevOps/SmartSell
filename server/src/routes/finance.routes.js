import { Router } from "express";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { getFinanceSummary, requestPayout, updatePayoutStatus } from "../services/finance.service.js";
import { httpError } from "../utils/httpError.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/summary",
  requireRoles("seller", "shop", "service_provider", "admin", "super_admin"),
  async (req, res, next) => {
    try {
      const summary = await getFinanceSummary(req.user);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/payouts",
  requireRoles("seller", "shop", "service_provider"),
  async (req, res, next) => {
    try {
      const payout = await requestPayout(req.user, req.body);
      res.status(201).json({ success: true, message: "Payout request submitted.", data: payout });
    } catch (error) {
      next(httpError(400, error.message));
    }
  }
);

router.patch(
  "/payouts/:id/status",
  requireRoles("admin", "super_admin"),
  async (req, res, next) => {
    try {
      const payout = await updatePayoutStatus(req.params.id, req.body);
      if (!payout) return next(httpError(404, "Payout request not found."));
      res.json({ success: true, message: "Payout request updated.", data: payout });
    } catch (error) {
      next(httpError(400, error.message));
    }
  }
);

export default router;
