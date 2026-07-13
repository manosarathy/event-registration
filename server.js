const express = require('express');
require('dotenv').config();
const mysql = require('mysql2');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(express.static('public'));

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'event_registration_db',
  dateStrings: true
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    return;
  }
  console.log('Connected to MySQL database');
  // Ensure the registrations table exists
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS registrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      participant_name VARCHAR(255) NOT NULL,
      event_name VARCHAR(255) NOT NULL,
      event_date DATE NOT NULL,
      contact_number VARCHAR(50) NOT NULL
    )
  `;

  db.execute(createTableSql, (createErr) => {
    if (createErr) {
      console.error('Failed to ensure registrations table exists:', createErr.message);
    } else {
      console.log('Registrations table ready');
    }
  });
});

// CREATE
app.post('/api/registrations', (req, res) => {
  const { participant_name, event_name, event_date, contact_number } = req.body;

  console.log('Received registration payload:', req.body);

  if (!participant_name || !event_name || !event_date || !contact_number) {
    console.error('Missing required field(s) in payload:', req.body);
    return res.status(400).json({ message: 'All fields are required' });
  }

  const sql = `
    INSERT INTO registrations (participant_name, event_name, event_date, contact_number)
    VALUES (?, ?, ?, ?)
  `;

  db.execute(sql, [participant_name, event_name, event_date, contact_number], (err, result) => {
    if (err) {
      console.error('Insert error:', err.code, '-', err.message);
      return res.status(500).json({ message: 'Insert failed', error: err.message });
    }
    res.json({ message: 'Registration added successfully', id: result.insertId });
  });
});
app.get('/api/registrations', (req, res) => {
  const sql = 'SELECT * FROM registrations ORDER BY id ASC';

  db.execute(sql, (err, results) => {
    if (err) {
      console.error('Fetch error:', err.code, '-', err.message);
      return res.status(500).json({ message: 'Fetch failed', error: err.message });
    }
    res.json(results);
  });
});
app.get('/api/registrations/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM registrations WHERE id = ?';

  db.execute(sql, [id], (err, results) => {
    if (err) {
      console.error('Fetch one error:', err.code, '-', err.message);
      return res.status(500).json({ message: 'Fetch failed', error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    res.json(results[0]);
  });
});

// UPDATE
app.put('/api/registrations/:id', (req, res) => {
  const { id } = req.params;
  const { participant_name, event_name, event_date, contact_number } = req.body;

  if (!participant_name || !event_name || !event_date || !contact_number) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const sql = `
    UPDATE registrations
    SET participant_name = ?, event_name = ?, event_date = ?, contact_number = ?
    WHERE id = ?
  `;

  db.execute(sql, [participant_name, event_name, event_date, contact_number, id], (err, result) => {
    if (err) {
      console.error('Update error:', err.code, '-', err.message);
      return res.status(500).json({ message: 'Update failed', error: err.message });
    }
    res.json({ message: 'Registration updated successfully' });
  });
});
app.delete('/api/registrations/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM registrations WHERE id = ?';

  db.execute(sql, [id], (err, result) => {
    if (err) {
      console.error('Delete error:', err.code, '-', err.message);
      return res.status(500).json({ message: 'Delete failed', error: err.message });
    }
    res.json({ message: 'Registration deleted successfully' });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});