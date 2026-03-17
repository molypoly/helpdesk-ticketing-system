import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') { setEmail('admin@helpdesk.com'); setPassword('admin123'); }
    else { setEmail('user@helpdesk.com'); setPassword('user123'); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🎫</div>
          <div className="auth-title">HelpDesk</div>
          <div className="auth-sub">Sign in to your account</div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }} onClick={() => fillDemo('admin')}>
            Demo Admin
          </button>
          <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }} onClick={() => fillDemo('user')}>
            Demo User
          </button>
        </div>

        <div className="auth-footer">
          No account? <Link to="/register">Register here</Link>
        </div>
      </div>
    </div>
  );
}
