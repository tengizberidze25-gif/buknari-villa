'use client';

import { useState, useEffect } from 'react';

export default function AdminSettingsPage() {
  const [token, setToken] = useState(null);
  const [pct, setPct] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('buknari_admin_token');
    if (!stored) {
      window.location.href = '/admin';
      return;
    }
    setToken(stored);
  }, []);

  useEffect(() => {
    fetch('/api/site-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setPct(String(data.referralDiscountPct));
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, referralDiscountPct: pct }),
      });
      const data = await res.json();
      setMsg(data.ok ? 'შენახულია ✓' : data.message || 'შეცდომა');
    } catch (err) {
      setMsg('შეცდომა');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dashboard-page">
      <nav className="nav">
        <a href="/" className="nav-logo">
          <img src="/logo-nav.png" alt="Buknari Villa" style={{ height: '56px', width: 'auto' }} />
        </a>
      </nav>

      <main className="wrap dashboard-content">
        <h1 className="dashboard-title">საიტის პარამეტრები</h1>
        <a href="/admin" className="guest-logout-link" style={{ marginBottom: '24px', display: 'inline-block' }}>
          ← უკან ადმინ პანელში
        </a>

        {loading ? (
          <p>იტვირთება...</p>
        ) : (
          <form onSubmit={handleSave} style={{ maxWidth: '420px', marginTop: '24px' }}>
            <div className="form-row">
              <label>სარეფერალო ფასდაკლება (%) — მოქმედებს ყველა ვილაზე</label>
              <input
                type="number"
                min="0"
                max="50"
                value={pct}
                onChange={(e) => setPct(e.target.value)}
              />
              <p className="form-hint">
                ეს პროცენტი ავტომატურად ერიცხება ორივე მხარეს — მოწვეულ სტუმარსაც და მომწვევსაც (მისი შემდეგი ჯავშნისთვის).
              </p>
            </div>
            <button type="submit" className="cta-btn" disabled={saving} style={{ marginTop: '12px' }}>
              {saving ? 'ინახება...' : 'შენახვა'}
            </button>
            {msg && <p className="dashboard-empty-hint" style={{ marginTop: '12px' }}>{msg}</p>}
          </form>
        )}
      </main>
    </div>
  );
}
