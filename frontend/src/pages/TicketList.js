import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { formatDistanceToNow } from 'date-fns';

function StatusBadge({ status }) {
  const map = { 'Open': 'open', 'In Progress': 'in-progress', 'Resolved': 'resolved', 'Closed': 'closed' };
  return <span className={`badge badge-${map[status] || 'open'}`}>{status}</span>;
}
function PriorityBadge({ priority }) {
  return <span className={`badge badge-${priority?.toLowerCase()}`}>{priority}</span>;
}

export default function TicketList() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    api.get('/api/tickets').then(r => setTickets(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = tickets.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || String(t.id).includes(search);
    const matchStatus = !statusFilter || t.status === statusFilter;
    const matchPriority = !priorityFilter || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">My Tickets</div>
          <div className="page-subtitle">{tickets.length} total ticket{tickets.length !== 1 ? 's' : ''}</div>
        </div>
        <Link to="/tickets/new" className="btn btn-primary">+ New Ticket</Link>
      </div>

      <div className="filters-bar">
        <input className="search-input" placeholder="Search tickets…" value={search} onChange={e => setSearch(e.target.value)} />
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
      </div>

      <div className="card" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">No tickets found</div>
            <div className="empty-sub">Try adjusting your filters or create a new ticket.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Title</th><th>Category</th><th>Priority</th><th>Status</th><th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} onClick={() => navigate(`/tickets/${t.id}`)}>
                    <td className="ticket-id">#{t.id}</td>
                    <td className="ticket-title-cell">{t.title}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{t.category}</td>
                    <td><PriorityBadge priority={t.priority} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {formatDistanceToNow(new Date(t.updated_at), { addSuffix: true })}
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