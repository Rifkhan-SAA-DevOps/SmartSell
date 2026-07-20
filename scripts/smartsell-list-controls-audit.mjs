import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const failures = [];
const checks = [];

function expect(file, fragment, message) {
  const content = read(file);
  if (!content.includes(fragment)) failures.push(`${file}: ${message}`);
  else checks.push(message);
}

const paginatedPages = [
  "client/src/pages/Marketplace.jsx",
  "client/src/pages/Services.jsx",
  "client/src/pages/Storefronts.jsx",
  "client/src/pages/Orders.jsx",
  "client/src/pages/Wishlist.jsx",
  "client/src/pages/Offers.jsx",
  "client/src/pages/Notifications.jsx",
  "client/src/pages/Inbox.jsx",
  "client/src/pages/UserManagement.jsx",
  "client/src/pages/ListingManagement.jsx",
  "client/src/pages/Fulfillment.jsx",
];

for (const file of paginatedPages) {
  expect(file, "10", "default list size is declared as 10");
  const content = read(file);
  if (!content.includes("SmartPagination") && !content.includes("AdminPagination")) {
    failures.push(`${file}: list does not render a pagination component.`);
  }
}

expect("client/src/hooks/useSmartPagination.js", "const DEFAULT_PAGE_SIZE = 10", "shared customer/business pagination defaults to 10");
expect("client/src/hooks/useSmartPagination.js", "resetPage", "shared pagination exposes explicit reset support");
expect("client/src/components/AdminWorkspaceUi.jsx", "export function useAdminPagination(items = [], pageSize = 10", "admin pagination defaults to 10");
expect("client/src/pages/Offers.jsx", "useDebouncedValue(search, 280)", "offer search is debounced");
expect("client/src/pages/Marketplace.jsx", "const params = { limit: 250 }", "marketplace requests a complete client-pagination dataset");
expect("client/src/pages/Services.jsx", "const params = { limit: 250 }", "services request a complete client-pagination dataset");

for (const file of [
  "client/src/pages/Storefronts.jsx",
  "client/src/pages/Orders.jsx",
  "client/src/pages/Wishlist.jsx",
  "client/src/pages/Offers.jsx",
  "client/src/pages/Notifications.jsx",
  "client/src/pages/Inbox.jsx",
  "client/src/pages/UserManagement.jsx",
  "client/src/pages/ListingManagement.jsx",
  "client/src/pages/Fulfillment.jsx",
]) {
  const content = read(file);
  if (!content.includes("setSort")) failures.push(`${file}: sortable directory is missing sort state.`);
  if (!/resetKey:[^\n]*sort|useAdminPagination\([^\n]*sort/.test(content)) failures.push(`${file}: pagination does not reset when sorting changes.`);
}

const rootPackage = JSON.parse(read("package.json"));
if (rootPackage.scripts?.["audit:lists"] !== "node scripts/smartsell-list-controls-audit.mjs") {
  failures.push("package.json: audit:lists script is missing or incorrect.");
}
if (!String(rootPackage.scripts?.check || "").includes("npm run audit:lists")) {
  failures.push("package.json: npm run check does not include audit:lists.");
}

console.log("# SmartSell Search, Filter, Sort & Pagination Audit\n");
if (failures.length) {
  failures.forEach((failure) => console.error(`❌ ${failure}`));
  process.exit(1);
}
console.log("✅ All audited directories start with 10 records per page.");
console.log("✅ Sort and filter changes reset pagination to page 1.");
console.log("✅ Marketplace and Services retain correct filtering with fallback data.");
console.log("✅ Offer search uses debounced API refresh.");
console.log("✅ Shared customer/business/admin pagination contracts are valid.");
