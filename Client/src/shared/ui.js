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
