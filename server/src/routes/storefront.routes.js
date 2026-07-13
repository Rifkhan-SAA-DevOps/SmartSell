import { Router } from "express";
import { getProviderStorefront, getSellerStorefront, listStorefronts } from "../services/storefront.service.js";
import { httpError } from "../utils/httpError.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const storefronts = await listStorefronts(req.query);
    res.json({ success: true, data: storefronts });
  } catch (error) {
    next(error);
  }
});

router.get("/sellers/:id", async (req, res, next) => {
  try {
    const storefront = await getSellerStorefront(req.params.id);
    if (!storefront) return next(httpError(404, "Seller storefront not found"));
    res.json({ success: true, data: storefront });
  } catch (error) {
    next(error);
  }
});

router.get("/providers/:id", async (req, res, next) => {
  try {
    const storefront = await getProviderStorefront(req.params.id);
    if (!storefront) return next(httpError(404, "Service provider storefront not found"));
    res.json({ success: true, data: storefront });
  } catch (error) {
    next(error);
  }
});

export default router;
