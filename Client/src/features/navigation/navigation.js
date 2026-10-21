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
