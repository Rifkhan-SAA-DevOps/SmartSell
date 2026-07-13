import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from "../services/marketplace.service.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { httpError } from "../utils/httpError.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const products = await listProducts(req.query);
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const product = await getProduct(req.params.id);
    if (!product) return next(httpError(404, "Product not found"));
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { name, price } = req.body;
    if (!name || price === undefined || price === "") {
      return next(httpError(400, "Product name and price are required."));
    }

    const product = await createProduct(req.body, req.user);
    res.status(201).json({
      success: true,
      message: "Product submitted. Admin approval is required before it appears publicly.",
      data: product,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAuth, requireRoles("admin", "super_admin"), async (req, res, next) => {
  try {
    const product = await updateProduct(req.params.id, req.body);
    if (!product) return next(httpError(404, "Product not found"));
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAuth, requireRoles("admin", "super_admin"), async (req, res, next) => {
  try {
    const deleted = await deleteProduct(req.params.id);
    if (!deleted) return next(httpError(404, "Product not found"));
    res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
