const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const current_year = new Date().getFullYear();
const current_month = new Date().getMonth() + 1;

async function table_has_data() {
  const res = await fetch("/is-empty");
  const data = await res.json();

  let is_empty = !data.empty;

  return is_empty;
}

function create_table_example() {
  const table_div = document.querySelector("#table-section");

  // create year title
  const heading = document.createElement("h1");
  heading.textContent = current_year;
  table_div.appendChild(heading);

  // dummy data array for the example table
  const data = Array.from({ length: monthNames.length }, () => {
    return [
      Math.random() < 0.3
        ? null
        : parseFloat((Math.random() * (150 - 0) + 0).toFixed(2)),
      Math.random() < 0.3
        ? null
        : parseFloat((Math.random() * (150 - 0) + 0).toFixed(2)),
      Math.random() < 0.7
        ? null
        : parseFloat((Math.random() * (150 - 0) + 0).toFixed(2)),
    ];
  });
  // Append € to non-null values
  const formattedData = data.map((row) =>
    row.map((cell) => (cell !== null ? cell + " €" : null))
  );
  // create table
  const hot = new Handsontable(table_div, {
    themeName: "ht-theme-main-dark-auto",
    data: formattedData,
    colHeaders: ["electricity_example", "gas_example", "internet_example"],
    rowHeaders: monthNames,
    width: "100%",
    height: "auto",
    colWidths: 150,
    rowHeaderWidth: 120,
    readOnly: true,
    licenseKey: "non-commercial-and-evaluation",
  });
  hot.addHook("afterSelection", example_popup);
}

async function table_write_new_value(bill_name, y_m_bill_id, amount) {
  try {
    const response = await fetch("http://localhost:3000/insert-bill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bill_name: bill_name,
        y_m_bill_id: y_m_bill_id,
        amount: amount,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error inserting bill:", error);
  }
}

async function table_change_value(bill_id, new_value) {
  try {
    const response = await fetch("http://localhost:3000/update-bill-amount", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        y_m_bill_id: bill_id,
        amount: new_value,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error inserting bill:", error);
  }
}

async function table_delete_value(y_m_bill_id) {
  try {
    const response = await fetch("/delete-bill", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ y_m_bill_id }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Delete failed:", result.error);
      alert("Delete failed: " + result.error);
      return;
    }
  } catch (err) {
    console.error("Request error:", err);
    alert("Error connecting to the server.");
  }
}

function encode_db_id(t_year, t_month, t_col) {
  // convert row 0 to december
  month = t_month;
  // combine year and month + add leading zero if single digit month
  let y_m_b_id = parseInt(`${t_year}${String(month).padStart(2, "0")}${t_col}`);
  return y_m_b_id;
}

function decode_db_id(bill_id) {
  const str = String(bill_id);

  const t_year = parseInt(str.slice(0, 4), 10);
  const t_month = parseInt(str.slice(4, 6), 10);
  const t_id = parseInt(str.slice(6), 10);

  return { t_year, t_month, t_id };
}

function cell_modifier(cell_data, t_year, col_names) {
  let data = cell_data[0];
  let row = data[0];
  let col = data[1];
  let old_value = data[2];
  let new_value = data[3];

  y_m_b_id = encode_db_id(t_year, row, col);

  // normalize
  const old_empty =
    old_value === null || old_value === undefined || old_value === "";
  const new_empty =
    new_value === null || new_value === undefined || new_value === "";

  if (old_empty && !new_empty) {
    table_write_new_value(
      col_names[col],
      y_m_b_id,
      Number(new_value.toFixed(2))
    );
  } else if (!old_empty && !new_empty && old_value != new_value) {
    table_change_value(y_m_b_id, Number(new_value.toFixed(2)));
  } else if (!old_empty && new_empty) {
    table_delete_value(y_m_b_id);
  } else {
    // no action
  }
}

async function create_table_from_db(cells_data) {
  const table_div = document.querySelector("#table-section");
  let data_col;
  let data_cells;

  try {
    const response = await fetch("http://localhost:3000/get-columns");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    data_col = await response.json();
  } catch (err) {
    console.error("Error fetching data:", err);
  }

  try {
    const response = await fetch("http://localhost:3000/get-cells_data");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    data_cells = await response.json();
  } catch (err) {
    console.error("Error fetching data:", err);
  }

  // --- Create H1 above the table ---
  const heading = document.createElement("h1");
  heading.textContent = current_year; // your title text
  heading.style.textAlign = "center"; // center the text
  heading.style.marginBottom = "20px"; // spacing below the heading
  heading.style.fontFamily = "Arial, sans-serif";
  heading.style.fontWeight = "600";

  table_div.appendChild(heading);

  let data_headers = [];
  for (let i = 0; i < data_col.data.length; i++) {
    data_headers.push(data_col.data[i].bill_name);
  }

  let real_data = [];
  for (let i = 0; i < monthNames.length; i++) {
    real_data[i] = []; // initialize each month as an empty array
  }

  for (let i = 0; i < data_cells.data.length; i++) {
    let t_cell = decode_db_id(data_cells.data[i].y_m_bill_id);
    real_data[t_cell.t_month][t_cell.t_id] = data_cells.data[i].amount;
  }

  const hot = new Handsontable(table_div, {
    themeName: "ht-theme-main-dark-auto",
    data: real_data,
    colHeaders: data_headers,
    rowHeaders: monthNames.reverse(),
    width: "100%",
    height: "auto",
    colWidths: 150,
    rowHeaderWidth: 120,
    licenseKey: "non-commercial-and-evaluation",
    columns: data_headers.map(() => ({
      type: "numeric",
      allowInvalid: false,
      numericFormat: {
        pattern: "0.00", // Always show 2 decimals
      },
    })),
  });

  hot.addHook("afterChange", (cell) => {
    cell_modifier(cell, heading.textContent, hot.getColHeader());
  });
}

/**
 * database is checked for empty in fake_main, so assume data is here
 */
async function db_retrieve_data() {
  var cells_data = {
    columns: null,
    data: null,
  };

  // store data headers first
  let data_headers;
  try {
    const response = await fetch("http://localhost:3000/get-columns");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    data_headers = await response.json();
  } catch (err) {
    console.error("Error fetching data:", err);
  }

  var tmp_columns = {
    col_map: new Map(),
    col_name: [],
  };
  for (let i = 0; i < data_headers.data.length; i++) {
    tmp_columns.col_name.push(data_headers.data[i].bill_name);
    tmp_columns.col_map.set(data_headers.data[i].bill_name, i);
  }
  cells_data.columns = tmp_columns;

  // store data belonging to these headers. if no data is found, fill current year with 12 months of nulls
  let tmp_data;
  try {
    const response = await fetch("http://localhost:3000/get-cells_data");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    tmp_data = await response.json();
  } catch (err) {
    console.error("Error fetching data:", err);
  }
}

/*
check if DB is empty and create new table
if DB isn't empty, create table for each year and populate it
*/
async function fake_main() {
  const db_has_data = await table_has_data();
  add_bill_button();
  delete_bill_button();
  if (db_has_data) {
    const cells_data = db_retrieve_data();
    create_table_from_db(cells_data);
  } else {
    create_table_example();
  }
}

fake_main();
