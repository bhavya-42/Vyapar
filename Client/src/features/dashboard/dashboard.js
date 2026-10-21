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
