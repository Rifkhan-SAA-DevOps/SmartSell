import { prisma } from "../config/prisma.js";
import { emitToThread, emitToUser, emitToUsers, getOnlineUserIds, isUserOnline } from "../realtime/realtime.js";
import {
  deliverContactNotification,
  deliverUserNotification,
  notificationChannelStatus,
  sendNotificationChannelTest,
} from "./notificationDelivery.service.js";

const adminRoles = ["admin", "super_admin"];
const businessRoles = ["seller", "shop", "service_provider", "delivery_partner"];

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    businessName: user.businessName,
  };
}

export function serializeNotification(notification) {
  if (!notification) return null;
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    link: notification.link,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };
}

export function serializeMessage(message) {
  if (!message) return null;
  return {
    id: message.id,
    threadId: message.threadId,
    body: message.body,
    readAt: message.readAt,
    sender: publicUser(message.sender),
    recipient: publicUser(message.recipient),
    createdAt: message.createdAt,
  };
}

export function serializeThread(thread, currentUser = null) {
  if (!thread) return null;
  const messages = thread.messages || [];
  const lastMessage = messages[0] || null;
  const unreadCount = messages.filter(
    (message) => message.recipientId === currentUser?.id && !message.readAt
  ).length;

  return {
    id: thread.id,
    subject: thread.subject,
    contextType: thread.contextType,
    contextId: thread.contextId,
    customer: publicUser(thread.customer),
    businessUser: publicUser(thread.businessUser),
    admin: publicUser(thread.admin),
    createdBy: publicUser(thread.createdBy),
    unreadCount,
    lastMessage: lastMessage ? serializeMessage(lastMessage) : null,
    messages: messages.slice().reverse().map(serializeMessage),
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
  };
}

export async function communicationSummaryByUserId(userId) {
  if (!userId) return { unreadNotifications: 0, unreadMessages: 0 };

  const [notifications, unreadMessages] = await Promise.all([
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.message.count({ where: { recipientId: userId, readAt: null } }),
  ]);

  return { unreadNotifications: notifications, unreadMessages };
}

async function emitSummaryForUser(userId) {
  if (!userId) return;
  const summary = await communicationSummaryByUserId(userId);
  emitToUser(userId, "communication:summary", summary);
}

function participantUsers(thread) {
  return [thread?.customer, thread?.businessUser, thread?.admin].filter(Boolean);
}

async function emitThreadUpdate(thread, eventName = "thread:updated") {
  if (!thread) return;
  const participants = participantUsers(thread);
  participants.forEach((participant) => {
    emitToUser(participant.id, eventName, {
      thread: serializeThread(thread, participant),
    });
  });

  emitToThread(thread.id, eventName, {
    thread: serializeThread(thread, null),
  });

  await Promise.all(participants.map((participant) => emitSummaryForUser(participant.id)));
}

async function emitMessageCreated(thread, message = null) {
  if (!thread) return;
  const newestMessage = message || thread.messages?.[0] || null;
  const participants = participantUsers(thread);

  participants.forEach((participant) => {
    emitToUser(participant.id, "message:new", {
      thread: serializeThread(thread, participant),
      message: newestMessage ? serializeMessage(newestMessage) : null,
    });
  });

  emitToThread(thread.id, "message:new", {
    thread: serializeThread(thread, null),
    message: newestMessage ? serializeMessage(newestMessage) : null,
  });

  await Promise.all(participants.map((participant) => emitSummaryForUser(participant.id)));
}

export async function createNotification({ userId, title, message, type = "general", link = null, external = true }, db = prisma) {
  if (!userId || !title || !message) return null;
  const cleanTitle = String(title).trim();
  const cleanMessage = String(message).trim();

  try {
    const created = await db.notification.create({
      data: {
        userId,
        title: cleanTitle,
        message: cleanMessage,
        type: String(type || "general"),
        link: link || null,
      },
    });

    emitToUser(userId, "notification:new", { notification: serializeNotification(created) });
    await emitSummaryForUser(userId);

    if (external) {
      deliverUserNotification({ userId, title: cleanTitle, message: cleanMessage, link }).catch((error) => {
        console.error("Notification delivery failed:", error.message);
      });
    }

    return created;
  } catch {
    return null;
  }
}

export function deliverExternalNotification({ email, phone, title, message, link = null }) {
  return deliverContactNotification({ email, phone, title, message, link });
}

export function getNotificationChannelStatus() {
  return notificationChannelStatus();
}

export function testNotificationChannels(payload) {
  return sendNotificationChannelTest(payload);
}

export async function notifyAdmins({ title, message, type = "admin", link = null }, db = prisma) {
  const admins = await db.user.findMany({
    where: { role: { in: adminRoles }, status: { not: "blocked" } },
    select: { id: true },
  });

  await Promise.all(
    admins.map((admin) => createNotification({ userId: admin.id, title, message, type, link }, db))
  );
}

export async function listNotifications(user) {
  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
  ]);

  return {
    unreadCount,
    items: items.map(serializeNotification),
  };
}

export async function markNotificationRead(id, user) {
  const notification = await prisma.notification.findFirst({ where: { id, userId: user.id } });
  if (!notification) return null;

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return serializeNotification(updated);
}

export async function markAllNotificationsRead(user) {
  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
  return listNotifications(user);
}

function threadWhereForUser(user) {
  if (adminRoles.includes(user.role)) return {};
  if (businessRoles.includes(user.role)) {
    return { OR: [{ businessUserId: user.id }, { adminId: user.id }] };
  }
  return { customerId: user.id };
}

const threadIncludeList = {
  customer: true,
  businessUser: true,
  admin: true,
  createdBy: true,
  messages: {
    include: { sender: true, recipient: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  },
};

const threadIncludeFull = {
  customer: true,
  businessUser: true,
  admin: true,
  createdBy: true,
  messages: {
    include: { sender: true, recipient: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  },
};

function canAccessThread(thread, user) {
  if (!thread || !user) return false;
  if (adminRoles.includes(user.role)) return true;
  return [thread.customerId, thread.businessUserId, thread.adminId].includes(user.id);
}

async function findDefaultAdmin() {
  return prisma.user.findFirst({
    where: { role: { in: adminRoles }, status: { not: "blocked" } },
    orderBy: { createdAt: "asc" },
  });
}

function chooseRecipientId(thread, sender) {
  const participants = [thread.customerId, thread.businessUserId, thread.adminId].filter(Boolean);
  if (adminRoles.includes(sender.role)) {
    return thread.customerId || thread.businessUserId || null;
  }
  return participants.find((id) => id !== sender.id) || thread.adminId || null;
}

export async function listMessageRecipients(user) {
  const where = adminRoles.includes(user.role)
    ? { status: { not: "blocked" }, id: { not: user.id } }
    : { role: { in: adminRoles }, status: { not: "blocked" } };

  const users = await prisma.user.findMany({
    where,
    orderBy: [{ role: "asc" }, { name: "asc" }],
    take: 150,
  });

  return users.map((item) => ({
    id: item.id,
    name: item.businessName || item.name,
    email: item.email,
    role: item.role,
    label: `${item.businessName || item.name} (${String(item.role).replaceAll("_", " ")})`,
  }));
}

export async function listThreads(user) {
  const threads = await prisma.messageThread.findMany({
    where: threadWhereForUser(user),
    include: threadIncludeList,
    orderBy: { updatedAt: "desc" },
    take: 80,
  });

  return threads.map((thread) => serializeThread(thread, user));
}

export async function createThread(payload, user) {
  const subject = String(payload.subject || "SmartSell message").trim();
  const body = String(payload.message || payload.body || "").trim();
  if (!body) throw new Error("Message is required.");

  let customerId = null;
  let businessUserId = null;
  let adminId = null;
  let recipientId = null;

  if (adminRoles.includes(user.role)) {
    const recipient = payload.recipientId
      ? await prisma.user.findUnique({ where: { id: String(payload.recipientId) } })
      : null;
    if (!recipient) throw new Error("Admin must select a valid recipient.");

    adminId = user.id;
    recipientId = recipient.id;
    if (recipient.role === "customer") customerId = recipient.id;
    else businessUserId = recipient.id;
  } else {
    const admin = await findDefaultAdmin();
    if (!admin) throw new Error("No admin account is available for support messages.");

    adminId = admin.id;
    recipientId = admin.id;
    if (businessRoles.includes(user.role)) businessUserId = user.id;
    else customerId = user.id;
  }

  const thread = await prisma.messageThread.create({
    data: {
      subject,
      contextType: payload.contextType || null,
      contextId: payload.contextId || null,
      customerId,
      businessUserId,
      adminId,
      createdById: user.id,
      messages: {
        create: {
          senderId: user.id,
          recipientId,
          body,
        },
      },
    },
    include: threadIncludeFull,
  });

  await createNotification({
    userId: recipientId,
    title: "New SmartSell message",
    message: `${user.name} sent you a message: ${subject}`,
    type: "message",
    link: `/inbox?thread=${thread.id}`,
  });

  await emitMessageCreated(thread, thread.messages?.[0]);

  return serializeThread(thread, user);
}

export async function getThread(id, user) {
  const thread = await prisma.messageThread.findUnique({ where: { id }, include: threadIncludeFull });
  if (!canAccessThread(thread, user)) return null;

  await prisma.message.updateMany({
    where: { threadId: id, recipientId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  const refreshed = await prisma.messageThread.findUnique({ where: { id }, include: threadIncludeFull });
  await emitSummaryForUser(user.id);
  emitToUser(user.id, "thread:read", { threadId: id, summary: await communicationSummaryByUserId(user.id) });
  return serializeThread(refreshed, user);
}

export async function replyToThread(id, payload, user) {
  const body = String(payload.message || payload.body || "").trim();
  if (!body) throw new Error("Message is required.");

  const thread = await prisma.messageThread.findUnique({ where: { id }, include: threadIncludeFull });
  if (!canAccessThread(thread, user)) return null;

  const recipientId = chooseRecipientId(thread, user);

  await prisma.$transaction(async (tx) => {
    await tx.message.create({
      data: {
        threadId: id,
        senderId: user.id,
        recipientId,
        body,
      },
    });

    await tx.messageThread.update({ where: { id }, data: { updatedAt: new Date() } });
  });

  const refreshed = await prisma.messageThread.findUnique({ where: { id }, include: threadIncludeFull });

  if (recipientId) {
    await createNotification({
      userId: recipientId,
      title: "New reply in SmartSell Inbox",
      message: `${user.name} replied to: ${thread.subject}`,
      type: "message",
      link: `/inbox?thread=${id}`,
    });
  }

  await emitMessageCreated(refreshed, refreshed?.messages?.[0]);

  return serializeThread(refreshed, user);
}


function normalizeContextType(value) {
  return String(value || "general").trim().toLowerCase();
}

function readableContext(value) {
  return String(value || "SmartSell")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isAdminUser(user) {
  return adminRoles.includes(user?.role);
}

function isBusinessUser(user) {
  return businessRoles.includes(user?.role);
}

function buildParticipantPayload({ sender, recipient, contextOwner = null, admin = null }) {
  const payload = {
    customerId: null,
    businessUserId: null,
    adminId: null,
  };

  [sender, recipient, contextOwner, admin].filter(Boolean).forEach((participant) => {
    if (adminRoles.includes(participant.role)) payload.adminId ||= participant.id;
    else if (businessRoles.includes(participant.role)) payload.businessUserId ||= participant.id;
    else payload.customerId ||= participant.id;
  });

  return payload;
}

async function resolveContextTarget(payload, user) {
  const contextType = normalizeContextType(payload.contextType);
  const contextId = String(payload.contextId || "").trim();
  if (!contextId) throw new Error("Context id is required.");

  const defaultAdmin = await findDefaultAdmin();
  let subject = String(payload.subject || "").trim();
  let recipient = null;
  let contextOwner = null;
  let contextLabel = readableContext(contextType);
  let link = "/inbox";

  if (contextType === "product") {
    const product = await prisma.product.findUnique({
      where: { id: contextId },
      include: { createdBy: true, seller: { include: { user: true } } },
    });
    if (!product) throw new Error("Product not found for message context.");
    contextLabel = product.name;
    link = `/products/${product.id}`;
    contextOwner = product.createdBy || product.seller?.user || null;
    recipient = isAdminUser(user) ? contextOwner : (contextOwner?.id === user.id ? defaultAdmin : contextOwner || defaultAdmin);
    subject ||= `Question about product: ${product.name}`;
  } else if (contextType === "service") {
    const service = await prisma.service.findUnique({
      where: { id: contextId },
      include: { createdBy: true, provider: { include: { user: true } } },
    });
    if (!service) throw new Error("Service not found for message context.");
    contextLabel = service.title;
    link = `/services/${service.id}`;
    contextOwner = service.createdBy || service.provider?.user || null;
    recipient = isAdminUser(user) ? contextOwner : (contextOwner?.id === user.id ? defaultAdmin : contextOwner || defaultAdmin);
    subject ||= `Question about service: ${service.title}`;
  } else if (contextType === "order") {
    const order = await prisma.order.findUnique({ where: { id: contextId }, include: { customer: true } });
    if (!order) throw new Error("Order not found for message context.");
    contextLabel = order.orderNo;
    link = `/orders`;
    contextOwner = order.customer || null;
    recipient = isAdminUser(user) ? contextOwner : defaultAdmin;
    subject ||= `Order discussion: ${order.orderNo}`;
  } else if (contextType === "request") {
    const request = await prisma.customRequest.findUnique({ where: { id: contextId }, include: { user: true } });
    if (!request) throw new Error("Request not found for message context.");
    contextLabel = readableContext(request.requestType || "Custom request");
    link = `/my-requests`;
    contextOwner = request.user || null;
    recipient = isAdminUser(user) ? contextOwner : defaultAdmin;
    subject ||= `Request discussion: ${contextLabel}`;
  } else if (contextType === "offer") {
    const offer = await prisma.productOffer.findUnique({
      where: { id: contextId },
      include: { buyer: true, seller: true, product: true },
    });
    if (!offer) throw new Error("Offer not found for message context.");
    contextLabel = offer.offerNo;
    link = `/offers`;
    if (user.id === offer.buyerId) recipient = offer.seller || defaultAdmin;
    else if (user.id === offer.sellerId) recipient = offer.buyer || defaultAdmin;
    else if (isAdminUser(user)) recipient = offer.buyer || offer.seller || null;
    else recipient = defaultAdmin;
    contextOwner = offer.seller || offer.buyer || null;
    subject ||= `Offer discussion: ${offer.offerNo} - ${offer.product?.name || "Product"}`;
  } else if (contextType === "support") {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: contextId }, include: { user: true, assignedAdmin: true } });
    if (!ticket) throw new Error("Support ticket not found for message context.");
    contextLabel = ticket.ticketNo;
    link = `/support`;
    contextOwner = ticket.user || null;
    recipient = isAdminUser(user) ? contextOwner : ticket.assignedAdmin || defaultAdmin;
    subject ||= `Support ticket discussion: ${ticket.ticketNo}`;
  } else {
    recipient = payload.recipientId ? await prisma.user.findUnique({ where: { id: String(payload.recipientId) } }) : defaultAdmin;
    subject ||= "SmartSell message";
  }

  if (!recipient) throw new Error("No valid recipient found for this conversation.");
  if (recipient.id === user.id) {
    recipient = defaultAdmin?.id !== user.id ? defaultAdmin : null;
  }
  if (!recipient) throw new Error("Cannot create a conversation with yourself.");

  return { contextType, contextId, subject, recipient, contextOwner, defaultAdmin, contextLabel, link };
}

export async function startContextThread(payload, user) {
  const body = String(payload.message || payload.body || "").trim();
  if (!body) throw new Error("Message is required.");

  const resolved = await resolveContextTarget(payload, user);
  const participants = buildParticipantPayload({
    sender: user,
    recipient: resolved.recipient,
    contextOwner: resolved.contextOwner,
    admin: isAdminUser(user) || isAdminUser(resolved.recipient) ? (isAdminUser(user) ? user : resolved.recipient) : resolved.defaultAdmin,
  });

  const participantFilters = [
    participants.customerId ? { customerId: participants.customerId } : null,
    participants.businessUserId ? { businessUserId: participants.businessUserId } : null,
    participants.adminId ? { adminId: participants.adminId } : null,
  ].filter(Boolean);

  const existing = await prisma.messageThread.findFirst({
    where: {
      contextType: resolved.contextType,
      contextId: resolved.contextId,
      ...(participantFilters.length ? { AND: participantFilters } : {}),
    },
    include: threadIncludeFull,
    orderBy: { updatedAt: "desc" },
  });

  let thread;
  if (existing && canAccessThread(existing, user)) {
    await prisma.$transaction(async (tx) => {
      await tx.message.create({
        data: {
          threadId: existing.id,
          senderId: user.id,
          recipientId: resolved.recipient.id,
          body,
        },
      });
      await tx.messageThread.update({ where: { id: existing.id }, data: { updatedAt: new Date() } });
    });
    thread = await prisma.messageThread.findUnique({ where: { id: existing.id }, include: threadIncludeFull });
  } else {
    thread = await prisma.messageThread.create({
      data: {
        subject: resolved.subject,
        contextType: resolved.contextType,
        contextId: resolved.contextId,
        ...participants,
        createdById: user.id,
        messages: {
          create: {
            senderId: user.id,
            recipientId: resolved.recipient.id,
            body,
          },
        },
      },
      include: threadIncludeFull,
    });
  }

  await createNotification({
    userId: resolved.recipient.id,
    title: `${readableContext(resolved.contextType)} message`,
    message: `${user.name} sent a message about ${resolved.contextLabel}.`,
    type: "message",
    link: `/inbox?thread=${thread.id}`,
  });

  await emitMessageCreated(thread, thread.messages?.[0]);

  return serializeThread(thread, user);
}

export async function communicationSummary(user) {
  const summary = await communicationSummaryByUserId(user.id);
  return {
    ...summary,
    realtimeOnline: isUserOnline(user.id),
    onlineUserIds: getOnlineUserIds(),
  };
}
