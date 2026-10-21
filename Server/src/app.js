const express = require('express');
const cors = require('cors');
const db = require('./config/database');
const createAuthRoutes = require('./routes/auth');
const createDataRoutes = require('./routes/data');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use('/api/auth', createAuthRoutes(db));
app.use('/api/db', createDataRoutes(db));

module.exports = app;
