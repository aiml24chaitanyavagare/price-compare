import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database will be created inside project/server/data/
const dataDir = path.join(__dirname, "data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "products.db");

const db = new Database(dbPath);

// Improve performance for large datasets
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");
db.pragma("cache_size = -64000");

// Create products table
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    company TEXT NOT NULL,
    product_code TEXT,
    product_name TEXT NOT NULL,

    cas_number TEXT,
    packing TEXT,
    variant TEXT,

    price REAL,

    hsn_code TEXT,
    gst TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Indexes for FAST searching
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_product_code
  ON products(product_code);

  CREATE INDEX IF NOT EXISTS idx_product_name
  ON products(product_name);

  CREATE INDEX IF NOT EXISTS idx_company
  ON products(company);

  CREATE INDEX IF NOT EXISTS idx_cas_number
  ON products(cas_number);

  CREATE INDEX IF NOT EXISTS idx_company_code
  ON products(company, product_code);
`);

console.log(`Database ready: ${dbPath}`);

export default db;