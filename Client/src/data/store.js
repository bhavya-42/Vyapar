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
