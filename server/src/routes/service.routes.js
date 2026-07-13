import { Router } from "express";
import { createService, getService, listServices, updateService } from "../services/marketplace.service.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { httpError } from "../utils/httpError.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const services = await listServices(req.query);
    res.json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const service = await getService(req.params.id);
    if (!service) return next(httpError(404, "Service not found"));
    res.json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title) return next(httpError(400, "Service title is required."));

    const service = await createService(req.body, req.user);
    res.status(201).json({
      success: true,
      message: "Service submitted. Admin approval is required before it appears publicly.",
      data: service,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAuth, requireRoles("admin", "super_admin"), async (req, res, next) => {
  try {
    const service = await updateService(req.params.id, req.body);
    if (!service) return next(httpError(404, "Service not found"));
    res.json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
});

export default router;
