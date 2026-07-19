import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["src", "public", "api", "scripts"];
const EXTRA_FILES = ["package.json"];
const TEXT_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
  ".html",
  ".md",
  ".txt",
  ".sql"
]);
const IGNORE_DIRS = new Set(["node_modules", "dist", ".git", "artifacts", ".vercel"]);
const MOJIBAKE_PATTERN = new RegExp("[\\u00c3\\u00c2\\ufffd]|\\u00e2\\u20ac|\\u00ef\\u00bb\\u00bf");

const findings = [];

for (const dir of SCAN_DIRS) {
  walk(path.join(ROOT, dir));
}

for (const file of EXTRA_FILES) {
  const absolute = path.join(ROOT, file);
  if (fs.existsSync(absolute)) scanFile(absolute);
}

if (findings.length) {
  console.error("Se detectaron posibles textos con codificación dañada:");
  for (const finding of findings.slice(0, 80)) {
    console.error(`- ${finding.file}:${finding.line}: ${finding.preview}`);
  }
  if (findings.length > 80) console.error(`... ${findings.length - 80} hallazgo(s) adicional(es).`);
  process.exit(1);
}

console.log("audit:encoding ok - no se detectó mojibake en archivos fuente revisados.");

function walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(absolute);
      continue;
    }
    scanFile(absolute);
  }
}

function scanFile(filePath) {
  if (!TEXT_EXTENSIONS.has(path.extname(filePath))) return;
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!MOJIBAKE_PATTERN.test(line)) return;
    findings.push({
      file: path.relative(ROOT, filePath).replace(/\\/g, "/"),
      line: index + 1,
      preview: line.trim().slice(0, 160)
    });
  });
}
