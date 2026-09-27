import db from "./server/database.js";

const columns = db
  .prepare("PRAGMA table_info(products)")
  .all();

console.log(columns);
