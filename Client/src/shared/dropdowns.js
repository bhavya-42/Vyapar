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

function closeAllDropdowns() {
  document.querySelectorAll('[id^="dropdown_"]').forEach(el => el.style.display = 'none');
}

function openReportSub(paneId, btn) {
  document.querySelectorAll('.rep-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(paneId).classList.add('active');
  if (btn) btn.classList.add('active');
}
