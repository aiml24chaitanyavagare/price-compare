import fs from "node:fs";
import path from "node:path";

const inputFile = path.join(process.cwd(), "extracted-text", "LOBA.txt");
const outputFile = path.join(
  process.cwd(),
  "server",
  "data",
  "loba-products.json"
);

const lines = fs.readFileSync(inputFile, "utf8").split(/\r?\n/);

const records = [];

let currentPage = 1;
let current = null;

function clean(s = "") {
  return String(s).replace(/\s+/g, " ").trim();
}

function isPage(line) {
  return /^--\s+\d+\s+of\s+\d+\s+--$/i.test(line);
}

function isCas(line) {
  return /^CAS\s+No\.\s*:/i.test(line);
}

function isHsn(line) {
  return /^HSN\s*:/i.test(line);
}

function isPrice(line) {
  return /^(?:[\d,]+\.\d{2}|POR)$/i.test(clean(line));
}

function isCodePack(line) {
  return /^\d{5,}\s+[0-9A-Z]{4,}(?:\s+.*)?$/i.test(clean(line));
}

function isPacking(line) {
  return /^(?:\d+(?:\.\d+)?\s*(?:mg|g|kg|ml|l|µl|ul|set|sets|pcs?|pack|packs)|\d+\s*-\s*\d+\s*(?:g|kg|ml|l))$/i.test(
    clean(line)
  );
}

function parseCas(line) {
  const m = line.match(/^CAS\s+No\.\s*:\s*([^\s]+)/i);
  return m ? m[1] : "";
}

function parseHsn(line) {
  const m = line.match(/^HSN\s*:\s*(.+)$/i);
  return m ? clean(m[1]) : "";
}

function parseSameLine(line) {
  const m = clean(line).match(
    /^(\d{5,})\s+([0-9A-Z]{4,})\s+(.+?)\s+([\d,]+\.\d{2}|POR)$/i
  );

  if (!m) return null;

  return {
    code: m[1],
    packCode: m[2],
    packing: clean(m[3]),
    priceText: clean(m[4]).toUpperCase()
  };
}

function parseCodePack(line) {
  const m = clean(line).match(/^(\d{5,})\s+([0-9A-Z]{4,})$/i);

  if (!m) return null;

  return {
    code: m[1],
    packCode: m[2]
  };
}

function looksLikeName(line) {
  const x = clean(line);

  if (!x) return false;
  if (isPage(x)) return false;
  if (isCas(x)) return false;
  if (isHsn(x)) return false;
  if (isPrice(x)) return false;
  if (isCodePack(x)) return false;

  if (/^LOBA Chemie$/i.test(x)) return false;
  if (/^Price List/i.test(x)) return false;
  if (/^Product\s+Hazard/i.test(x)) return false;
  if (/^Store at/i.test(x)) return false;
  if (/^CAS Number$/i.test(x)) return false;
  if (/^Product Code$/i.test(x)) return false;

  return /[A-Za-z]/.test(x);
}

function startProduct(name) {
  if (current) flushProduct();

  current = {
    name: clean(name),
    cas: "",
    hsn: "",
    page: currentPage,
    rows: [],
    packings: [],
    prices: []
  };
}

function addRecord(row) {
  if (!current) return;
  if (!row.code) return;

  const priceText = clean(row.priceText || "").toUpperCase();

  records.push({
    company: "LOBA Chemie",
    product_name: current.name,
    product_code: row.code,
    cas_number: current.cas,
    packing: clean(row.packing || ""),
    price:
      priceText === "POR"
        ? null
        : Number(priceText.replace(/,/g, "")),
    price_type: priceText === "POR" ? "POR" : "FIXED",
    hsn_code: current.hsn,
    source: "LOBA",
    source_page: current.page
  });
}

function flushProduct() {
  if (!current) return;

  // First handle rows where everything is on one line.
  for (const row of current.rows) {
    if (row.packing && row.priceText) {
      addRecord(row);
    }
  }

  // Handle separated code/pack + packing + price format.
  const separatedRows = current.rows.filter(
    r => !r.packing && !r.priceText
  );

  const count = Math.max(
    separatedRows.length,
    current.packings.length,
    current.prices.length
  );

  for (let i = 0; i < count; i++) {
    const row = separatedRows[i];

    if (!row) continue;

    const packing = current.packings[i] || "";
    const priceText = current.prices[i] || "";

    if (!packing && !priceText) continue;

    addRecord({
      code: row.code,
      packCode: row.packCode,
      packing,
      priceText
    });
  }

  current = null;
}

for (let i = 0; i < lines.length; i++) {
  const line = clean(lines[i]);

  if (!line) continue;

  const pageMatch = line.match(/^--\s+(\d+)\s+of\s+\d+\s+--$/);

  if (pageMatch) {
    currentPage = Number(pageMatch[1]);
    continue;
  }

  // Detect product heading.
  if (looksLikeName(line)) {
    const lookAhead = lines
      .slice(i + 1, i + 15)
      .map(clean);

    const hasData =
      lookAhead.some(isCas) ||
      lookAhead.some(isHsn) ||
      lookAhead.some(isCodePack);

    if (hasData) {
      startProduct(line);
      continue;
    }
  }

  if (!current) continue;

  // CAS
  if (isCas(line)) {
    current.cas = parseCas(line);
    continue;
  }

  // HSN
  if (isHsn(line)) {
    current.hsn = parseHsn(line);
    continue;
  }

  // Everything on one line
  const same = parseSameLine(line);

  if (same) {
    current.rows.push(same);
    continue;
  }

  // Code + pack
  const cp = parseCodePack(line);

  if (cp) {
    current.rows.push(cp);
    continue;
  }

  // Packing line
  if (isPacking(line)) {
    current.packings.push(line);
    continue;
  }

  // Price / POR line
  if (isPrice(line)) {
    current.prices.push(line.toUpperCase());
    continue;
  }
}

flushProduct();

// Remove duplicates
const seen = new Set();
const unique = [];

for (const r of records) {
  const key = [
    r.company,
    r.product_code,
    r.product_name,
    r.cas_number,
    r.packing,
    r.price_type,
    r.price
  ].join("|");

  if (!seen.has(key)) {
    seen.add(key);
    unique.push(r);
  }
}

fs.mkdirSync(path.dirname(outputFile), { recursive: true });

fs.writeFileSync(
  outputFile,
  JSON.stringify(unique, null, 2),
  "utf8"
);

const fixed = unique.filter(r => r.price_type === "FIXED").length;
const por = unique.filter(r => r.price_type === "POR").length;

console.log("========================================");
console.log("LOBA PARSER RESULT");
console.log("========================================");
console.log("Total records :", unique.length);
console.log("Fixed prices  :", fixed);
console.log("POR records   :", por);
console.log("Output file   :", outputFile);
console.log("========================================");

console.log("\nFirst 5 records:");
console.log(JSON.stringify(unique.slice(0, 5), null, 2));