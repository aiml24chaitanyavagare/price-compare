import fs from "fs";

const inputFile = "./extracted-text/SRL.txt";
const outputFile = "./srl-products.json";

const raw = fs.readFileSync(inputFile, "utf8");

function clean(s) {
  return s
    .replace(/â€‘|â€\x93|â€\x94|‐|-|–|—/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

const lines = raw
  .split(/\r?\n/)
  .map(x => x.trim())
  .filter(Boolean);

const products = [];

/*
  A valid SRL data row ends with:

  Part A
  8 digit HSN
  GST
  Storage

  Example:
  41721 Sodium Chloride ACS, 99.9% 7647-14-5 500 Gms 210 Part A 25010090 0 RT
*/

function parseCompleteRow(row) {
  row = clean(row);

  const match = row.match(
    /^(\d{4,6})\s+(.+?)\s+(\d{1,7}[-]\d{1,3}[-]\d{1,4})\s+(.+?)\s+(\d+(?:\.\d+)?)\s+(Part\s+[A-Z])\s+(\d{8})\s+(\d+(?:\.\d+)?)\s+(.+)$/
  );

  if (match) {
    return {
      company: "SRL",
      product_code: match[1],
      product_name: clean(match[2]),
      cas_number: clean(match[3]),
      packing: clean(match[4]),
      price: Number(match[5]),
      variant: clean(match[6]),
      hsn_code: match[7],
      gst: match[8],
      storage: clean(match[9])
    };
  }

  /*
    CAS missing
  */

  const noCas = row.match(
    /^(\d{4,6})\s+(.+?)\s+(.+?)\s+(\d+(?:\.\d+)?)\s+(Part\s+[A-Z])\s+(\d{8})\s+(\d+(?:\.\d+)?)\s+(.+)$/
  );

  if (noCas) {
    return {
      company: "SRL",
      product_code: noCas[1],
      product_name: clean(noCas[2]),
      cas_number: "",
      packing: clean(noCas[3]),
      price: Number(noCas[4]),
      variant: clean(noCas[5]),
      hsn_code: noCas[6],
      gst: noCas[7],
      storage: clean(noCas[8])
    };
  }

  return null;
}

/*
  Build logical records.

  Important:
  Some SRL products are split like:

  93602 Acetic Acid Glacial ACS, ExiPlus, Multi-
  Compendial, 99.9%
  64-19-7 500 ml  ...
*/

let buffer = [];

function flushBuffer() {
  if (!buffer.length) return;

  const joined = clean(buffer.join(" "));

  /*
    Ignore obvious year/header lines
  */
  if (/^\d{4}\s*-\s*\d{4}$/.test(joined)) {
    buffer = [];
    return;
  }

  const product = parseCompleteRow(joined);

  if (product) {
    products.push(product);
  }

  buffer = [];
}

for (const line of lines) {

  /*
    Skip headers
  */
  if (
    /^s\.?\s*no/i.test(line) ||
    /^product\s*name/i.test(line) ||
    /^price\s*list/i.test(line) ||
    /^sr[l|i]/i.test(line) ||
    /^page\s+\d+/i.test(line)
  ) {
    continue;
  }

  /*
    A new product normally starts with 4-6 digit product code.
  */
  const startsProduct = /^\d{4,6}\s+/.test(line);

  if (startsProduct) {

    /*
      Finish previous product.
    */
    flushBuffer();

    buffer = [line];

    /*
      If this line itself is complete, immediately parse it.
    */
    const product = parseCompleteRow(line);

    if (product) {
      products.push(product);
      buffer = [];
    }

    continue;
  }

  /*
    Continuation line:
    product name / CAS / packing / remaining fields.
  */
  if (buffer.length > 0) {

    buffer.push(line);

    const joined = clean(buffer.join(" "));

    const product = parseCompleteRow(joined);

    if (product) {
      products.push(product);
      buffer = [];
    }
  }
}

/*
  Flush last record.
*/
flushBuffer();

/*
  Remove exact duplicate records.

  Key:
  company + product_code + packing + price
*/
const unique = [];
const seen = new Set();

for (const p of products) {

  const key =
    `${p.company}||${p.product_code}||${p.packing}||${p.price}`;

  if (!seen.has(key)) {
    seen.add(key);
    unique.push(p);
  }
}

console.log("======================================");
console.log("SRL PARSER");
console.log("======================================");

console.log("Raw lines:", lines.length);
console.log("Parsed records:", products.length);
console.log("Unique records:", unique.length);

console.log("\nCHECK PRODUCT 41721:");

console.table(
  unique.filter(p => p.product_code === "41721")
);

/*
  GST statistics
*/

const gstStats = {};

for (const p of unique) {
  gstStats[p.gst] = (gstStats[p.gst] || 0) + 1;
}

console.log("\nGST distribution:");

console.table(
  Object.entries(gstStats).map(([gst, count]) => ({
    gst,
    count
  }))
);

/*
  Product-code statistics
*/

const uniqueCodes = new Set(
  unique.map(p => p.product_code)
);

console.log(
  "\nUnique product codes:",
  uniqueCodes.size
);

console.log(
  "Products with missing CAS:",
  unique.filter(p => !p.cas_number).length
);

/*
  Save JSON
*/

fs.writeFileSync(
  outputFile,
  JSON.stringify(unique, null, 2),
  "utf8"
);

console.log("\nSaved:", outputFile);
console.log("======================================");
