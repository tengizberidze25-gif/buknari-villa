'use client';

import { useState, useEffect, useCallback } from 'react';

const STATUS_LABELS = {
  pending: 'მოლოდინში',
  confirmed: 'დადასტურებული',
  declined: 'უარყოფილი',
  owner_block: 'ხელით დაბლოკილი',
};

function fmt(dateStr) {
  return dateStr;
}

export default function DashboardPage() {
  const [ownerId, setOwnerId] = useState(null);
  const [token, setToken] = useState(null);
  const [villas, setVillas] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingId, setActingId] = useState(null);

  // Block-dates mini form state, per villa id
  const [blockForm, setBlockForm] = useState({}); // { [villaId]: { checkIn, checkOut } }
  const [blockSubmitting, setBlockSubmitting] = useState(null);
  const [blockError, setBlockError] = useState({});

  const load = useCallback((oid, tok) => {
    setLoading(true);
    fetch('/api/owner/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId: oid, token: tok }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok) {
          setError(data.message || 'დაფიქსირდა შეცდომა');
        } else {
          setVillas(data.villas);
          setBookings(data.bookings);
        }
      })
      .catch(() => setError('კავშირის შეცდომა'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const oid = localStorage.getItem('buknari_owner_id');
    const tok = localStorage.getItem('buknari_owner_token');
    if (!oid || !tok) {
      window.location.href = '/register';
      return;
    }
    setOwnerId(oid);
    setToken(tok);
    load(oid, tok);
  }, [load]);

  async function respond(bookingId, action) {
    setActingId(bookingId);
    try {
      const res = await fetch('/api/owner/bookings/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId, token, bookingId, action }),
      });
      const data = await res.json();
      if (data.ok) load(ownerId, token);
      else setError(data.message || 'დაფიქსირდა შეცდომა');
    } catch (e) {
      setError('კავშირის შეცდომა');
    }
    setActingId(null);
  }

  async function submitBlock(villaId) {
    const form = blockForm[villaId] || {};
    if (!form.checkIn || !form.checkOut) {
      setBlockError((s) => ({ ...s, [villaId]: 'აირჩიეთ ორივე თარიღი' }));
      return;
    }
    setBlockSubmitting(villaId);
    setBlockError((s) => ({ ...s, [villaId]: '' }));
    try {
      const res = await fetch('/api/owner/block-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId, token, villaId, checkIn: form.checkIn, checkOut: form.checkOut }),
      });
      const data = await res.json();
      if (data.ok) {
        setBlockForm((s) => ({ ...s, [villaId]: { checkIn: '', checkOut: '' } }));
        load(ownerId, token);
      } else {
        setBlockError((s) => ({ ...s, [villaId]: data.message || 'დაფიქსირდა შეცდომა' }));
      }
    } catch (e) {
      setBlockError((s) => ({ ...s, [villaId]: 'კავშირის შეცდომა' }));
    }
    setBlockSubmitting(null);
  }

  async function unblock(bookingId) {
    setActingId(bookingId);
    try {
      const res = await fetch('/api/owner/unblock-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId, token, bookingId }),
      });
      const data = await res.json();
      if (data.ok) load(ownerId, token);
      else setError(data.message || 'დაფიქსირდა შეცდომა');
    } catch (e) {
      setError('კავშირის შეცდომა');
    }
    setActingId(null);
  }

  if (!ownerId) return null;

  return (
    <div className="dashboard-page">
      <nav className="nav">
        <a href="/" className="nav-logo">
          <img src="/logo-nav.png" alt="Buknari Villa" style={{ height: '56px', width: 'auto' }} />
        </a>
        <div className="nav-links">
          <a href="/add-villa">+ ახალი ვილა</a>
        </div>
      </nav>

      <main className="wrap dashboard-content">
        <h1 className="dashboard-title">ჩემი ვილები და ჯავშნები</h1>

        {loading && <p className="booking-loading">იტვირთება...</p>}
        {error && <div className="auth-error">{error}</div>}

        {!loading && villas.length === 0 && (
          <div className="empty-state">
            <p>ჯერ არცერთი ვილა არ გაქვთ დამატებული.</p>
          </div>
        )}

        {villas.map((villa) => {
          const villaBookings = bookings.filter((b) => b.villa_id === villa.id);
          const pending = villaBookings.filter((b) => b.status === 'pending');
          const confirmed = villaBookings.filter((b) => b.status === 'confirmed');
          const ownerBlocks = villaBookings.filter((b) => b.status === 'owner_block');
          const form = blockForm[villa.id] || { checkIn: '', checkOut: '' };

          return (
            <section key={villa.id} className="dashboard-villa-section">
              <h2 className="dashboard-villa-title">{villa.title}</h2>

              {pending.length > 0 && (
                <div className="dashboard-group">
                  <h3>ახალი მოთხოვნები ({pending.length})</h3>
                  {pending.map((b) => (
                    <div key={b.id} className="booking-request-card">
                      <div>
                        <strong>{b.guest_name}</strong> · {b.guest_phone}
                        <div className="booking-request-dates">{fmt(b.check_in)} → {fmt(b.check_out)}</div>
                        {b.guest_message && <p className="booking-request-message">{b.guest_message}</p>}
                      </div>
                      <div className="booking-request-actions">
                        <button
                          disabled={actingId === b.id}
                          className="btn-confirm"
                          onClick={() => respond(b.id, 'confirm')}
                        >
                          დადასტურება
                        </button>
                        <button
                          disabled={actingId === b.id}
                          className="btn-decline"
                          onClick={() => respond(b.id, 'decline')}
                        >
                          უარყოფა
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {confirmed.length > 0 && (
                <div className="dashboard-group">
                  <h3>დადასტურებული ჯავშნები</h3>
                  {confirmed.map((b) => (
                    <div key={b.id} className="booking-list-row">
                      <span>{b.guest_name} · {b.guest_phone}</span>
                      <span>{fmt(b.check_in)} → {fmt(b.check_out)}</span>
                      <button disabled={actingId === b.id} className="btn-unblock" onClick={() => unblock(b.id)}>
                        გაუქმება
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="dashboard-group">
                <h3>ხელით დაბლოკილი თარიღები</h3>
                {ownerBlocks.length === 0 && <p className="dashboard-empty-hint">არცერთი თარიღი არაა დაბლოკილი</p>}
                {ownerBlocks.map((b) => (
                  <div key={b.id} className="booking-list-row">
                    <span>{fmt(b.check_in)} → {fmt(b.check_out)}</span>
                    <button disabled={actingId === b.id} className="btn-unblock" onClick={() => unblock(b.id)}>
                      გახსნა
                    </button>
                  </div>
                ))}

                <div className="dashboard-block-form">
                  <input
                    type="date"
                    value={form.checkIn}
                    onChange={(e) =>
                      setBlockForm((s) => ({ ...s, [villa.id]: { ...form, checkIn: e.target.value } }))
                    }
                  />
                  <input
                    type="date"
                    value={form.checkOut}
                    onChange={(e) =>
                      setBlockForm((s) => ({ ...s, [villa.id]: { ...form, checkOut: e.target.value } }))
                    }
                  />
                  <button disabled={blockSubmitting === villa.id} onClick={() => submitBlock(villa.id)}>
                    დაბლოკვა
                  </button>
                </div>
                {blockError[villa.id] && <div className="auth-error">{blockError[villa.id]}</div>}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
