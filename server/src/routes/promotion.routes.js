import { Router } from "express";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { httpError } from "../utils/httpError.js";
import {
  createCategory,
  createCoupon,
  listCategories,
  listCoupons,
  updateCategory,
  updateCoupon,
  validateCouponCode,
} from "../services/promotion.service.js";

const router = Router();
const adminOnly = [requireAuth, requireRoles("admin", "super_admin")];

router.get("/categories", async (req, res, next) => {
  try {
    const categories = await listCategories(req.query);
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
});

router.post("/categories", ...adminOnly, async (req, res, next) => {
  try {
    const category = await createCategory(req.body);
    res.status(201).json({ success: true, message: "Category saved.", data: category });
  } catch (error) {
    next(httpError(400, error.message));
  }
});

router.patch("/categories/:id", ...adminOnly, async (req, res, next) => {
  try {
    const category = await updateCategory(req.params.id, req.body);
    if (!category) return next(httpError(404, "Category not found."));
    res.json({ success: true, message: "Category updated.", data: category });
  } catch (error) {
    next(httpError(400, error.message));
  }
});

router.get("/coupons", ...adminOnly, async (req, res, next) => {
  try {
    const coupons = await listCoupons(req.query);
    res.json({ success: true, data: coupons });
  } catch (error) {
    next(error);
  }
});

router.post("/coupons", ...adminOnly, async (req, res, next) => {
  try {
    const coupon = await createCoupon(req.body);
    res.status(201).json({ success: true, message: "Coupon saved.", data: coupon });
  } catch (error) {
    next(httpError(400, error.message));
  }
});

router.patch("/coupons/:id", ...adminOnly, async (req, res, next) => {
  try {
    const coupon = await updateCoupon(req.params.id, req.body);
    if (!coupon) return next(httpError(404, "Coupon not found."));
    res.json({ success: true, message: "Coupon updated.", data: coupon });
  } catch (error) {
    next(httpError(400, error.message));
  }
});

router.post("/coupons/validate", requireAuth, async (req, res, next) => {
  try {
    const result = await validateCouponCode(req.body.code, req.body.subtotal);
    res.json({
      success: true,
      message: result.message,
      data: {
        couponCode: result.couponCode,
        discountAmount: result.discountAmount,
        finalAmount: result.finalAmount,
      },
    });
  } catch (error) {
    next(httpError(400, error.message));
  }
});

export default router;
