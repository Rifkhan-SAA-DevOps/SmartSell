import { prisma } from "../config/prisma.js";
import { createNotification, notifyAdmins } from "./communication.service.js";

const adminRoles = ["admin", "super_admin"];
const businessRoles = ["seller", "shop", "service_provider"];

const allowedStatuses = ["open", "reviewing", "waiting_customer", "resolved", "rejected", "closed"];
const allowedPriorities = ["low", "normal", "high", "urgent"];
const allowedIssueTypes = [
  "general",
  "order_issue",
  "delivery_issue",
  "refund_request",
  "payment_issue",
  "seller_issue",
  "service_issue",
  "damaged_item",
  "wrong_item",
  "other",
];

function moneyToNumber(value) {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.businessName || user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
  };
}

function makeTicketNo() {
  const stamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `SST-${stamp}-${random}`;
}

function cleanText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function normalizeIssueType(value) {
  return allowedIssueTypes.includes(value) ? value : "general";
}

function normalizePriority(value) {
  return allowedPriorities.includes(value) ? value : "normal";
}

export function serializeSupportTicket(ticket) {
  if (!ticket) return null;

  return {
    id: ticket.id,
    ticketNo: ticket.ticketNo,
    subject: ticket.subject,
    issueType: ticket.issueType,
    priority: ticket.priority,
    status: ticket.status,
    preferredResolution: ticket.preferredResolution,
    customerMessage: ticket.customerMessage,
    adminNote: ticket.adminNote,
    refundAmount: moneyToNumber(ticket.refundAmount),
    requestId: ticket.requestId,
    user: publicUser(ticket.user),
    assignedAdmin: publicUser(ticket.assignedAdmin),
    order: ticket.order
      ? {
          id: ticket.order.id,
          orderNo: ticket.order.orderNo,
          status: ticket.order.status,
          paymentStatus: ticket.order.paymentStatus,
          deliveryStatus: ticket.order.deliveryStatus,
          totalAmount: moneyToNumber(ticket.order.totalAmount),
        }
      : null,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    resolvedAt: ticket.resolvedAt,
  };
}

const ticketInclude = {
  user: true,
  assignedAdmin: true,
  order: true,
};

async function businessUserOrderIds(user) {
  if (!businessRoles.includes(user.role)) return [];

  const products = await prisma.product.findMany({
    where: { createdById: user.id },
    select: { id: true },
  });

  const productIds = products.map((product) => product.id);
  if (!productIds.length) return [];

  const orderItems = await prisma.orderItem.findMany({
    where: { productId: { in: productIds } },
    select: { orderId: true },
    distinct: ["orderId"],
  });

  return orderItems.map((item) => item.orderId);
}

export async function supportSummary(user) {
  const isAdmin = adminRoles.includes(user.role);
  const orderIds = await businessUserOrderIds(user);

  const where = isAdmin
    ? {}
    : businessRoles.includes(user.role)
      ? { OR: [{ userId: user.id }, { orderId: { in: orderIds.length ? orderIds : ["__none__"] } }] }
      : { userId: user.id };

  const [total, open, urgent, resolved] = await Promise.all([
    prisma.supportTicket.count({ where }),
    prisma.supportTicket.count({ where: { ...where, status: { in: ["open", "reviewing", "waiting_customer"] } } }),
    prisma.supportTicket.count({ where: { ...where, priority: "urgent", status: { notIn: ["resolved", "closed", "rejected"] } } }),
    prisma.supportTicket.count({ where: { ...where, status: { in: ["resolved", "closed"] } } }),
  ]);

  return { total, open, urgent, resolved };
}

export async function listSupportTickets(user) {
  const isAdmin = adminRoles.includes(user.role);
  const orderIds = await businessUserOrderIds(user);

  const where = isAdmin
    ? {}
    : businessRoles.includes(user.role)
      ? { OR: [{ userId: user.id }, { orderId: { in: orderIds.length ? orderIds : ["__none__"] } }] }
      : { userId: user.id };

  const tickets = await prisma.supportTicket.findMany({
    where,
    include: ticketInclude,
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    take: isAdmin ? 200 : 80,
  });

  return tickets.map(serializeSupportTicket);
}

export async function createSupportTicket(payload, user) {
  const subject = cleanText(payload.subject);
  const customerMessage = cleanText(payload.customerMessage || payload.message);

  if (!subject) throw new Error("Subject is required.");
  if (!customerMessage) throw new Error("Please explain the issue before submitting.");

  const orderId = cleanText(payload.orderId) || null;
  let order = null;

  if (orderId) {
    order = await prisma.order.findFirst({
      where: adminRoles.includes(user.role) ? { id: orderId } : { id: orderId, customerId: user.id },
    });
    if (!order) throw new Error("Selected order was not found for this account.");
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNo: makeTicketNo(),
      userId: user.id,
      orderId: order?.id || null,
      requestId: cleanText(payload.requestId) || null,
      subject,
      issueType: normalizeIssueType(payload.issueType),
      priority: normalizePriority(payload.priority),
      preferredResolution: cleanText(payload.preferredResolution) || null,
      customerMessage,
      status: "open",
    },
    include: ticketInclude,
  });

  await notifyAdmins({
    title: "New support ticket",
    message: `${ticket.ticketNo}: ${ticket.subject}`,
    type: "support",
    link: "/support",
  });

  return serializeSupportTicket(ticket);
}

export async function updateSupportTicket(ticketId, payload, user) {
  const isAdmin = adminRoles.includes(user.role);
  const existing = await prisma.supportTicket.findUnique({ where: { id: ticketId }, include: ticketInclude });
  if (!existing) return null;

  if (!isAdmin && existing.userId !== user.id) {
    throw new Error("You can only update your own support tickets.");
  }

  const data = {};

  if (isAdmin) {
    if (payload.status !== undefined) {
      if (!allowedStatuses.includes(payload.status)) throw new Error("Invalid support status.");
      data.status = payload.status;
      if (["resolved", "closed", "rejected"].includes(payload.status)) data.resolvedAt = new Date();
      if (["open", "reviewing", "waiting_customer"].includes(payload.status)) data.resolvedAt = null;
    }

    if (payload.priority !== undefined) {
      if (!allowedPriorities.includes(payload.priority)) throw new Error("Invalid priority.");
      data.priority = payload.priority;
    }

    if (payload.adminNote !== undefined) data.adminNote = cleanText(payload.adminNote) || null;
    if (payload.assignedAdminId !== undefined) data.assignedAdminId = cleanText(payload.assignedAdminId) || null;
    if (payload.refundAmount !== undefined) {
      const amount = moneyToNumber(payload.refundAmount);
      data.refundAmount = amount && amount > 0 ? amount : null;
    }
  } else {
    if (payload.customerMessage !== undefined) {
      const message = cleanText(payload.customerMessage);
      if (!message) throw new Error("Message cannot be empty.");
      data.customerMessage = message;
      if (["waiting_customer", "closed"].includes(existing.status)) data.status = "open";
    }
    if (payload.status === "closed") data.status = "closed";
  }

  const updated = await prisma.supportTicket.update({
    where: { id: ticketId },
    data,
    include: ticketInclude,
  });

  if (isAdmin && updated.userId) {
    await createNotification({
      userId: updated.userId,
      title: `Support ticket ${updated.status}`,
      message: `${updated.ticketNo}: ${updated.adminNote || updated.subject}`,
      type: "support",
      link: "/support",
    });
  }

  return serializeSupportTicket(updated);
}
