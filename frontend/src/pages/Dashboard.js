import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

function StatusBadge({ status }) {
  const map = { 'Open': 'open', 'In Progress': 'in-progress', 'Resolved': 'resolved', 'Closed': 'closed' };
  return <span className={`badge badge-${map[status] || 'open'}`}>{status}</span>;
}
function PriorityBadge({ priority }) {
  return <span className={`badge badge-${priority?.toLowerCase()}`}>{priority}</span>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/tickets').then(r => setTickets(r.data)).finally(() => setLoading(false));
  }, []);

  const open = tickets.filter(t => t.status === 'Open').length;
  const inProgress = tickets.filter(t => t.status === 'In Progress').length;
  const resolved = tickets.filter(t => t.status === 'Resolved').length;
  const recent = tickets.slice(0, 5);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</div>
          <div className="page-subtitle">Here's an overview of your support tickets</div>
        </div>
        <Link to="/tickets/new" className="btn btn-primary">+ New Ticket</Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total</div>
          <div className="stat-value">{tickets.length}</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-label">Open</div>
          <div className="stat-value">{open}</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">In Progress</div>
          <div className="stat-value">{inProgress}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Resolved</div>
          <div className="stat-value">{resolved}</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700 }}>Recent Tickets</h2>
          <Link to="/tickets" className="btn btn-sm">View all →</Link>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-title">No tickets yet</div>
            <div className="empty-sub">Submit your first support request to get started.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Title</th><th>Priority</th><th>Status</th><th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(t => (
                  <tr key={t.id} onClick={() => window.location.href = `/tickets/${t.id}`}>
                    <td className="ticket-id">#{t.id}</td>
                    <td className="ticket-title-cell">{t.title}</td>
                    <td><PriorityBadge priority={t.priority} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
