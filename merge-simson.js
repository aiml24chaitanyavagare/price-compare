import fs from "fs";

const mainFile = "./src/data/products.json";
const simsonFile = "./simson-products.json";
const outputFile = "./src/data/products.json";

const main = JSON.parse(fs.readFileSync(mainFile, "utf8"));
const simson = JSON.parse(fs.readFileSync(simsonFile, "utf8"));

console.log("Old products:", main.length);
console.log("New SIMSON products:", simson.length);

// Keep LOBA + SRL
const withoutSimson = main.filter(row => row[0] !== "SIMSON");

function getVariantKind(packing) {
  const s = String(packing || "").toLowerCase();

  if (s.includes("ml") || s.includes("ltr") || s.includes("liter") || s.includes("l")) {
    return "VOL";
  }

  return "WT";
}

function getVariantValue(packing) {
  const match = String(packing || "").match(/[\d.]+/);
  return match ? Number(match[0]) : null;
}

const newSimson = simson
  .filter(p => p.product_name && p.product_code)
  .map(p => [
    "SIMSON",
    p.product_code,
    p.product_name,
    p.packing,
    getVariantKind(p.packing),
    getVariantValue(p.packing),
    p.price
  ]);

const merged = [...withoutSimson, ...newSimson];

fs.writeFileSync(
  outputFile,
  JSON.stringify(merged, null, 2),
  "utf8"
);

console.log("--------------------------------");
console.log("Old total:", main.length);
console.log("Old SIMSON removed:", main.length - withoutSimson.length);
console.log("New SIMSON added:", newSimson.length);
console.log("NEW TOTAL:", merged.length);
console.log("--------------------------------");
console.log("✅ products.json updated!");