import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const clientSrc = path.join(root, "client", "src");
const globalCssPath = path.join(clientSrc, "styles", "global.css");
const reportPath = path.join(root, "SMARTSELL_CSS_CLEANUP_REPORT.md");

const riskySelectorPatterns = [
  /^\.section\b/,
  /^\.page-shell\b/,
  /^\.card\b/,
  /^\.btn\b/,
  /^\.form-grid\b/,
  /^\.status\b/,
  /^\.badge\b/,
  /^\.modal\b/,
  /^\.table\b/,
  /^button\b/,
  /^input\b/,
  /^select\b/,
  /^textarea\b/,
  /^a\b/,
  /^img\b/,
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", "dist", "build"].includes(entry.name)) continue;
      walk(full, files);
    } else if (/\.(jsx|tsx|js|ts|css)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function extractSelectors(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("}")
    .map((block) => block.split("{")[0]?.trim())
    .filter(Boolean)
    .flatMap((selector) => selector.split(",").map((part) => part.trim()))
    .filter(Boolean);
}

function extractClassNames(text) {
  const classes = new Set();
  const classAttrRegex = /className\s*=\s*["'`]([^"'`]+)["'`]/g;
  let match;
  while ((match = classAttrRegex.exec(text))) {
    match[1]
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => classes.add(item));
  }
  return classes;
}

if (!fs.existsSync(globalCssPath)) {
  console.error(`Missing global.css at ${globalCssPath}`);
  process.exit(1);
}

const globalCss = fs.readFileSync(globalCssPath, "utf8");
const selectors = extractSelectors(globalCss);
const risky = selectors.filter((selector) => riskySelectorPatterns.some((pattern) => pattern.test(selector)));

const sourceFiles = walk(clientSrc).filter((file) => !file.endsWith("global.css"));
const usedClasses = new Set();
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, "utf8");
  for (const className of extractClassNames(text)) usedClasses.add(className);
}

const classSelectors = selectors
  .map((selector) => selector.match(/^\.([a-zA-Z0-9_-]+)/)?.[1])
  .filter(Boolean);
const possiblyUnused = [...new Set(classSelectors)].filter((className) => !usedClasses.has(className));

const report = `# SmartSell CSS Cleanup Report

Generated: ${new Date().toISOString()}

## Summary

- global.css selectors found: ${selectors.length}
- risky broad selectors found: ${risky.length}
- class selectors that may be unused: ${possiblyUnused.length}

## Risky broad selectors to migrate first

These selectors are broad and can accidentally affect many pages. Move them page-by-page into scoped CSS files.

${risky.length ? risky.slice(0, 120).map((item) => `- \`${item}\``).join("\n") : "No risky selectors found."}

## Possibly unused global classes

These may be safe to remove later, but check manually first because dynamic class names are not always detected.

${possiblyUnused.length ? possiblyUnused.slice(0, 160).map((item) => `- \`.${item}\``).join("\n") : "No unused class selectors detected."}

## Safe cleanup order

1. Move customer page styles from global.css into \`client/src/styles/pages/customer/...\`.
2. Move admin/business page styles into \`client/src/styles/pages/management/...\`.
3. Move reusable card/button/table/form styles into \`client/src/styles/components/...\`.
4. Run this audit again.
5. Remove migrated selectors from global.css only after checking the page in browser.
`;

fs.writeFileSync(reportPath, report);
console.log(`CSS cleanup report created: ${reportPath}`);
