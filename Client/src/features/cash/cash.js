function adjustCashBankModal() {
  let modal = document.getElementById('cashAdjModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'cashAdjModal';
    modal.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:999999;";
    modal.innerHTML = `
      <div style="background:white;padding:25px;border-radius:10px;width:350px;box-shadow:0 5px 15px rgba(0,0,0,0.3);font-family:Segoe UI,sans-serif;">
        <h3 style="margin-top:0;color:#1e293b;" id="adjModalTitle">Add / Reduce Cash</h3>
        <input type="hidden" id="adjEditIdx" value="-1" />
        <label style="font-size:12px;font-weight:600;">Action Type</label>
        <select id="adj_action" style="width:100%;padding:8px;margin-bottom:10px;border:1px solid #cbd5e1;border-radius:4px;box-sizing:border-box;">
          <option value="ADD">Add Cash (Paisa Aaya)</option>
          <option value="REDUCE">Reduce Cash (Paisa Gaya)</option>
        </select>
        <label style="font-size:12px;font-weight:600;">Amount (₹)</label>
        <input type="number" id="adj_amount" placeholder="Enter amount" style="width:100%;padding:8px;margin-bottom:10px;border:1px solid #cbd5e1;border-radius:4px;box-sizing:border-box;" />
        <label style="font-size:12px;font-weight:600;">Date</label>
        <input type="date" id="adj_date" style="width:100%;padding:8px;margin-bottom:15px;border:1px solid #cbd5e1;border-radius:4px;box-sizing:border-box;" />
        <div style="display:flex;gap:10px;">
          <button onclick="saveCashAdjustment()" style="flex:1;background:#2563eb;color:white;border:none;padding:10px;border-radius:4px;cursor:pointer;font-weight:600;">Save</button>
          <button onclick="document.getElementById('cashAdjModal').style.display='none'" style="flex:1;background:#64748b;color:white;border:none;padding:10px;border-radius:4px;cursor:pointer;">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  } else {
    modal.style.display = 'flex';
  }
  document.getElementById('adjEditIdx').value = '-1';
  document.getElementById('adjModalTitle').innerText = 'Add / Reduce Cash';
  document.getElementById('adj_amount').value = '';
  document.getElementById('adj_date').value = new Date().toISOString().split('T')[0];
}

function saveCashAdjustment() {
  let editIdx = parseInt(document.getElementById('adjEditIdx').value);
  let action = document.getElementById('adj_action').value;
  let amt = parseFloat(document.getElementById('adj_amount').value) || 0;
  let date = document.getElementById('adj_date').value || new Date().toISOString().split('T')[0];

  if (amt <= 0) return showToast("Valid amount daalein!", "error");
  if (!db.cashAdjustments) db.cashAdjustments = [];

  if (editIdx === -1) {
    db.cashAdjustments.unshift({ date, action, amt });
  } else {
    db.cashAdjustments[editIdx] = { date, action, amt };
  }

  document.getElementById('cashAdjModal').style.display = 'none';
  saveDB();
  showToast("Cash in Hand updated successfully!");
}

function editCashAdjustment(idx) {
  let adj = db.cashAdjustments[idx];
  adjustCashBankModal();
  document.getElementById('adjEditIdx').value = idx;
  document.getElementById('adjModalTitle').innerText = 'Edit Cash Adjustment';
  document.getElementById('adj_action').value = adj.action;
  document.getElementById('adj_amount').value = adj.amt;
  document.getElementById('adj_date').value = adj.date;
}

function deleteCashAdjustment(idx) {
  if (!confirm("Is cash adjustment entry ko delete karein?")) return;
  db.cashAdjustments.splice(idx, 1);
  saveDB();
  showToast("Entry delete ho gayi!");
}
