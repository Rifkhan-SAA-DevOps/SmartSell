import { prisma } from "../config/prisma.js";
import { httpError } from "../utils/httpError.js";

const ADMIN_ROLES = ["admin", "super_admin"];
const DELIVERY_ROLES = ["delivery_partner"];
const DELIVERY_STATUSES = ["not_assigned", "assigned", "picked_up", "on_the_way", "delivered", "failed"];
const DELIVERY_TRANSITIONS = {
  assigned: ["picked_up", "failed"],
  picked_up: ["on_the_way", "failed"],
  on_the_way: ["delivered", "failed"],
  not_assigned: [],
  delivered: [],
  failed: [],
};

function isAdmin(user) {
  return ADMIN_ROLES.includes(user?.role);
}

function isDeliveryPartner(user) {
  return DELIVERY_ROLES.includes(user?.role);
}

function requireDeliveryAccess(user) {
  if (!user || (!isAdmin(user) && !isDeliveryPartner(user))) {
    throw httpError(403, "Delivery access is required.");
  }
}

function assertDeliveryStatus(status) {
  if (!DELIVERY_STATUSES.includes(status)) {
    throw httpError(400, "Invalid delivery status.");
  }
}

const orderInclude = {
  customer: { select: { id: true, name: true, email: true, phone: true } },
  deliveryPartner: { select: { id: true, name: true, email: true, phone: true, businessName: true } },
  items: {
    include: {
      product: {
        include: {
          createdBy: { select: { id: true, name: true, email: true, phone: true } },
          seller: {
            include: {
              user: { select: { id: true, name: true, email: true, phone: true } },
            },
          },
        },
      },
    },
  },
};

export async function listDeliveryPartners(currentUser) {
  if (!isAdmin(currentUser)) throw httpError(403, "Admin access is required.");

  return prisma.user.findMany({
    where: { role: "delivery_partner", status: "active" },
    select: { id: true, name: true, email: true, phone: true, businessName: true, status: true, createdAt: true },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
}

export async function getDeliverySummary(currentUser) {
  requireDeliveryAccess(currentUser);

  const baseWhere = isDeliveryPartner(currentUser) ? { deliveryPartnerId: currentUser.id } : {};

  const [assigned, pickedUp, onTheWay, delivered, failed, activeTasks] = await Promise.all([
    prisma.order.count({ where: { ...baseWhere, deliveryStatus: "assigned" } }),
    prisma.order.count({ where: { ...baseWhere, deliveryStatus: "picked_up" } }),
    prisma.order.count({ where: { ...baseWhere, deliveryStatus: "on_the_way" } }),
    prisma.order.count({ where: { ...baseWhere, deliveryStatus: "delivered" } }),
    prisma.order.count({ where: { ...baseWhere, deliveryStatus: "failed" } }),
    prisma.order.count({ where: { ...baseWhere, deliveryStatus: { in: ["assigned", "picked_up", "on_the_way"] } } }),
  ]);

  return { assigned, pickedUp, onTheWay, delivered, failed, activeTasks };
}

export async function listDeliveryTasks(currentUser, query = {}) {
  requireDeliveryAccess(currentUser);

  const status = String(query.status || "active");
  const where = {};

  if (isDeliveryPartner(currentUser)) {
    where.deliveryPartnerId = currentUser.id;
  }

  if (status === "active") {
    where.deliveryStatus = { in: ["assigned", "picked_up", "on_the_way"] };
  } else if (status === "unassigned") {
    if (!isAdmin(currentUser)) throw httpError(403, "Only admin can view unassigned delivery tasks.");
    where.deliveryStatus = "not_assigned";
  } else if (status === "completed") {
    where.deliveryStatus = "delivered";
  } else if (status === "failed") {
    where.deliveryStatus = "failed";
  } else if (status !== "all") {
    assertDeliveryStatus(status);
    where.deliveryStatus = status;
  }

  return prisma.order.findMany({
    where,
    include: orderInclude,
    orderBy: [{ updatedAt: "desc" }],
    take: 120,
  });
}

export async function assignDeliveryPartner(currentUser, orderId, payload) {
  if (!isAdmin(currentUser)) throw httpError(403, "Admin access is required to assign delivery partners.");

  const deliveryPartnerId = payload.deliveryPartnerId || null;
  let partner = null;

  if (deliveryPartnerId) {
    partner = await prisma.user.findUnique({ where: { id: deliveryPartnerId } });
    if (!partner || partner.role !== "delivery_partner") {
      throw httpError(400, "Selected user is not a delivery partner.");
    }
    if (partner.status !== "active") throw httpError(400, "Only active delivery partners can receive assignments.");
  }

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { customer: true } });
  if (!order) throw httpError(404, "Order was not found.");
  if (["delivered", "cancelled"].includes(order.status) || order.deliveryStatus === "delivered") {
    throw httpError(409, "A completed or cancelled order cannot be assigned for delivery.");
  }

  const nextStatus = deliveryPartnerId ? "assigned" : "not_assigned";
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      deliveryPartnerId,
      deliveryAssignedAt: deliveryPartnerId ? new Date() : null,
      deliveryStatus: nextStatus,
      courierName: payload.courierName ?? partner?.name ?? null,
      deliveryFee: payload.deliveryFee === undefined || payload.deliveryFee === "" ? order.deliveryFee : Number(payload.deliveryFee || 0),
      trackingNumber: payload.trackingNumber ?? order.trackingNumber,
      estimatedDelivery: payload.estimatedDelivery ? new Date(payload.estimatedDelivery) : order.estimatedDelivery,
      deliveryNote: payload.deliveryNote ?? order.deliveryNote,
    },
    include: orderInclude,
  });

  const notifications = [];
  if (partner) {
    notifications.push(prisma.notification.create({
      data: {
        userId: partner.id,
        title: "New delivery task assigned",
        message: `Order ${order.orderNo} was assigned to you for delivery.`,
        type: "delivery",
        link: "/delivery",
      },
    }));
  }
  if (order.customerId) {
    notifications.push(prisma.notification.create({
      data: {
        userId: order.customerId,
        title: "Delivery assigned",
        message: partner ? `${partner.name} is assigned to deliver order ${order.orderNo}.` : `Delivery assignment was updated for order ${order.orderNo}.`,
        type: "delivery",
        link: "/orders",
      },
    }));
  }
  notifications.push(prisma.adminAction.create({
    data: {
      adminId: currentUser.id,
      action: "assign_delivery_partner",
      targetType: "order",
      targetId: orderId,
      note: partner ? `Assigned ${partner.name} to ${order.orderNo}` : `Cleared delivery partner for ${order.orderNo}`,
    },
  }));

  await Promise.all(notifications.map((promise) => promise.catch(() => null)));
  return updated;
}

export async function updateDeliveryTaskStatus(currentUser, orderId, payload) {
  requireDeliveryAccess(currentUser);

  const status = String(payload.deliveryStatus || "");
  assertDeliveryStatus(status);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw httpError(404, "Delivery task was not found.");

  if (isDeliveryPartner(currentUser) && order.deliveryPartnerId !== currentUser.id) {
    throw httpError(403, "You can only update delivery tasks assigned to you.");
  }

  if (order.deliveryStatus === status) {
    throw httpError(409, `Delivery is already ${status.replaceAll("_", " ")}.`);
  }

  if (isDeliveryPartner(currentUser)) {
    const allowed = DELIVERY_TRANSITIONS[order.deliveryStatus] || [];
    if (!allowed.includes(status)) {
      throw httpError(409, `Delivery cannot move from ${order.deliveryStatus.replaceAll("_", " ")} to ${status.replaceAll("_", " ")}.`);
    }
  }

  const data = {
    deliveryStatus: status,
    trackingNumber: payload.trackingNumber ?? order.trackingNumber,
    courierName: payload.courierName ?? order.courierName,
    deliveryNote: payload.deliveryNote ?? order.deliveryNote,
  };

  if (payload.estimatedDelivery) data.estimatedDelivery = new Date(payload.estimatedDelivery);
  if (status === "delivered") {
    data.deliveredAt = new Date();
    data.status = "delivered";
  }
  if (status === "failed") {
    data.status = order.status === "delivered" ? order.status : "processing";
  }

  const updated = await prisma.order.update({ where: { id: orderId }, data, include: orderInclude });

  const notifications = [];
  if (order.customerId) {
    notifications.push(prisma.notification.create({
      data: {
        userId: order.customerId,
        title: "Delivery status updated",
        message: `Order ${order.orderNo} delivery is now ${status.replaceAll("_", " ")}.`,
        type: "delivery",
        link: "/orders",
      },
    }));
  }

  const admins = await prisma.user.findMany({ where: { role: { in: ["admin", "super_admin"] }, status: "active" }, select: { id: true } }).catch(() => []);
  admins.forEach((admin) => {
    notifications.push(prisma.notification.create({
      data: {
        userId: admin.id,
        title: "Delivery task updated",
        message: `${currentUser.name} updated order ${order.orderNo} to ${status.replaceAll("_", " ")}.`,
        type: "delivery",
        link: "/fulfillment",
      },
    }));
  });

  await Promise.all(notifications.map((promise) => promise.catch(() => null)));
  return updated;
}
