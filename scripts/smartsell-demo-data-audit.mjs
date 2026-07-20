import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = {
  seed: path.join(root, "server", "prisma", "seed.js"),
  expansion: path.join(root, "server", "prisma", "demo-data-phase134.js"),
  verifier: path.join(root, "server", "prisma", "verify-demo-data.js"),
  rootPackage: path.join(root, "package.json"),
  serverPackage: path.join(root, "server", "package.json"),
};

const failures = [];

const relative = (file) => path.relative(root, file).replaceAll("\\", "/");

const requireFile = (name, file) => {
  if (!fs.existsSync(file)) {
    failures.push(`${name} is missing: ${relative(file)}`);
  }
};

const readJsonFile = (label, file) => {
  try {
    const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
    return JSON.parse(text);
  } catch (error) {
    let hint = "";
    try {
      const beginning = fs
        .readFileSync(file, "utf8")
        .replace(/^\uFEFF/, "")
        .slice(0, 40)
        .replaceAll("\r", "\\r")
        .replaceAll("\n", "\\n");
      hint = beginning ? ` File begins with: ${JSON.stringify(beginning)}.` : " File is empty.";
    } catch {
      // The primary read error below is sufficient.
    }

    failures.push(
      `${label} is not valid JSON: ${relative(file)}. ${error.message}.${hint}`,
    );
    return null;
  }
};

Object.entries(files).forEach(([name, file]) => requireFile(name, file));

if (!failures.length) {
  const seed = fs.readFileSync(files.seed, "utf8");
  const expansion = fs.readFileSync(files.expansion, "utf8");
  const verifier = fs.readFileSync(files.verifier, "utf8");
  const rootPackage = readJsonFile("Root package.json", files.rootPackage);
  const serverPackage = readJsonFile("Server package.json", files.serverPackage);

  const requiredSeedFragments = [
    'import { seedPhase134DemoData } from "./demo-data-phase134.js"',
    "await seedPhase134DemoData(prisma",
  ];
  for (const fragment of requiredSeedFragments) {
    if (!seed.includes(fragment)) {
      failures.push(`seed.js does not include required Phase 134 integration: ${fragment}`);
    }
  }

  const requiredExpansionFragments = [
    "export const PHASE_134_TARGETS",
    "products: 48",
    "services: 30",
    "orders: 36",
    "notifications: 50",
    "homeMerchandising.config",
    "seedExpansionOrders",
    "seedExpansionCommunication",
  ];
  for (const fragment of requiredExpansionFragments) {
    if (!expansion.includes(fragment)) {
      failures.push(`demo-data-phase134.js is missing: ${fragment}`);
    }
  }

  if (!verifier.includes("Phase 134 live demo-data verification")) {
    failures.push("verify-demo-data.js does not expose the live verification report.");
  }

  if (rootPackage && serverPackage) {
    const rootScripts = rootPackage.scripts || {};
    const serverScripts = serverPackage.scripts || {};
    const expectedRootScripts = {
      "audit:data": "node scripts/smartsell-demo-data-audit.mjs",
      "data:seed": "npm run db:seed --prefix server",
      "data:verify": "npm run db:verify --prefix server",
    };

    for (const [name, command] of Object.entries(expectedRootScripts)) {
      if (rootScripts[name] !== command) {
        failures.push(`Root package script ${name} must be: ${command}`);
      }
    }

    if (!String(rootScripts.check || "").includes("npm run audit:data")) {
      failures.push("Root check script does not include audit:data.");
    }

    if (serverScripts.check !== "npm --prefix .. run check") {
      failures.push("Server package check script must forward to the project-root check command.");
    }

    if (serverScripts["db:verify"] !== "node prisma/verify-demo-data.js") {
      failures.push("Server package is missing db:verify.");
    }
  }
}

if (failures.length) {
  console.error("SmartSell demo-data audit failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("SmartSell demo-data audit passed.");
console.log("- Multi-page targets are declared for products, services, orders, requests, offers, reviews, messages, support, finance, and administration.");
console.log("- The seed is idempotent and includes Home merchandising selections.");
console.log("- Live database verification is available through `npm run data:verify`.");
