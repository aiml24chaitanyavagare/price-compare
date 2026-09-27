import fs from "fs";

const mainFile = "./src/data/products.json";
const srlFile = "./srl-products.json";
const outputFile = "./src/data/products.json";

const main = JSON.parse(fs.readFileSync(mainFile, "utf8"));
const srl = JSON.parse(fs.readFileSync(srlFile, "utf8"));

console.log("Old products:", main.length);
console.log("SRL products:", srl.length);

// Remove any old SRL records if they already exist
const withoutSRL = main.filter(row => {
  if (Array.isArray(row)) {
    return row[0] !== "SRL";
  }

  if (row && typeof row === "object") {
    return row.company !== "SRL";
  }

  return true;
});

console.log("Old SRL removed:", main.length - withoutSRL.length);

// Add complete SRL objects
const merged = [
  ...withoutSRL,
  ...srl
];

fs.writeFileSync(
  outputFile,
  JSON.stringify(merged, null, 2),
  "utf8"
);

console.log("--------------------------------");
console.log("LOBA + existing data:", withoutSRL.length);
console.log("SRL added:", srl.length);
console.log("NEW TOTAL:", merged.length);
console.log("--------------------------------");
console.log("SRL GST check:");

const gst = srl.reduce((acc, p) => {
  acc[p.gst] = (acc[p.gst] || 0) + 1;
  return acc;
}, {});

console.log(gst);

console.log("--------------------------------");
console.log("products.json updated!");
