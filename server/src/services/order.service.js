import { prisma } from "../config/prisma.js";
import { cancelOrderCommissions, createOrderCommissionsForPaidOrder } from "./finance.service.js";
import { createNotification, notifyAdmins } from "./communication.service.js";
import { markCouponUsed, validateCouponCode } from "./promotion.service.js";

function toNumber(value) {
  if (value === null || value === undefined) return value;
  return Number(value);
}

function makeOrderNo() {
  const stamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SS-${stamp}-${random}`;
}

function normalizeQuantity(value) {
  const quantity = Number(value || 1);
  if (!Number.isFinite(quantity) || quantity < 1) return 1;
  return Math.floor(quantity);
}

function parseOptionalDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

function cleanOptionalText(value) {
  if (value === undefined) return undefined;
  const text = String(value || "").trim();
  return text || null;
}

async function notifyOrderCreated(order) {
  if (order?.customerId) {
    await createNotification({
      userId: order.customerId,
      title: `Order ${order.orderNo} placed`,
      message: `Your order was submitted successfully. Total: Rs. ${Number(order.totalAmount).toLocaleString()}. SmartSell will update you when the status changes.`,
      type: "order",
      link: "/orders",
    });
  }

  await notifyAdmins({
    title: "New order received",
    message: `${order.orderNo} needs confirmation. Total: Rs. ${Number(order.totalAmount).toLocaleString()}.`,
    type: "order",
    link: "/admin",
  });

  const sellerIds = new Set();
  for (const item of order.items || []) {
    const sellerUserId = item.product?.seller?.user?.id;
    if (sellerUserId) sellerIds.add(sellerUserId);
  }

  await Promise.all(
    Array.from(sellerIds).map((sellerId) =>
      createNotification({
        userId: sellerId,
        title: "New product order",
        message: `${order.orderNo} includes one of your products. Admin will confirm fulfillment.`,
        type: "order",
        link: "/business",
      })
    )
  );
}

async function notifyOrderUpdated(order) {
  if (!order?.customerId) return;
  await createNotification({
    userId: order.customerId,
    title: `Order ${order.orderNo} updated`,
    message: `Status: ${String(order.status).replaceAll("_", " ")}. Delivery: ${String(order.deliveryStatus || "not_assigned").replaceAll("_", " ")}. Payment: ${String(order.paymentStatus).replaceAll("_", " ")}.`,
    type: "order",
    link: "/orders",
  });
}

export function serializeOrder(order) {
  if (!order) return null;

  return {
    id: order.id,
    orderNo: order.orderNo,
    status: order.status,
    paymentStatus: order.paymentStatus,
    subtotalAmount: toNumber(order.subtotalAmount ?? order.totalAmount),
    discountAmount: toNumber(order.discountAmount || 0),
    couponCode: order.couponCode || null,
    totalAmount: toNumber(order.totalAmount),
    deliveryName: order.deliveryName,
    deliveryPhone: order.deliveryPhone,
    deliveryAddress: order.deliveryAddress,
    deliveryStatus: order.deliveryStatus || "not_assigned",
    courierName: order.courierName,
    trackingNumber: order.trackingNumber,
    deliveryNote: order.deliveryNote,
    estimatedDelivery: order.estimatedDelivery,
    deliveredAt: order.deliveredAt,
    customer: order.customer
      ? {
          id: order.customer.id,
          name: order.customer.name,
          email: order.customer.email,
          phone: order.customer.phone,
        }
      : null,
    items: (order.items || []).map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: toNumber(item.price),
      lineTotal: toNumber(item.price) * item.quantity,
      seller: item.product?.seller?.user
        ? {
            id: item.product.seller.user.id,
            name: item.product.seller.user.name,
            email: item.product.seller.user.email,
            businessName: item.product.seller.businessName || item.product.seller.shopName,
          }
        : null,
      product: item.product
        ? {
            id: item.product.id,
            name: item.product.name,
            image: item.product.images?.[0]?.url || null,
            status: item.product.status,
          }
        : null,
    })),
    payments: (order.payments || []).map((payment) => ({
      id: payment.id,
      amount: toNumber(payment.amount),
      method: payment.method,
      status: payment.status,
      reference: payment.reference,
      createdAt: payment.createdAt,
    })),
    commissions: (order.commissions || []).map((commission) => ({
      id: commission.id,
      sellerId: commission.sellerId,
      grossAmount: toNumber(commission.grossAmount),
      commissionAmount: toNumber(commission.commissionAmount),
      sellerAmount: toNumber(commission.sellerAmount),
      status: commission.status,
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

const orderInclude = {
  customer: true,
  items: {
    include: {
      product: {
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          seller: { include: { user: true } },
        },
      },
    },
  },
  payments: { orderBy: { createdAt: "desc" } },
  commissions: true,
};

export async function listOrders(user) {
  const isAdmin = ["admin", "super_admin"].includes(user?.role);

  const orders = await prisma.order.findMany({
    where: isAdmin ? {} : { customerId: user.id },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
    take: isAdmin ? 150 : 50,
  });

  return orders.map(serializeOrder);
}

export async function getOrder(orderId, user) {
  const isAdmin = ["admin", "super_admin"].includes(user?.role);

  const order = await prisma.order.findFirst({
    where: isAdmin ? { id: orderId } : { id: orderId, customerId: user.id },
    include: orderInclude,
  });

  return serializeOrder(order);
}

export async function createOrder(payload, user) {
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!items.length) throw new Error("Cart is empty. Add at least one product before checkout.");

  const deliveryName = String(payload.deliveryName || user?.name || "").trim();
  const deliveryPhone = String(payload.deliveryPhone || user?.phone || "").trim();
  const deliveryAddress = String(payload.deliveryAddress || "").trim();

  if (!deliveryName || !deliveryPhone || !deliveryAddress) {
    throw new Error("Delivery name, phone, and address are required.");
  }

  const requestedMap = new Map();
  for (const item of items) {
    const productId = String(item.productId || item.id || "");
    if (!productId) continue;
    requestedMap.set(productId, (requestedMap.get(productId) || 0) + normalizeQuantity(item.quantity));
  }

  const requested = Array.from(requestedMap.entries()).map(([productId, quantity]) => ({ productId, quantity }));

  if (!requested.length) throw new Error("No valid products found in cart.");

  const productIds = requested.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: "approved" },
  });

  const productMap = new Map(products.map((product) => [product.id, product]));

  const orderItems = requested.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new Error("One or more products are not available for ordering.");
    if (product.isStockTracked !== false && !product.allowBackorder && product.stock < item.quantity) {
      throw new Error(`${product.name} has only ${product.stock} item(s) available.`);
    }
    return {
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      price: Number(product.price),
    };
  });

  const subtotalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let couponResult = null;

  if (payload.couponCode) {
    couponResult = await validateCouponCode(payload.couponCode, subtotalAmount);
  }

  const discountAmount = couponResult?.discountAmount || 0;
  const totalAmount = Math.max(0, subtotalAmount - discountAmount);

  const order = await prisma.$transaction(async (tx) => {
    const stockSnapshots = new Map();
    for (const item of orderItems) {
      const product = productMap.get(item.productId);
      const previousStock = Number(product.stock || 0);
      const newStock = previousStock - item.quantity;
      stockSnapshots.set(item.productId, { previousStock, newStock });

      if (product.isStockTracked !== false) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    const createdOrder = await tx.order.create({
      data: {
        orderNo: makeOrderNo(),
        customerId: user.id,
        status: "pending",
        paymentStatus: "unpaid",
        deliveryStatus: "not_assigned",
        subtotalAmount,
        discountAmount,
        couponCode: couponResult?.couponCode || null,
        totalAmount,
        deliveryName,
        deliveryPhone,
        deliveryAddress,
        items: {
          create: orderItems.map((item) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: orderInclude,
    });

    for (const item of orderItems) {
      const product = productMap.get(item.productId);
      if (product?.isStockTracked === false) continue;
      const snapshot = stockSnapshots.get(item.productId);
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          orderId: createdOrder.id,
          type: "sale",
          quantity: -Math.abs(item.quantity),
          previousStock: snapshot.previousStock,
          newStock: snapshot.newStock,
          reason: `Order ${createdOrder.orderNo}`,
          reference: createdOrder.orderNo,
          createdById: user?.id || null,
        },
      });
    }

    if (couponResult?.coupon?.id) {
      await markCouponUsed(couponResult.coupon.id, tx);
    }

    return createdOrder;
  });

  await notifyOrderCreated(order);

  return serializeOrder(order);
}

export async function updateOrderStatus(orderId, payload) {
  const allowedOrderStatuses = ["pending", "confirmed", "processing", "ready", "delivered", "cancelled"];
  const allowedPaymentStatuses = ["unpaid", "pending", "paid", "failed", "refunded"];
  const allowedDeliveryStatuses = ["not_assigned", "assigned", "picked_up", "on_the_way", "delivered", "failed"];

  const status = allowedOrderStatuses.includes(payload.status) ? payload.status : undefined;
  const paymentStatus = allowedPaymentStatuses.includes(payload.paymentStatus) ? payload.paymentStatus : undefined;
  const deliveryStatus = allowedDeliveryStatuses.includes(payload.deliveryStatus) ? payload.deliveryStatus : undefined;

  const data = {
    ...(status ? { status } : {}),
    ...(paymentStatus ? { paymentStatus } : {}),
    ...(deliveryStatus ? { deliveryStatus } : {}),
    ...(payload.courierName !== undefined ? { courierName: cleanOptionalText(payload.courierName) } : {}),
    ...(payload.trackingNumber !== undefined ? { trackingNumber: cleanOptionalText(payload.trackingNumber) } : {}),
    ...(payload.deliveryNote !== undefined ? { deliveryNote: cleanOptionalText(payload.deliveryNote) } : {}),
    ...(payload.estimatedDelivery !== undefined ? { estimatedDelivery: parseOptionalDate(payload.estimatedDelivery) || null } : {}),
  };

  if (status === "delivered" || deliveryStatus === "delivered") {
    data.status = "delivered";
    data.deliveryStatus = "delivered";
    data.deliveredAt = new Date();
  }

  if (!Object.keys(data).length) {
    throw new Error("Valid order, payment, delivery status, or delivery detail is required.");
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data,
        include: orderInclude,
      });

      if (updatedOrder.status === "delivered" && updatedOrder.paymentStatus === "paid") {
        const existingPaidPayment = await tx.payment.findFirst({
          where: { orderId: updatedOrder.id, status: "paid" },
        });

        if (!existingPaidPayment) {
          await tx.payment.create({
            data: {
              orderId: updatedOrder.id,
              amount: updatedOrder.totalAmount,
              method: "manual_admin",
              status: "paid",
              reference: `ADMIN-${updatedOrder.orderNo}`,
            },
          });
        }

        await createOrderCommissionsForPaidOrder(updatedOrder.id, tx);
      }

      if (updatedOrder.status === "cancelled") {
        await cancelOrderCommissions(updatedOrder.id, tx);
      }

      return tx.order.findUnique({
        where: { id: updatedOrder.id },
        include: orderInclude,
      });
    });

    await notifyOrderUpdated(order);
    return serializeOrder(order);
  } catch (error) {
    if (error.code === "P2025") return null;
    throw error;
  }
}
