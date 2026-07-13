import { Router } from "express";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import {
  createReview,
  listMyReviews,
  listPublicReviews,
  updateReviewStatus,
} from "../services/review.service.js";
import { httpError } from "../utils/httpError.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const reviews = await listPublicReviews({
      productId: req.query.productId,
      serviceId: req.query.serviceId,
    });

    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
});

router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const reviews = await listMyReviews(req.user);
    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const review = await createReview(req.body, req.user);
    res.status(201).json({
      success: true,
      message: review.status === "approved" ? "Review published." : "Review submitted for admin approval.",
      data: review,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", requireAuth, requireRoles("admin", "super_admin"), async (req, res, next) => {
  try {
    const review = await updateReviewStatus(req.params.id, req.body.status);
    if (!review) return next(httpError(404, "Review not found."));
    res.json({ success: true, message: `Review ${req.body.status}.`, data: review });
  } catch (error) {
    next(error);
  }
});

export default router;
