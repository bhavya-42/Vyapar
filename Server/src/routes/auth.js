const express = require('express');

function createAuthRoutes(db) {
  const router = express.Router();

  router.post('/send-otp', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ error: 'OTP delivery is not configured.' });
    }

    const { phone } = req.body;
    if (!phone || phone.length < 10) {
      return res.status(400).json({ error: 'Valid mobile number daalein!' });
    }
    res.json({ message: 'Demo OTP flow enabled.' });
  });

  router.post('/verify-otp', (req, res) => {
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

  router.post('/register-shop', (req, res) => {
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
        phone,
        gst: gst || '',
        cash: 0,
        bank: 0,
        items: [],
        parties: [],
        bills: [],
        expenses: [],
        payments: []
      };

      db.query(
        'INSERT INTO app_store (user_id, data) VALUES (?, ?)',
        [userId, JSON.stringify(defaultData)],
        () => {
          res.json({ success: true, user: { id: userId, phone, shop_name, gst } });
        }
      );
    });
  });

  return router;
}

module.exports = createAuthRoutes;
