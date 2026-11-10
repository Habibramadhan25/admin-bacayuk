const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

// API: Get all books
app.get('/api/books', (req, res) => {
  db.all("SELECT * FROM books WHERE status = 'Published'", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// API: Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (row) {
      res.json({ success: true, user: { id: row.id, username: row.username, name: row.name, role: row.role } });
    } else {
      res.status(401).json({ success: false, message: "Username atau password salah" });
    }
  });
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => {
console.log("Server berjalan di http://localhost:" + PORT);
});
