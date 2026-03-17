const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function query(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

async function initDB() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS tickets (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      priority TEXT NOT NULL DEFAULT 'Medium',
      status TEXT NOT NULL DEFAULT 'Open',
      user_id INTEGER NOT NULL REFERENCES users(id),
      assigned_to INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      ticket_id INTEGER NOT NULL REFERENCES tickets(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed demo data if no users exist
  const { rows } = await query('SELECT id FROM users WHERE email = $1', ['admin@helpdesk.com']);
  if (rows.length === 0) {
    const bcrypt = require('bcryptjs');

    const adminHash = bcrypt.hashSync('admin123', 10);
    const adminRes = await query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
      ['Admin User', 'admin@helpdesk.com', adminHash, 'admin']
    );

    const userHash = bcrypt.hashSync('user123', 10);
    const userRes = await query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
      ['John Doe', 'user@helpdesk.com', userHash, 'user']
    );

    const adminId = adminRes.rows[0].id;
    const userId = userRes.rows[0].id;

    const tickets = [
      { title: 'Cannot connect to VPN', description: 'Getting timeout errors when trying to connect to company VPN from home.', category: 'Network', priority: 'High', status: 'Open', user_id: userId, assigned_to: null },
      { title: 'Outlook not syncing emails', description: 'Emails are not syncing in Outlook since this morning. Tried restarting but no luck.', category: 'Email', priority: 'Medium', status: 'In Progress', user_id: userId, assigned_to: adminId },
      { title: 'Request new monitor', description: 'Need a second monitor for my workstation to improve productivity.', category: 'Hardware', priority: 'Low', status: 'Open', user_id: userId, assigned_to: null },
      { title: 'Password reset required', description: 'Locked out of my account after too many failed login attempts.', category: 'Access', priority: 'Critical', status: 'Resolved', user_id: userId, assigned_to: adminId },
      { title: 'Printer offline on 3rd floor', description: 'The shared printer on the 3rd floor shows as offline for everyone on the floor.', category: 'Hardware', priority: 'Medium', status: 'Open', user_id: userId, assigned_to: null },
    ];

    for (const t of tickets) {
      await query(
        'INSERT INTO tickets (title, description, category, priority, status, user_id, assigned_to) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [t.title, t.description, t.category, t.priority, t.status, t.user_id, t.assigned_to]
      );
    }

    console.log('✅ Database seeded with demo data');
  }

  console.log('✅ Database initialized');
}

module.exports = { query, initDB };
