import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';

function StatusBadge({ status }) {
  const map = { 'Open': 'open', 'In Progress': 'in-progress', 'Resolved': 'resolved', 'Closed': 'closed' };
  return <span className={`badge badge-${map[status] || 'open'}`}>{status}</span>;
}
function PriorityBadge({ priority }) {
  return <span className={`badge badge-${priority?.toLowerCase()}`}>{priority}</span>;
}

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ticketRes, commentsRes] = await Promise.all([
          axios.get(`/api/tickets/${id}`),
          axios.get(`/api/comments/${id}`)
        ]);
        setTicket(ticketRes.data);
        setComments(commentsRes.data);
        if (user.role === 'admin') {
          const usersRes = await axios.get('/api/auth/users');
          setUsers(usersRes.data);
        }
      } catch (err) {
        setError('Failed to load ticket');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id, user.role]);

  const updateTicket = async (updates) => {
    try {
      const res = await axios.patch(`/api/tickets/${id}`, updates);
      setTicket(res.data);
    } catch {
      setError('Failed to update ticket');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`/api/comments/${id}`, { content: newComment });
      setComments(c => [...c, res.data]);
      setNewComment('');
    } catch {
      setError('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this ticket? This cannot be undone.')) return;
    await axios.delete(`/api/tickets/${id}`);
    navigate('/admin');
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!ticket) return <div className="card"><div className="alert alert-error">Ticket not found.</div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--mono)', marginBottom: 4 }}>
            <Link to={user.role === 'admin' ? '/admin' : '/tickets'} style={{ color: 'var(--accent)', textDecoration: 'none' }}>
              ← {user.role === 'admin' ? 'Admin Panel' : 'My Tickets'}
            </Link>
          </div>
          <div className="page-title">Ticket #{ticket.id}</div>
          <div className="page-subtitle">{ticket.title}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="ticket-detail">
        {/* Main column */}
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Description</div>
            <p style={{ color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
          </div>

          {/* Admin controls */}
          {user.role === 'admin' && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Admin Controls</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label className="form-label">Status</label>
                  <select className="form-select" value={ticket.status} onChange={e => updateTicket({ status: e.target.value })}>
                    <option>Open</option>
                    <option>In Progress</option>
                    <option>Resolved</option>
                    <option>Closed</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={ticket.priority} onChange={e => updateTicket({ priority: e.target.value })}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Assign To</label>
                <select className="form-select" value={ticket.assigned_to || ''} onChange={e => updateTicket({ assigned_to: e.target.value || null })}>
                  <option value="">Unassigned</option>
                  {users.filter(u => u.role === 'admin').map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>🗑 Delete Ticket</button>
            </div>
          )}

          {/* Comments */}
          <div className="card">
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
              Comments ({comments.length})
            </div>

            {comments.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', fontSize: 13, padding: '12px 0' }}>No comments yet.</div>
            ) : (
              <div>
                {comments.map(c => (
                  <div key={c.id} className="comment">
                    <div className="comment-header">
                      <div className="user-avatar" style={{ width: 24, height: 24, fontSize: 10 }}>
                        {c.author_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="comment-author">{c.author_name}</span>
                      {c.author_role === 'admin' && <span className="comment-admin-badge">Staff</span>}
                      <span className="comment-time">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                    </div>
                    <div className="comment-body">{c.content}</div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleComment} style={{ marginTop: 16 }}>
              <div className="form-group" style={{ marginBottom: 10 }}>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Add a comment or update…"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                />
              </div>
              <button className="btn btn-primary btn-sm" type="submit" disabled={submitting || !newComment.trim()}>
                {submitting ? 'Posting…' : 'Post Comment'}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar metadata */}
        <div>
          <div className="card">
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Ticket Info</div>

            <div className="ticket-meta-item">
              <div className="ticket-meta-label">Ticket ID</div>
              <div className="ticket-meta-value" style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>#{ticket.id}</div>
            </div>
            <div className="ticket-meta-item">
              <div className="ticket-meta-label">Category</div>
              <div className="ticket-meta-value">{ticket.category}</div>
            </div>
            <div className="ticket-meta-item">
              <div className="ticket-meta-label">Status</div>
              <div><StatusBadge status={ticket.status} /></div>
            </div>
            <div className="ticket-meta-item">
              <div className="ticket-meta-label">Priority</div>
              <div><PriorityBadge priority={ticket.priority} /></div>
            </div>
            <div className="ticket-meta-item">
              <div className="ticket-meta-label">Submitted By</div>
              <div className="ticket-meta-value">{ticket.submitter_name}</div>
            </div>
            <div className="ticket-meta-item">
              <div className="ticket-meta-label">Assigned To</div>
              <div className="ticket-meta-value">{ticket.assignee_name || 'Unassigned'}</div>
            </div>
            <div className="ticket-meta-item">
              <div className="ticket-meta-label">Created</div>
              <div className="ticket-meta-value" style={{ fontSize: 12 }}>
                {format(new Date(ticket.created_at), 'MMM d, yyyy · h:mm a')}
              </div>
            </div>
            <div className="ticket-meta-item" style={{ marginBottom: 0 }}>
              <div className="ticket-meta-label">Last Updated</div>
              <div className="ticket-meta-value" style={{ fontSize: 12 }}>
                {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
