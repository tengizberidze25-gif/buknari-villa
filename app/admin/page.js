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
  const [backfilling, setBackfilling] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [remindMsg, setRemindMsg] = useState('');
  const [backfillMsg, setBackfillMsg] = useState('');
  const [oldPhone, setOldPhone] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [changingPhone, setChangingPhone] = useState(false);
  const [phoneChangeMsg, setPhoneChangeMsg] = useState('');

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

  async function backfillLocations() {
    setBackfilling(true);
    setBackfillMsg('');
    try {
      const res = await fetch('/api/admin/backfill-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.ok) {
        setBackfillMsg(`გადათარგმნილია ${data.processed} ვილის ლოკაცია (სულ ${data.total} საჭიროებდა).`);
      } else {
        setBackfillMsg(data.message || 'დაფიქსირდა შეცდომა');
      }
    } catch (e) {
      setBackfillMsg('კავშირის შეცდომა');
    }
    setBackfilling(false);
  }

  async function remindOwnersLocation() {
  setReminding(true);
  setRemindMsg('');
  try {
    const res = await fetch('/api/admin/remind-location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (data.ok) {
      setRemindMsg(`გაეგზავნა ${data.sent} SMS (სულ ${data.totalMissing} ვილას აკლია ლოკაცია).`);
    } else {
      setRemindMsg(data.message || 'დაფიქსირდა შეცდომა');
    }
  } catch (e) {
    setRemindMsg('კავშირის შეცდომა');
  }
  setReminding(false);
}

  async function changeOwnerPhone() {
    if (!oldPhone.trim() || !newPhone.trim()) {
      setPhoneChangeMsg('შეავსეთ ორივე ველი');
      return;
    }
    setChangingPhone(true);
    setPhoneChangeMsg('');
    try {
      const res = await fetch('/api/admin/change-owner-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, oldPhone, newPhone }),
      });
      const data = await res.json();
      if (data.ok) {
        setPhoneChangeMsg(`ნომერი წარმატებით შეიცვალა${data.ownerName ? ` (${data.ownerName})` : ''} ✓`);
        setOldPhone('');
        setNewPhone('');
      } else {
        setPhoneChangeMsg(data.message || 'დაფიქსირდა შეცდომა');
      }
    } catch (e) {
      setPhoneChangeMsg('კავშირის შეცდომა');
    }
    setChangingPhone(false);
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

        <div style={{ marginBottom: '24px' }}>
          <button
            type="button"
            className="guest-logout-link"
            disabled={backfilling}
            onClick={backfillLocations}
          >
            {backfilling ? 'მიმდინარეობს...' : 'ლოკაციების თარგმანის შევსება (ერთჯერადი)'}
          </button>
          {backfillMsg && <p className="dashboard-empty-hint" style={{ marginTop: '8px' }}>{backfillMsg}</p>}
        </div>

            <div style={{ marginBottom: '24px' }}>
          <button
            type="button"
            className="guest-logout-link"
            disabled={reminding}
            onClick={remindOwnersLocation}
          >
            {reminding ? 'იგზავნება...' : 'SMS შეხსენება — ვილის ადგილმდებარეობის მონიშვნა'}
          </button>
          {remindMsg && <p className="dashboard-empty-hint" style={{ marginTop: '8px' }}>{remindMsg}</p>}
        </div>

        <div className="admin-phone-change-box">
          <h3 className="villa-amenities-title">მფლობელის ტელეფონის შეცვლა</h3>
          <p className="dashboard-empty-hint">
            გამოიყენე, თუ მფლობელმა ძველი ნომერი დაკარგა და ვეღარ შედის — ჩაწერე მისი ძველი ნომერი და ახალი.
          </p>
          <div className="dashboard-block-form">
            <input
              type="tel"
              placeholder="ძველი ნომერი"
              value={oldPhone}
              onChange={(e) => setOldPhone(e.target.value)}
            />
            <input
              type="tel"
              placeholder="ახალი ნომერი"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
            />
            <button disabled={changingPhone} onClick={changeOwnerPhone}>
              {changingPhone ? 'იცვლება...' : 'ნომრის შეცვლა'}
            </button>
          </div>
          {phoneChangeMsg && <p className="dashboard-empty-hint" style={{ marginTop: '8px' }}>{phoneChangeMsg}</p>}
        </div>

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
