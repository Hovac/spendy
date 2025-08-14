const sqlite3 = require('sqlite3').verbose();
const path = require('path');


function db_open(){
    const dbPath = path.join(__dirname, '..', 'database', 'spendy.sqlite');
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
          console.error('Failed to open DB:', err.message);
      } else {
          console.log('Connected to SQLite database.');
      }
    });

    return db;
}

function db_close(t_db){
    if (!t_db) return;
    t_db.close((err) => {
        if (err) {
            console.error('Error closing DB:', err.message);
        } else {
            console.log('Closed SQLite database.');
        }
    });

}

function db_get_data(limit = 100, t_db) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM spendings LIMIT ?;`;
    t_db.all(sql, [limit], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function db_get_columns(limit = 100, t_db) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM bills LIMIT ?;`;
    t_db.all(sql, [limit], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function db_save_bill(bill, t_db) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO bills (name)
      VALUES (?);
    `;
    t_db.run(sql, [bill.name], function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID }); // this.lastID = auto-generated ID
    });
  });
}

function db_save_data_row(spending_row, t_db){
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO spendings (bill_id, year, month, amount)
      VALUES (?, ?, ?, ?);
    `;
    t_db.run(sql, [spending_row.bill_id, spending_row.year, spending_row.month, spending_row.amount], function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID }); // this.lastID = auto-generated ID
    });
  });
}

function db_delete_data_row(data_id){
  return new Promise((resolve, reject) => {
    const db = db_open();
    const sql = `
      DELETE FROM spendings
      WHERE id = ?;
      LIMIT 1;
    `;
    db.run(
      sql,
      [data_id],
      function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes }); // number of deleted rows
        db_close(db);
      }
    );
  });
}

function db_delete_bill(bill_id) {
  return new Promise((resolve, reject) => {
    const db = db_open();

    db.serialize(() => {
      db.run(
        'DELETE FROM spendings WHERE bill_id = ?;',
        [bill_id],
        function (err) {
          if (err) return reject(err);
        }
      );

      db.run(
        'DELETE FROM bills WHERE id = ?;',
        [bill_id],
        function (err) {
          if (err) return reject(err);
          resolve({ deletedBillId: bill_id });
          db_close(db);
        }
      );
    });
  });
}

module.exports = {
    db_get_data,
    db_get_columns,
    db_save_bill,
    db_save_data_row,
    db_open,
    db_close,
    db_delete_data_row,
    db_delete_bill
};
