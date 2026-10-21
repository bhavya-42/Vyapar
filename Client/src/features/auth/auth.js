function initApp() {
  if (!currentUser) {
    showLoginScreen();
  } else {
    initDefaultDates();
    loadDBFromServer();
  }
}

function showLoginScreen() {
  let overlay = document.getElementById('loginOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loginOverlay';
    overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:#0f172a;display:flex;justify-content:center;align-items:center;z-index:9999;";
    overlay.innerHTML = `
      <div style="background:white;padding:30px;border-radius:12px;width:380px;box-shadow:0 10px 25px rgba(0,0,0,0.3);font-family:Segoe UI,sans-serif;">
        <h2 style="margin-top:0;color:#1e293b;text-align:center;">Vyapar Pro Login</h2>
        <p style="color:#64748b;font-size:14px;text-align:center;margin-bottom:20px;">Apna mobile number daal kar login karein</p>
        
        <div id="stepPhone">
          <label style="font-size:13px;font-weight:600;color:#475569;">Mobile Number</label>
          <input type="text" id="loginPhone" placeholder="10 digit mobile number" maxlength="10" style="width:100%;padding:10px;margin-top:6px;margin-bottom:15px;border:1px solid #cbd5e1;border-radius:6px;box-sizing:border-box;" />
          <button onclick="requestOtp()" style="width:100%;background:#2563eb;color:white;border:none;padding:11px;border-radius:6px;font-weight:600;cursor:pointer;">Send OTP</button>
        </div>

        <div id="stepOtp" style="display:none;">
          <label style="font-size:13px;font-weight:600;color:#475569;">Enter OTP (Test OTP: 123456)</label>
          <input type="text" id="loginOtp" value="123456" placeholder="Enter 6-digit OTP" style="width:100%;padding:10px;margin-top:6px;margin-bottom:15px;border:1px solid #cbd5e1;border-radius:6px;box-sizing:border-box;" />
          <button onclick="verifyOtp()" style="width:100%;background:#16a34a;color:white;border:none;padding:11px;border-radius:6px;font-weight:600;cursor:pointer;">Verify & Login</button>
        </div>

        <div id="stepShop" style="display:none;">
          <h3 style="margin-top:0;color:#1e293b;font-size:16px;">Nayi Dukaan Details</h3>
          <label style="font-size:13px;font-weight:600;color:#475569;">Shop / Firm Name</label>
          <input type="text" id="regShopName" placeholder="Jaise: Shiv Shakti Garments" style="width:100%;padding:10px;margin-top:6px;margin-bottom:12px;border:1px solid #cbd5e1;border-radius:6px;box-sizing:border-box;" />
          
          <label style="font-size:13px;font-weight:600;color:#475569;">GST Number (Optional)</label>
          <input type="text" id="regGst" placeholder="08XXXXX..." style="width:100%;padding:10px;margin-top:6px;margin-bottom:15px;border:1px solid #cbd5e1;border-radius:6px;box-sizing:border-box;" />
          
          <button onclick="registerShop()" style="width:100%;background:#2563eb;color:white;border:none;padding:11px;border-radius:6px;font-weight:600;cursor:pointer;">Create Shop & Start</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  } else {
    overlay.style.display = 'flex';
  }
}

async function requestOtp() {
  let phone = document.getElementById('loginPhone').value.trim();
  if (phone.length < 10) return showToast("Sahi 10 digit mobile number daalein!", "error");
  try {
    let res = await fetch(`${API_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    let data = await res.json();
    if (res.ok) {
      document.getElementById('stepPhone').style.display = 'none';
      document.getElementById('stepOtp').style.display = 'block';
    } else { showToast(data.error, "error"); }
  } catch (err) { showToast("Server error!", "error"); }
}

async function verifyOtp() {
  let phone = document.getElementById('loginPhone').value.trim();
  let otp = document.getElementById('loginOtp').value.trim();
  try {
    let res = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp })
    });
    let data = await res.json();
    if (res.ok) {
      if (data.isNewUser) {
        document.getElementById('stepOtp').style.display = 'none';
        document.getElementById('stepShop').style.display = 'block';
      } else {
        currentUser = data.user;
        localStorage.setItem('vyapar_current_user', JSON.stringify(currentUser));
        document.getElementById('loginOverlay').style.display = 'none';
        loadDBFromServer();
      }
    } else { showToast(data.error, "error"); }
  } catch (err) { showToast("Login failed!", "error"); }
}

async function registerShop() {
  let phone = document.getElementById('loginPhone').value.trim();
  let shop_name = document.getElementById('regShopName').value.trim();
  let gst = document.getElementById('regGst').value.trim();
  if (!shop_name) return showToast("Shop ka naam zaroori hai!", "error");
  try {
    let res = await fetch(`${API_URL}/auth/register-shop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, shop_name, gst })
    });
    let data = await res.json();
    if (res.ok) {
      currentUser = data.user;
      localStorage.setItem('vyapar_current_user', JSON.stringify(currentUser));
      document.getElementById('loginOverlay').style.display = 'none';
      loadDBFromServer();
    } else { showToast(data.error, "error"); }
  } catch (err) { showToast("Registration failed!", "error"); }
}

function logoutUser() {
  if (confirm("Logout karna chahte hain?")) {
    localStorage.removeItem('vyapar_current_user');
    currentUser = null;
    showLoginScreen();
  }
}
