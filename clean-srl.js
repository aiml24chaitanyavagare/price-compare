import fs from "fs";

const file = "./srl-products.json";
const products = JSON.parse(
  fs.readFileSync(file, "utf8")
);

for (const p of products) {
  if (p.storage) {
    p.storage = p.storage
      .replace(/\s*--\s*\d+\s+of\s+\d+\s+--.*$/i, "")
      .trim();
  }
}

fs.writeFileSync(
  file,
  JSON.stringify(products, null, 2),
  "utf8"
);

console.log("======================================");
console.log("SRL CLEANUP");
console.log("======================================");

console.log("Products:", products.length);

console.log("\nCheck 41721:");
console.table(
  products.filter(p => p.product_code === "41721")
);

const suspicious = products.filter(p =>
  /Code Product Name|HS code|Packing Price|Storage/i.test(
    p.storage || ""
  )
);

console.log("\nSuspicious storage rows:", suspicious.length);

if (suspicious.length > 0) {
  console.table(suspicious);
} else {
  console.log("No suspicious storage rows found.");
}

console.log("\nSaved:", file);
console.log("======================================");
