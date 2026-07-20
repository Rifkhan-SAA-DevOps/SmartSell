import { PrismaClient } from "@prisma/client";
import { PHASE_134_TARGETS } from "./demo-data-phase134.js";

const prisma = new PrismaClient();

function line(label, actual, expected, ok) {
  const marker = ok ? "PASS" : "FAIL";
  console.log(`${marker.padEnd(4)}  ${label.padEnd(34)} ${String(actual).padStart(4)} / ${expected}`);
}

async function main() {
  const [
    users,
    customers,
    businessUsers,
    categories,
    products,
    approvedProducts,
    budgetProducts,
    services,
    approvedServices,
    requests,
    orders,
    offers,
    reviews,
    wishlistItems,
    notifications,
    messageThreads,
    supportTickets,
    commissions,
    payoutRequests,
    coupons,
    adminActions,
    assignedOrders,
    multiItemOrders,
    pendingListings,
    merchandising,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "customer" } }),
    prisma.user.count({ where: { role: { in: ["seller", "shop", "service_provider"] } } }),
    prisma.category.count(),
    prisma.product.count(),
    prisma.product.count({ where: { status: "approved" } }),
    prisma.product.count({ where: { status: "approved", price: { lte: 1000 } } }),
    prisma.service.count(),
    prisma.service.count({ where: { status: "approved" } }),
    prisma.customRequest.count(),
    prisma.order.count(),
    prisma.productOffer.count(),
    prisma.review.count(),
    prisma.wishlistItem.count(),
    prisma.notification.count(),
    prisma.messageThread.count(),
    prisma.supportTicket.count(),
    prisma.commission.count(),
    prisma.payoutRequest.count(),
    prisma.coupon.count(),
    prisma.adminAction.count(),
    prisma.order.count({ where: { deliveryPartnerId: { not: null } } }),
    prisma.order.count({ where: { items: { some: {} } } }),
    prisma.product.count({ where: { status: { in: ["pending", "rejected", "draft", "archived"] } } }),
    prisma.platformSetting.findUnique({ where: { key: "homeMerchandising.config" } }),
  ]);

  const checks = [
    ["Users", users, PHASE_134_TARGETS.users],
    ["Customers", customers, PHASE_134_TARGETS.customers],
    ["Seller/shop/provider accounts", businessUsers, PHASE_134_TARGETS.businessUsers],
    ["Categories", categories, PHASE_134_TARGETS.categories],
    ["Products", products, PHASE_134_TARGETS.products],
    ["Approved products", approvedProducts, PHASE_134_TARGETS.approvedProducts],
    ["Approved products under Rs. 1,000", budgetProducts, PHASE_134_TARGETS.budgetProducts],
    ["Services", services, PHASE_134_TARGETS.services],
    ["Approved services", approvedServices, PHASE_134_TARGETS.approvedServices],
    ["Customer requests", requests, PHASE_134_TARGETS.requests],
    ["Orders", orders, PHASE_134_TARGETS.orders],
    ["Product offers", offers, PHASE_134_TARGETS.offers],
    ["Reviews", reviews, PHASE_134_TARGETS.reviews],
    ["Wishlist items", wishlistItems, PHASE_134_TARGETS.wishlistItems],
    ["Notifications", notifications, PHASE_134_TARGETS.notifications],
    ["Message threads", messageThreads, PHASE_134_TARGETS.messageThreads],
    ["Support tickets", supportTickets, PHASE_134_TARGETS.supportTickets],
    ["Commissions", commissions, PHASE_134_TARGETS.commissions],
    ["Payout requests", payoutRequests, PHASE_134_TARGETS.payoutRequests],
    ["Coupons", coupons, PHASE_134_TARGETS.coupons],
    ["Admin actions", adminActions, PHASE_134_TARGETS.adminActions],
    ["Orders assigned to delivery partners", assignedOrders, 20],
    ["Orders with item relationships", multiItemOrders, PHASE_134_TARGETS.orders],
    ["Listings in admin-review states", pendingListings, 10],
  ];

  console.log("\nSmartSell Phase 134 live demo-data verification\n");
  let failed = false;
  for (const [label, actual, expected] of checks) {
    const ok = actual >= expected;
    line(label, actual, expected, ok);
    if (!ok) failed = true;
  }

  const config = merchandising?.value && typeof merchandising.value === "object" ? merchandising.value : {};
  const merchandisingChecks = [
    ["Today offers selection", config?.todayOffers?.productIds?.length || 0, 6],
    ["Flash-sale selection", config?.flashSale?.productIds?.length || 0, 5],
    ["Under-1000 selection", config?.budgetCollection?.productIds?.length || 0, 8],
    ["Marketplace highlight slides", config?.marketplaceHighlights?.slides?.length || 0, 3],
  ];
  console.log("");
  for (const [label, actual, expected] of merchandisingChecks) {
    const ok = actual >= expected;
    line(label, actual, expected, ok);
    if (!ok) failed = true;
  }

  if (failed) {
    throw new Error("Demo-data verification failed. Run `npm run data:seed` and review the failed rows above.");
  }

  console.log("\nPhase 134 demo data is ready for multi-page pagination and end-to-end workflow testing.");
}

main()
  .catch((error) => {
    console.error(`\n${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
