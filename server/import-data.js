import fs from "fs";
import path from "path";
import db from "./database.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.join(
  __dirname,
  "..",
  "src",
  "data",
  "products.json"
);

console.log("========================================");
console.log("PRODUCT DATABASE IMPORT");
console.log("========================================");

console.log("Reading file:");
console.log(jsonPath);

if (!fs.existsSync(jsonPath)) {
  console.error("products.json NOT FOUND!");
  process.exit(1);
}

let products;

try {
  products = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
} catch (error) {
  console.error("Unable to read products.json");
  console.error(error);
  process.exit(1);
}

if (!Array.isArray(products)) {
  console.error("products.json is not an array!");
  process.exit(1);
}

console.log(`Products found: ${products.length.toLocaleString()}`);

console.log("Clearing old database records...");
db.exec("DELETE FROM products");

const insert = db.prepare(`
  INSERT INTO products (
    company,
    product_code,
    product_name,
    cas_number,
    packing,
    variant,
    price,
    hsn_code,
    gst
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertMany = db.transaction((rows) => {
  for (const row of rows) {

    // ---------------------------------------------
    // NEW OBJECT FORMAT
    // ---------------------------------------------
    if (!Array.isArray(row) && typeof row === "object") {

      insert.run(
        row.company ?? "",
        row.product_code ?? "",
        row.product_name ?? "",
        row.cas_number ?? null,
        row.packing ?? "",
        row.variant ?? "",
        Number(row.price) || null,
        row.hsn_code ?? null,
        row.gst ?? null
      );

      continue;
    }

    // ---------------------------------------------
    // OLD ARRAY FORMAT
    // ---------------------------------------------
    const company = row[0] ?? "";
    const productCode = row[1] ?? "";
    const productName = row[2] ?? "";
    const packing = row[3] ?? "";
    const vKind = row[4] ?? "";
    const vVal = row[5] ?? "";
    const price = Number(row[6]) || null;

    const variant =
      vKind && vVal !== ""
        ? `${vKind}:${vVal}`
        : "";

    insert.run(
      company,
      productCode,
      productName,
      null,
      packing,
      variant,
      price,
      null,
      null
    );
  }
});

try {

  console.log("Importing products...");

  insertMany(products);

  console.log("Insert completed!");

} catch (error) {

  console.error("Database insert failed!");
  console.error(error);

  process.exit(1);
}

const total = db
  .prepare("SELECT COUNT(*) AS count FROM products")
  .get();

const companies = db
  .prepare(`
    SELECT company, COUNT(*) AS count
    FROM products
    GROUP BY company
    ORDER BY company
  `)
  .all();

console.log("");
console.log("========================================");
console.log("IMPORT COMPLETED");
console.log("========================================");

console.log(`Total products: ${total.count.toLocaleString()}`);

console.log("");
console.log("Companies:");

for (const company of companies) {
  console.log(
    `  ${company.company}: ${company.count.toLocaleString()}`
  );
}

console.log("");
console.log("========================================");
console.log("GST DISTRIBUTION");
console.log("========================================");

const gst = db
  .prepare(`
    SELECT company, gst, COUNT(*) AS count
    FROM products
    WHERE gst IS NOT NULL
      AND gst != ''
    GROUP BY company, gst
    ORDER BY company, CAST(gst AS REAL)
  `)
  .all();

console.table(gst);

console.log("");
console.log("Database is ready!");

db.close();
