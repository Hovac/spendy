const express = require("express");
const db_func = require("./db_functions");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());

/**
 * check if database table is empty or not
 */
app.get("/is-empty", (req, res) => {
  t_db = db_func.db_open();

  t_db.get("SELECT COUNT(*) AS count FROM spendy_bills", (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    // If count == 0, table is empty
    const isEmpty = row.count === 0;
    res.json({ empty: isEmpty });

    db_func.db_close(t_db);
  });
});

/**
 * save only a bill name with ID <1000
 * this way user can have 1000 unique columns
 * and we have speedier way to create columns
 * instead of querying everything and searching
 * for unique entries
 */
app.post("/save-bill", (req, res) => {
  t_db = db_func.db_open();

  const { textField } = req.body;

  if (!textField) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  const sql = `INSERT INTO spendy_bills (bill_name) VALUES (?)`;
  t_db.run(sql, [textField], function (err) {
    if (err) {
      console.error("Insert error:", err.message);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ success: true, insertedId: this.lastID });
    db_func.db_close(t_db);
  });
});

/**
 * only get bill names with ID less than 1000
 * helps us speed up the table creation
 */
app.get("/get-columns", (req, res) => {
  const t_db = db_func.db_open();

  const sql = `SELECT * FROM spendy_bills WHERE y_m_bill_id < ?`;

  t_db.all(sql, [1000], (err, rows) => {
    if (err) {
      console.error("Query error:", err.message);
      db_func.db_close(t_db);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({ success: true, data: rows });
    db_func.db_close(t_db);
  });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
