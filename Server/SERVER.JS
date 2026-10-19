require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// MySQL Database Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vyapar_db'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('✅ Connected to MySQL Database successfully.');
});

// 1. Send OTP API
app.post('/api/auth/send-otp', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(503).json({ error: 'OTP delivery is not configured.' });
  }

  const { phone } = req.body;
  if (!phone || phone.length < 10) {
    return res.status(400).json({ error: 'Valid mobile number daalein!' });
  }
  res.json({ message: 'Demo OTP flow enabled.' });
});

// 2. Verify OTP API
app.post('/api/auth/verify-otp', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(503).json({ error: 'OTP delivery is not configured.' });
  }

  const { phone, otp } = req.body;
  if (otp !== (process.env.TEST_OTP || '123456')) {
    return res.status(400).json({ error: 'Galat OTP hai!' });
  }

  db.query('SELECT * FROM users WHERE phone = ?', [phone], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length > 0) {
      res.json({ success: true, isNewUser: false, user: results[0] });
    } else {
      res.json({ success: true, isNewUser: true, phone });
    }
  });
});

// 3. Register Shop API
app.post('/api/auth/register-shop', (req, res) => {
  const { phone, shop_name, gst } = req.body;
  if (!phone || !shop_name) {
    return res.status(400).json({ error: 'Phone aur Shop Name zaroori hai!' });
  }

  const query = 'INSERT INTO users (phone, shop_name, gst) VALUES (?, ?, ?)';
  db.query(query, [phone, shop_name, gst || ''], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    const userId = result.insertId;
    
    const defaultData = {
      firm: shop_name,
      phone: phone,
      gst: gst || '',
      cash: 0,
      bank: 0,
      items: [],
      parties: [],
      bills: [],
      expenses: [],
      payments: []
    };

    db.query('INSERT INTO app_store (user_id, data) VALUES (?, ?)', [userId, JSON.stringify(defaultData)], () => {
      res.json({ success: true, user: { id: userId, phone, shop_name, gst } });
    });
  });
});

// 4. Get User Data API
app.get('/api/db/:userId', (req, res) => {
  const userId = req.params.userId;
  db.query('SELECT data FROM app_store WHERE user_id = ?', [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length > 0) {
      const parsedData = typeof results[0].data === 'string' ? JSON.parse(results[0].data) : results[0].data;
      res.json(parsedData);
    } else {
      res.json(null);
    }
  });
});

// 5. Save User Data API
app.post('/api/db/:userId', (req, res) => {
  const userId = req.params.userId;
  const appData = req.body;
  const jsonData = JSON.stringify(appData);

  const query = 'INSERT INTO app_store (user_id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = ?';
  db.query(query, [userId, jsonData, jsonData], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Saved to MySQL successfully!' });
  });
});

const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});