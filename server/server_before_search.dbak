import express from "express";
import cors from "cors";
import db from "./database.js";

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
   PRODUCT SEARCH
--------------------------------------- */

app.get("/api/search", (req, res) => {
  try {
    const q = String(req.query.q || "").trim();

    if (!q) {
      return res.json([]);
    }

    const search = `%${q}%`;

    const rows = db
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
          gst
        FROM products
        WHERE
          product_code LIKE ?
          OR product_name LIKE ?
          OR cas_number LIKE ?
        ORDER BY product_name
        LIMIT 50
      `)
      .all(search, search, search);

    res.json(rows);
  } catch (error) {
    console.error("Search error:", error);

    res.status(500).json({
      success: false,
      error: "Search failed",
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