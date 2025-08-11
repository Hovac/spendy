const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function init_db(){
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

function get_data(limit = 100, t_db) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM spendings LIMIT ?;`;
    t_db.all(sql, [limit], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = {
    init_db,
    get_data
};
