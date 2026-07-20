import { Router } from "express";
import { createSeller, listSellers, updateSeller } from "../services/marketplace.service.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { httpError } from "../utils/httpError.js";

const router = Router();

router.get("/", requireAuth, requireRoles("admin", "super_admin"), async (req, res, next) => {
  try {
    const sellers = await listSellers(req.query);
    res.json({ success: true, data: sellers });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, requireRoles("admin", "super_admin"), async (req, res, next) => {
  try {
    const { name, phone, sellerType } = req.body;
    if (!name || !phone || !sellerType) {
      return next(httpError(400, "Name, phone, and sellerType are required"));
    }

    const seller = await createSeller(req.body);
    res.status(201).json({ success: true, data: seller });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAuth, requireRoles("admin", "super_admin"), async (req, res, next) => {
  try {
    const seller = await updateSeller(req.params.id, req.body);
    if (!seller) return next(httpError(404, "Seller not found"));
    res.json({ success: true, data: seller });
  } catch (error) {
    next(error);
  }
});

export default router;
