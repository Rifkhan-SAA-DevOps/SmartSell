import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listWishlist, removeWishlistItem, toggleWishlist } from "../services/wishlist.service.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const wishlist = await listWishlist(req.user);
    res.json({ success: true, data: wishlist });
  } catch (error) {
    next(error);
  }
});

router.post("/toggle", async (req, res, next) => {
  try {
    const result = await toggleWishlist(req.body.productId, req.user);
    res.json({
      success: true,
      message: result.saved ? "Product saved to wishlist." : "Product removed from wishlist.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/:productId", async (req, res, next) => {
  try {
    const wishlist = await removeWishlistItem(req.params.productId, req.user);
    res.json({ success: true, message: "Product removed from wishlist.", data: wishlist });
  } catch (error) {
    next(error);
  }
});

export default router;
