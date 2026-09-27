import db from "./server/database.js";

const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type = ? ORDER BY name")
  .all("table");

console.log(tables);
