import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const errors = [];
const warnings = [];
const checks = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function pass(message) {
  checks.push(`✅ ${message}`);
}

function fail(message) {
  errors.push(`❌ ${message}`);
}

function warn(message) {
  warnings.push(`⚠️ ${message}`);
}

function extractQuotedArray(source, variableName) {
  const match = source.match(new RegExp(`const\\s+${variableName}\\s*=\\s*\\[([\\s\\S]*?)\\]`));
  if (!match) return [];
  return [...match[1].matchAll(/["']([^"']+)["']/g)].map((item) => item[1]);
}

const schema = read("server/prisma/schema.prisma");
const roleBlock = schema.match(/enum\s+Role\s*\{([\s\S]*?)\}/)?.[1] || "";
const prismaRoles = roleBlock
  .split(/\r?\n/)
  .map((line) => line.trim().split(/\s+/)[0])
  .filter((line) => line && !line.startsWith("//"));

if (prismaRoles.length) pass(`Prisma user roles detected — ${prismaRoles.join(", ")}`);
else fail("Could not read the Prisma Role enum.");

const userManagement = read("client/src/pages/UserManagement.jsx");
for (const variableName of ["roleOptions", "accountCreateRoles"]) {
  const values = extractQuotedArray(userManagement, variableName).filter((value) => value !== "all");
  const invalid = values.filter((value) => !prismaRoles.includes(value));
  if (invalid.length) fail(`${variableName} exposes non-Prisma user roles: ${invalid.join(", ")}`);
  else pass(`${variableName} uses only valid Prisma user roles.`);
}

const userService = read("server/src/services/user.service.js");
if (/role\s*===\s*["']shop_seller["']\s*\?\s*["']shop["']/.test(userService)) {
  pass("Legacy shop_seller input is normalized to the Prisma shop role.");
} else {
  warn("No compatibility normalization was found for legacy shop_seller input.");
}

const clientRoot = path.join(root, "client/src");
const contextTypes = new Set();
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(jsx|js)$/.test(entry.name)) {
      const source = fs.readFileSync(full, "utf8");
      for (const match of source.matchAll(/contextType\s*=\s*["']([^"']+)["']/g)) contextTypes.add(match[1]);
    }
  }
}
walk(clientRoot);

const communicationService = read("server/src/services/communication.service.js");
const handledContexts = new Set(
  [...communicationService.matchAll(/contextType\s*===\s*["']([^"']+)["']/g)].map((match) => match[1])
);
const missingContexts = [...contextTypes].filter((type) => !handledContexts.has(type));
if (missingContexts.length) fail(`Context message types are used by the UI but not resolved by the backend: ${missingContexts.join(", ")}`);
else pass(`All UI context-message types are handled — ${[...contextTypes].sort().join(", ")}`);

const inbox = read("client/src/pages/Inbox.jsx");
const inboxLinks = new Set([...inbox.matchAll(/thread\.contextType\s*===\s*["']([^"']+)["']/g)].map((match) => match[1]));
const missingInboxLinks = [...contextTypes].filter((type) => !inboxLinks.has(type));
if (missingInboxLinks.length) warn(`Inbox has no related-page link for: ${missingInboxLinks.join(", ")}`);
else pass("Inbox related-page links cover every UI context-message type.");

if (communicationService.includes("You do not have access to this request conversation.")) pass("Assigned-request messaging includes access validation.");
else fail("Assigned-request context messaging has no explicit access validation.");

if (communicationService.includes("Review not found for message context.")) pass("Customer-review messaging has a dedicated backend context resolver.");
else fail("Customer-review Message customer action has no dedicated backend resolver.");


const contextButton = read("client/src/components/ContextMessageButton.jsx");
if (/navigate\(\s*["']\/login["']\s*,\s*\{\s*state:\s*\{\s*from:\s*location/.test(contextButton)) {
  pass("Context messaging preserves the original route through login.");
} else {
  fail("Context messaging does not preserve the original route through login.");
}

const packageJson = JSON.parse(read("package.json"));
if (packageJson.scripts?.["audit:workflow"] === "node scripts/smartsell-workflow-audit.mjs") pass("Workflow audit command is configured.");
else fail("Root package.json is missing the audit:workflow command.");

if (String(packageJson.scripts?.check || "").includes("audit:workflow")) pass("The root npm run check includes workflow auditing.");
else fail("The root npm run check does not include workflow auditing.");

console.log("# SmartSell End-to-End Workflow Contract Audit\n");
for (const check of checks) console.log(check);
if (warnings.length) {
  console.log("\n## Warnings");
  for (const item of warnings) console.log(item);
}
if (errors.length) {
  console.log("\n## Errors");
  for (const item of errors) console.log(item);
  process.exitCode = 1;
} else {
  console.log("\n✅ No blocking workflow-contract errors found.");
}
