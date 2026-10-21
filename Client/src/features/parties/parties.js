function setPartyFilter(mode, btn) {
  partyFilterMode = mode;
  document.querySelectorAll('#parties .btn-sm').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderAll();
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
