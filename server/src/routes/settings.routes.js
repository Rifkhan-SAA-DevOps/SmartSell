import { Router } from "express";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { httpError } from "../utils/httpError.js";
import { getAdminSettings, getPublicSettings, updatePlatformSettings } from "../services/settings.service.js";

const router = Router();
const adminOnly = [requireAuth, requireRoles("admin", "super_admin")];

router.get("/public", async (_req, res, next) => {
  try {
    const settings = await getPublicSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

router.get("/admin", ...adminOnly, async (_req, res, next) => {
  try {
    const settings = await getAdminSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

router.patch("/admin", ...adminOnly, async (req, res, next) => {
  try {
    const settings = await updatePlatformSettings(req.body, req.user);
    res.json({ success: true, message: "Platform settings updated.", data: settings });
  } catch (error) {
    next(httpError(400, error.message));
  }
});

export default router;
