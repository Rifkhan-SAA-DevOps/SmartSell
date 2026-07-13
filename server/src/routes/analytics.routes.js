import { Router } from "express";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { getAdminAnalytics } from "../services/analytics.service.js";

const router = Router();

router.use(requireAuth, requireRoles("admin", "super_admin"));

router.get("/admin", async (_req, res, next) => {
  try {
    const data = await getAdminAnalytics();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export default router;
