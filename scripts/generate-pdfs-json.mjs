import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const pdfDir = path.join(repoRoot, "PDFs");
const outPath = path.join(repoRoot, "pdfs.json");

function nepaliDigitsToLatin(input) {
  const map = {
    "०": "0",
    "१": "1",
    "२": "2",
    "३": "3",
    "४": "4",
    "५": "5",
    "६": "6",
    "७": "7",
    "८": "8",
    "९": "9",
  };
  return input.replace(/[०-९]/g, (d) => map[d] ?? d);
}

function extractYear(filename) {
  // Most files are like "2024.pdf"
  const mLatin = filename.match(/(\d{4})\.pdf$/);
  if (mLatin) return Number(mLatin[1]);

  // Example: "हिमाल पञ्चाङ्ग २०७७.pdf"
  const mNepali = filename.match(/([०-९]{4})/);
  if (mNepali) return Number(nepaliDigitsToLatin(mNepali[1]));

  return null;
}

function makeHref(filename) {
  // GitHub Pages served from repo root (via index.html at root),
  // so PDFs live at /PDFs/<filename>.
  return `./PDFs/${encodeURIComponent(filename)}`;
}

const entries = fs.readdirSync(pdfDir, { withFileTypes: true });
const pdfFiles = entries
  .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".pdf"))
  .map((e) => e.name);

const files = pdfFiles.map((filename) => {
  const full = path.join(pdfDir, filename);
  const st = fs.statSync(full);
  const year = extractYear(filename);

  return {
    filename,
    title: filename.replace(/\.pdf$/i, ""),
    year,
    sizeBytes: st.size,
    modifiedISO: st.mtime.toISOString(),
    href: makeHref(filename),
  };
});

files.sort((a, b) => {
  const ya = a.year ?? -Infinity;
  const yb = b.year ?? -Infinity;
  if (yb !== ya) return yb - ya;
  return a.filename.localeCompare(b.filename);
});

const payload = {
  generatedAtISO: new Date().toISOString(),
  count: files.length,
  files,
};

fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");

console.log(`Generated ${path.relative(repoRoot, outPath)} with ${files.length} PDFs.`);

