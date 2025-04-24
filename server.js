
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

// Connect to SQLite DB (creates the file if it doesn't exist)
const db = new sqlite3.Database('./todos.db', (err) => {
  if (err) return console.error('Failed to connect to DB:', err.message);
  console.log('Connected to SQLite database.');
});

// Create todos table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    priority TEXT DEFAULT 'low',
    isComplete INTEGER DEFAULT 0,
    isFun INTEGER DEFAULT 1
  )
`);

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET all todos
app.get('/todos', (req, res) => {
  db.all('SELECT * FROM todos', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET a single todo by ID
app.get('/todos/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM todos WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ message: 'Todo item not found' });
    res.json(row);
  });
});

// POST a new todo
app.post('/todos', (req, res) => {
  const { name, priority = 'low', isFun = true } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });

  db.run(
    `INSERT INTO todos (name, priority, isComplete, isFun) VALUES (?, ?, ?, ?)`,
    [name, priority, 0, isFun ? 1 : 0],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, name, priority, isComplete: 0, isFun: isFun ? 1 : 0 });
    }
  );
});

// DELETE a todo
app.delete('/todos/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM todos WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ message: 'Todo item not found' });
    res.json({ message: `Todo item ${id} deleted.` });
  });
});

app.listen(port, () => {
  console.log(`Todo API server running at http://localhost:${port}`);
});