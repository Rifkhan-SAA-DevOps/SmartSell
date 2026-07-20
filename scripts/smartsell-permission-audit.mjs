import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const checks = [];
const errors = [];

function check(condition, success, failure) {
  if (condition) checks.push(`✅ ${success}`);
  else errors.push(`❌ ${failure}`);
}

const schema = read("server/prisma/schema.prisma");
const roleBlock = schema.match(/enum\s+Role\s*\{([\s\S]*?)\}/)?.[1] || "";
const prismaRoles = roleBlock
  .split(/\r?\n/)
  .map((line) => line.trim().split(/\s+/)[0])
  .filter(Boolean);

check(
  JSON.stringify(prismaRoles) === JSON.stringify(["customer", "seller", "shop", "service_provider", "delivery_partner", "admin", "super_admin"]),
  "Prisma user-role enum matches the supported permission model.",
  `Unexpected Prisma role model: ${prismaRoles.join(", ")}`
);

const productRoutes = read("server/src/routes/product.routes.js");
const serviceRoutes = read("server/src/routes/service.routes.js");
const sellerRoutes = read("server/src/routes/seller.routes.js");
const uploadRoutes = read("server/src/routes/upload.routes.js");
const businessService = read("server/src/services/business.service.js");
const inventoryService = read("server/src/services/inventory.service.js");
const offerService = read("server/src/services/offer.service.js");
const reviewService = read("server/src/services/review.service.js");
const deliveryService = read("server/src/services/delivery.service.js");
const financeService = read("server/src/services/finance.service.js");
const marketplaceService = read("server/src/services/marketplace.service.js");
const orderService = read("server/src/services/order.service.js");
const adminRoutes = read("server/src/routes/admin.routes.js");
const app = read("client/src/App.jsx");
const sidebar = read("client/src/components/Sidebar.jsx");
const layout = read("client/src/components/AppLayout.jsx");
const sellerHub = read("client/src/pages/SellerHub.jsx");

check(
  /router\.post\("\/", requireAuth, requireRoles\("seller", "shop", "admin", "super_admin"\)/.test(productRoutes),
  "Product creation is restricted to product sellers and administrators.",
  "Product creation route is not role-restricted."
);
check(
  /router\.post\("\/", requireAuth, requireRoles\("service_provider", "admin", "super_admin"\)/.test(serviceRoutes),
  "Service creation is restricted to service providers and administrators.",
  "Service creation route is not role-restricted."
);
check(
  /router\.post\("\/", requireAuth, requireRoles\("admin", "super_admin"\)/.test(sellerRoutes),
  "Legacy seller-profile creation is administrator-only.",
  "Legacy seller-profile creation remains publicly accessible."
);
check(
  /listing-images", requireAuth, requireRoles\("seller", "shop", "service_provider", "admin", "super_admin"\)/.test(uploadRoutes),
  "Listing-image uploads use business/admin role protection.",
  "Listing-image uploads are not role-protected."
);

check(
  productRoutes.includes('listProducts({ ...req.query, status: "approved" })') && serviceRoutes.includes('listServices({ ...req.query, status: "approved" })'),
  "Public listing endpoints cannot request pending, rejected, archived, or draft data.",
  "Public listing endpoints still trust a caller-supplied status filter."
);
check(
  marketplaceService.includes('status: "approved"') && marketplaceService.includes('createdBy: { is: { status: "active" } }'),
  "Public listing details and collections require approved listings from active owners.",
  "Public listing visibility does not enforce approval and active-owner status."
);
check(
  orderService.includes('stock: { gte: item.quantity }') && orderService.includes('stockUpdate.count !== 1'),
  "Checkout uses atomic stock reservation to prevent overselling.",
  "Checkout stock checks are not atomic."
);
check(
  offerService.includes("You already have an active offer") && offerService.includes('status: { in: ["pending", "countered"] }'),
  "Product offers prevent duplicate active submissions.",
  "Product offers allow duplicate active submissions."
);
check(
  adminRoutes.includes('user.status === "active"'),
  "Only active business accounts are offered as request assignees.",
  "Pending or blocked accounts can still be assigned customer requests."
);
check(
  businessService.includes("ownerListingStatus") && businessService.includes("isAdmin(user) ? approvalStatusToDb(payload.status) : ownerListingStatus(payload.status)"),
  "Business owners cannot approve or reject their own listings.",
  "Business listing updates can bypass admin approval."
);
check(
  inventoryService.includes("const safePayload = isAdmin(user)") && inventoryService.includes('status: "pending"'),
  "Advanced catalog updates sanitize owner payloads and return reviewed listings to pending.",
  "Advanced catalog updates may allow owner approval/featured escalation."
);
check(
  offerService.includes("OFFER_TRANSITIONS") && offerService.includes("assertOfferTransition"),
  "Product-offer state changes use an explicit transition model.",
  "Product offers do not have transition protection."
);
check(
  businessService.includes("BUSINESS_REQUEST_TRANSITIONS") && businessService.includes("assertBusinessRequestTransition"),
  "Assigned requests use sequential business status transitions.",
  "Assigned requests can jump between arbitrary statuses."
);
check(
  deliveryService.includes("DELIVERY_TRANSITIONS") && deliveryService.includes("Only active delivery partners can receive assignments"),
  "Delivery assignment and partner status changes are permission-safe.",
  "Delivery workflow lacks assignment/status safeguards."
);
check(
  reviewService.includes("You cannot review your own product") && reviewService.includes("You already submitted a review"),
  "Reviews block self-review and duplicate submissions.",
  "Review submission lacks self-review or duplicate protection."
);
check(
  financeService.includes('isolationLevel: "Serializable"') && financeService.includes("This payout request was already submitted"),
  "Payout requests use serializable balance checks and duplicate protection.",
  "Payout requests remain vulnerable to duplicate/racing submissions."
);

const roleGuardText = `${app}\n${sidebar}\n${layout}`;
check(
  !roleGuardText.includes('"shop_seller"'),
  "Frontend permission guards use only valid Prisma user roles.",
  "Frontend permission guards still include the invalid shop_seller user role."
);
check(
  sellerHub.includes("productSubmitting") && sellerHub.includes("serviceSubmitting"),
  "Listing forms prevent duplicate submissions while requests are running.",
  "Listing forms do not disable duplicate submissions."
);

console.log("# SmartSell API & Permission Reliability Audit\n");
checks.forEach((item) => console.log(item));
if (errors.length) {
  console.log("\n## Blocking permission errors\n");
  errors.forEach((item) => console.error(item));
  process.exitCode = 1;
} else {
  console.log("\n✅ No blocking permission or transition errors found.");
}
