import fs from "fs";

const inputFile = "./extracted-text/SIMSON.txt";
const outputFile = "./simson-products.json";

const text = fs.readFileSync(inputFile, "utf8");

const lines = text
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(Boolean);

const products = [];

let buffer = null;

function parseCompletedRow(rowText, serial) {
  /*
    Expected ending:

    CAS
    Product Code
    Packing
    HSN
    GST
    Price
  */

  const match = rowText.match(
    /^(.+?)\s+(\d{1,7}-\d{1,2}-\d{1,4}|NA)\s+(SC[A-Z0-9]+)\s+(\S+)\s+(\d{8})\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/
  );

  if (!match) {
    return null;
  }

  return {
    serial,
    product_name: match[1].trim(),
    cas_number: match[2],
    product_code: match[3],
    packing: match[4],
    hsn_code: match[5],
    gst: match[6],
    price: Number(match[7]),
  };
}

function isCompleteRow(rowText) {
  return /\s+(?:\d{1,7}-\d{1,2}-\d{1,4}|NA)\s+SC[A-Z0-9]+\s+\S+\s+\d{8}\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?$/.test(
    rowText
  );
}

function processBuffer() {
  if (!buffer) return;

  const rowText = buffer.text.replace(/\s+/g, " ").trim();

  const product = parseCompletedRow(rowText, buffer.serial);

  if (product) {
    products.push(product);
  } else {
    console.log(
      `⚠️ Could not parse serial ${buffer.serial}: ${rowText}`
    );
  }

  buffer = null;
}

for (const line of lines) {

  // Ignore obvious page/header/footer text
  if (
    /^s\.no\./i.test(line) ||
    /^product name/i.test(line) ||
    /^price list/i.test(line) ||
    /^mrp for/i.test(line) ||
    /^simson/i.test(line) ||
    /^page\s+\d+/i.test(line)
  ) {
    continue;
  }

  // New numbered row
  const numbered = line.match(/^(\d+)\s+(.+)$/);

  if (numbered) {

    // Finish previous row first
    processBuffer();

    buffer = {
      serial: Number(numbered[1]),
      text: numbered[2],
    };

    // Some rows fit completely on one line
    if (isCompleteRow(buffer.text)) {
      processBuffer();
    }

    continue;
  }

  // Continuation of previous product row
  if (buffer) {
    buffer.text += " " + line;

    // Once the ending fields appear, finish the row
    if (isCompleteRow(buffer.text)) {
      processBuffer();
    }
  }
}

// Process last row
processBuffer();

console.log("======================================");
console.log("SIMSON PARSER RESULT");
console.log("======================================");

console.log("Valid products:", products.length);

console.log("\n----- FIRST 20 PRODUCTS -----\n");

for (const product of products.slice(0, 20)) {
  console.log(product);
}

console.log("\n----- LAST 5 PRODUCTS -----\n");

for (const product of products.slice(-5)) {
  console.log(product);
}

fs.writeFileSync(
  outputFile,
  JSON.stringify(products, null, 2),
  "utf8"
);

console.log("\n======================================");
console.log(`Saved: ${outputFile}`);
console.log("======================================");