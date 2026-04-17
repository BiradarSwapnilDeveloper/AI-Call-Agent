const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'calls.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_number TEXT UNIQUE,
      name TEXT,
      is_vip BOOLEAN DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS call_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_number TEXT,
      call_status TEXT,
      direction TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_urgent BOOLEAN DEFAULT 0,
      voicemail_url TEXT
    )
  `);
});

const getContact = (phoneNumber) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM contacts WHERE phone_number = ?', [phoneNumber], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const createLog = (phoneNumber, direction) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO call_logs (phone_number, call_status, direction) VALUES (?, ?, ?)',
      [phoneNumber, 'in-progress', direction],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

const updateLog = (id, data) => {
  return new Promise((resolve, reject) => {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setQuery = keys.map(k => `${k} = ?`).join(', ');
    db.run(
      `UPDATE call_logs SET ${setQuery} WHERE id = ?`,
      [...values, id],
      function (err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
};

const getLogs = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM call_logs ORDER BY timestamp DESC', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

module.exports = {
  db,
  getContact,
  createLog,
  updateLog,
  getLogs
};
