import { Router } from "express";
import { getPublicUser, loginUser, registerUser } from "../services/auth.service.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res, next) => {
  try {
    const data = await registerUser(req.body);
    res.status(201).json({ success: true, message: "Account created successfully.", data });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const data = await loginUser(req.body);
    res.json({ success: true, message: "Login successful.", data });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ success: true, data: { user: getPublicUser(req.user) } });
});

export default router;
