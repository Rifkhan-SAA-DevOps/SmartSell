#!/usr/bin/env node
const API_BASE = process.env.SMARTSELL_API_BASE || "http://localhost:5001/api";

const checks = [
  { label: "Health", url: "/health" },
  { label: "Products", url: "/products" },
  { label: "Services", url: "/services" },
  { label: "Product categories", url: "/promotions/categories?type=product&active=true" },
  { label: "Service categories", url: "/promotions/categories?type=service&active=true" },
  { label: "Public settings", url: "/settings/public" },
];

console.log(`SmartSell API smoke test: ${API_BASE}`);

let failed = 0;

for (const check of checks) {
  const target = `${API_BASE}${check.url}`;
  try {
    const response = await fetch(target, { headers: { "Accept": "application/json" } });
    const text = await response.text();
    const ok = response.status >= 200 && response.status < 500;
    const bodyPreview = text.replace(/\s+/g, " ").slice(0, 140);
    console.log(`${ok ? "✅" : "❌"} ${check.label}: ${response.status} ${response.statusText} — ${bodyPreview}`);
    if (!ok) failed += 1;
  } catch (error) {
    failed += 1;
    console.log(`❌ ${check.label}: ${error.message}`);
  }
}

if (failed) {
  console.log(`\nSmoke test finished with ${failed} failing check(s).`);
  process.exit(1);
}

console.log("\nSmoke test finished successfully.");
