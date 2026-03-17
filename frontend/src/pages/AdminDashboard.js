import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

function StatusBadge({ status }) {
  const map = { 'Open': 'open', 'In Progress': 'in-progress', 'Resolved': 'resolved', 'Closed': 'closed' };
  return <span className={`badge badge-${map[status] || 'open'}`}>{status}</span>;
}
function PriorityBadge({ priority }) {
  return <span className={`badge badge-${priority?.toLowerCase()}`}>{priority}</span>;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    Promise.all([
      axios.get('/api/tickets'),
      axios.get('/api/tickets/stats')
    ]).then(([ticketsRes, statsRes]) => {
      setTickets(ticketsRes.data);
      setStats(statsRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = tickets.filter(t => {
    const matchSearch = !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      String(t.id).includes(search) ||
      t.submitter_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || t.status === statusFilter;
    const matchPriority = !priorityFilter || t.priority === priorityFilter;
    const matchCategory = !categoryFilter || t.category === categoryFilter;
    return matchSearch && matchStatus && matchPriority && matchCategory;
  });

  const categories = [...new Set(tickets.map(t => t.category))].sort();

  const quickUpdate = async (e, ticketId, field, value) => {
    e.stopPropagation();
    try {
      const res = await axios.patch(`/api/tickets/${ticketId}`, { [field]: value });
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...res.data } : t));
    } catch {
      alert('Update failed');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">⚙️ Admin Panel</div>
          <div className="page-subtitle">Manage all support tickets</div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Tickets</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-card accent">
            <div className="stat-label">Open</div>
            <div className="stat-value">{stats.open}</div>
          </div>
          <div className="stat-card yellow">
            <div className="stat-label">In Progress</div>
            <div className="stat-value">{stats.inProgress}</div>
          </div>
          <div className="stat-card green">
            <div className="stat-label">Resolved</div>
            <div className="stat-value">{stats.resolved}</div>
          </div>
          <div className="stat-card red">
            <div className="stat-label">Critical Open</div>
            <div className="stat-value">{stats.critical}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <input className="search-input" placeholder="Search by title, ID or user…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option>Open</option>
          <option>In Progress</option>
          <option>Resolved</option>
          <option>Closed</option>
        </select>
        <select className="filter-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="">All Priorities</option>
          <option>Critical</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <select className="filter-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginLeft: 4 }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">No tickets found</div>
            <div className="empty-sub">Try adjusting your filters.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Submitted By</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assignee</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} onClick={() => navigate(`/tickets/${t.id}`)}>
                    <td className="ticket-id">#{t.id}</td>
                    <td className="ticket-title-cell" style={{ maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{t.submitter_name}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{t.category}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <select
                        className="filter-select"
                        style={{ padding: '3px 6px', fontSize: 11 }}
                        value={t.priority}
                        onChange={e => quickUpdate(e, t.id, 'priority', e.target.value)}
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                        <option>Critical</option>
                      </select>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <select
                        className="filter-select"
                        style={{ padding: '3px 6px', fontSize: 11 }}
                        value={t.status}
                        onChange={e => quickUpdate(e, t.id, 'status', e.target.value)}
                      >
                        <option>Open</option>
                        <option>In Progress</option>
                        <option>Resolved</option>
                        <option>Closed</option>
                      </select>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{t.assignee_name || '—'}</td>
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
