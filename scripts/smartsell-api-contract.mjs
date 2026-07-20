#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const candidates = [process.cwd(), path.resolve(process.cwd(), "SmartSell"), path.resolve(scriptDir, "..")];
const root = candidates.find((candidate) => fs.existsSync(path.join(candidate, "client", "src")) && fs.existsSync(path.join(candidate, "server", "src")));

if (!root) {
  console.error("Could not find the SmartSell project root.");
  process.exit(1);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function stripQuery(value) {
  return String(value || "").split("?")[0].replace(/\/+$/, "") || "/";
}

function segments(value) {
  return stripQuery(value).split("/").filter(Boolean);
}

function isDynamic(segment) {
  return segment.startsWith(":") || segment === "*";
}

function pathsOverlap(frontendPath, backendPath) {
  const front = segments(frontendPath);
  const back = segments(backendPath);
  if (front.length !== back.length) return false;
  return front.every((segment, index) => segment === back[index] || isDynamic(segment) || isDynamic(back[index]));
}

function parseServerRoutes() {
  const serverFile = path.join(root, "server", "src", "server.js");
  const source = read(serverFile);
  const imports = {};
  for (const match of source.matchAll(/import\s+(\w+Routes)\s+from\s+["']\.\/routes\/([^"']+)["']/g)) {
    imports[match[1]] = match[2];
  }

  const routes = [];
  for (const match of source.matchAll(/app\.use\(["']([^"']+)["']\s*,\s*(?:[^,\n]+,\s*)?(\w+Routes)\)/g)) {
    const mount = match[1].replace(/\/$/, "");
    const routeFile = imports[match[2]];
    if (!routeFile) continue;
    const routeSource = read(path.join(root, "server", "src", "routes", routeFile));
    for (const routeMatch of routeSource.matchAll(/router\.(get|post|put|patch|delete)\(\s*["']([^"']*)["']/g)) {
      routes.push({
        method: routeMatch[1].toUpperCase(),
        path: `${mount}/${routeMatch[2].replace(/^\//, "")}`.replace(/\/+$/, ""),
        file: `server/src/routes/${routeFile}`,
      });
    }
  }
  return routes;
}

function normalizeFrontendUrl(url) {
  return `/api/${String(url).replace(/\$\{[^}]+\}/g, ":dynamic").replace(/^\//, "")}`;
}

function parseFrontendCalls() {
  const files = walk(path.join(root, "client", "src")).filter((file) => /\.(jsx|js)$/.test(file));
  const calls = [];
  const quoted = /api\.(get|post|put|patch|delete)\(\s*["']([^"']+)["']/g;
  const templated = /api\.(get|post|put|patch|delete)\(\s*`([^`]+)`/g;

  for (const file of files) {
    const source = read(file);
    for (const pattern of [quoted, templated]) {
      for (const match of source.matchAll(pattern)) {
        const raw = match[2];
        if (!raw.startsWith("/")) continue;
        calls.push({
          method: match[1].toUpperCase(),
          path: normalizeFrontendUrl(raw),
          file: path.relative(root, file).replaceAll("\\", "/"),
        });
      }
    }
  }
  return calls;
}

const serverRoutes = parseServerRoutes();
const frontendCalls = parseFrontendCalls();
const missing = frontendCalls.filter((call) => !serverRoutes.some((route) => route.method === call.method && pathsOverlap(call.path, route.path)));

console.log("# SmartSell API Contract Report\n");
console.log(`Frontend API calls checked: ${frontendCalls.length}`);
console.log(`Backend routes checked: ${serverRoutes.length}`);

if (missing.length) {
  console.log(`\nMissing or incompatible contracts: ${missing.length}\n`);
  for (const call of missing) console.log(`❌ ${call.method} ${call.path} — ${call.file}`);
  process.exit(1);
}

console.log("\n✅ Every directly referenced frontend API method/path has a compatible backend route.");
