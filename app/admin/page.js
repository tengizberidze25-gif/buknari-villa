'use client';

import { useState, useEffect } from 'react';

const STATUS_LABELS = {
  pending: 'მოლოდინში',
  approved: 'დამტკიცებული',
  declined: 'უარყოფილი',
};

export default function AdminPage() {
  const [token, setToken] = useState(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [villas, setVillas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState(null);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    const stored = localStorage.getItem('buknari_admin_token');
    if (stored) setToken(stored);
  }, []);

  useEffect(() => {
    if (token) load();
  }, [token]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!data.ok) {
        setLoginError(data.message || 'შესვლა ვერ მოხერხდა');
      } else {
        localStorage.setItem('buknari_admin_token', data.token);
        setToken(data.token);
      }
    } catch (e) {
      setLoginError('კავშირის შეცდომა');
    }
    setLoggingIn(false);
  }

  function load() {
    setLoading(true);
    fetch('/api/admin/villas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setVillas(data.villas);
        else if (data.message === 'ავტორიზაცია საჭიროა') {
          localStorage.removeItem('buknari_admin_token');
          setToken(null);
        }
      })
      .finally(() => setLoading(false));
  }

  async function respond(villaId, action) {
    setActingId(villaId);
    try {
      const res = await fetch('/api/admin/villas/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, villaId, action }),
      });
      const data = await res.json();
      if (data.ok) load();
    } catch (e) {
      // ignore
    }
    setActingId(null);
  }

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-texture" />
        <div className="auth-card">
          <a href="/" className="auth-logo">
            <img src="/logo-nav.png" alt="Buknari Villa" style={{ height: '56px', width: 'auto' }} />
          </a>
          <h1>ადმინის შესვლა</h1>
          <form onSubmit={handleLogin}>
            <div className="form-row">
              <label>პაროლი</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {loginError && <div className="auth-error">{loginError}</div>}
            <button type="submit" disabled={loggingIn}>
              {loggingIn ? 'შესვლა...' : 'შესვლა'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filtered = villas.filter((v) => (filter === 'all' ? true : v.status === filter));

  return (
    <div className="dashboard-page">
      <nav className="nav">
        <a href="/" className="nav-logo">
          <img src="/logo-nav.png" alt="Buknari Villa" style={{ height: '56px', width: 'auto' }} />
        </a>
      </nav>

      <main className="wrap dashboard-content">
        <h1 className="dashboard-title">ადმინ პანელი — ვილების მართვა</h1>

        <a href="/admin/add-villa" className="cta-btn" style={{ marginBottom: '24px', display: 'inline-flex' }}>
          + ვილის დამატება მფლობელის სახელით
        </a>

        <div className="admin-filter-tabs">
          {['pending', 'approved', 'declined', 'all'].map((f) => (
            <button
              key={f}
              className={filter === f ? 'active' : ''}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'ყველა' : STATUS_LABELS[f]}
            </button>
          ))}
        </div>

        {loading && <p className="booking-loading">იტვირთება...</p>}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <p>ამ სტატუსით ვილა არ არის.</p>
          </div>
        )}

        {filtered.map((villa) => (
          <div key={villa.id} className="dashboard-villa-section">
            <div className="admin-villa-header">
              <div>
                <h2 className="dashboard-villa-title">{villa.title}</h2>
                <div className="booking-request-dates">
                  {villa.location_name} · ₾{villa.price_per_night}/ღამე
                </div>
                <div className="dashboard-empty-hint">
                  მფლობელი: {villa.owners?.full_name || '—'} · {villa.owners?.phone || '—'}
                </div>
              </div>
              <span className={`admin-status-badge admin-status-${villa.status}`}>
                {STATUS_LABELS[villa.status] || villa.status}
              </span>
            </div>

            {villa.status !== 'approved' && (
              <button
                disabled={actingId === villa.id}
                className="btn-confirm"
                onClick={() => respond(villa.id, 'approve')}
                style={{ marginRight: 8 }}
              >
                დამტკიცება
              </button>
            )}
            {villa.status !== 'declined' && (
              <button
                disabled={actingId === villa.id}
                className="btn-decline"
                onClick={() => respond(villa.id, 'decline')}
              >
                უარყოფა
              </button>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
