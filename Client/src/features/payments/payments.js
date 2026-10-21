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
