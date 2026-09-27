import express from "express";
import cors from "cors";
import db from "./database.js";
import ExcelJS from "exceljs";

async function exportQuotationsToExcel() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Quotation History");

  sheet.columns = [
    { header: "Quotation No", key: "quotation_no", width: 18 },
    { header: "Quotation Date", key: "quotation_date", width: 15 },
    { header: "Customer Name", key: "customer_name", width: 24 },
    { header: "Product", key: "product_name", width: 32 },
    { header: "Product Company", key: "product_company", width: 20 },
    { header: "Packing", key: "packing", width: 15 },
    { header: "Quantity", key: "quantity", width: 12 },
    { header: "Unit Price", key: "unit_price", width: 14 },
    { header: "Item Total", key: "total", width: 15 },
    { header: "Grand Total", key: "grand_total", width: 18 }
  ];

  const rows = db.prepare(`
    SELECT
      q.quotation_no,
      q.quotation_date,
      c.name AS customer_name,
      qi.product_name,
      qi.company AS product_company,
      qi.packing,
      qi.quantity,
      qi.unit_price,
      qi.total,
      q.grand_total
    FROM quotations q
    LEFT JOIN customers c ON c.id = q.customer_id
    LEFT JOIN quotation_items qi ON qi.quotation_id = q.id
    ORDER BY q.id DESC, qi.id ASC
  `).all();

  rows.forEach((row) => {
    sheet.addRow(row);
  });

  sheet.getRow(1).font = { bold: true };

  await workbook.xlsx.writeFile(
    "./server/data/excel/quotation-history.xlsx"
  );
}
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

/* ---------------------------------------
   HEALTH CHECK
--------------------------------------- */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Price Compare API is running",
  });
});

/* ---------------------------------------
   DATABASE STATS
--------------------------------------- */

app.get("/api/stats", (req, res) => {
  try {
    const productCount = db
      .prepare("SELECT COUNT(*) AS count FROM products")
      .get();

    const companyCount = db
      .prepare(
        `SELECT COUNT(DISTINCT company) AS count
         FROM products
         WHERE company IS NOT NULL
         AND company != ''`
      )
      .get();

    const companies = db
      .prepare(
        `SELECT company, COUNT(*) AS count
         FROM products
         WHERE company IS NOT NULL
         AND company != ''
         GROUP BY company
         ORDER BY company`
      )
      .all();

    res.json({
      success: true,
      products: productCount.count,
      companies: companyCount.count,
      companyDetails: companies,
    });
  } catch (error) {
    console.error("Stats error:", error);

    res.status(500).json({
      success: false,
      error: "Unable to read database statistics",
    });
  }
});

/* ---------------------------------------
   PRODUCT + PDF SEARCH
--------------------------------------- */

app.get("/api/search", (req, res) => {
  try {
    const q = String(req.query.q || "").trim();

    if (!q) {
      return res.json([]);
    }

    const search = `%${q}%`;

    /* -----------------------------------
       1. STRUCTURED PRODUCT SEARCH
    ----------------------------------- */

    const products = db
      .prepare(`
        SELECT
          id,
          company,
          product_code,
          product_name,
          cas_number,
          packing,
          variant,
          price,
          hsn_code,
          gst,
          'product' AS result_type
        FROM products
        WHERE
          product_code LIKE ?
          OR product_name LIKE ?
          OR cas_number LIKE ?
        ORDER BY product_name
        LIMIT 50
      `)
      .all(search, search, search);

    /* -----------------------------------
       2. RAW PDF TEXT SEARCH
    ----------------------------------- */

    const pdfResults = db
      .prepare(`
        SELECT
          id,
          company,
          source_file,
          page_number,
          content,
          'pdf' AS result_type
        FROM pdf_search
        WHERE content LIKE ?
        ORDER BY company, page_number
        LIMIT 50
      `)
      .all(search);

    /* -----------------------------------
       RETURN BOTH RESULTS
    ----------------------------------- */

    res.json({
      success: true,
      query: q,
      products,
      pdfResults,
      totalProducts: products.length,
      totalPdfResults: pdfResults.length,
    });

  } catch (error) {
    console.error("Search error:", error);

    res.status(500).json({
      success: false,
      error: "Search failed",
    });
  }
});


/* ---------------------------------------
   SAVE QUOTATION
--------------------------------------- */

app.post("/api/quotations", async (req, res) => {
  try {
    const {
      quotationNo,
      quotationDate,
      customer,
      items
    } = req.body;

    if (!quotationNo || !quotationDate || !customer?.name || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Quotation number, date, customer name and items are required."
      });
    }

    const saveQuotation = db.transaction(() => {
      const customerResult = db.prepare(`
        INSERT INTO customers
          (name, company, mobile, email, gstin, place)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        customer.name || "",
        customer.company || "",
        customer.mobile || "",
        customer.email || "",
        customer.gstin || "",
        customer.place || ""
      );

      const customerId = customerResult.lastInsertRowid;

      let grandTotal = 0;

      const quotationResult = db.prepare(`
        INSERT INTO quotations
          (quotation_no, quotation_date, customer_id, grand_total)
        VALUES (?, ?, ?, ?)
      `).run(
        quotationNo,
        quotationDate,
        customerId,
        0
      );

      const quotationId = quotationResult.lastInsertRowid;

      const insertItem = db.prepare(`
        INSERT INTO quotation_items
          (
            quotation_id,
            product_id,
            product_name,
            company,
            product_code,
            cas_number,
            hsn_code,
            packing,
            quantity,
            unit_price,
            discount_percent,
            gst_percent,
            total
          )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        const quantity = Number(item.quantity || 1);
        const unitPrice = Number(item.price ?? item.unit_price ?? 0);
        const discountPercent = Number(item.discount_percent || 0);
        const gstPercent = Number(item.gst_percent ?? item.gst ?? 0);

        const baseAmount = quantity * unitPrice;
        const discountAmount = baseAmount * discountPercent / 100;
        const taxableAmount = baseAmount - discountAmount;
        const gstAmount = taxableAmount * gstPercent / 100;
        const total = taxableAmount + gstAmount;

        grandTotal += total;

        insertItem.run(
          quotationId,
          item.id || null,
          item.product_name || item.name || "",
          item.company || "",
          item.product_code || item.code || "",
          item.cas_number || item.cas || "",
          item.hsn_code || "",
          item.packing || "",
          quantity,
          unitPrice,
          discountPercent,
          gstPercent,
          total
        );
      }

      db.prepare(`
        UPDATE quotations
        SET grand_total = ?
        WHERE id = ?
      `).run(grandTotal, quotationId);

      return {
        quotationId,
        customerId,
        grandTotal
      };
    })();

    await exportQuotationsToExcel();

    res.json({
      success: true,
      message: "Quotation saved successfully.",
      ...saveQuotation
    });

  } catch (error) {
    console.error("Quotation save error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to save quotation."
    });
  }
});

/* ---------------------------------------
   START SERVER
--------------------------------------- */

app.listen(PORT, () => {
  console.log("========================================");
  console.log(`Price Compare API running at http://localhost:${PORT}`);
  console.log("========================================");
});












