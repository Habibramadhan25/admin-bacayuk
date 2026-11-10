const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize tables
db.serialize(() => {
  // Create Books table
  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      category TEXT NOT NULL,
      coverUrl TEXT,
      rating REAL,
      status TEXT
    )
  `);

  // Create Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL -- 'admin' or 'siswa'
    )
  `);

  // Seed Admin user
  db.run(`INSERT OR IGNORE INTO users (id, username, password, name, role) VALUES ('admin1', 'admin', 'admin123', 'Administrator', 'admin')`);

  // Initial Books seeding if empty
  db.get("SELECT count(*) as count FROM books", (err, row) => {
    if (row && row.count === 0) {
      const stmt = db.prepare(`INSERT INTO books VALUES (?, ?, ?, ?, ?, ?, ?)`);
      const initialBooks = [
        { id: "1", title: "Laskar Pelangi", author: "Andrea Hirata", category: "Fiksi", coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400", rating: 4.8, status: "Published" },
        { id: "2", title: "Bumi Manusia", author: "Pramoedya Ananta Toer", category: "Sejarah", coverUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400", rating: 4.9, status: "Published" },
        { id: "3", title: "Filosofi Teras", author: "Henry Manampiring", category: "Nonfiksi", coverUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400", rating: 4.7, status: "Published" }
      ];
      for (const book of initialBooks) {
        stmt.run(book.id, book.title, book.author, book.category, book.coverUrl, book.rating, book.status);
      }
      stmt.finalize();
    }
  });
});

module.exports = db;
