import { prisma } from "../config/prisma.js";

function toNumber(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  if (typeof value.toNumber === "function") return value.toNumber();
  return Number(value) || 0;
}

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function monthKey(date) {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(key) {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function getLastMonthKeys(count = 8) {
  const keys = [];
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);

  for (let index = count - 1; index >= 0; index -= 1) {
    const current = new Date(date);
    current.setMonth(date.getMonth() - index);
    keys.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`);
  }

  return keys;
}

function serializeSimpleUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    businessName: user.businessName,
  };
}

function serializeOrderLite(order) {
  return {
    id: order.id,
    orderNo: order.orderNo,
    status: order.status,
    paymentStatus: order.paymentStatus,
    totalAmount: toNumber(order.totalAmount),
    deliveryStatus: order.deliveryStatus,
    customer: serializeSimpleUser(order.customer),
    items: order.items?.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: toNumber(item.price),
    })) || [],
    createdAt: order.createdAt,
  };
}

function serializeLowStock(product) {
  return {
    id: product.id,
    name: product.name,
    stock: product.stock,
    status: product.status,
    type: product.type,
    price: toNumber(product.price),
    seller: product.createdBy ? serializeSimpleUser(product.createdBy) : null,
    category: product.category?.name || null,
  };
}

export async function getAdminAnalytics() {
  const thirtyDaysAgo = startOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const sevenDaysAgo = startOfDay(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const monthKeys = getLastMonthKeys(8);
  const firstMonth = new Date(`${monthKeys[0]}-01T00:00:00.000Z`);

  const [
    usersTotal,
    customersTotal,
    sellersTotal,
    activeUsers,
    pendingUsers,
    blockedUsers,
    productsTotal,
    approvedProducts,
    pendingProducts,
    rejectedProducts,
    usedProducts,
    servicesTotal,
    approvedServices,
    pendingServices,
    requestsTotal,
    activeRequests,
    quotedRequests,
    completedRequests,
    ordersTotal,
    activeOrders,
    deliveredOrders,
    paidOrders,
    pendingReviews,
    unreadNotifications,
    unreadMessages,
    revenueAllTime,
    revenueLast30,
    commissionAllTime,
    commissionLast30,
    payoutsPending,
    recentOrders,
    lowStockProducts,
    productCategoryRows,
    serviceCategoryRows,
    ordersForTrend,
    requestsForTrend,
    recentAdminActions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "customer" } }),
    prisma.user.count({ where: { role: { in: ["seller", "shop", "service_provider"] } } }),
    prisma.user.count({ where: { status: "active" } }),
    prisma.user.count({ where: { status: "pending_approval" } }),
    prisma.user.count({ where: { status: "blocked" } }),
    prisma.product.count(),
    prisma.product.count({ where: { status: "approved" } }),
    prisma.product.count({ where: { status: "pending" } }),
    prisma.product.count({ where: { status: "rejected" } }),
    prisma.product.count({ where: { type: "used_product" } }),
    prisma.service.count(),
    prisma.service.count({ where: { status: "approved" } }),
    prisma.service.count({ where: { status: "pending" } }),
    prisma.customRequest.count(),
    prisma.customRequest.count({ where: { status: { in: ["new", "pending", "quoted", "accepted", "in_progress"] } } }),
    prisma.customRequest.count({ where: { status: "quoted" } }),
    prisma.customRequest.count({ where: { status: "completed" } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ["pending", "confirmed", "processing", "ready"] } } }),
    prisma.order.count({ where: { status: "delivered" } }),
    prisma.order.count({ where: { paymentStatus: "paid" } }),
    prisma.review.count({ where: { status: "pending" } }),
    prisma.notification.count({ where: { isRead: false } }).catch(() => 0),
    prisma.message.count({ where: { readAt: null } }).catch(() => 0),
    prisma.order.aggregate({ where: { paymentStatus: "paid" }, _sum: { totalAmount: true } }),
    prisma.order.aggregate({ where: { paymentStatus: "paid", createdAt: { gte: thirtyDaysAgo } }, _sum: { totalAmount: true } }),
    prisma.commission.aggregate({ _sum: { commissionAmount: true } }).catch(() => ({ _sum: { commissionAmount: 0 } })),
    prisma.commission.aggregate({ where: { createdAt: { gte: thirtyDaysAgo } }, _sum: { commissionAmount: true } }).catch(() => ({ _sum: { commissionAmount: 0 } })),
    prisma.payoutRequest.count({ where: { status: "pending" } }).catch(() => 0),
    prisma.order.findMany({
      include: { customer: true, items: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.product.findMany({
      where: { stock: { lte: 3 }, status: { in: ["approved", "pending"] } },
      include: { category: true, createdBy: true },
      orderBy: [{ stock: "asc" }, { updatedAt: "desc" }],
      take: 8,
    }),
    prisma.product.findMany({
      where: { status: "approved" },
      select: { categoryId: true },
    }),
    prisma.service.findMany({
      where: { status: "approved" },
      select: { categoryId: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: firstMonth } },
      select: { createdAt: true, totalAmount: true, paymentStatus: true },
    }),
    prisma.customRequest.findMany({
      where: { createdAt: { gte: firstMonth } },
      select: { createdAt: true, status: true },
    }),
    prisma.adminAction.findMany({
      include: { admin: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }).catch(() => []),
  ]);

  function countCategoryRows(rows) {
    const counts = new Map();
    rows.forEach((row) => {
      const key = row.categoryId || "uncategorized";
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([categoryId, count]) => ({ categoryId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }

  const productCategoryCounts = countCategoryRows(productCategoryRows);
  const serviceCategoryCounts = countCategoryRows(serviceCategoryRows);
  const categoryIds = [
    ...new Set([
      ...productCategoryCounts.map((row) => row.categoryId).filter((id) => id !== "uncategorized"),
      ...serviceCategoryCounts.map((row) => row.categoryId).filter((id) => id !== "uncategorized"),
    ]),
  ];

  const categories = categoryIds.length
    ? await prisma.category.findMany({ where: { id: { in: categoryIds } } })
    : [];
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  const productCategories = productCategoryCounts.map((row) => ({
    id: row.categoryId,
    name: categoryMap.get(row.categoryId)?.name || "Uncategorized",
    count: row.count,
  }));

  const serviceCategories = serviceCategoryCounts.map((row) => ({
    id: row.categoryId,
    name: categoryMap.get(row.categoryId)?.name || "Uncategorized",
    count: row.count,
  }));

  const trendMap = new Map(monthKeys.map((key) => [key, {
    key,
    label: formatMonthLabel(key),
    orders: 0,
    requests: 0,
    revenue: 0,
  }]));

  ordersForTrend.forEach((order) => {
    const key = monthKey(order.createdAt);
    const bucket = trendMap.get(key);
    if (!bucket) return;
    bucket.orders += 1;
    if (order.paymentStatus === "paid") bucket.revenue += toNumber(order.totalAmount);
  });

  requestsForTrend.forEach((request) => {
    const key = monthKey(request.createdAt);
    const bucket = trendMap.get(key);
    if (!bucket) return;
    bucket.requests += 1;
  });

  const trends = Array.from(trendMap.values());
  const maxRevenue = Math.max(...trends.map((item) => item.revenue), 1);
  const maxActivity = Math.max(...trends.map((item) => item.orders + item.requests), 1);

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      usersTotal,
      customersTotal,
      sellersTotal,
      activeUsers,
      pendingUsers,
      blockedUsers,
      productsTotal,
      approvedProducts,
      pendingProducts,
      rejectedProducts,
      usedProducts,
      servicesTotal,
      approvedServices,
      pendingServices,
      requestsTotal,
      activeRequests,
      quotedRequests,
      completedRequests,
      ordersTotal,
      activeOrders,
      deliveredOrders,
      paidOrders,
      pendingReviews,
      unreadNotifications,
      unreadMessages,
      payoutsPending,
      revenueAllTime: toNumber(revenueAllTime._sum.totalAmount),
      revenueLast30: toNumber(revenueLast30._sum.totalAmount),
      commissionAllTime: toNumber(commissionAllTime._sum.commissionAmount),
      commissionLast30: toNumber(commissionLast30._sum.commissionAmount),
      newUsersLast7: await prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      newOrdersLast7: await prisma.order.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      newRequestsLast7: await prisma.customRequest.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    },
    trends: trends.map((item) => ({
      ...item,
      revenuePercent: Math.round((item.revenue / maxRevenue) * 100),
      activityPercent: Math.round(((item.orders + item.requests) / maxActivity) * 100),
    })),
    productCategories,
    serviceCategories,
    recentOrders: recentOrders.map(serializeOrderLite),
    lowStockProducts: lowStockProducts.map(serializeLowStock),
    recentAdminActions: recentAdminActions.map((action) => ({
      id: action.id,
      action: action.action,
      targetType: action.targetType,
      targetId: action.targetId,
      note: action.note,
      admin: serializeSimpleUser(action.admin),
      createdAt: action.createdAt,
    })),
  };
}
