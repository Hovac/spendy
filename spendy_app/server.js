const express = require("express");
const db_func = require("./db_functions");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());

/**
 * GET FUNCTIONS
 */
//check if database table is empty or not
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

// only get bill names with ID less than 1000, helps us speed up the table creation
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

//get cell data with ID larger than 1000
app.get("/get-cells_data", (req, res) => {
  const t_db = db_func.db_open();

  const sql = `SELECT * FROM spendy_bills WHERE y_m_bill_id > ?`;

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

// get bill name connected to the ID
app.get("/get-bill-name", (req, res) => {
  const t_db = db_func.db_open();

  const { y_m_bill_id } = req.query; // get from URL: /get-bill-name?y_m_bill_id=2025102

  if (!y_m_bill_id) {
    db_func.db_close(t_db);
    return res.status(400).json({ error: "Missing y_m_bill_id parameter" });
  }

  const sql = `SELECT bill_name FROM spendy_bills WHERE y_m_bill_id = ?`;

  t_db.get(sql, [y_m_bill_id], (err, row) => {
    if (err) {
      console.error("Query error:", err.message);
      db_func.db_close(t_db);
      return res.status(500).json({ error: "Database error" });
    }

    if (!row) {
      db_func.db_close(t_db);
      return res.status(404).json({ error: "Bill not found" });
    }

    res.json({ success: true, bill_name: row.bill_name });
    db_func.db_close(t_db);
  });
});


/**
 * DELETE FUNCTIONS
 */
// delete whole category
app.post("/delete-bill", (req, res) => {
  const t_db = db_func.db_open();

  const { bill_name } = req.body;

  // Validate input
  if (!bill_name || typeof bill_name !== "string") {
    db_func.db_close(t_db);
    return res.status(400).json({ error: "Invalid or missing bill_name" });
  }

  const sql = `DELETE FROM spendy_bills WHERE bill_name = ?`;

  t_db.run(sql, [bill_name], function (err) {
    if (err) {
      console.error("Delete error:", err.message);
      db_func.db_close(t_db);
      return res.status(500).json({ error: "Database error" });
    }

    // 'this.changes' tells us how many rows were deleted
    if (this.changes === 0) {
      res.status(404).json({ error: "No entries found with that bill_name" });
    } else {
      res.json({
        success: true,
        deletedCount: this.changes,
        bill_name: bill_name,
      });
    }

    db_func.db_close(t_db);
  });
});

// delete single data cell
app.post("/delete-cell", (req, res) => {
  const t_db = db_func.db_open();

  const { y_m_bill_id } = req.body;

  // Validate input
  if (typeof y_m_bill_id !== "number") {
    db_func.db_close(t_db);
    return res
      .status(400)
      .json({ error: "Invalid input type for y_m_bill_id" });
  }

  const sql = `DELETE FROM spendy_bills WHERE y_m_bill_id = ?`;

  t_db.run(sql, [y_m_bill_id], function (err) {
    if (err) {
      console.error("Delete error:", err.message);
      db_func.db_close(t_db);
      return res.status(500).json({ error: "Database error" });
    }

    // 'this.changes' tells us how many rows were deleted
    if (this.changes === 0) {
      res.status(404).json({ error: "Entry not found" });
    } else {
      res.json({
        success: true,
        deletedId: y_m_bill_id,
      });
    }

    db_func.db_close(t_db);
  });
});


/**
 * CREATE FUNCTIONS
 */
app.post("/insert-bill", (req, res) => {
  const t_db = db_func.db_open();

  const { bill_name, y_m_bill_id, amount } = req.body;

  // Validate input
  if (
    typeof bill_name !== "string" ||
    typeof y_m_bill_id !== "number" ||
    typeof amount !== "number"
  ) {
    db_func.db_close(t_db);
    return res.status(400).json({ error: "Invalid input types" });
  }

  const sql = `INSERT INTO spendy_bills (bill_name, y_m_bill_id, amount) VALUES (?, ?, ?)`;

  t_db.run(sql, [bill_name, y_m_bill_id, amount], function (err) {
    if (err) {
      console.error("Insert error:", err.message);
      db_func.db_close(t_db);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({
      success: true,
      insertedId: this.lastID,
      bill_name,
      y_m_bill_id,
      amount,
    });

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

  const { textField, y_m_bill_id } = req.body;

  if (!textField) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  const sql = `INSERT INTO spendy_bills (bill_name, y_m_bill_id) VALUES (?, ?)`;
  t_db.run(sql, [textField, y_m_bill_id], function (err) {
    if (err) {
      console.error("Insert error:", err.message);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ success: true, insertedId: this.lastID });
    db_func.db_close(t_db);
  });
});


/**
 * UPDATE FUNCTIONS
 */
app.post("/update-bill-amount", (req, res) => {
  const t_db = db_func.db_open();

  const { y_m_bill_id, amount } = req.body;

  // Validate input
  if (typeof y_m_bill_id !== "number" || typeof amount !== "number") {
    db_func.db_close(t_db);
    return res.status(400).json({ error: "Invalid input types" });
  }

  const sql = `UPDATE spendy_bills SET amount = ? WHERE y_m_bill_id = ?`;

  t_db.run(sql, [amount, y_m_bill_id], function (err) {
    if (err) {
      console.error("Update error:", err.message);
      db_func.db_close(t_db);
      return res.status(500).json({ error: "Database error" });
    }

    // 'this.changes' tells us how many rows were updated
    if (this.changes === 0) {
      res.status(404).json({ error: "Entry not found" });
    } else {
      res.json({
        success: true,
        updatedId: y_m_bill_id,
        newAmount: amount,
      });
    }

    db_func.db_close(t_db);
  });
});

app.listen(8119, "0.0.0.0", () => {
  console.log("Server running on http://0.0.0.0:8119");
});
