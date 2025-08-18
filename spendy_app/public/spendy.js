var bill_col_map;
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

function group_by_year(db_obj) {
  // 1. Group by year
  const grouped = Object.values(
    db_obj.reduce((acc, curr) => {
      if (!acc[curr.year]) {
        acc[curr.year] = { year: curr.year, items: [] };
      }
      acc[curr.year].items.push({
        month: curr.month,
        bill_id: curr.bill_id,
        amount: curr.amount,
        id: curr.id,
      });
      return acc;
    }, {})
  );

  // 2. Sort years ascending
  grouped.sort((a, b) => b.year - a.year);

  // 3. Sort months and fill missing with ""
  grouped.forEach((group) => {
    // sort ascending
    group.items.sort((a, b) => a.month - b.month);

    // fill in months 1 → 12
    const filled = [];
    for (let m = 1; m <= 12; m++) {
      const found = group.items.find((item) => item.month === m);
      filled.push(found || { month: m, bill_id: "", amount: "", id: "" });
    }
    group.items = filled;
  });

  return grouped;
}

function create_title(title_year) {
  const table_div = document.querySelector("#table-section");

  const h1_el = document.createElement("h1");
  h1_el.textContent = title_year;
  h1_el.style.color = "#22648c";

  table_div.appendChild(h1_el);
}

function create_tables() {
  const table_div = document.querySelector("#table-section");
  let temp_data = [];
  let temp_row = [];

  for (let i = 11; i >= 0; i--) {
    temp_row = [];
    temp_row[0] = monthNames[i];
    temp_row[1] = "";
    temp_row[2] = "";
    temp_data.push(temp_row);
  }
  console.log(temp_data);

  const hot = new Handsontable(table_div, {
    // theme name with obligatory ht-theme-* prefix
    themeName: "ht-theme-main-dark-auto",
    // other options
    data: temp_data,
    colHeaders: ["Month", "HEP", "MEEEP"],
    width: "auto",
    height: "auto",
    colWidths: 150,
    stretchH: "none", // do not stretch columns
    autoWrapRow: true,
    autoWrapCol: true,
    licenseKey: "non-commercial-and-evaluation", // for non-commercial use only
  });
  hot.addHook("afterChange", (cell) => {
    let data = cell[0];
    let row = data[0];
    let col = data[1];
    let old_value = data[2];
    let new_value = data[3];
    console.log(data);

    if (Number(new_value) === new_value) {
      if ((old_value == "" || old_value === undefined) && new_value != "") {
        // table_write_new_value();
        console.log("new value");
      } else if (new_value != "" && new_value != old_value) {
        // table_change_value();
        console.log("change value");
      } else {
        // currently do nothing
      }
    }
  });
}

function populate_tables(t_bills, table_data) {
  const table_div = document.querySelector("#table-section");

  table_data.forEach((t_year) => {
    create_title(t_year.year);
    // create_table(t_bills, t_year.items);
  });
}

async function loadBills() {
  try {
    const res = await fetch("/api/db/get_tables", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error ${res.status} ${res.statusText}`);

    const spendy_data = await res.json().catch(() => null);
    if (
      !spendy_data ||
      !Array.isArray(spendy_data.bills) ||
      !Array.isArray(spendy_data.spendings)
    ) {
      throw new Error("Invalid data format");
    }

    /* map bill_id to a column - important to know where to write data and how to store data */
    bill_col_map = spendy_data.bills.reduce((map, bill, index) => {
      map[bill.id] = index + 1;
      return map;
    }, {});

    const sorted_data = group_by_year(spendy_data.spendings);
    populate_tables(spendy_data.bills, sorted_data);
  } catch (err) {
    console.error("Failed to load bills:", err);
    document.getElementById(
      "table-section"
    ).innerHTML = `<p>Error loading bills: ${err.message}</p>`;
  }
}

// Call after page load
window.addEventListener("DOMContentLoaded", create_tables);
