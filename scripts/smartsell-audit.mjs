#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const candidates = [process.cwd(), path.resolve(process.cwd(), "SmartSell"), path.resolve(scriptDir, "..")];
const root = candidates.find((candidate) => fs.existsSync(path.join(candidate, "client", "src")) && fs.existsSync(path.join(candidate, "server", "src")));

if (!root) {
  console.error("Could not find SmartSell root. Run this from the project root or keep this file inside SmartSell/scripts.");
  process.exit(1);
}

const clientSrc = path.join(root, "client", "src");
const serverSrc = path.join(root, "server", "src");
const report = [];
const warnings = [];
const errors = [];

function exists(file) { return fs.existsSync(file); }
function read(file) { return fs.readFileSync(file, "utf8"); }
function rel(file) { return path.relative(root, file).replaceAll("\\", "/"); }
function walk(dir, predicate = () => true, files = []) {
  if (!exists(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, predicate, files);
    else if (predicate(full)) files.push(full);
  }
  return files;
}

function localImportPaths(source) {
  const paths = [];
  for (const match of source.matchAll(/(?:import\s+(?:[\s\S]*?\s+from\s+)?|export\s+[\s\S]*?\s+from\s+)["']([^"']+)["']/g)) paths.push(match[1]);
  for (const match of source.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)) paths.push(match[1]);
  return paths;
}

function resolveLocalImport(fromFile, importPath) {
  if (!importPath.startsWith(".")) return true;
  const base = path.resolve(path.dirname(fromFile), importPath);
  const candidates = [
    base,
    `${base}.js`, `${base}.jsx`, `${base}.mjs`, `${base}.css`, `${base}.json`,
    `${base}.png`, `${base}.jpg`, `${base}.jpeg`, `${base}.webp`, `${base}.svg`,
    path.join(base, "index.js"), path.join(base, "index.jsx"), path.join(base, "index.css"),
  ];
  return candidates.some(exists);
}

function extractRoutes(source) {
  return [...source.matchAll(/<Route\s+path=["']([^"']+)["']\s+element=\{([\s\S]*?)\}\s*\/>/g)]
    .map((match) => ({ path: match[1], element: match[2].replace(/\s+/g, " ").trim() }));
}

function initialApiLiteral(source, startIndex) {
  let index = startIndex;
  while (/\s/.test(source[index] || "")) index += 1;
  const quote = source[index];
  if (!["'", '"', "`"].includes(quote)) return null;
  index += 1;
  let value = "";
  while (index < source.length) {
    const char = source[index];
    if (char === "\\") {
      value += char + (source[index + 1] || "");
      index += 2;
      continue;
    }
    if (char === quote) break;
    if (quote === "`" && char === "$" && source[index + 1] === "{") break;
    value += char;
    index += 1;
  }
  return value;
}

function extractApiCalls() {
  const calls = [];
  const files = walk(clientSrc, (file) => /\.(?:js|jsx)$/.test(file));
  const pattern = /api\.(get|post|put|patch|delete)\(\s*/g;
  for (const file of files) {
    const source = read(file);
    for (const match of source.matchAll(pattern)) {
      const literal = initialApiLiteral(source, match.index + match[0].length);
      if (!literal?.startsWith("/")) continue;
      calls.push({ method: match[1].toUpperCase(), url: literal, file: rel(file) });
    }
  }
  return calls;
}

function extractServerMounts(source) {
  return [...source.matchAll(/app\.use\(["']([^"']+)["']\s*,\s*(?:[^,\n]+,\s*)?([A-Za-z0-9_]+Routes)\)/g)]
    .map((match) => ({ mount: match[1], router: match[2] }));
}

function extractRouteImports(source) {
  const imports = {};
  for (const match of source.matchAll(/import\s+([A-Za-z0-9_]+Routes)\s+from\s+["']\.\/routes\/([^"']+)["']/g)) imports[match[1]] = match[2];
  return imports;
}

function firstApiSegment(url) {
  const clean = String(url || "").split("?")[0].replace(/^\/+/, "");
  return clean.split("/")[0] || "";
}

function checkCssImports(entryFile, visited = new Set()) {
  if (visited.has(entryFile) || !exists(entryFile)) return;
  visited.add(entryFile);
  const source = read(entryFile);
  for (const match of source.matchAll(/@import\s+["']([^"']+)["']/g)) {
    const target = path.resolve(path.dirname(entryFile), match[1]);
    const resolved = exists(target) ? target : `${target}.css`;
    if (!exists(resolved)) errors.push(`Missing CSS import: ${rel(entryFile)} → ${match[1]}`);
    else checkCssImports(resolved, visited);
  }
}

function status(ok, label, detail = "") {
  report.push(`${ok ? "✅" : "❌"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) errors.push(`${label}${detail ? ` — ${detail}` : ""}`);
}

report.push("# SmartSell Route/UI Regression Audit", "", `Generated: ${new Date().toISOString()}`, `Project root: \`${root}\``, "");

const rootPackagePath = path.join(root, "package.json");
if (exists(rootPackagePath)) {
  const pkg = JSON.parse(read(rootPackagePath));
  status(Boolean(pkg.scripts?.audit), "Root audit script configured");
  status(Boolean(pkg.scripts?.["audit:api"]), "API-contract audit configured");
  status(Boolean(pkg.scripts?.["audit:server"]), "Server syntax audit configured");
  status(Boolean(pkg.scripts?.check) && !pkg.scripts.check.includes("--prefix .."), "Root check command runs from the project root");
} else status(false, "Root package.json found");

const clientFiles = walk(clientSrc, (file) => /\.(?:js|jsx)$/.test(file));
for (const file of clientFiles) {
  for (const importPath of localImportPaths(read(file))) {
    if (!resolveLocalImport(file, importPath)) errors.push(`Missing frontend import target: ${rel(file)} → ${importPath}`);
  }
}
status(!errors.some((item) => item.startsWith("Missing frontend import target")), "All local frontend import targets exist");

const appPath = path.join(clientSrc, "App.jsx");
if (!exists(appPath)) status(false, "client/src/App.jsx found");
else {
  const source = read(appPath);
  const routes = extractRoutes(source);
  const paths = routes.map((route) => route.path);
  const duplicates = [...new Set(paths.filter((route, index) => paths.indexOf(route) !== index))];
  status(true, "Frontend App.jsx found");
  status(routes.length > 0, "Frontend routes detected", `${routes.length} routes`);
  status(duplicates.length === 0, "No duplicate frontend routes", duplicates.join(", "));
  report.push("", "## Frontend routes");
  routes.forEach((route) => report.push(`- \`${route.path}\``));

  const lazyPages = new Set([...source.matchAll(/lazy\(\(\)\s*=>\s*import\(["']\.\/pages\/([^"']+)["']\)\)/g)].map((match) => match[1].replace(/\.(?:js|jsx)$/, "")));
  const pageFiles = walk(path.join(clientSrc, "pages"), (file) => /\.(?:js|jsx)$/.test(file)).map((file) => path.basename(file).replace(/\.(?:js|jsx)$/, ""));
  const unrouted = pageFiles.filter((page) => page !== "NotFound" && !lazyPages.has(page));
  if (unrouted.length) warnings.push(`Page modules not lazy-imported by App.jsx: ${unrouted.join(", ")}`);
}

const appCss = path.join(clientSrc, "styles", "app.css");
if (exists(appCss)) {
  checkCssImports(appCss);
  status(!errors.some((item) => item.startsWith("Missing CSS import")), "Active CSS import graph is complete");
} else status(false, "client/src/styles/app.css found");

const serverPath = path.join(serverSrc, "server.js");
if (!exists(serverPath)) status(false, "server/src/server.js found");
else {
  const source = read(serverPath);
  const mounts = extractServerMounts(source);
  const imports = extractRouteImports(source);
  status(true, "Backend server.js found");
  report.push("", "## Backend API mounts");
  mounts.forEach((item) => report.push(`- \`${item.mount}\` → ${item.router}`));
  for (const mount of mounts) {
    const imported = imports[mount.router];
    if (!imported) errors.push(`Mounted router has no import: ${mount.router}`);
    else {
      const routeFile = path.join(serverSrc, "routes", imported.endsWith(".js") ? imported : `${imported}.js`);
      if (!exists(routeFile)) errors.push(`Missing backend route file for ${mount.router}: ${imported}`);
    }
  }
  status(!errors.some((item) => item.startsWith("Mounted router") || item.startsWith("Missing backend route")), "Mounted backend route files exist");

  const mountedSegments = new Set(mounts.map((item) => item.mount.replace(/^\/api\/?/, "").split("/")[0]).filter(Boolean));
  const suspicious = extractApiCalls().filter((call) => !mountedSegments.has(firstApiSegment(call.url)));
  if (suspicious.length) warnings.push(`Frontend API calls with an unmounted first path segment:\n${suspicious.map((call) => `  - ${call.method} ${call.url} in ${call.file}`).join("\n")}`);
}

report.push("", "## Warnings");
if (warnings.length) warnings.forEach((warning) => report.push(`⚠️ ${warning}`));
else report.push("No warnings found.");

report.push("", "## Errors");
if (errors.length) errors.forEach((error) => report.push(`❌ ${error}`));
else report.push("No blocking errors found.");

report.push("", "## Manual browser checks still required", "- Open protected routes with the correct role and live API data.", "- Check browser console and server logs.", "- Verify desktop, tablet, and mobile layouts with realistic record counts.");

const outFile = path.join(root, "SMARTSELL_AUDIT_REPORT.md");
fs.writeFileSync(outFile, `${report.join("\n")}\n`, "utf8");
console.log(report.join("\n"));
console.log(`\nAudit report written to: ${outFile}`);
process.exit(errors.length ? 1 : 0);
