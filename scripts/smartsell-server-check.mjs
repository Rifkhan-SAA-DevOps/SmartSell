#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const candidates = [process.cwd(), path.resolve(process.cwd(), "SmartSell"), path.resolve(scriptDir, "..")];
const root = candidates.find((candidate) => fs.existsSync(path.join(candidate, "server", "src")));

if (!root) {
  console.error("Could not find the SmartSell project root.");
  process.exit(1);
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(?:js|mjs)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const files = [
  ...walk(path.join(root, "server", "src")),
  ...walk(path.join(root, "server", "prisma")),
];

const failures = [];
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    failures.push({ file: path.relative(root, file).replaceAll("\\", "/"), output: result.stderr || result.stdout });
  }
}

console.log("# SmartSell Server Syntax Report\n");
console.log(`JavaScript files checked: ${files.length}`);

if (failures.length) {
  console.log(`\nSyntax failures: ${failures.length}\n`);
  for (const failure of failures) {
    console.log(`❌ ${failure.file}`);
    console.log(failure.output.trim());
  }
  process.exit(1);
}

console.log("\n✅ All server and Prisma JavaScript files passed Node syntax validation.");
