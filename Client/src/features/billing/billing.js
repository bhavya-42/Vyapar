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
