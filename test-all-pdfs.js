import fs from "fs";
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

async function testPDF(pdf) {
  console.log("\n======================================");
  console.log(`TESTING: ${pdf.name}`);
  console.log("======================================");

  try {
    if (!fs.existsSync(pdf.path)) {
      console.log("❌ File not found:");
      console.log(pdf.path);
      return;
    }

    const data = fs.readFileSync(pdf.path);

    const parser = new PDFParse({
      data,
    });

    const result = await parser.getText();

    console.log("✅ PDF READ SUCCESS");
    console.log("Pages:", result.total);
    console.log("Text length:", result.text.length);

    console.log("\n----- FIRST 1500 CHARACTERS -----\n");

    console.log(result.text.slice(0, 1500));

    await parser.destroy();
  } catch (error) {
    console.log("❌ ERROR:");
    console.error(error);
  }
}

async function main() {
  for (const pdf of pdfs) {
    await testPDF(pdf);
  }

  console.log("\n======================================");
  console.log("🎉 ALL PDF TESTS COMPLETED");
  console.log("======================================");
}

main();