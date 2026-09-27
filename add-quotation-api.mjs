import fs from "fs";

const file = "./server/server.js";
let code = fs.readFileSync(file, "utf8");

const marker = "/* ---------------------------------------\n   START SERVER\n--------------------------------------- */";

const apiCode = `
/* ---------------------------------------
   SAVE QUOTATION
--------------------------------------- */

app.post("/api/quotations", (req, res) => {
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
      const customerResult = db.prepare(\`
        INSERT INTO customers
          (name, company, mobile, email, gstin, place)
        VALUES (?, ?, ?, ?, ?, ?)
      \`).run(
        customer.name || "",
        customer.company || "",
        customer.mobile || "",
        customer.email || "",
        customer.gstin || "",
        customer.place || ""
      );

      const customerId = customerResult.lastInsertRowid;

      let grandTotal = 0;

      const quotationResult = db.prepare(\`
        INSERT INTO quotations
          (quotation_no, quotation_date, customer_id, grand_total)
        VALUES (?, ?, ?, ?)
      \`).run(
        quotationNo,
        quotationDate,
        customerId,
        0
      );

      const quotationId = quotationResult.lastInsertRowid;

      const insertItem = db.prepare(\`
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
      \`);

      for (const item of items) {
        const quantity = Number(item.quantity || 1);
        const unitPrice = Number(item.price || 0);
        const discountPercent = Number(item.discount_percent || 0);
        const gstPercent = Number(item.gst || 0);

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

      db.prepare(\`
        UPDATE quotations
        SET grand_total = ?
        WHERE id = ?
      \`).run(grandTotal, quotationId);

      return {
        quotationId,
        customerId,
        grandTotal
      };
    })();

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

`;

if (code.includes('app.post("/api/quotations"')) {
  console.log("Quotation API already exists. No changes made.");
} else if (!code.includes(marker)) {
  console.error("START SERVER marker not found. No changes made.");
} else {
  code = code.replace(marker, apiCode + marker);
  fs.writeFileSync(file, code, "utf8");
  console.log("Quotation API added successfully.");
}
