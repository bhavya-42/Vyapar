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

function deleteItem(idx) {
  let item = db.items[idx];
  let isUsed = db.bills.some(b => b.items && b.items.some(bi => bi.id == item.id));
  if (isUsed) return showToast(`❌ "${item.name}" purane bills mein use ho chuka hai!`, "error");
  if (confirm(`Item "${item.name}" delete karein?`)) { db.items.splice(idx, 1); saveDB(); showToast("Item deleted!"); }
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
