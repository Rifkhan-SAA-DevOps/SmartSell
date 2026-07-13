import { prisma } from "../config/prisma.js";
import { getCommissionRate } from "./settings.service.js";

function toNumber(value) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function moneySum(items, field) {
  return items.reduce((sum, item) => sum + toNumber(item[field]), 0);
}

function serializeCommission(commission) {
  return {
    id: commission.id,
    orderNo: commission.order?.orderNo || "-",
    productName: commission.product?.name || commission.orderItem?.name || "SmartSell item",
    grossAmount: toNumber(commission.grossAmount),
    commissionRate: toNumber(commission.commissionRate),
    commissionAmount: toNumber(commission.commissionAmount),
    sellerAmount: toNumber(commission.sellerAmount),
    status: commission.status,
    createdAt: commission.createdAt,
    updatedAt: commission.updatedAt,
  };
}

function serializePayout(payout) {
  return {
    id: payout.id,
    seller: payout.seller
      ? {
          id: payout.seller.id,
          name: payout.seller.name,
          email: payout.seller.email,
          role: payout.seller.role,
          businessName: payout.seller.businessName,
        }
      : null,
    amount: toNumber(payout.amount),
    method: payout.method,
    accountDetails: payout.accountDetails,
    note: payout.note,
    adminNote: payout.adminNote,
    status: payout.status,
    requestedAt: payout.requestedAt,
    processedAt: payout.processedAt,
    updatedAt: payout.updatedAt,
  };
}

export async function createOrderCommissionsForPaidOrder(orderId, txClient = prisma) {
  const order = await txClient.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              seller: { include: { user: true } },
            },
          },
        },
      },
    },
  });

  if (!order || order.status !== "delivered" || order.paymentStatus !== "paid") {
    return { created: 0 };
  }

  let created = 0;

  for (const item of order.items || []) {
    const sellerUserId = item.product?.seller?.user?.id;
    if (!sellerUserId) continue;

    const grossAmount = toNumber(item.price) * Number(item.quantity || 1);
    const commissionRate = await getCommissionRate(txClient);
    const commissionAmount = Number(((grossAmount * commissionRate) / 100).toFixed(2));
    const sellerAmount = Number((grossAmount - commissionAmount).toFixed(2));

    const existing = await txClient.commission.findUnique({ where: { orderItemId: item.id } });
    if (existing) continue;

    await txClient.commission.create({
      data: {
        sellerId: sellerUserId,
        orderId: order.id,
        orderItemId: item.id,
        productId: item.productId,
        grossAmount,
        commissionRate,
        commissionAmount,
        sellerAmount,
        status: "available",
      },
    });
    created += 1;
  }

  return { created };
}

export async function cancelOrderCommissions(orderId, txClient = prisma) {
  await txClient.commission.updateMany({
    where: { orderId, status: { in: ["available", "pending_payout"] } },
    data: { status: "cancelled" },
  });
}

export async function getFinanceSummary(user) {
  const isAdmin = ["admin", "super_admin"].includes(user.role);

  if (isAdmin) {
    const [commissions, payouts, orders] = await Promise.all([
      prisma.commission.findMany({
        include: { seller: true, order: true, orderItem: true, product: true },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.payoutRequest.findMany({
        include: { seller: true },
        orderBy: { requestedAt: "desc" },
        take: 100,
      }),
      prisma.order.findMany({
        where: { paymentStatus: "paid" },
        select: { totalAmount: true },
      }),
    ]);

    const grossSales = orders.reduce((sum, order) => sum + toNumber(order.totalAmount), 0);
    const platformCommission = moneySum(commissions, "commissionAmount");
    const sellerEarnings = moneySum(commissions, "sellerAmount");
    const pendingPayoutAmount = payouts
      .filter((payout) => payout.status === "pending" || payout.status === "approved")
      .reduce((sum, payout) => sum + toNumber(payout.amount), 0);

    return {
      role: "admin",
      stats: {
        grossSales,
        platformCommission,
        sellerEarnings,
        pendingPayoutAmount,
        totalCommissions: commissions.length,
        totalPayoutRequests: payouts.length,
      },
      commissions: commissions.map(serializeCommission),
      payouts: payouts.map(serializePayout),
    };
  }

  const [commissions, payouts] = await Promise.all([
    prisma.commission.findMany({
      where: { sellerId: user.id },
      include: { order: true, orderItem: true, product: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.payoutRequest.findMany({
      where: { sellerId: user.id },
      orderBy: { requestedAt: "desc" },
      take: 50,
    }),
  ]);

  const grossSales = moneySum(commissions, "grossAmount");
  const platformCommission = moneySum(commissions, "commissionAmount");
  const totalSellerEarnings = moneySum(commissions, "sellerAmount");
  const paidOut = payouts.filter((payout) => payout.status === "paid").reduce((sum, payout) => sum + toNumber(payout.amount), 0);
  const pendingPayout = payouts
    .filter((payout) => payout.status === "pending" || payout.status === "approved")
    .reduce((sum, payout) => sum + toNumber(payout.amount), 0);
  const availableBalance = Math.max(
    0,
    commissions.filter((commission) => commission.status === "available").reduce((sum, commission) => sum + toNumber(commission.sellerAmount), 0) - pendingPayout
  );

  return {
    role: "seller",
    stats: {
      grossSales,
      platformCommission,
      totalSellerEarnings,
      paidOut,
      pendingPayout,
      availableBalance,
      totalCommissions: commissions.length,
      totalPayoutRequests: payouts.length,
    },
    commissions: commissions.map(serializeCommission),
    payouts: payouts.map(serializePayout),
  };
}

export async function requestPayout(user, payload) {
  const amount = Number(payload.amount || 0);
  const method = String(payload.method || "bank_transfer").trim();
  const accountDetails = String(payload.accountDetails || "").trim();
  const note = String(payload.note || "").trim() || null;

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Enter a valid payout amount.");
  }
  if (!accountDetails) {
    throw new Error("Payment account details are required.");
  }

  const summary = await getFinanceSummary(user);
  if (amount > summary.stats.availableBalance) {
    throw new Error(`Requested amount is higher than available balance Rs. ${summary.stats.availableBalance.toLocaleString("en-LK")}.`);
  }

  const payout = await prisma.payoutRequest.create({
    data: {
      sellerId: user.id,
      amount,
      method,
      accountDetails,
      note,
      status: "pending",
    },
    include: { seller: true },
  });

  return serializePayout(payout);
}

export async function updatePayoutStatus(payoutId, payload) {
  const allowed = ["pending", "approved", "paid", "rejected"];
  const status = allowed.includes(payload.status) ? payload.status : null;
  if (!status) throw new Error("Valid payout status is required.");

  const adminNote = payload.adminNote === undefined ? undefined : String(payload.adminNote || "").trim() || null;

  const payout = await prisma.$transaction(async (tx) => {
    const current = await tx.payoutRequest.findUnique({ where: { id: payoutId } });
    if (!current) return null;

    if (status === "paid") {
      let remaining = toNumber(current.amount);
      const availableCommissions = await tx.commission.findMany({
        where: { sellerId: current.sellerId, status: "available" },
        orderBy: { createdAt: "asc" },
      });

      for (const commission of availableCommissions) {
        if (remaining <= 0) break;
        await tx.commission.update({
          where: { id: commission.id },
          data: { status: "paid", payoutId: current.id },
        });
        remaining -= toNumber(commission.sellerAmount);
      }
    }

    return tx.payoutRequest.update({
      where: { id: payoutId },
      data: {
        status,
        ...(adminNote !== undefined ? { adminNote } : {}),
        ...(status === "paid" || status === "rejected" ? { processedAt: new Date() } : {}),
      },
      include: { seller: true },
    });
  });

  return payout ? serializePayout(payout) : null;
}
