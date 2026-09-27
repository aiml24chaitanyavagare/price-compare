import fs from "fs";

const inputFile = "./extracted-text/SRL.txt";
const outputFile = "./srl-products.json";

const text = fs.readFileSync(inputFile, "utf8");

const lines = text
  .split(/\r?\n/)
  .map(x => x.trim())
  .filter(Boolean);

const products = [];

function clean(s) {
  return s
    .replace(/â€‘|â€\x93|â€\x94/g, "-")
    .replace(/[‐-‒–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

// Detect the end of a product row.
// Example:
// 25010090 0 RT
function hasEndFields(s) {
  return /\b\d{8}\s+\d+(?:\.\d+)?\s+(?:RT|[0-9]+(?:-[0-9]+)?C|[0-9]+[‐-][0-9]+C)\s*$/i.test(s);
}

// Parse one complete logical product row.
function parseRow(row) {
  row = clean(row);

  // Remove obvious duplicated OCR/PDF text appearing before the real product code.
  const codeMatches = [...row.matchAll(/\b(\d{4,6})\s+(?=[A-Za-z])/g)];

  if (codeMatches.length > 1) {
    row = row.slice(codeMatches[codeMatches.length - 1].index);
  }

  // Standard row with CAS.
  let m = row.match(
    /^(\d{4,6})\s+(.+?)\s+(\d{1,7}[-]\d{1,2}[-]\d{1,4}|NA)\s+(.+?)\s+(\d+(?:\.\d+)?)\s+(Part\s+[A-Z])\s+(\d{8})\s+(\d+(?:\.\d+)?)\s+(.+)$/i
  );

  if (m) {
    return {
      company: "SRL",
      product_code: m[1],
      product_name: clean(m[2]),
      cas_number: clean(m[3]),
      packing: clean(m[4]),
      price: Number(m[5]),
      variant: clean(m[6]),
      hsn_code: m[7],
      gst: m[8],
      storage: clean(m[9])
    };
  }

  // Row without CAS.
  m = row.match(
    /^(\d{4,6})\s+(.+?)\s+(.+?)\s+(\d+(?:\.\d+)?)\s+(Part\s+[A-Z])\s+(\d{8})\s+(\d+(?:\.\d+)?)\s+(.+)$/i
  );

  if (m) {
    return {
      company: "SRL",
      product_code: m[1],
      product_name: clean(m[2]),
      cas_number: "",
      packing: clean(m[3]),
      price: Number(m[4]),
      variant: clean(m[5]),
      hsn_code: m[6],
      gst: m[7],
      storage: clean(m[8])
    };
  }

  return null;
}

let current = [];

for (const line of lines) {

  // Skip headers/noise.
  if (
    /^s\.?\s*no/i.test(line) ||
    /^product\s*name/i.test(line) ||
    /^price\s*list/i.test(line) ||
    /^sr[l|i]/i.test(line) ||
    /^page\s+\d+/i.test(line) ||
    /^catalogue$/i.test(line) ||
    /^\d{4}\s*-\s*\d{4}$/i.test(line)
  ) {
    continue;
  }

  // New product starts only when code is followed by actual product text.
  const isNew = /^\d{4,6}\s+[A-Za-z]/.test(line);

  if (isNew) {

    if (current.length > 0) {
      const product = parseRow(current.join(" "));

      if (product) {
        products.push(product);
      }
    }

    current = [line];

  } else if (current.length > 0) {

    current.push(line);
  }
}

// Final row.
if (current.length > 0) {
  const product = parseRow(current.join(" "));

  if (product) {
    products.push(product);
  }
}

console.log("======================================");
console.log("SRL PARSER");
console.log("======================================");

console.log("Total SRL products parsed:", products.length);

console.log("\nCHECK PRODUCT 41721:");

console.table(
  products.filter(p => p.product_code === "41721")
);

const gstStats = {};

for (const p of products) {
  gstStats[p.gst] = (gstStats[p.gst] || 0) + 1;
}

console.log("\nGST distribution:");
console.table(
  Object.entries(gstStats).map(([gst, count]) => ({
    gst,
    count
  }))
);

const uniqueCodes = new Set(
  products.map(p => p.product_code)
);

console.log("\nUnique product codes:", uniqueCodes.size);

console.log(
  "Products with missing CAS:",
  products.filter(p => !p.cas_number).length
);

fs.writeFileSync(
  outputFile,
  JSON.stringify(products, null, 2),
  "utf8"
);

console.log("\nSaved:", outputFile);
console.log("======================================");
