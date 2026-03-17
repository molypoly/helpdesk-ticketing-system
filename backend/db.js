const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'helpdesk.db');

let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDB() {
  const db = getDB();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      priority TEXT NOT NULL DEFAULT 'Medium',
      status TEXT NOT NULL DEFAULT 'Open',
      user_id INTEGER NOT NULL,
      assigned_to INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Seed a default admin user
  const bcrypt = require('bcryptjs');
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@helpdesk.com');
  if (!existing) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`).run('Admin User', 'admin@helpdesk.com', hash, 'admin');
    
    const userHash = bcrypt.hashSync('user123', 10);
    db.prepare(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`).run('John Doe', 'user@helpdesk.com', userHash, 'user');

    // Seed sample tickets
    const adminId = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@helpdesk.com').id;
    const userId = db.prepare('SELECT id FROM users WHERE email = ?').get('user@helpdesk.com').id;

    const tickets = [
      { title: 'Cannot connect to VPN', description: 'Getting timeout errors when trying to connect to company VPN from home.', category: 'Network', priority: 'High', status: 'Open', user_id: userId },
      { title: 'Outlook not syncing emails', description: 'Emails are not syncing in Outlook since this morning. Tried restarting but no luck.', category: 'Email', priority: 'Medium', status: 'In Progress', user_id: userId, assigned_to: adminId },
      { title: 'Request new monitor', description: 'Need a second monitor for my workstation to improve productivity.', category: 'Hardware', priority: 'Low', status: 'Open', user_id: userId },
      { title: 'Password reset required', description: 'Locked out of my account after too many failed login attempts.', category: 'Access', priority: 'Critical', status: 'Resolved', user_id: userId, assigned_to: adminId },
      { title: 'Printer offline on 3rd floor', description: 'The shared printer on the 3rd floor shows as offline for everyone on the floor.', category: 'Hardware', priority: 'Medium', status: 'Open', user_id: userId },
    ];

    const insert = db.prepare('INSERT INTO tickets (title, description, category, priority, status, user_id, assigned_to) VALUES (@title, @description, @category, @priority, @status, @user_id, @assigned_to)');
    tickets.forEach(t => insert.run({ assigned_to: null, ...t }));

    console.log('✅ Database seeded with demo data');
  }

  console.log('✅ Database initialized');
}

module.exports = { getDB, initDB };
