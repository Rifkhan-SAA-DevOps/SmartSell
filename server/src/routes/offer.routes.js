import { Router } from "express";
import { createProductOffer, listProductOffers, updateProductOffer } from "../services/offer.service.js";
import { requireAuth } from "../middleware/auth.js";
import { httpError } from "../utils/httpError.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const offers = await listProductOffers(req.user, req.query);
    res.json({ success: true, data: offers });
  } catch (error) {
    next(error);
  }
});

router.post("/products/:productId", requireAuth, async (req, res, next) => {
  try {
    const offer = await createProductOffer(req.params.productId, req.body, req.user);
    if (!offer) return next(httpError(404, "Approved product was not found."));
    res.status(201).json({ success: true, message: "Offer submitted successfully.", data: offer });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const offer = await updateProductOffer(req.params.id, req.body, req.user);
    if (!offer) return next(httpError(404, "Offer not found."));
    res.json({ success: true, message: "Offer updated successfully.", data: offer });
  } catch (error) {
    next(error);
  }
});

export default router;
