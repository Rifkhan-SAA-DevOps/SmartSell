import { Router } from "express";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import {
  createAdminAccount,
  getManagedUser,
  getUserManagementOverview,
  listManagedUsers,
  resetUserPassword,
  updateBusinessApproval,
  updateUserRole,
  updateUserStatus,
} from "../services/user.service.js";

const router = Router();

router.use(requireAuth, requireRoles("admin", "super_admin"));

router.get("/admin/overview", async (req, res, next) => {
  try {
    const data = await getUserManagementOverview(req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/accounts", async (req, res, next) => {
  try {
    const data = await listManagedUsers(req.user, req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/accounts", async (req, res, next) => {
  try {
    const data = await createAdminAccount(req.user, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/accounts/:id", async (req, res, next) => {
  try {
    const data = await getManagedUser(req.user, req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/accounts/:id/status", async (req, res, next) => {
  try {
    const data = await updateUserStatus(req.user, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/accounts/:id/role", async (req, res, next) => {
  try {
    const data = await updateUserRole(req.user, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/accounts/:id/business-status", async (req, res, next) => {
  try {
    const data = await updateBusinessApproval(req.user, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/accounts/:id/reset-password", async (req, res, next) => {
  try {
    const data = await resetUserPassword(req.user, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export default router;
