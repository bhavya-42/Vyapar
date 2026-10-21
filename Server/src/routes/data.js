const express = require('express');

function createDataRoutes(db) {
  const router = express.Router();

  router.get('/:userId', (req, res) => {
    const userId = req.params.userId;
    db.query('SELECT data FROM app_store WHERE user_id = ?', [userId], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length > 0) {
        const parsedData = typeof results[0].data === 'string'
          ? JSON.parse(results[0].data)
          : results[0].data;
        res.json(parsedData);
      } else {
        res.json(null);
      }
    });
  });

  router.post('/:userId', (req, res) => {
    const userId = req.params.userId;
    const jsonData = JSON.stringify(req.body);
    const query = 'INSERT INTO app_store (user_id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = ?';
    db.query(query, [userId, jsonData, jsonData], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Saved to MySQL successfully!' });
    });
  });

  return router;
}

module.exports = createDataRoutes;
