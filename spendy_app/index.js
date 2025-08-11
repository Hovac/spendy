const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db_func = require('./db_functions');
const app = express();


// New route to get data from the DB
app.get('/', async (req, res) => {
  t_db = db_func.init_db();
  try {
    const rows = await db_func.get_data(50, t_db); // call the function
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
