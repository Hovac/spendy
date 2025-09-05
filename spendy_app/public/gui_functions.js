async function save_bill_column(bill_name) {
  let data_col;
  try {
    const response = await fetch("/get-columns");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    data_col = await response.json();
  } catch (err) {
    console.error("Error fetching data:", err);
  }

  const usedIds = new Set(data_col.data.map((item) => item.y_m_bill_id));

  let emptyPos = 0;
  while (usedIds.has(emptyPos) && emptyPos <= 1000) {
    emptyPos++;
  }

  console.log(emptyPos); // 0

  try {
    const response = await fetch("/save-bill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        textField: bill_name,
        y_m_bill_id: Number(emptyPos),
      }),
    });
    const data = await response.json();
    console.log("Server response:", data);
    location.reload();
  } catch (error) {
    console.error("Error sending data:", error);
  }
}

async function getBillName(y_m_bill_id) {
  try {
    const response = await fetch(`/get-bill-name?y_m_bill_id=${y_m_bill_id}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Unknown error");
    }

    return data.bill_name;
  } catch (error) {
    console.error("Error fetching bill name:", error);
    return null; // or handle it differently
  }
}

async function delete_bill_column(col_id) {
  const billId = parseInt(col_id, 10);
  if (isNaN(billId)) {
    alert("Please enter a valid number.");
    return;
  }

  let bill_name = await getBillName(billId);

  console.log(bill_name);

  try {
    const response = await fetch("/delete-bill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bill_name: bill_name }),
    });

    const result = await response.json();
    if (result.success) {
    } else {
      alert(`Error: ${result.error}`);
    }
    location.reload();
  } catch (err) {
    console.error("Delete request failed:", err);
    alert("Request failed, check console.");
  }
}

function closePopup(popup, overlay) {
  popup.classList.remove("show");
  overlay.classList.remove("show");
  setTimeout(() => {
    popup.remove();
    overlay.remove();
  }, 300); // wait for fade-out animation
}

function delete_bill_button() {
  const table_div = document.querySelector("#table-section");

  // Create the Delete Popup button
  const button = document.createElement("button");
  button.id = "delete-popup-btn";
  button.textContent = "Delete Bill";
  button.style.padding = "5px";

  table_div.appendChild(button);

  // Create overlay (hidden initially)
  const overlay = document.createElement("div");
  overlay.id = "popup-overlay";
  document.body.appendChild(overlay);

  // Create popup container (hidden initially)
  const popup = document.createElement("div");
  popup.id = "center-popup";

  // Input field for y_m_bill_id
  const input = document.createElement("input");
  input.type = "number";
  input.placeholder = "Enter y_m_bill_id...";

  // Submit button
  const submitBtn = document.createElement("button");
  submitBtn.textContent = "Delete";

  // Submit event - triggers delete API
  async function submitDelete() {
    delete_bill_column(input.value);
    closePopup(popup, overlay);
  }

  submitBtn.addEventListener("click", submitDelete);

  // Allow pressing Enter to submit
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitDelete();
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

    overlay.classList.add("show");
    popup.classList.add("show");

    setTimeout(() => input.focus(), 50);
  });

  // Close popup if overlay is clicked
  overlay.addEventListener("click", () => closePopup(popup, overlay));
}

function add_bill_button() {
  const table_div = document.querySelector("#table-section");

  // Create the Open Popup button
  const button = document.createElement("button");
  button.id = "show-popup-btn";
  button.textContent = "add column";
  button.style.marginRight = "25px";
  button.style.marginBottom = "25px";
  button.style.padding = "5px";
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

  // Submit event
  function submitForm() {
    save_bill_column(input.value);
    closePopup(popup, overlay);
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
  overlay.addEventListener("click", () => closePopup(popup, overlay));
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

// Function to calculate column width based on table_div width
function calculate_col_width(header_quantity) {
  const row_header_width = 120;
  const table_div = document.querySelector("#table-section");
  const col_width =
    (table_div.offsetWidth - row_header_width) / header_quantity;
  return col_width;
}
