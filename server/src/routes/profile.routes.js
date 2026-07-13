import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { changeMyPassword, getMyProfile, updateMyProfile } from "../services/profile.service.js";

const router = Router();

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const data = await getMyProfile(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const data = await updateMyProfile(req.user.id, req.body);
    res.json({ success: true, message: "Profile updated successfully.", data });
  } catch (error) {
    next(error);
  }
});

router.patch("/password", requireAuth, async (req, res, next) => {
  try {
    const data = await changeMyPassword(req.user.id, req.body);
    res.json({ success: true, message: "Password changed successfully.", data });
  } catch (error) {
    next(error);
  }
});

export default router;
