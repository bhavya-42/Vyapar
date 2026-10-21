function setChartPeriod(period, btn) {
  chartPeriod = period;
  document.getElementById('ch_curr').classList.remove('active');
  document.getElementById('ch_prev').classList.remove('active');
  document.getElementById('ch_year').classList.remove('active');
  if (btn) btn.classList.add('active');
  drawSalesChart();
}

function drawSalesChart() {
  const canvas = document.getElementById('salesChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.parentElement.clientWidth - 40;
  const h = canvas.height = 220;
  ctx.clearRect(0, 0, w, h);

  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth();
  let labels = [], values = [];

  if (chartPeriod === 'CURR' || chartPeriod === 'PREV') {
    let targetY = curY, targetM = chartPeriod === 'CURR' ? curM : curM - 1;
    if (targetM < 0) { targetM = 11; targetY--; }
    let daysInMonth = new Date(targetY, targetM + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) { labels.push(d); values.push(0); }

    db.bills.forEach(b => {
      if (b.type === 'SALE' && b.date) {
        let parts = b.date.split('-');
        let by = parseInt(parts[0]), bm = parseInt(parts[1]) - 1, bd = parseInt(parts[2]);
        if (by === targetY && bm === targetM && bd >= 1 && bd <= daysInMonth) values[bd - 1] += b.total;
      }
    });
  } else {
    labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    values = new Array(12).fill(0);
    db.bills.forEach(b => {
      if (b.type === 'SALE' && b.date) {
        let parts = b.date.split('-');
        let by = parseInt(parts[0]), bm = parseInt(parts[1]) - 1;
        if (by === curY && bm >= 0 && bm < 12) values[bm] += b.total;
      }
    });
  }

  let periodSum = values.reduce((a, b) => a + b, 0);
  document.getElementById('chartTotalLabel').innerText = `Selected Period Sales: ₹${periodSum}`;

  let maxVal = Math.max(...values, 1000);
  let padL = 48, padR = 15, padT = 20, padB = 30;
  let plotW = w - padL - padR;
  let plotH = h - padT - padB;

  ctx.strokeStyle = '#e2e8f0';
  ctx.fillStyle = '#64748b';
  ctx.font = '11px Segoe UI';
  for (let i = 0; i <= 4; i++) {
    let y = padT + (plotH * i / 4);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
    ctx.fillText('₹' + Math.round(maxVal - (maxVal * i / 4)), 4, y + 4);
  }

  let step = plotW / labels.length;
  let barW = Math.max(6, step * 0.55);

  values.forEach((v, i) => {
    let x = padL + i * step + (step - barW) / 2;
    let barH = (v / maxVal) * plotH;
    let y = padT + plotH - barH;
    ctx.fillStyle = v > 0 ? '#2563eb' : '#cbd5e1';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, barW, Math.max(barH, 2), 3) : ctx.rect(x, y, barW, Math.max(barH, 2));
    ctx.fill();
    if (labels.length <= 12 || i % 3 === 0) { ctx.fillStyle = '#475569'; ctx.fillText(labels[i], x, h - 10); }
  });
}
