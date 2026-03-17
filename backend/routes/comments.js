const express = require('express');
const { getDB } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/comments/:ticketId
router.get('/:ticketId', authenticate, (req, res) => {
  const db = getDB();
  const comments = db.prepare(`
    SELECT c.*, u.name as author_name, u.role as author_role
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.ticket_id = ?
    ORDER BY c.created_at ASC
  `).all(req.params.ticketId);
  res.json(comments);
});

// POST /api/comments/:ticketId
router.post('/:ticketId', authenticate, (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });

  const db = getDB();
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.ticketId);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const result = db.prepare('INSERT INTO comments (ticket_id, user_id, content) VALUES (?, ?, ?)').run(req.params.ticketId, req.user.id, content);
  const comment = db.prepare(`
    SELECT c.*, u.name as author_name, u.role as author_role
    FROM comments c LEFT JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(comment);
});

module.exports = router;
