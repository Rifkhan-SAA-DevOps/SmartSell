import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createSupportTicket,
  listSupportTickets,
  supportSummary,
  updateSupportTicket,
} from "../services/support.service.js";
import { httpError } from "../utils/httpError.js";

const router = Router();
router.use(requireAuth);

router.get("/summary", async (req, res, next) => {
  try {
    const data = await supportSummary(req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get("/tickets", async (req, res, next) => {
  try {
    const data = await listSupportTickets(req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.post("/tickets", async (req, res, next) => {
  try {
    const ticket = await createSupportTicket(req.body, req.user);
    res.status(201).json({ success: true, message: "Support ticket created.", data: ticket });
  } catch (error) {
    next(httpError(400, error.message));
  }
});

router.patch("/tickets/:id", async (req, res, next) => {
  try {
    const ticket = await updateSupportTicket(req.params.id, req.body, req.user);
    if (!ticket) return next(httpError(404, "Support ticket not found."));
    res.json({ success: true, message: "Support ticket updated.", data: ticket });
  } catch (error) {
    next(httpError(400, error.message));
  }
});

export default router;
