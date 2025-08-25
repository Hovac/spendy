const sqlite3 = require("sqlite3").verbose();
const path = require("path");

function db_open() {
  const dbPath = path.join(__dirname, "..", "database", "spendy.sqlite");
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error("Failed to open DB:", err.message);
    } else {
      console.log("Connected to SQLite database.");
    }
  });

  return db;
}

function db_close(t_db) {
  if (!t_db) return;
  t_db.close((err) => {
    if (err) {
      console.error("Error closing DB:", err.message);
    } else {
      console.log("Closed SQLite database.");
    }
  });
}

module.exports = {
  db_open,
  db_close,
};
