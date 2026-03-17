const express = require('express');
const { getDB } = require('../db');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/tickets - list tickets (admin sees all, user sees own)
router.get('/', authenticate, (req, res) => {
  const db = getDB();
  let tickets;
  if (req.user.role === 'admin') {
    tickets = db.prepare(`
      SELECT t.*, u.name as submitter_name, a.name as assignee_name
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN users a ON t.assigned_to = a.id
      ORDER BY t.created_at DESC
    `).all();
  } else {
    tickets = db.prepare(`
      SELECT t.*, u.name as submitter_name, a.name as assignee_name
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN users a ON t.assigned_to = a.id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
    `).all(req.user.id);
  }
  res.json(tickets);
});

// GET /api/tickets/stats - dashboard stats (admin only)
router.get('/stats', authenticate, adminOnly, (req, res) => {
  const db = getDB();
  const total = db.prepare('SELECT COUNT(*) as count FROM tickets').get().count;
  const open = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'Open'").get().count;
  const inProgress = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'In Progress'").get().count;
  const resolved = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'Resolved'").get().count;
  const critical = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE priority = 'Critical' AND status != 'Resolved'").get().count;
  res.json({ total, open, inProgress, resolved, critical });
});

// GET /api/tickets/:id
router.get('/:id', authenticate, (req, res) => {
  const db = getDB();
  const ticket = db.prepare(`
    SELECT t.*, u.name as submitter_name, u.email as submitter_email, a.name as assignee_name
    FROM tickets t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN users a ON t.assigned_to = a.id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  if (req.user.role !== 'admin' && ticket.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });

  res.json(ticket);
});

// POST /api/tickets
router.post('/', authenticate, (req, res) => {
  const { title, description, category, priority } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'Title and description required' });

  const db = getDB();
  const result = db.prepare(`
    INSERT INTO tickets (title, description, category, priority, user_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(title, description, category || 'General', priority || 'Medium', req.user.id);

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(ticket);
});

// PATCH /api/tickets/:id - update status, priority, assigned_to
router.patch('/:id', authenticate, (req, res) => {
  const db = getDB();
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  if (req.user.role !== 'admin' && ticket.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { status, priority, assigned_to, title, description, category } = req.body;

  const updates = {
    title: title ?? ticket.title,
    description: description ?? ticket.description,
    category: category ?? ticket.category,
    status: status ?? ticket.status,
    priority: priority ?? ticket.priority,
    assigned_to: assigned_to !== undefined ? assigned_to : ticket.assigned_to,
    updated_at: new Date().toISOString(),
  };

  db.prepare(`
    UPDATE tickets SET title=@title, description=@description, category=@category,
    status=@status, priority=@priority, assigned_to=@assigned_to, updated_at=@updated_at
    WHERE id=?
  `).run({ ...updates }, req.params.id);

  const updated = db.prepare(`
    SELECT t.*, u.name as submitter_name, a.name as assignee_name
    FROM tickets t LEFT JOIN users u ON t.user_id=u.id LEFT JOIN users a ON t.assigned_to=a.id
    WHERE t.id=?
  `).get(req.params.id);
  res.json(updated);
});

// DELETE /api/tickets/:id (admin only)
router.delete('/:id', authenticate, adminOnly, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM comments WHERE ticket_id = ?').run(req.params.id);
  db.prepare('DELETE FROM tickets WHERE id = ?').run(req.params.id);
  res.json({ message: 'Ticket deleted' });
});

module.exports = router;
