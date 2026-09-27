import db from "./server/database.js";

db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company TEXT,
    mobile TEXT,
    email TEXT,
    gstin TEXT,
    place TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS quotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quotation_no TEXT NOT NULL UNIQUE,
    quotation_date TEXT NOT NULL,
    customer_id INTEGER,
    grand_total REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS quotation_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quotation_id INTEGER NOT NULL,
    product_id INTEGER,
    product_name TEXT NOT NULL,
    company TEXT,
    product_code TEXT,
    cas_number TEXT,
    hsn_code TEXT,
    packing TEXT,
    quantity REAL DEFAULT 1,
    unit_price REAL DEFAULT 0,
    discount_percent REAL DEFAULT 0,
    gst_percent REAL DEFAULT 0,
    total REAL DEFAULT 0,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE INDEX IF NOT EXISTS idx_quotations_no
  ON quotations(quotation_no);

  CREATE INDEX IF NOT EXISTS idx_quotations_customer
  ON quotations(customer_id);

  CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation
  ON quotation_items(quotation_id);
`);

console.log("Quotation database tables created successfully.");
