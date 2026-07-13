import { Router } from "express";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { listAuditLogs, securitySummary } from "../services/security.service.js";

const router = Router();
router.use(requireAuth, requireRoles("admin", "super_admin"));

router.get("/summary", async (_req, res, next) => {
  try {
    const data = await securitySummary();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get("/audit", async (req, res, next) => {
  try {
    const data = await listAuditLogs(req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export default router;
