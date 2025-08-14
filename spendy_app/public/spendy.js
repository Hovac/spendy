async function loadBills() {
  try {
    const res = await fetch('/api/db/get_tables', { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error ${res.status} ${res.statusText}`);

    const data = await res.json().catch(() => null);
    if (!data || !Array.isArray(data.bills) || !Array.isArray(data.spendings)) {
      throw new Error("Invalid data format");
    }

    // Map numeric bill_id → bill name
    const billsMap = {};
    data.bills.forEach(b => { billsMap[b.id] = b.name; });

    const spendings = data.spendings;
    const container = document.getElementById('table-section');

    if (spendings.length === 0) {
      container.innerHTML = "<p>No bills yet</p>";
      return;
    }

    // Group by year-month
    const grouped = {};
    spendings.forEach(bill => {
      const key = `${bill.year}-${bill.month}`;
      if (!grouped[key]) grouped[key] = {};
      const name = billsMap[bill.bill_id] || `Bill ${bill.bill_id}`;
      grouped[key][name] = bill.amount.toFixed(2);
    });

    // Collect all unique bill names for table columns
    const allCategories = [...new Set(data.bills.map(b => b.name))];

    // Build table HTML
    let html = `<table>
      <thead>
        <tr>
          <th>Month</th>
          ${allCategories.map(c => `<th>${c}</th>`).join('')}
        </tr>
      </thead>
      <tbody>`;

    Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a)) // latest month first
      .forEach(key => {
        const [year, month] = key.split('-');
        const date = new Date(year, month - 1);
        const monthName = date.toLocaleString('default', { month: 'long' });

        html += `<tr>
          <td>${month}. ${monthName} ${year}</td>
          ${allCategories.map(c => `<td>${grouped[key][c] || ''}</td>`).join('')}
        </tr>`;
      });

    html += `</tbody></table>`;
    container.innerHTML = html;

  } catch (err) {
    console.error("Failed to load bills:", err);
    document.getElementById('table-section').innerHTML =
      `<p>Error loading bills: ${err.message}</p>`;
  }
}

// Call after page load
window.addEventListener('DOMContentLoaded', loadBills);

document.getElementById('bill-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const bill_id = document.getElementById('bill_id').value;
  const year = document.getElementById('year').value;
  const month = document.getElementById('month').value;
  const amount = document.getElementById('amount').value;

  const res = await fetch('/api/db/save_bill_row', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bill_id, year, month, amount })
  });

  if (res.ok) {
    loadBills();
    document.getElementById('bill-form').reset();
  }
});
