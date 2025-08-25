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

// function cell_modifier(cell_data) {
//   let data = cell_data[0];
//   let row = data[0];
//   let col = data[1];
//   let old_value = data[2];
//   let new_value = data[3];
//   console.log(data);

//   if (Number(new_value) === new_value) {
//     if (
//       (old_value == "" || old_value === undefined || old_value === null) &&
//       new_value != ""
//     ) {
//       // write new value
//       // table_write_new_value();
//       console.log("new value");
//     } else if (new_value != "" && new_value != old_value) {
//       // change table value
//       // table_change_value();
//       console.log("change value");
//     } else {
//       console.log("do nothing");
//       // do nothing
//     }
//   } else if (
//     (new_value === null || new_value == "") &&
//     old_value != "" &&
//     old_value !== null
//   ) {
//     // delete the entry
//     console.log("delete value");
//   }
// }

function create_tables() {
  hot.addHook("afterChange", (cell) => {
    cell_modifier(cell);
  });
}

async function table_has_data() {
  const res = await fetch("/is-empty");
  const data = await res.json();

  let is_empty = !data.empty;

  return is_empty;
}

/**
 * create popup to signify the user that this is example table
 */
// Create the popup div once, outside the function
popup = document.createElement("div");
popup.id = "popup-message";
popup.textContent = "Add new bills to \ntrack the spendings";
document.body.appendChild(popup);
let timeoutId = null;

function example_popup() {
  const table_div = document.querySelector("#table-section");

  table_div.addEventListener("click", (e) => {
    const target = e.target;

    // Only trigger on cell or header
    if (
      target.tagName === "TD" ||
      target.closest(".ht_clone_top") ||
      target.closest(".ht_clone_left")
    ) {
      // Clear previous timer
      if (timeoutId) clearTimeout(timeoutId);

      // Show popup
      popup.style.display = "block";

      // Position centered on clicked element
      const rect = target.getBoundingClientRect();
      const popupWidth = popup.offsetWidth;
      const popupHeight = popup.offsetHeight;
      popup.style.left =
        rect.left + window.scrollX + rect.width / 2 - popupWidth / 2 + "px";
      popup.style.top =
        rect.top + window.scrollY + rect.height / 2 - popupHeight / 2 + "px";

      // Auto-hide after 5 seconds
      timeoutId = setTimeout(() => {
        popup.style.display = "none";
      }, 5000);
    }
  });

  // Hide popup if clicking anywhere outside table
  document.addEventListener("click", (e) => {
    if (
      e.target !== popup &&
      !e.target.closest(".htCore") &&
      !e.target.closest(".ht_clone_top") &&
      !e.target.closest(".ht_clone_left")
    ) {
      popup.style.display = "none";
      if (timeoutId) clearTimeout(timeoutId);
    }
  });
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

async function save_bill_column(bill_name) {
  try {
    const response = await fetch("http://localhost:3000/save-bill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        textField: bill_name,
      }),
    });

    const data = await response.json();
    console.log("Server response:", data);
  } catch (error) {
    console.error("Error sending data:", error);
  }
}

function add_bill_button() {
  const table_div = document.querySelector("#table-section");

  // Create the Open Popup button
  const button = document.createElement("button");
  button.id = "show-popup-btn";
  button.textContent = "Open Popup";
  table_div.appendChild(button);

  // Create overlay (hidden initially)
  const overlay = document.createElement("div");
  overlay.id = "popup-overlay";
  document.body.appendChild(overlay);

  // Create popup container (hidden initially)
  const popup = document.createElement("div");
  popup.id = "center-popup";

  // Input field
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Enter text...";

  // Submit button
  const submitBtn = document.createElement("button");
  submitBtn.textContent = "Submit";

  // Close popup function with fade-out
  function closePopup() {
    popup.classList.remove("show");
    overlay.classList.remove("show");
    setTimeout(() => {
      popup.remove();
      overlay.remove();
    }, 300); // wait for fade-out to finish
  }

  // Submit event
  function submitForm() {
    save_bill_column(input.value);
    closePopup();
  }

  submitBtn.addEventListener("click", submitForm);

  // Allow pressing Enter to submit
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // prevent form submission if inside a form
      submitForm();
    }
  });

  // Append elements to popup
  popup.appendChild(input);
  popup.appendChild(submitBtn);

  // Open popup on button click
  button.addEventListener("click", () => {
    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    // Force reflow so CSS transition works
    void overlay.offsetWidth;
    void popup.offsetWidth;

    // Show with fade-in
    overlay.classList.add("show");
    popup.classList.add("show");

    // Autofocus input after popup becomes visible
    setTimeout(() => input.focus(), 50);
  });

  // Close popup if overlay is clicked
  overlay.addEventListener("click", closePopup);
}

async function create_table_from_db() {
  const table_div = document.querySelector("#table-section");

  try {
    const response = await fetch("http://localhost:3000/get-columns");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Retrieved data:", data.data);
    return data;
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
  if (db_has_data) {
    create_table_from_db();
  } else {
    create_table_example();
  }
}

fake_main();
