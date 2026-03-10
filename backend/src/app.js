require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDatabase = require('./database/connection');
const itemRoutes = require('./routes/itemRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

connectDatabase();

app.use(cors());
app.use(express.json());

// SERVIR IMAGENS UPLOADADAS (CORRETO)
app.use(
  '/uploads',
  express.static(path.resolve(__dirname, '..', 'uploads'))
);

// ROTAS DA API
app.use('/api', authRoutes);
app.use('/api', itemRoutes);

module.exports = app;
