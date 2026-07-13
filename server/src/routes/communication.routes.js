import { Router } from "express";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import {
  communicationSummary,
  createThread,
  getNotificationChannelStatus,
  getThread,
  listMessageRecipients,
  listNotifications,
  listThreads,
  markAllNotificationsRead,
  markNotificationRead,
  replyToThread,
  startContextThread,
  testNotificationChannels,
} from "../services/communication.service.js";
import { httpError } from "../utils/httpError.js";
import { getOnlineUserIds } from "../realtime/realtime.js";

const router = Router();
router.use(requireAuth);

router.get("/summary", async (req, res, next) => {
  try {
    const summary = await communicationSummary(req.user);
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
});



router.get("/notification-channels/status", requireRoles("admin", "super_admin"), async (_req, res, next) => {
  try {
    res.json({ success: true, data: getNotificationChannelStatus() });
  } catch (error) {
    next(error);
  }
});

router.post("/notification-channels/test", requireRoles("admin", "super_admin"), async (req, res, next) => {
  try {
    const result = await testNotificationChannels(req.body || {});
    res.json({ success: true, message: "Notification test completed.", data: result });
  } catch (error) {
    next(httpError(400, error.message));
  }
});

router.get("/online", async (_req, res, next) => {
  try {
    res.json({ success: true, data: { onlineUserIds: getOnlineUserIds() } });
  } catch (error) {
    next(error);
  }
});

router.get("/notifications", async (req, res, next) => {
  try {
    const data = await listNotifications(req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.patch("/notifications/read-all", async (req, res, next) => {
  try {
    const data = await markAllNotificationsRead(req.user);
    res.json({ success: true, message: "All notifications marked as read.", data });
  } catch (error) {
    next(error);
  }
});

router.patch("/notifications/:id/read", async (req, res, next) => {
  try {
    const notification = await markNotificationRead(req.params.id, req.user);
    if (!notification) return next(httpError(404, "Notification not found."));
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
});

router.get("/recipients", async (req, res, next) => {
  try {
    const data = await listMessageRecipients(req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get("/threads", async (req, res, next) => {
  try {
    const threads = await listThreads(req.user);
    res.json({ success: true, data: threads });
  } catch (error) {
    next(error);
  }
});


router.post("/context-threads", async (req, res, next) => {
  try {
    const thread = await startContextThread(req.body, req.user);
    res.status(201).json({ success: true, message: "Conversation opened.", data: thread });
  } catch (error) {
    next(httpError(400, error.message));
  }
});

router.post("/threads", async (req, res, next) => {
  try {
    const thread = await createThread(req.body, req.user);
    res.status(201).json({ success: true, message: "Message sent.", data: thread });
  } catch (error) {
    next(httpError(400, error.message));
  }
});

router.get("/threads/:id", async (req, res, next) => {
  try {
    const thread = await getThread(req.params.id, req.user);
    if (!thread) return next(httpError(404, "Message thread not found."));
    res.json({ success: true, data: thread });
  } catch (error) {
    next(error);
  }
});

router.post("/threads/:id/messages", async (req, res, next) => {
  try {
    const thread = await replyToThread(req.params.id, req.body, req.user);
    if (!thread) return next(httpError(404, "Message thread not found."));
    res.status(201).json({ success: true, message: "Reply sent.", data: thread });
  } catch (error) {
    next(httpError(400, error.message));
  }
});

export default router;
