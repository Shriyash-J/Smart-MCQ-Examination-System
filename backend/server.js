require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize, syncDB } = require('./models');

const authRoutes = require('./routes/auth');
const examRoutes = require('./routes/exams');
const resultRoutes = require('./routes/results');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/results', resultRoutes);

const PORT = process.env.PORT || 5000;

// Connect to PostgreSQL and start server
sequelize.authenticate()
  .then(() => {
    console.log('PostgreSQL connection established successfully.');
    return syncDB(); // Create tables if they don't exist
  })
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('Unable to connect to PostgreSQL:', err);
  });