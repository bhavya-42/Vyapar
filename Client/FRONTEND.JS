const API_URL = 'http://localhost:5000/api';

let currentUser = JSON.parse(localStorage.getItem('vyapar_current_user')) || null;

let db = {
  firm: "Shiv Shakti Garments",
  phone: "9352407578",
  gst: "08XXXXX1234X1Z5",
  cash: 0,
  bank: 0,
  items: [],
  parties: [],
  bills: [],
  expenses: [],
  payments: [],
  cashAdjustments: []
};

let currentBillItems = [];
let partyFilterMode = 'ALL';
let chartPeriod = 'CURR';
let editingItemIdx = null;
let activePaymentBillIdx = null;

function showToast(message, type = 'success') {
  let toast = document.getElementById('toastNotification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastNotification';
    toast.style.cssText = "position:fixed; bottom:25px; left:50%; transform:translateX(-50%); background:#0f172a; color:white; padding:12px 24px; border-radius:8px; font-size:14px; font-weight:500; z-index:999999; box-shadow:0 10px 25px rgba(0,0,0,0.3); transition:0.3s; opacity:0;";
    document.body.appendChild(toast);
  }
  toast.innerText = message;
  toast.style.background = type === 'error' ? '#dc2626' : '#16a34a';
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

function initDefaultDates() {
  let now = new Date();
  let firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  let today = now.toISOString().split('T')[0];

  ['dash', 'sales', 'pur', 'pin', 'pout', 'exp', 'cash', 'rep'].forEach(prefix => {
    let fromEl = document.getElementById(prefix + '_from');
    let toEl = document.getElementById(prefix + '_to');
    if (fromEl && !fromEl.value) fromEl.value = firstDay;
    if (toEl && !toEl.value) toEl.value = today;
  });
}

function setGlobalCurrentMonth() {
  let now = new Date();
  let firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  let today = now.toISOString().split('T')[0];

  ['dash', 'sales', 'pur', 'pin', 'pout', 'exp', 'cash', 'rep'].forEach(prefix => {
    let fromEl = document.getElementById(prefix + '_from');
    let toEl = document.getElementById(prefix + '_to');
    if (fromEl) fromEl.value = firstDay;
    if (toEl) toEl.value = today;
  });
  renderAll();
}

function isDateInRange(dateStr, fromDate, toDate) {
  if (!dateStr) return true;
  if (fromDate && dateStr < fromDate) return false;
  if (toDate && dateStr > toDate) return false;
  return true;
}

function initApp() {
  if (!currentUser) {
    showLoginScreen();
  } else {
    initDefaultDates();
    loadDBFromServer();
  }
}

function showLoginScreen() {
  let overlay = document.getElementById('loginOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loginOverlay';
    overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:#0f172a;display:flex;justify-content:center;align-items:center;z-index:9999;";
    overlay.innerHTML = `
      <div style="background:white;padding:30px;border-radius:12px;width:380px;box-shadow:0 10px 25px rgba(0,0,0,0.3);font-family:Segoe UI,sans-serif;">
        <h2 style="margin-top:0;color:#1e293b;text-align:center;">Vyapar Pro Login</h2>
        <p style="color:#64748b;font-size:14px;text-align:center;margin-bottom:20px;">Apna mobile number daal kar login karein</p>
        
        <div id="stepPhone">
          <label style="font-size:13px;font-weight:600;color:#475569;">Mobile Number</label>
          <input type="text" id="loginPhone" placeholder="10 digit mobile number" maxlength="10" style="width:100%;padding:10px;margin-top:6px;margin-bottom:15px;border:1px solid #cbd5e1;border-radius:6px;box-sizing:border-box;" />
          <button onclick="requestOtp()" style="width:100%;background:#2563eb;color:white;border:none;padding:11px;border-radius:6px;font-weight:600;cursor:pointer;">Send OTP</button>
        </div>

        <div id="stepOtp" style="display:none;">
          <label style="font-size:13px;font-weight:600;color:#475569;">Enter OTP (Test OTP: 123456)</label>
          <input type="text" id="loginOtp" value="123456" placeholder="Enter 6-digit OTP" style="width:100%;padding:10px;margin-top:6px;margin-bottom:15px;border:1px solid #cbd5e1;border-radius:6px;box-sizing:border-box;" />
          <button onclick="verifyOtp()" style="width:100%;background:#16a34a;color:white;border:none;padding:11px;border-radius:6px;font-weight:600;cursor:pointer;">Verify & Login</button>
        </div>

        <div id="stepShop" style="display:none;">
          <h3 style="margin-top:0;color:#1e293b;font-size:16px;">Nayi Dukaan Details</h3>
          <label style="font-size:13px;font-weight:600;color:#475569;">Shop / Firm Name</label>
          <input type="text" id="regShopName" placeholder="Jaise: Shiv Shakti Garments" style="width:100%;padding:10px;margin-top:6px;margin-bottom:12px;border:1px solid #cbd5e1;border-radius:6px;box-sizing:border-box;" />
          
          <label style="font-size:13px;font-weight:600;color:#475569;">GST Number (Optional)</label>
          <input type="text" id="regGst" placeholder="08XXXXX..." style="width:100%;padding:10px;margin-top:6px;margin-bottom:15px;border:1px solid #cbd5e1;border-radius:6px;box-sizing:border-box;" />
          
          <button onclick="registerShop()" style="width:100%;background:#2563eb;color:white;border:none;padding:11px;border-radius:6px;font-weight:600;cursor:pointer;">Create Shop & Start</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  } else {
    overlay.style.display = 'flex';
  }
}

async function requestOtp() {
  let phone = document.getElementById('loginPhone').value.trim();
  if (phone.length < 10) return showToast("Sahi 10 digit mobile number daalein!", "error");
  try {
    let res = await fetch(`${API_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    let data = await res.json();
    if (res.ok) {
      document.getElementById('stepPhone').style.display = 'none';
      document.getElementById('stepOtp').style.display = 'block';
    } else { showToast(data.error, "error"); }
  } catch (err) { showToast("Server error!", "error"); }
}

async function verifyOtp() {
  let phone = document.getElementById('loginPhone').value.trim();
  let otp = document.getElementById('loginOtp').value.trim();
  try {
    let res = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp })
    });
    let data = await res.json();
    if (res.ok) {
      if (data.isNewUser) {
        document.getElementById('stepOtp').style.display = 'none';
        document.getElementById('stepShop').style.display = 'block';
      } else {
        currentUser = data.user;
        localStorage.setItem('vyapar_current_user', JSON.stringify(currentUser));
        document.getElementById('loginOverlay').style.display = 'none';
        loadDBFromServer();
      }
    } else { showToast(data.error, "error"); }
  } catch (err) { showToast("Login failed!", "error"); }
}

async function registerShop() {
  let phone = document.getElementById('loginPhone').value.trim();
  let shop_name = document.getElementById('regShopName').value.trim();
  let gst = document.getElementById('regGst').value.trim();
  if (!shop_name) return showToast("Shop ka naam zaroori hai!", "error");
  try {
    let res = await fetch(`${API_URL}/auth/register-shop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, shop_name, gst })
    });
    let data = await res.json();
    if (res.ok) {
      currentUser = data.user;
      localStorage.setItem('vyapar_current_user', JSON.stringify(currentUser));
      document.getElementById('loginOverlay').style.display = 'none';
      loadDBFromServer();
    } else { showToast(data.error, "error"); }
  } catch (err) { showToast("Registration failed!", "error"); }
}

function logoutUser() {
  if (confirm("Logout karna chahte hain?")) {
    localStorage.removeItem('vyapar_current_user');
    currentUser = null;
    showLoginScreen();
  }
}

async function loadDBFromServer() {
  if (!currentUser) return;
  try {
    const res = await fetch(`${API_URL}/db/${currentUser.id}`);
    if (res.ok) {
      const serverData = await res.json();
      if (serverData) { 
        db = serverData; 
        if (!db.cashAdjustments) db.cashAdjustments = [];
        initDefaultDates();
        renderAll(); 
      }
      else { saveDB(); }
    }
  } catch (err) { console.warn("Server offline"); }
}

async function saveDB() {
  if (!currentUser) return;
  renderAll();
  try {
    await fetch(`${API_URL}/db/${currentUser.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(db)
    });
  } catch (err) { console.error("Save error:", err); }
}

function recalculateMasterLedger() {
  db.parties.forEach(p => { p.bal = p.openingBal || 0; });
  db.items.forEach(it => { it.stock = it.openingStock !== undefined ? it.openingStock : 0; });
  db.cash = 0;
  db.bank = 0;

  let sortedBills = [...db.bills].reverse();
  sortedBills.forEach(b => {
    if (b.type !== 'ESTIMATE' && b.items) {
      b.items.forEach(bi => {
        let item = db.items.find(i => i.id == bi.id);
        if (item) {
          if (b.type === 'SALE') item.stock -= bi.qty;
          else if (b.type === 'PURCHASE' || b.type === 'RETURN') item.stock += bi.qty;
        }
      });
      let party = db.parties.find(p => p.id == b.partyId);
      if (b.type === 'SALE') {
        if (b.mode === 'CASH') db.cash += b.paid; else db.bank += b.paid;
        if (party) party.bal += b.bal;
      } else if (b.type === 'PURCHASE' || b.type === 'RETURN') {
        if (b.mode === 'CASH') db.cash -= b.paid; else db.bank -= b.paid;
        if (party) party.bal -= b.bal;
      }
    }
  });

  let sortedPayments = [...db.payments].reverse();
  sortedPayments.forEach(p => {
    let party = db.parties.find(pt => pt.id == p.partyId);
    if (p.type === 'IN') {
      if (p.mode === 'CASH') db.cash += p.amt; else db.bank += p.amt;
      if (party) party.bal -= p.amt;
    } else {
      if (p.mode === 'CASH') db.cash -= p.amt; else db.bank -= p.amt;
      if (party) party.bal += p.amt;
    }
  });

  let sortedExpenses = [...db.expenses].reverse();
  sortedExpenses.forEach(e => {
    if (e.mode === 'CASH') db.cash -= e.amt; else db.bank -= e.amt;
  });

  if (db.cashAdjustments) {
    let sortedAdj = [...db.cashAdjustments].reverse();
    sortedAdj.forEach(adj => {
      if (adj.action === 'ADD') db.cash += adj.amt;
      else db.cash -= adj.amt;
    });
  }
}

function renderActionDropdown(actions) {
  let id = 'dropdown_' + Math.random().toString(36).substring(2, 9);
  let itemsHtml = actions.map(a => `<div onclick="${a.onclick}; closeAllDropdowns();" style="padding:8px 12px;cursor:pointer;font-size:13px;color:#334155;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:6px;white-space:nowrap;">${a.icon} ${a.label}</div>`).join('');
  
  return `
    <div style="position:relative;display:inline-block;" onclick="event.stopPropagation();">
      <button onclick="toggleDropdown(event, '${id}')" style="background:#f1f5f9;border:1px solid #cbd5e1;padding:4px 10px;border-radius:4px;cursor:pointer;font-weight:bold;">⋮</button>
      <div id="${id}" style="display:none;position:absolute;right:0;top:32px;background:white;border:1px solid #cbd5e1;border-radius:6px;box-shadow:0 4px 15px rgba(0,0,0,0.2);z-index:999999;min-width:140px;text-align:left;">
        ${itemsHtml}
      </div>
    </div>
  `;
}

function toggleDropdown(event, id) {
  event.stopPropagation();
  closeAllDropdowns();
  let menu = document.getElementById(id);
  if (menu) menu.style.display = 'block';
}

window.onclick = function() { closeAllDropdowns(); };
function closeAllDropdowns() {
  document.querySelectorAll('[id^="dropdown_"]').forEach(el => el.style.display = 'none');
}

function openReportSub(paneId, btn) {
  document.querySelectorAll('.rep-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(paneId).classList.add('active');
  if (btn) btn.classList.add('active');
}

function makeBillPayment(idx) {
  activePaymentBillIdx = idx;
  let b = db.bills[idx];
  if (b.bal <= 0) return showToast("Is bill ka poora payment ho chuka hai!", "error");

  let modal = document.getElementById('paymentModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'paymentModal';
    modal.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:999999;";
    modal.innerHTML = `
      <div style="background:white;padding:25px;border-radius:10px;width:350px;box-shadow:0 5px 15px rgba(0,0,0,0.3);font-family:Segoe UI,sans-serif;">
        <h3 style="margin-top:0;color:#1e293b;">Make Bill Payment</h3>
        <label style="font-size:12px;font-weight:600;">Payment Amount (₹)</label>
        <input type="number" id="modal_pay_amt" style="width:100%;padding:8px;margin-bottom:10px;border:1px solid #cbd5e1;border-radius:4px;box-sizing:border-box;" />
        <label style="font-size:12px;font-weight:600;">Payment Mode</label>
        <select id="modal_pay_mode" style="width:100%;padding:8px;margin-bottom:15px;border:1px solid #cbd5e1;border-radius:4px;box-sizing:border-box;">
          <option value="CASH">Cash</option>
          <option value="BANK">Bank / UPI</option>
        </select>
        <div style="display:flex;gap:10px;">
          <button onclick="confirmBillPayment()" style="flex:1;background:#2563eb;color:white;border:none;padding:10px;border-radius:4px;cursor:pointer;font-weight:600;">Submit</button>
          <button onclick="document.getElementById('paymentModal').style.display='none'" style="flex:1;background:#64748b;color:white;border:none;padding:10px;border-radius:4px;cursor:pointer;">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  } else {
    modal.style.display = 'flex';
  }
  document.getElementById('modal_pay_amt').value = b.bal;
}

function confirmBillPayment() {
  if (activePaymentBillIdx === null) return;
  let b = db.bills[activePaymentBillIdx];
  let payAmt = parseFloat(document.getElementById('modal_pay_amt').value) || 0;
  let mode = document.getElementById('modal_pay_mode').value;

  if (payAmt <= 0 || payAmt > b.bal) return showToast("Valid payment amount daalein!", "error");

  b.paid += payAmt;
  b.bal -= payAmt;

  let party = db.parties.find(p => p.id == b.partyId);
  if (b.type === 'SALE') {
    db.payments.unshift({ date: new Date().toISOString().split('T')[0], partyId: party ? party.id : 0, partyName: party ? party.name : 'Cash', type: 'IN', mode, amt: payAmt, note: `Bill ${b.id} Payment` });
  } else if (b.type === 'PURCHASE') {
    db.payments.unshift({ date: new Date().toISOString().split('T')[0], partyId: party ? party.id : 0, partyName: party ? party.name : 'Cash', type: 'OUT', mode, amt: payAmt, note: `Bill ${b.id} Payout` });
  }

  document.getElementById('paymentModal').style.display = 'none';
  saveDB();
  showToast("Payment successful!");
}

function editItem(idx) {
  editingItemIdx = idx;
  let it = db.items[idx];
  let modal = document.getElementById('editItemModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'editItemModal';
    modal.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:999999;";
    modal.innerHTML = `
      <div style="background:white;padding:25px;border-radius:10px;width:350px;box-shadow:0 5px 15px rgba(0,0,0,0.3);font-family:Segoe UI,sans-serif;">
        <h3 style="margin-top:0;color:#1e293b;">Edit Item</h3>
        <label style="font-size:12px;font-weight:600;">Item Name</label>
        <input type="text" id="modal_i_name" style="width:100%;padding:8px;margin-bottom:10px;border:1px solid #cbd5e1;border-radius:4px;box-sizing:border-box;" />
        <label style="font-size:12px;font-weight:600;">Item Code</label>
        <input type="text" id="modal_i_code" style="width:100%;padding:8px;margin-bottom:10px;border:1px solid #cbd5e1;border-radius:4px;box-sizing:border-box;" />
        <label style="font-size:12px;font-weight:600;">Purchase Rate (₹)</label>
        <input type="number" id="modal_i_prate" style="width:100%;padding:8px;margin-bottom:10px;border:1px solid #cbd5e1;border-radius:4px;box-sizing:border-box;" />
        <label style="font-size:12px;font-weight:600;">Selling Rate (₹)</label>
        <input type="number" id="modal_i_srate" style="width:100%;padding:8px;margin-bottom:10px;border:1px solid #cbd5e1;border-radius:4px;box-sizing:border-box;" />
        <label style="font-size:12px;font-weight:600;">Opening Stock Qty</label>
        <input type="number" id="modal_i_opening" style="width:100%;padding:8px;margin-bottom:15px;border:1px solid #cbd5e1;border-radius:4px;box-sizing:border-box;" />
        <div style="display:flex;gap:10px;">
          <button onclick="saveEditedItem()" style="flex:1;background:#2563eb;color:white;border:none;padding:10px;border-radius:4px;cursor:pointer;font-weight:600;">Save Changes</button>
          <button onclick="document.getElementById('editItemModal').style.display='none'" style="flex:1;background:#64748b;color:white;border:none;padding:10px;border-radius:4px;cursor:pointer;">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  } else {
    modal.style.display = 'flex';
  }
  document.getElementById('modal_i_name').value = it.name;
  document.getElementById('modal_i_code').value = it.code || '';
  document.getElementById('modal_i_prate').value = it.prate;
  document.getElementById('modal_i_srate').value = it.srate;
  document.getElementById('modal_i_opening').value = it.openingStock !== undefined ? it.openingStock : it.stock;
}

function saveEditedItem() {
  if (editingItemIdx === null) return;
  let it = db.items[editingItemIdx];
  it.name = document.getElementById('modal_i_name').value.trim();
  it.code = document.getElementById('modal_i_code').value.trim() || '-';
  it.prate = parseFloat(document.getElementById('modal_i_prate').value) || 0;
  it.srate = parseFloat(document.getElementById('modal_i_srate').value) || 0;
  it.openingStock = parseFloat(document.getElementById('modal_i_opening').value) || 0;
  
  document.getElementById('editItemModal').style.display = 'none';
  saveDB();
  showToast("Item successfully updated!");
}

function openAddItemModal() {
  let modal = document.getElementById('addItemModal');
  if (modal) {
    document.getElementById('i_name').value = '';
    document.getElementById('i_code').value = '';
    document.getElementById('i_hsn').value = '';
    document.getElementById('i_prate').value = '';
    document.getElementById('i_srate').value = '';
    document.getElementById('i_stock').value = '';
    modal.style.display = 'flex';
  }
}

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

function deleteItem(idx) {
  let item = db.items[idx];
  let isUsed = db.bills.some(b => b.items && b.items.some(bi => bi.id == item.id));
  if (isUsed) return showToast(`❌ "${item.name}" purane bills mein use ho chuka hai!`, "error");
  if (confirm(`Item "${item.name}" delete karein?`)) { db.items.splice(idx, 1); saveDB(); showToast("Item deleted!"); }
}

function deleteBill(idx) {
  let b = db.bills[idx];
  if (!confirm(`Bill ${b.id} (${b.type}) delete karein?`)) return;
  db.bills.splice(idx, 1);
  saveDB();
  showToast("Bill deleted successfully!");
}

function editBill(idx) {
  let b = db.bills[idx];
  showTab('billing', document.getElementById('nav-billing'));
  document.getElementById('b_type').value = b.type;
  changeBillType();
  document.getElementById('b_date').value = b.date;
  document.getElementById('b_party').value = b.partyId || "0";
  document.getElementById('b_mode').value = b.mode || "CASH";
  
  currentBillItems = JSON.parse(JSON.stringify(b.items || []));
  renderBillItems();
  db.bills.splice(idx, 1);
  saveDB();
  showToast("Bill loaded into editor for modification.");
}

function deletePayment(idx) {
  if (!confirm("Payment delete karein?")) return;
  db.payments.splice(idx, 1);
  saveDB();
  showToast("Payment deleted!");
}

function deleteExpense(idx) {
  if (!confirm("Expense delete karein?")) return;
  db.expenses.splice(idx, 1);
  saveDB();
  showToast("Expense deleted!");
}

function showTab(tabId, btn) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  if (btn) btn.classList.add('active');
  document.getElementById('pageTitle').innerText = btn ? btn.innerText : 'Dashboard';
  if (tabId === 'dash') setTimeout(drawSalesChart, 50);
}

function openCardDetail(cardType) {
  if (cardType === 'RECEIVE') { showTab('parties', document.getElementById('nav-parties')); setPartyFilter('RECEIVE', document.getElementById('pf_rec')); }
  else if (cardType === 'PAY') { showTab('parties', document.getElementById('nav-parties')); setPartyFilter('PAY', document.getElementById('pf_pay')); }
  else if (cardType === 'SALES') { showTab('sales_sec', document.getElementById('nav-sales')); }
  else if (cardType === 'STOCK') { showTab('items', document.getElementById('nav-items')); }
  else if (cardType === 'CASH') { showTab('cash_sec', document.getElementById('nav-cash-sec')); }
  else if (cardType === 'BANK') { showTab('expenses', document.getElementById('nav-expenses')); document.getElementById('adj_mode').value = 'BANK'; document.getElementById('adj_amt').focus(); }
}

function setPartyFilter(mode, btn) {
  partyFilterMode = mode;
  document.querySelectorAll('#parties .btn-sm').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderAll();
}

function openBill(type) {
  showTab('billing', document.getElementById('nav-billing'));
  document.getElementById('b_type').value = type;
  changeBillType();
  document.getElementById('b_date').value = new Date().toISOString().split('T')[0];
  if (type === 'SALE' || type === 'ESTIMATE') {
    let partySelect = document.getElementById('b_party');
    if (partySelect) partySelect.value = "0";
  }
}

function changeBillType() {
  let type = document.getElementById('b_type').value;
  document.getElementById('rateLabel').innerText = (type === 'PURCHASE') ? 'Purchase Rate (₹)' : 'Selling Rate (₹)';
  let titles = { SALE: 'TAX INVOICE', PURCHASE: 'PURCHASE BILL', RETURN: 'CREDIT NOTE (RETURN)', ESTIMATE: 'ESTIMATE / QUOTATION' };
  document.getElementById('billTypeHeading').innerText = titles[type];
  autoFillRate();
}

function toggleInlineParty() {
  let box = document.getElementById('inlinePartyBox');
  box.style.display = (box.style.display === 'none') ? 'block' : 'none';
}

function saveInlineParty() {
  let name = document.getElementById('qp_name').value.trim();
  let phone = document.getElementById('qp_phone').value.trim();
  let gst = document.getElementById('qp_gst').value.trim();
  if (!name) return showToast("Party name daalein!", "error");
  let newId = Date.now();
  db.parties.push({ id: newId, name, phone, gst, bal: 0, openingBal: 0 });
  document.getElementById('qp_name').value = '';
  document.getElementById('qp_phone').value = '';
  document.getElementById('qp_gst').value = '';
  toggleInlineParty();
  saveDB();
  document.getElementById('b_party').value = newId;
  showToast("Party created!");
}

function autoFillRate() {
  let itemId = document.getElementById('b_item').value;
  let type = document.getElementById('b_type').value;
  let item = db.items.find(i => i.id == itemId);
  if (item) {
    document.getElementById('b_rate').value = (type === 'PURCHASE') ? item.prate : item.srate;
    document.getElementById('b_gst').value = item.gst || 0;
  }
}

function addItemToBill() {
  let itemId = document.getElementById('b_item').value;
  let qty = parseFloat(document.getElementById('b_qty').value) || 0;
  let rate = parseFloat(document.getElementById('b_rate').value) || 0;
  let discPct = parseFloat(document.getElementById('b_disc').value) || 0;
  let gstPct = parseFloat(document.getElementById('b_gst').value) || 0;
  let item = db.items.find(i => i.id == itemId);
  if (!item || qty <= 0) return showToast("Valid item aur quantity daalein!", "error");

  let base = qty * rate;
  let discAmt = +(base * (discPct / 100)).toFixed(2);
  let taxable = +(base - discAmt).toFixed(2);
  let gstAmt = +(taxable * (gstPct / 100)).toFixed(2);
  let total = +(taxable + gstAmt).toFixed(2);

  currentBillItems.push({ id: item.id, name: item.name, hsn: item.hsn || '-', qty, rate, prate: item.prate, discPct, discAmt, taxable, gstPct, gstAmt, total });
  renderBillItems();
}

function renderBillItems() {
  let tbody = document.getElementById('billItemsBody');
  tbody.innerHTML = '';
  let grand = 0, taxSum = 0;
  currentBillItems.forEach((it, idx) => {
    grand += it.total;
    taxSum += it.gstAmt;
    tbody.innerHTML += `<tr>
      <td>${idx + 1}</td><td><b>${it.name}</b> <small>(${it.hsn})</small></td><td>${it.qty}</td>
      <td>₹${it.rate}</td><td>${it.discPct}%</td><td>₹${it.taxable}</td>
      <td>${it.gstPct}% (₹${it.gstAmt})</td><td><b>₹${it.total}</b></td>
      <td class="no-print"><button class="btn-sm" onclick="currentBillItems.splice(${idx},1);renderBillItems()">❌</button></td>
    </tr>`;
  });
  document.getElementById('b_tax_total').value = taxSum.toFixed(2);
  document.getElementById('b_total').value = Math.round(grand);
  document.getElementById('b_paid').value = Math.round(grand);
  calcBillBalance();
}

function calcBillBalance() {
  let tot = parseFloat(document.getElementById('b_total').value) || 0;
  let paid = parseFloat(document.getElementById('b_paid').value) || 0;
  document.getElementById('b_bal').value = tot - paid;
}

function saveBill() {
  if (currentBillItems.length === 0) return showToast("Pehle bill mein item add karein!", "error");
  let type = document.getElementById('b_type').value;
  let partyId = document.getElementById('b_party').value;
  let mode = document.getElementById('b_mode').value;
  let date = document.getElementById('b_date').value;
  let total = parseFloat(document.getElementById('b_total').value) || 0;
  let taxTotal = parseFloat(document.getElementById('b_tax_total').value) || 0;
  let paid = parseFloat(document.getElementById('b_paid').value) || 0;
  let bal = total - paid;

  let party = partyId == "0" ? null : db.parties.find(p => p.id == partyId);
  let costTotal = 0;
  let billItemsSnapshot = JSON.parse(JSON.stringify(currentBillItems));

  currentBillItems.forEach(bi => {
    let item = db.items.find(i => i.id == bi.id);
    if (item) {
      if (type === 'SALE') costTotal += (item.prate * bi.qty);
    }
  });

  db.bills.unshift({
    id: (type === 'ESTIMATE' ? 'EST-' : 'INV-') + (db.bills.length + 101),
    date, type, partyId: party ? party.id : 0, partyName: party ? party.name : 'Cash Sale',
    mode, total, taxTotal, paid, bal, costTotal,
    profit: (type === 'SALE') ? (total - taxTotal - costTotal) : 0,
    items: billItemsSnapshot
  });

  currentBillItems = [];
  renderBillItems();
  saveDB();
  showToast("Bill Saved Successfully!");
  showTab('dash', document.getElementById('nav-dash'));
}

function addItem() {
  let code = document.getElementById('i_code').value.trim() || '-';
  let name = document.getElementById('i_name').value.trim();
  let hsn = document.getElementById('i_hsn').value.trim() || '-';
  let prate = parseFloat(document.getElementById('i_prate').value) || 0;
  let srate = parseFloat(document.getElementById('i_srate').value) || 0;
  let gst = parseFloat(document.getElementById('i_gst').value) || 0;
  let stock = parseFloat(document.getElementById('i_stock').value) || 0;
  let min = parseFloat(document.getElementById('i_min').value) || 5;
  if (!name) return showToast("Item ka naam daalein!", "error");

  db.items.push({ id: Date.now(), code, name, hsn, prate, srate, gst, stock, openingStock: stock, min });
  
  let modal = document.getElementById('addItemModal');
  if (modal) modal.style.display = 'none';

  saveDB();
  showToast("Item added successfully!");
}

function addParty() {
  let name = document.getElementById('p_name').value.trim();
  let phone = document.getElementById('p_phone').value.trim();
  let gst = document.getElementById('p_gst').value.trim();
  let type = document.getElementById('p_type').value;
  let bal = parseFloat(document.getElementById('p_bal').value) || 0;
  if (!name) return showToast("Party ka naam daalein!", "error");

  let initialBal = type === 'RECEIVE' ? bal : -bal;
  db.parties.push({ id: Date.now(), name, phone, gst, bal: initialBal, openingBal: initialBal });
  document.getElementById('p_name').value = '';
  document.getElementById('p_bal').value = 0;
  saveDB();
  showToast("Party added successfully!");
}

function recordPayment() {
  let partyId = document.getElementById('pay_party').value;
  let type = document.getElementById('pay_type').value;
  let mode = document.getElementById('pay_mode').value;
  let amt = parseFloat(document.getElementById('pay_amt').value) || 0;
  let note = document.getElementById('pay_note').value.trim();
  if (amt <= 0) return showToast("Valid amount daalein!", "error");

  db.payments.unshift({ date: new Date().toISOString().split('T')[0], partyId: parseInt(partyId), partyName: db.parties.find(p=>p.id==partyId)?.name || 'Party', type, mode, amt, note });
  document.getElementById('pay_amt').value = '';
  document.getElementById('pay_note').value = '';
  saveDB();
  showToast("Payment Saved!");
}

function addExpense() {
  let cat = document.getElementById('e_cat').value;
  let desc = document.getElementById('e_desc').value.trim() || '-';
  let mode = document.getElementById('e_mode').value;
  let amt = parseFloat(document.getElementById('e_amt').value) || 0;
  if (amt <= 0) return showToast("Valid expense amount daalein!", "error");

  db.expenses.unshift({ date: new Date().toISOString().split('T')[0], cat, desc, mode, amt });
  document.getElementById('e_amt').value = '';
  document.getElementById('e_desc').value = '';
  saveDB();
  showToast("Expense recorded!");
}

function viewLedger(partyId) {
  let party = db.parties.find(p => p.id == partyId);
  if (!party) return;
  document.getElementById('ledgerTitle').innerText = `${party.name} - Khata Statement (Net Bal: ₹${party.bal})`;
  let tbody = document.getElementById('ledgerBody');
  tbody.innerHTML = '';
  db.bills.filter(b => b.partyId == partyId).forEach(b => {
    tbody.innerHTML += `<tr><td>${b.date}</td><td>${b.id}</td><td><b>${b.type}</b></td><td>₹${b.total}</td><td>₹${b.paid}</td><td>${b.mode}</td></tr>`;
  });
  db.payments.filter(p => p.partyId == partyId).forEach(p => {
    tbody.innerHTML += `<tr><td>${p.date}</td><td>PAY-${p.type}</td><td>Payment ${p.type} (${p.note})</td><td>-</td><td><b>₹${p.amt}</b></td><td>${p.mode}</td></tr>`;
  });
  document.getElementById('ledgerModal').style.display = 'flex';
}

function saveFirm() {
  db.firm = document.getElementById('s_firm').value;
  db.phone = document.getElementById('s_phone').value;
  db.gst = document.getElementById('s_gst').value;
  saveDB();
  showToast("Settings Saved!");
}

function setChartPeriod(period, btn) {
  chartPeriod = period;
  document.getElementById('ch_curr').classList.remove('active');
  document.getElementById('ch_prev').classList.remove('active');
  document.getElementById('ch_year').classList.remove('active');
  if (btn) btn.classList.add('active');
  drawSalesChart();
}

function drawSalesChart() {
  const canvas = document.getElementById('salesChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.parentElement.clientWidth - 40;
  const h = canvas.height = 220;
  ctx.clearRect(0, 0, w, h);

  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth();
  let labels = [], values = [];

  if (chartPeriod === 'CURR' || chartPeriod === 'PREV') {
    let targetY = curY, targetM = chartPeriod === 'CURR' ? curM : curM - 1;
    if (targetM < 0) { targetM = 11; targetY--; }
    let daysInMonth = new Date(targetY, targetM + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) { labels.push(d); values.push(0); }

    db.bills.forEach(b => {
      if (b.type === 'SALE' && b.date) {
        let parts = b.date.split('-');
        let by = parseInt(parts[0]), bm = parseInt(parts[1]) - 1, bd = parseInt(parts[2]);
        if (by === targetY && bm === targetM && bd >= 1 && bd <= daysInMonth) values[bd - 1] += b.total;
      }
    });
  } else {
    labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    values = new Array(12).fill(0);
    db.bills.forEach(b => {
      if (b.type === 'SALE' && b.date) {
        let parts = b.date.split('-');
        let by = parseInt(parts[0]), bm = parseInt(parts[1]) - 1;
        if (by === curY && bm >= 0 && bm < 12) values[bm] += b.total;
      }
    });
  }

  let periodSum = values.reduce((a, b) => a + b, 0);
  document.getElementById('chartTotalLabel').innerText = `Selected Period Sales: ₹${periodSum}`;

  let maxVal = Math.max(...values, 1000);
  let padL = 48, padR = 15, padT = 20, padB = 30;
  let plotW = w - padL - padR;
  let plotH = h - padT - padB;

  ctx.strokeStyle = '#e2e8f0';
  ctx.fillStyle = '#64748b';
  ctx.font = '11px Segoe UI';
  for (let i = 0; i <= 4; i++) {
    let y = padT + (plotH * i / 4);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
    ctx.fillText('₹' + Math.round(maxVal - (maxVal * i / 4)), 4, y + 4);
  }

  let step = plotW / labels.length;
  let barW = Math.max(6, step * 0.55);

  values.forEach((v, i) => {
    let x = padL + i * step + (step - barW) / 2;
    let barH = (v / maxVal) * plotH;
    let y = padT + plotH - barH;
    ctx.fillStyle = v > 0 ? '#2563eb' : '#cbd5e1';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, barW, Math.max(barH, 2), 3) : ctx.rect(x, y, barW, Math.max(barH, 2));
    ctx.fill();
    if (labels.length <= 12 || i % 3 === 0) { ctx.fillStyle = '#475569'; ctx.fillText(labels[i], x, h - 10); }
  });
}

function downloadBackup() {
  let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db));
  let a = document.createElement('a');
  a.setAttribute("href", dataStr);
  a.setAttribute("download", "vyapar_pro_backup.json");
  a.click();
}

function restoreBackup(e) {
  let file = e.target.files[0];
  if (!file) return;
  let reader = new FileReader();
  reader.onload = function(evt) {
    try { 
      db = JSON.parse(evt.target.result); 
      if (!db.cashAdjustments) db.cashAdjustments = [];
      saveDB(); 
      showToast("Backup Restored!"); 
    }
    catch(err) { showToast("Invalid file!", "error"); }
  };
  reader.readAsText(file);
}

function exportCSV() {
  let csv = "Date,Invoice,Type,Party,Total,GST,Paid,Balance,Profit\n";
  db.bills.forEach(b => {
    csv += `${b.date},${b.id},${b.type},"${b.partyName}",${b.total},${b.taxTotal||0},${b.paid},${b.bal},${b.profit||0}\n`;
  });
  let a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'Vyapar_Report.csv';
  a.click();
}

function clearAllData() {
  if (confirm("Sabhi data reset ho jayenge. Continue?")) { saveDB(); location.reload(); }
}

function renderAll() {
  if (currentUser) {
    db.firm = currentUser.shop_name || db.firm;
    db.phone = currentUser.phone || db.phone;
    db.gst = currentUser.gst || db.gst;
  }

  recalculateMasterLedger();

  document.getElementById('firmNameDisplay').innerText = db.firm;
  document.getElementById('billFirmTitle').innerText = db.firm;
  document.getElementById('billFirmGst').innerText = db.gst || '-';
  document.getElementById('billFirmPhone').innerText = db.phone || '-';
  document.getElementById('s_firm').value = db.firm;
  document.getElementById('s_phone').value = db.phone || '';
  document.getElementById('s_gst').value = db.gst || '';

  let toReceive = 0, toPay = 0, stockVal = 0, lowStockCount = 0;
  let totalSale = 0, totalPurchase = 0, totalCOGS = 0, grossProfit = 0, totalExp = 0;

  let dashF = document.getElementById('dash_from')?.value || '';
  let dashT = document.getElementById('dash_to')?.value || '';
  let salesF = document.getElementById('sales_from')?.value || '';
  let salesT = document.getElementById('sales_to')?.value || '';
  let purF = document.getElementById('pur_from')?.value || '';
  let purT = document.getElementById('pur_to')?.value || '';
  let pinF = document.getElementById('pin_from')?.value || '';
  let pinT = document.getElementById('pin_to')?.value || '';
  let poutF = document.getElementById('pout_from')?.value || '';
  let poutT = document.getElementById('pout_to')?.value || '';
  let expF = document.getElementById('exp_from')?.value || '';
  let expT = document.getElementById('exp_to')?.value || '';
  let cashF = document.getElementById('cash_from')?.value || '';
  let cashT = document.getElementById('cash_to')?.value || '';
  let repF = document.getElementById('rep_from')?.value || '';
  let repT = document.getElementById('rep_to')?.value || '';

  let pTable = document.getElementById('partiesTable');
  let bParty = document.getElementById('b_party');
  let payParty = document.getElementById('pay_party');
  let prevSelectedParty = bParty.value;
  pTable.innerHTML = ''; bParty.innerHTML = ''; payParty.innerHTML = '';

  bParty.innerHTML += `<option value="0">Cash Sale (Default)</option>`;

  db.parties.forEach(p => {
    if (p.bal > 0) toReceive += p.bal;
    if (p.bal < 0) toPay += Math.abs(p.bal);
    bParty.innerHTML += `<option value="${p.id}">${p.name} (Bal: ₹${p.bal})</option>`;
    payParty.innerHTML += `<option value="${p.id}">${p.name} (Bal: ₹${p.bal})</option>`;

    if (partyFilterMode === 'RECEIVE' && p.bal <= 0) return;
    if (partyFilterMode === 'PAY' && p.bal >= 0) return;

    let status = p.bal >= 0 ? `<span class="badge-green">Lena Hai</span>` : `<span class="badge-red">Dena Hai</span>`;
    let wa = p.phone && p.bal > 0 ? `<a href="https://wa.me/91${p.phone}?text=Namaste%20${encodeURIComponent(p.name)}%20ji,%20${encodeURIComponent(db.firm)}%20mein%20aapka%20₹${p.bal}%20baki%20hai." target="_blank">📲 Reminder</a>` : '-';
    pTable.innerHTML += `<tr>
      <td><b>${p.name}</b></td><td>${p.phone||'-'}</td><td>${p.gst||'-'}</td><td>${status}</td>
      <td><b>₹${Math.abs(p.bal)}</b></td>
      <td><button class="btn-sm" onclick="viewLedger(${p.id})">📜 Ledger</button></td>
      <td>${wa}</td>
    </tr>`;
  });
  if (prevSelectedParty) bParty.value = prevSelectedParty;

  let iTable = document.getElementById('itemsTable');
  let repStockT = document.getElementById('repStockTable');
  let dashLowT = document.getElementById('dashLowStockTable');
  let bItem = document.getElementById('b_item');
  let sItem = (document.getElementById('searchItem').value || '').toLowerCase();
  iTable.innerHTML = ''; repStockT.innerHTML = ''; dashLowT.innerHTML = ''; bItem.innerHTML = '';

  db.items.forEach((it, idx) => {
    let val = it.stock * it.prate;
    let saleVal = it.stock * it.srate;
    stockVal += val;
    if (it.stock <= (it.min || 5)) {
      lowStockCount++;
      dashLowT.innerHTML += `<tr><td><b>${it.name}</b></td><td><span class="badge-low">${it.stock}</span></td><td>${it.min||5}</td></tr>`;
    }
    bItem.innerHTML += `<option value="${it.id}">[${it.code}] ${it.name} (Qty: ${it.stock})</option>`;

    repStockT.innerHTML += `<tr>
      <td>${it.code||'-'}</td><td><b>${it.name}</b></td><td><b>${it.stock}</b></td>
      <td>₹${it.prate}</td><td>₹${it.srate}</td><td><b>₹${val}</b></td><td>₹${saleVal}</td>
      <td class="badge-green">₹${saleVal - val}</td>
    </tr>`;

    if (it.name.toLowerCase().includes(sItem) || (it.code && it.code.toLowerCase().includes(sItem))) {
      let stkBadge = it.stock <= (it.min || 5) ? `<span class="badge-low">${it.stock} (LOW)</span>` : `<b>${it.stock}</b>`;
      let actionMenu = renderActionDropdown([
        { label: 'Edit Item', icon: '✏️', onclick: `editItem(${idx})` },
        { label: 'Delete', icon: '🗑️', onclick: `deleteItem(${idx})` }
      ]);
      iTable.innerHTML += `<tr>
        <td>${it.code||'-'}</td><td><b>${it.name}</b></td><td>${it.hsn||'-'}</td>
        <td>₹${it.prate}</td><td>₹${it.srate}</td><td>${it.gst||0}%</td>
        <td class="badge-green">₹${it.srate - it.prate}</td><td>${stkBadge}</td><td>₹${val}</td>
        <td>${actionMenu}</td>
      </tr>`;
    }
  });
  if (lowStockCount === 0) dashLowT.innerHTML = `<tr><td colspan="3" style="color:#16a34a; font-weight:bold;">✅ All items are well stocked!</td></tr>`;

  let expensesTableBody = document.getElementById('expTable');
  if (expensesTableBody) {
    expensesTableBody.innerHTML = '';
    db.expenses.forEach((e, idx) => {
      if (!isDateInRange(e.date, expF, expT)) return;
      totalExp += e.amt;
      let actionMenu = renderActionDropdown([{ label: 'Delete', icon: '🗑️', onclick: `deleteExpense(${idx})` }]);
      expensesTableBody.innerHTML += `<tr><td>${e.date}</td><td><b>${e.cat}</b></td><td>${e.desc}</td><td>${e.mode}</td><td class="badge-red">₹${e.amt}</td><td>${actionMenu}</td></tr>`;
    });
  }

  let pinTable = document.getElementById('paymentInTableBody');
  if (pinTable) {
    pinTable.innerHTML = '';
    let inTxs = [];
    db.bills.forEach((b, bIdx) => {
      if (b.type === 'SALE' && b.paid > 0 && isDateInRange(b.date, pinF, pinT)) {
        inTxs.push({ date: b.date, source: b.partyName, desc: `Sale Invoice #${b.id}`, amt: b.paid, mode: b.mode, type: 'BILL', refIdx: bIdx });
      }
    });
    db.payments.forEach((p, pIdx) => {
      if (p.type === 'IN' && isDateInRange(p.date, pinF, pinT)) {
        inTxs.push({ date: p.date, source: p.partyName, desc: `Payment IN (${p.note||''})`, amt: p.amt, mode: p.mode, type: 'PAY', refIdx: pIdx });
      }
    });
    if (db.cashAdjustments) {
      db.cashAdjustments.forEach((adj, aIdx) => {
        if (adj.action === 'ADD' && isDateInRange(adj.date, pinF, pinT)) {
          inTxs.push({ date: adj.date, source: 'Manual Cash Add', desc: 'Direct Cash Adjustment', amt: adj.amt, mode: 'CASH', type: 'ADJ', refIdx: aIdx });
        }
      });
    }
    inTxs.sort((a,b) => new Date(b.date) - new Date(a.date));
    inTxs.forEach(t => {
      let actionMenu = '-';
      if (t.type === 'BILL') {
        actionMenu = renderActionDropdown([
          { label: 'Edit Bill', icon: '✏️', onclick: `editBill(${t.refIdx})` },
          { label: 'Delete Bill', icon: '🗑️', onclick: `deleteBill(${t.refIdx})` }
        ]);
      } else if (t.type === 'PAY') {
        actionMenu = renderActionDropdown([
          { label: 'Delete Payment', icon: '🗑️', onclick: `deletePayment(${t.refIdx})` }
        ]);
      } else if (t.type === 'ADJ') {
        actionMenu = renderActionDropdown([
          { label: 'Edit', icon: '✏️', onclick: `editCashAdjustment(${t.refIdx})` },
          { label: 'Delete', icon: '🗑️', onclick: `deleteCashAdjustment(${t.refIdx})` }
        ]);
      }
      pinTable.innerHTML += `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td>${t.date}</td><td><b>${t.source}</b></td><td>${t.desc}</td>
          <td class="badge-green">+₹${t.amt}</td><td>${t.mode}</td>
          <td style="text-align:right;">${actionMenu}</td>
        </tr>
      `;
    });
  }

  let poutTable = document.getElementById('paymentOutTableBody');
  if (poutTable) {
    poutTable.innerHTML = '';
    let outTxs = [];
    db.expenses.forEach((e, eIdx) => {
      if (isDateInRange(e.date, poutF, poutT)) {
        outTxs.push({ date: e.date, recipient: e.cat, desc: e.desc, amt: e.amt, mode: e.mode, type: 'EXP', refIdx: eIdx });
      }
    });
    db.payments.forEach((p, pIdx) => {
      if (p.type === 'OUT' && isDateInRange(p.date, poutF, poutT)) {
        outTxs.push({ date: p.date, recipient: p.partyName, desc: `Payment OUT (${p.note||''})`, amt: p.amt, mode: p.mode, type: 'PAY', refIdx: pIdx });
      }
    });
    db.bills.forEach((b, bIdx) => {
      if (b.type === 'PURCHASE' && b.paid > 0 && isDateInRange(b.date, poutF, poutT)) {
        outTxs.push({ date: b.date, recipient: b.partyName, desc: `Purchase Bill #${b.id}`, amt: b.paid, mode: b.mode, type: 'BILL', refIdx: bIdx });
      }
    });
    if (db.cashAdjustments) {
      db.cashAdjustments.forEach((adj, aIdx) => {
        if (adj.action === 'REDUCE' && isDateInRange(adj.date, poutF, poutT)) {
          outTxs.push({ date: adj.date, recipient: 'Manual Cash Reduce', desc: 'Direct Cash Adjustment', amt: adj.amt, mode: 'CASH', type: 'ADJ', refIdx: aIdx });
        }
      });
    }
    outTxs.sort((a,b) => new Date(b.date) - new Date(a.date));
    outTxs.forEach(t => {
      let actionMenu = '-';
      if (t.type === 'EXP') {
        actionMenu = renderActionDropdown([{ label: 'Delete Expense', icon: '🗑️', onclick: `deleteExpense(${t.refIdx})` }]);
      } else if (t.type === 'PAY') {
        actionMenu = renderActionDropdown([{ label: 'Delete Payment', icon: '🗑️', onclick: `deletePayment(${t.refIdx})` }]);
      } else if (t.type === 'BILL') {
        actionMenu = renderActionDropdown([
          { label: 'Edit Bill', icon: '✏️', onclick: `editBill(${t.refIdx})` },
          { label: 'Delete Bill', icon: '🗑️', onclick: `deleteBill(${t.refIdx})` }
        ]);
      } else if (t.type === 'ADJ') {
        actionMenu = renderActionDropdown([
          { label: 'Edit', icon: '✏️', onclick: `editCashAdjustment(${t.refIdx})` },
          { label: 'Delete', icon: '🗑️', onclick: `deleteCashAdjustment(${t.refIdx})` }
        ]);
      }
      poutTable.innerHTML += `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td>${t.date}</td><td><b>${t.recipient}</b></td><td>${t.desc}</td>
          <td class="badge-red">-₹${t.amt}</td><td>${t.mode}</td>
          <td style="text-align:right;">${actionMenu}</td>
        </tr>
      `;
    });
  }

  let cashTable = document.getElementById('cashLedgerTableBody');
  if (cashTable) {
    cashTable.innerHTML = '';
    let cashTxs = [];
    db.bills.forEach(b => {
      if (b.mode === 'CASH' && b.paid > 0 && isDateInRange(b.date, cashF, cashT)) {
        cashTxs.push({ date: b.date, type: b.type === 'SALE' ? 'Cash Sale' : 'Cash Purchase', desc: `Bill #${b.id} (${b.partyName})`, amt: b.type === 'SALE' ? b.paid : -b.paid, isManual: false });
      }
    });
    db.payments.forEach(p => {
      if (p.mode === 'CASH' && isDateInRange(p.date, cashF, cashT)) {
        cashTxs.push({ date: p.date, type: p.type === 'IN' ? 'Payment In' : 'Payment Out', desc: `${p.partyName} - ${p.note||''}`, amt: p.type === 'IN' ? p.amt : -p.amt, isManual: false });
      }
    });
    db.expenses.forEach(e => {
      if (e.mode === 'CASH' && isDateInRange(e.date, cashF, cashT)) {
        cashTxs.push({ date: e.date, type: 'Expense', desc: `${e.cat} (${e.desc})`, amt: -e.amt, isManual: false });
      }
    });
    if (db.cashAdjustments) {
      db.cashAdjustments.forEach((adj, adjIdx) => {
        if (isDateInRange(adj.date, cashF, cashT)) {
          cashTxs.push({ date: adj.date, type: adj.action === 'ADD' ? 'Manual Add Cash' : 'Manual Reduce Cash', desc: 'Direct Cash Adjustment', amt: adj.action === 'ADD' ? adj.amt : -adj.amt, isManual: true, manualIdx: adjIdx });
        }
      });
    }
    cashTxs.sort((a,b) => new Date(b.date) - new Date(a.date));
    cashTxs.forEach(t => {
      let color = t.amt > 0 ? '#16a34a' : '#dc2626';
      let sign = t.amt > 0 ? '+' : '';
      let actionCell = '-';
      if (t.isManual) {
        let actionMenu = renderActionDropdown([
          { label: 'Edit', icon: '✏️', onclick: `editCashAdjustment(${t.manualIdx})` },
          { label: 'Delete', icon: '🗑️', onclick: `deleteCashAdjustment(${t.manualIdx})` }
        ]);
        actionCell = actionMenu;
      }
      cashTable.innerHTML += `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td>${t.date}</td><td><b>${t.type}</b></td><td>${t.desc}</td>
          <td style="color:${color};font-weight:bold;">${sign}₹${Math.abs(t.amt)}</td>
          <td style="text-align:right;">${actionCell}</td>
        </tr>
      `;
    });
  }

  let txTable = document.getElementById('recentTxTable');
  let salesSecT = document.getElementById('salesSecTable');
  let purSecT = document.getElementById('purSecTable');
  let profTable = document.getElementById('profitTable');
  let repSaleT = document.getElementById('repSaleTable');
  let repPurT = document.getElementById('repPurTable');

  let sTx = (document.getElementById('searchTx').value || '').toLowerCase();
  let sSale = (document.getElementById('searchSaleSec').value || '').toLowerCase();
  let sPur = (document.getElementById('searchPurSec').value || '').toLowerCase();

  txTable.innerHTML = ''; salesSecT.innerHTML = ''; purSecT.innerHTML = '';
  profTable.innerHTML = ''; repSaleT.innerHTML = ''; repPurT.innerHTML = '';

  db.bills.forEach((b, idx) => {
    let actionMenu = renderActionDropdown([
      { label: 'Edit Bill', icon: '✏️', onclick: `editBill(${idx})` },
      b.bal > 0 ? { label: 'Make Payment', icon: '💳', onclick: `makeBillPayment(${idx})` } : null,
      { label: 'Delete Bill', icon: '🗑️', onclick: `deleteBill(${idx})` }
    ].filter(Boolean));

    if (b.type === 'SALE') {
      if (isDateInRange(b.date, repF, repT)) {
        totalSale += b.total;
        totalCOGS += (b.costTotal || 0);
        grossProfit += (b.profit || 0);

        profTable.innerHTML += `<tr>
          <td>${b.date}</td><td>${b.id}</td><td>${b.partyName}</td>
          <td>₹${(b.total - (b.taxTotal||0)).toFixed(0)}</td><td>₹${b.taxTotal||0}</td>
          <td><b>₹${b.total}</b></td><td>₹${b.costTotal||0}</td>
          <td class="badge-green"><b>₹${(b.profit||0).toFixed(0)}</b></td>
        </tr>`;

        repSaleT.innerHTML += `<tr>
          <td>${b.date}</td><td><b>${b.id}</b></td><td>${b.partyName}</td>
          <td>₹${b.taxTotal||0}</td><td><b>₹${b.total}</b></td><td>₹${b.paid}</td><td>₹${b.bal}</td><td>${b.mode||'CASH'}</td>
        </tr>`;
      }

      if (isDateInRange(b.date, salesF, salesT) && (b.partyName.toLowerCase().includes(sSale) || b.id.toLowerCase().includes(sSale))) {
        salesSecT.innerHTML += `<tr>
          <td>${b.date}</td><td><b>${b.id}</b></td><td>${b.partyName}</td><td>₹${b.taxTotal||0}</td>
          <td><b>₹${b.total}</b></td><td>₹${b.paid}</td><td class="badge-green">₹${b.bal}</td><td>${b.mode||'CASH'}</td>
          <td style="text-align:right;padding-right:15px;">${actionMenu}</td>
        </tr>`;
      }
    } else if (b.type === 'PURCHASE') {
      if (isDateInRange(b.date, repF, repT)) {
        totalPurchase += b.total;
        repPurT.innerHTML += `<tr>
          <td>${b.date}</td><td><b>${b.id}</b></td><td>${b.partyName}</td>
          <td>₹${b.taxTotal||0}</td><td><b>₹${b.total}</b></td><td>₹${b.paid}</td><td>₹${b.bal}</td><td>${b.mode||'CASH'}</td>
        </tr>`;
      }

      if (isDateInRange(b.date, purF, purT) && (b.partyName.toLowerCase().includes(sPur) || b.id.toLowerCase().includes(sPur))) {
        purSecT.innerHTML += `<tr>
          <td>${b.date}</td><td><b>${b.id}</b></td><td>${b.partyName}</td><td>₹${b.taxTotal||0}</td>
          <td><b>₹${b.total}</b></td><td>₹${b.paid}</td><td class="badge-red">₹${b.bal}</td><td>${b.mode||'CASH'}</td>
          <td style="text-align:right;padding-right:15px;">${actionMenu}</td>
        </tr>`;
      }
    }

    if (isDateInRange(b.date, dashF, dashT) && (b.partyName.toLowerCase().includes(sTx) || b.id.toLowerCase().includes(sTx))) {
      txTable.innerHTML += `<tr>
        <td>${b.date}</td><td><b>${b.id}</b></td><td>${b.type}</td><td>${b.partyName}</td>
        <td><b>₹${b.total}</b></td><td>₹${b.paid}</td><td>₹${b.bal}</td><td>${b.mode||'CASH'}</td>
        <td style="text-align:right;padding-right:15px;">${actionMenu}</td>
      </tr>`;
    }
  });

  document.getElementById('d_receive').innerText = '₹' + toReceive;
  document.getElementById('d_pay').innerText = '₹' + toPay;
  document.getElementById('d_sale').innerText = '₹' + totalSale;
  document.getElementById('d_purchase_sub').innerText = 'Purchase: ₹' + totalPurchase;
  document.getElementById('d_stock').innerText = '₹' + stockVal;
  document.getElementById('d_lowstock_sub').innerText = 'Low Stock: ' + lowStockCount;
  document.getElementById('d_cash').innerText = '₹' + db.cash;
  document.getElementById('d_bank').innerText = '₹' + (db.bank || 0);

  document.getElementById('salesSecSummary').innerText = 'Total Sales Revenue: ₹' + totalSale;
  document.getElementById('purSecSummary').innerText = 'Total Purchases: ₹' + totalPurchase;

  let filteredExpSum = db.expenses.reduce((acc, e) => isDateInRange(e.date, repF, repT) ? acc + e.amt : acc, 0);
  document.getElementById('pnl_sale').innerText = '₹' + totalSale;
  document.getElementById('pnl_cogs').innerText = '₹' + totalCOGS;
  document.getElementById('pnl_gross').innerText = '₹' + grossProfit.toFixed(0);
  document.getElementById('pnl_exp').innerText = '₹' + filteredExpSum;
  document.getElementById('pnl_net').innerText = '₹' + (grossProfit - filteredExpSum).toFixed(0);

  autoFillRate();
  drawSalesChart();
}

window.addEventListener('resize', drawSalesChart);

initApp();