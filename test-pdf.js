import fs from "fs";
import { PDFParse } from "pdf-parse";

const pdfPath =
  "./source-pdfs/SIMSON PRICE  2026-27.pdf";

async function testPDF() {
  try {
    console.log("Reading PDF...");
    console.log(pdfPath);

    const data = fs.readFileSync(pdfPath);

    const parser = new PDFParse({
      data,
    });

    const result = await parser.getText();

    console.log("\n=================================");
    console.log("PDF TEXT EXTRACTION SUCCESS");
    console.log("=================================\n");

    console.log("Pages:", result.total);

    console.log("\n----- FIRST 5000 CHARACTERS -----\n");

    console.log(result.text.slice(0, 5000));

    await parser.destroy();

    console.log("\n=================================");
    console.log("TEST COMPLETED");
    console.log("=================================");
  } catch (error) {
    console.error("\n❌ PDF TEST FAILED");
    console.error(error);
  }
}

testPDF();