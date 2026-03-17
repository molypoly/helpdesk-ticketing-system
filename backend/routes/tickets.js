const express = require('express');
const { query } = require('../db');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authenticate, adminOnly, async (req, res) => {
  try {
    const total = (await query('SELECT COUNT(*) FROM tickets')).rows[0].count;
    const open = (await query("SELECT COUNT(*) FROM tickets WHERE status = 'Open'")).rows[0].count;
    const inProgress = (await query("SELECT COUNT(*) FROM tickets WHERE status = 'In Progress'")).rows[0].count;
    const resolved = (await query("SELECT COUNT(*) FROM tickets WHERE status = 'Resolved'")).rows[0].count;
    const critical = (await query("SELECT COUNT(*) FROM tickets WHERE priority = 'Critical' AND status != 'Resolved'")).rows[0].count;
    res.json({ total: +total, open: +open, inProgress: +inProgress, resolved: +resolved, critical: +critical });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await query(`
        SELECT t.*, u.name as submitter_name, a.name as assignee_name
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN users a ON t.assigned_to = a.id
        ORDER BY t.created_at DESC
      `);
    } else {
      result = await query(`
        SELECT t.*, u.name as submitter_name, a.name as assignee_name
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN users a ON t.assigned_to = a.id
        WHERE t.user_id = $1
        ORDER BY t.created_at DESC
      `, [req.user.id]);
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(`
      SELECT t.*, u.name as submitter_name, u.email as submitter_email, a.name as assignee_name
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN users a ON t.assigned_to = a.id
      WHERE t.id = $1
    `, [req.params.id]);
    const ticket = result.rows[0];
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (req.user.role !== 'admin' && ticket.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticate, async (req, res) => {
  const { title, description, category, priority } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'Title and description required' });
  try {
    const result = await query(
      'INSERT INTO tickets (title, description, category, priority, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, category || 'General', priority || 'Medium', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const existing = await query('SELECT * FROM tickets WHERE id = $1', [req.params.id]);
    const ticket = existing.rows[0];
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (req.user.role !== 'admin' && ticket.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    const { status, priority, assigned_to, title, description, category } = req.body;
    const result = await query(`
      UPDATE tickets SET
        title = $1, description = $2, category = $3,
        status = $4, priority = $5, assigned_to = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `, [
      title ?? ticket.title,
      description ?? ticket.description,
      category ?? ticket.category,
      status ?? ticket.status,
      priority ?? ticket.priority,
      assigned_to !== undefined ? assigned_to : ticket.assigned_to,
      req.params.id
    ]);

    const updated = await query(`
      SELECT t.*, u.name as submitter_name, a.name as assignee_name
      FROM tickets t LEFT JOIN users u ON t.user_id=u.id LEFT JOIN users a ON t.assigned_to=a.id
      WHERE t.id=$1
    `, [req.params.id]);
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    await query('DELETE FROM comments WHERE ticket_id = $1', [req.params.id]);
    await query('DELETE FROM tickets WHERE id = $1', [req.params.id]);
    res.json({ message: 'Ticket deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
