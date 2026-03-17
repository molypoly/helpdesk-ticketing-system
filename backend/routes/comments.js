const express = require('express');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/:ticketId', authenticate, async (req, res) => {
  try {
    const result = await query(`
      SELECT c.*, u.name as author_name, u.role as author_role
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = $1
      ORDER BY c.created_at ASC
    `, [req.params.ticketId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:ticketId', authenticate, async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });
  try {
    const ticket = await query('SELECT * FROM tickets WHERE id = $1', [req.params.ticketId]);
    if (!ticket.rows[0]) return res.status(404).json({ error: 'Ticket not found' });

    const result = await query(
      'INSERT INTO comments (ticket_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [req.params.ticketId, req.user.id, content]
    );
    const comment = await query(`
      SELECT c.*, u.name as author_name, u.role as author_role
      FROM comments c LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `, [result.rows[0].id]);
    res.status(201).json(comment.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
