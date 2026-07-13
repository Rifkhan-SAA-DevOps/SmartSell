#!/usr/bin/env node
import fs from "fs";
import path from "path";

const cwd = process.cwd();
const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const candidates = [
  cwd,
  path.resolve(cwd, "SmartSell"),
  path.resolve(scriptDir, ".."),
  path.resolve(scriptDir, "../.."),
];

function exists(p) {
  return fs.existsSync(p);
}

function findRoot() {
  for (const candidate of candidates) {
    if (exists(path.join(candidate, "client", "src")) && exists(path.join(candidate, "server", "src"))) {
      return candidate;
    }
  }
  console.error("Could not find SmartSell root. Run this from I:\\SmartSell\\smartsell or keep scripts inside SmartSell/scripts.");
  process.exit(1);
}

const root = findRoot();
const clientSrc = path.join(root, "client", "src");
const serverSrc = path.join(root, "server", "src");
const report = [];
const warnings = [];
const errors = [];

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function walk(dir, predicate = () => true, files = []) {
  if (!exists(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, predicate, files);
    else if (predicate(full)) files.push(full);
  }
  return files;
}

function normalizeImport(importPath) {
  if (importPath.endsWith(".jsx") || importPath.endsWith(".js")) return importPath;
  return `${importPath}.jsx`;
}

function extractImports(source) {
  const imports = [];
  const re = /import\s+(?:[\s\S]*?)\s+from\s+["']([^"']+)["'];?/g;
  let match;
  while ((match = re.exec(source))) imports.push(match[1]);
  return imports;
}

function extractRoutes(appSource) {
  const routes = [];
  const re = /<Route\s+path=["']([^"']+)["']\s+element=\{([\s\S]*?)\}\s*\/>/g;
  let match;
  while ((match = re.exec(appSource))) {
    routes.push({ path: match[1], element: match[2].replace(/\s+/g, " ").trim() });
  }
  return routes;
}

function extractApiCalls() {
  const files = walk(clientSrc, (file) => /\.(jsx|js)$/.test(file));
  const calls = [];
  const patterns = [
    /api\.(get|post|put|patch|delete)\(\s*`([^`]+)`/g,
    /api\.(get|post|put|patch|delete)\(\s*["']([^"']+)["']/g,
  ];

  for (const file of files) {
    const source = read(file);
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(source))) {
        const method = match[1].toUpperCase();
        const url = match[2].replace(/\$\{[^}]+\}/g, ":param");
        calls.push({ method, url, file: path.relative(root, file) });
      }
    }
  }
  return calls;
}

function extractServerMounts(serverSource) {
  const mounts = [];
  const re = /app\.use\(["']([^"']+)["']\s*,\s*(?:[^,\n]+,\s*)?([A-Za-z0-9_]+Routes)\)/g;
  let match;
  while ((match = re.exec(serverSource))) {
    mounts.push({ mount: match[1], router: match[2] });
  }
  return mounts;
}

function extractRouteImports(serverSource) {
  const imports = {};
  const re = /import\s+([A-Za-z0-9_]+Routes)\s+from\s+["']\.\/routes\/([^"']+)["'];?/g;
  let match;
  while ((match = re.exec(serverSource))) {
    imports[match[1]] = match[2];
  }
  return imports;
}

function firstApiSegment(url) {
  let clean = url.split("?")[0].replace(/^\/+/, "");
  if (!clean) return "";
  return clean.split("/")[0];
}

function addStatus(ok, label, detail = "") {
  const icon = ok ? "✅" : "❌";
  report.push(`${icon} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) errors.push(`${label}${detail ? ` — ${detail}` : ""}`);
}

const appPath = path.join(clientSrc, "App.jsx");
const serverPath = path.join(serverSrc, "server.js");

report.push("# SmartSell Route/API Audit Report");
report.push("");
report.push(`Generated: ${new Date().toISOString()}`);
report.push(`Project root: \`${root}\``);
report.push("");

if (!exists(appPath)) {
  addStatus(false, "client/src/App.jsx found");
} else {
  const appSource = read(appPath);
  const imports = extractImports(appSource);
  const routes = extractRoutes(appSource);
  const routePaths = routes.map((item) => item.path);
  const duplicateRoutes = routePaths.filter((item, index) => routePaths.indexOf(item) !== index);

  addStatus(true, "Frontend App.jsx found");
  addStatus(duplicateRoutes.length === 0, "No duplicate frontend routes", duplicateRoutes.join(", "));

  report.push("");
  report.push("## Frontend routes");
  routes.forEach((route) => report.push(`- \`${route.path}\``));

  for (const importPath of imports) {
    if (!importPath.startsWith(".")) continue;
    const resolved = path.resolve(clientSrc, normalizeImport(importPath));
    const jsResolved = resolved.replace(/\.jsx$/, ".js");
    const ok = exists(resolved) || exists(jsResolved);
    if (!ok) errors.push(`Missing frontend import target: ${importPath} in App.jsx`);
  }

  addStatus(!errors.some((e) => e.startsWith("Missing frontend import target")), "App.jsx import targets exist");

  const pageFiles = walk(path.join(clientSrc, "pages"), (file) => /\.(jsx|js)$/.test(file))
    .map((file) => path.relative(path.join(clientSrc, "pages"), file).replace(/\\/g, "/"));

  const appImportNames = new Set(imports.filter((item) => item.startsWith("./pages/")).map((item) => item.replace("./pages/", "").replace(/\.(jsx|js)$/, "")));
  const unroutedPages = pageFiles
    .map((file) => file.replace(/\.(jsx|js)$/, ""))
    .filter((page) => !appImportNames.has(page) && !["NotFound"].includes(page));

  if (unroutedPages.length) warnings.push(`Pages not imported by App.jsx: ${unroutedPages.join(", ")}`);
}

if (!exists(serverPath)) {
  addStatus(false, "server/src/server.js found");
} else {
  const serverSource = read(serverPath);
  const mounts = extractServerMounts(serverSource);
  const imports = extractRouteImports(serverSource);
  addStatus(true, "Backend server.js found");

  report.push("");
  report.push("## Backend API mounts");
  mounts.forEach((item) => report.push(`- \`${item.mount}\` → ${item.router}`));

  for (const mount of mounts) {
    const importFile = imports[mount.router];
    if (!importFile) {
      errors.push(`Mounted router has no import: ${mount.router}`);
      continue;
    }
    const routeFile = path.join(serverSrc, "routes", importFile);
    const routeFileJs = routeFile.endsWith(".js") ? routeFile : `${routeFile}.js`;
    if (!exists(routeFileJs)) errors.push(`Missing backend route file for ${mount.router}: ${importFile}`);
  }

  const mountedSegments = new Set(
    mounts
      .map((item) => item.mount.replace(/^\/api\/?/, "").split("/")[0])
      .filter(Boolean)
  );

  const apiCalls = extractApiCalls();
  const suspiciousCalls = [];
  for (const call of apiCalls) {
    const segment = firstApiSegment(call.url);
    if (!segment) continue;
    if (!mountedSegments.has(segment)) suspiciousCalls.push(call);
  }

  report.push("");
  report.push("## Frontend API calls found");
  apiCalls.forEach((call) => report.push(`- ${call.method} \`${call.url}\` in \`${call.file}\``));

  if (suspiciousCalls.length) {
    warnings.push(
      "Frontend API calls whose first path segment is not mounted in server.js:\n" +
      suspiciousCalls.map((call) => `  - ${call.method} ${call.url} in ${call.file}`).join("\n")
    );
  }

  addStatus(!errors.some((e) => e.startsWith("Missing backend route file") || e.startsWith("Mounted router")), "Mounted backend route files exist");
}

report.push("");
report.push("## Warnings");
if (warnings.length) warnings.forEach((item) => report.push(`⚠️ ${item}`));
else report.push("No warnings found.");

report.push("");
report.push("## Errors");
if (errors.length) errors.forEach((item) => report.push(`❌ ${item}`));
else report.push("No blocking errors found by static audit.");

report.push("");
report.push("## Next manual checks");
report.push("- Run frontend and open every protected route with the correct role.");
report.push("- Run backend and use the smoke script for public API routes.");
report.push("- Check browser console for React runtime errors.");
report.push("- Check terminal logs for Prisma or missing-field errors.");

const outFile = path.join(root, "SMARTSELL_AUDIT_REPORT.md");
fs.writeFileSync(outFile, `${report.join("\n")}\n`, "utf8");

console.log(report.join("\n"));
console.log("");
console.log(`Audit report written to: ${outFile}`);
process.exit(errors.length ? 1 : 0);
