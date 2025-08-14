const express = require("express");
const db_func = require("./db_functions");
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.get('/api/db/get_tables', async (req, res) => {
  t_db = db_func.db_open();
  try {
    const [headers, data] = await Promise.all([
      db_func.db_get_columns(100, t_db),
      db_func.db_get_data(100, t_db)
    ]);

    const spendy_table = {
      bills: headers,
      spendings: data
    };

    res.json(spendy_table);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    db_func.db_close(t_db);
  }
});

app.post('/api/db/save_column', express.json(), (req, res) => {
  t_db = db_func.db_open();
  db_func.db_save_bill(req.body, t_db)
    .then(result => res.json({ success: true, bill_id: result.id }))
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Could not save bill' });
    })
    .finally(() => {
      db_func.db_close(t_db);
    });
});

app.post('/api/db/save_bill_row', express.json(), (req, res) => {
  t_db = db_func.db_open();
  db_func.db_save_data_row(req.body, t_db)
    .then(result => res.json({ success: true, bill_id: result.id }))
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Could not save bill' });
    })
    .finally(() => {
      db_func.db_close(t_db);
    });
});

app.delete('/api/db/delete_bill_row/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await db_func.db_delete_data_row(id);

    if (result.changes === 0) {
      res.status(404).json({ error: 'No row found with that ID' });
    } else {
      res.json({ success: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/db/delete_bill_col/bills/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await db_func.db_delete_bill(id);

    if (result.changes === 0) {
      res.status(404).json({ error: 'No row found with that ID' });
    } else {
      res.json({ success: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
