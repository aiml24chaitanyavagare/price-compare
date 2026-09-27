import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";

const pdfs = [
  {
    name: "LOBA",
    path: "./source-pdfs/LOBA Price List 2026-27 - APRIL 2026_260402_113107.pdf",
  },
  {
    name: "SIMSON",
    path: "./source-pdfs/SIMSON PRICE  2026-27.pdf",
  },
  {
    name: "SRL",
    path: "./source-pdfs/SRL-E-Catalogue_26-27_Excel_Version.pdf",
  },
];

const outputFolder = "./extracted-text";

if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder, { recursive: true });
}

async function extractPDF(pdf) {
  console.log("\n======================================");
  console.log(`Reading ${pdf.name}`);
  console.log("======================================");

  if (!fs.existsSync(pdf.path)) {
    console.log("❌ File not found:", pdf.path);
    return;
  }

  const data = fs.readFileSync(pdf.path);

  const parser = new PDFParse({
    data,
  });

  const result = await parser.getText();

  const outputPath = path.join(
    outputFolder,
    `${pdf.name}.txt`
  );

  fs.writeFileSync(
    outputPath,
    result.text,
    "utf8"
  );

  console.log(`✅ ${pdf.name} extracted`);
  console.log(`Pages: ${result.total}`);
  console.log(`Characters: ${result.text.length}`);
  console.log(`Saved: ${outputPath}`);

  await parser.destroy();
}

async function main() {
  console.log("\n🚀 Starting PDF extraction...\n");

  for (const pdf of pdfs) {
    await extractPDF(pdf);
  }

  console.log("\n======================================");
  console.log("🎉 ALL PDF TEXT FILES CREATED");
  console.log("======================================");
}

main().catch((error) => {
  console.error("\n❌ Extraction failed:");
  console.error(error);
});