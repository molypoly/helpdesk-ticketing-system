import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function NewTicket() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: 'General', priority: 'Medium' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/api/tickets', form);
      navigate(`/tickets/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Submit New Ticket</div>
          <div className="page-subtitle">Describe your issue and our team will respond shortly</div>
        </div>
        <Link to="/tickets" className="btn">← Back</Link>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={form.title} onChange={set('title')}
              placeholder="Brief description of the issue" required maxLength={120} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={set('category')}>
                <option>General</option>
                <option>Hardware</option>
                <option>Software</option>
                <option>Network</option>
                <option>Email</option>
                <option>Access</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={set('priority')}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className="form-textarea" value={form.description} onChange={set('description')}
              placeholder="Please provide as much detail as possible. Include any error messages, steps to reproduce, and when the issue started." required rows={6} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Submitting…' : '🎫 Submit Ticket'}
            </button>
            <Link to="/tickets" className="btn">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}