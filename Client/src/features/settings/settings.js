function saveFirm() {
  db.firm = document.getElementById('s_firm').value;
  db.phone = document.getElementById('s_phone').value;
  db.gst = document.getElementById('s_gst').value;
  saveDB();
  showToast("Settings Saved!");
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
