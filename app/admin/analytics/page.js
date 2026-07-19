'use client';

import { useState, useEffect } from 'react';

export default function AdminAnalyticsPage() {
  const [token, setToken] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('buknari_admin_token');
    if (!stored) {
      window.location.href = '/admin';
      return;
    }
    setToken(stored);
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch('/api/admin/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) setData(res);
        else setError(res.message || 'შეცდომა');
      })
      .catch(() => setError('შეცდომა'))
      .finally(() => setLoading(false));
  }, [token]);

  const maxTrend = data ? Math.max(1, ...data.monthlyTrend.map((m) => m.count)) : 1;

  return (
    <div className="dashboard-page">
      <nav className="nav">
        <a href="/" className="nav-logo">
          <img src="/logo-nav.png" alt="Buknari Villa" style={{ height: '56px', width: 'auto' }} />
        </a>
        <div className="nav-links">
          <a href="/admin">← Admin პანელი</a>
        </div>
      </nav>

      <main className="wrap dashboard-content">
        <h1 className="dashboard-title">📊 ანალიტიკა</h1>

        {loading && <p className="booking-loading">იტვირთება...</p>}
        {error && <div className="auth-error">{error}</div>}

        {data && (
          <>
            <div className="analytics-cards">
              <div className="analytics-card">
                <div className="analytics-card-value">{data.totalConfirmedBookings}</div>
                <div className="analytics-card-label">დადასტურებული ჯავშანი</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-card-value">₾{data.totalRevenue.toLocaleString()}</div>
                <div className="analytics-card-label">სავარაუდო შემოსავალი</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-card-value">{data.avgOccupancy}%</div>
                <div className="analytics-card-label">დაკავებულობა (ეს თვე)</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-card-value">{data.activeVillasCount}</div>
                <div className="analytics-card-label">აქტიური ვილა</div>
              </div>
            </div>

            <p className="form-hint" style={{ marginTop: '12px' }}>
              ⚠️ "სავარაუდო შემოსავალი" გამოთვლილია ვილის გვერდზე მითითებული ფასის მიხედვით (სეზონურობის ჩათვლით) — არა
              owner-სა და სტუმარს შორის საბოლოოდ შეთანხმებული ზუსტი თანხა.
            </p>

            <div className="section-divider" />

            <h2 className="dashboard-subtitle">ჯავშნების დინამიკა — ბოლო 6 თვე</h2>
            <div className="analytics-trend-row">
              {data.monthlyTrend.map((m, i) => (
                <div key={i} className="analytics-trend-month">
                  <div className="analytics-trend-bar-track">
                    <div
                      className="analytics-trend-bar"
                      style={{ height: `${Math.max(6, Math.round((m.count / maxTrend) * 100))}px` }}
                      title={`${m.count}`}
                    />
                  </div>
                  <div className="analytics-trend-count">{m.count}</div>
                  <div className="analytics-trend-label">{m.label}</div>
                </div>
              ))}
            </div>

            <div className="section-divider" />

            <h2 className="dashboard-subtitle">ტოპ ვილები (შემოსავლის მიხედვით)</h2>
            {data.topVillas.length === 0 ? (
              <p className="dashboard-empty-hint">ჯერ არ არის საკმარისი მონაცემი.</p>
            ) : (
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>ვილა</th>
                    <th>ჯავშანი</th>
                    <th>ღამეები</th>
                    <th>სავარაუდო შემოსავალი</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topVillas.map((v, i) => (
                    <tr key={i}>
                      <td>{v.title}</td>
                      <td>{v.bookings}</td>
                      <td>{v.nights}</td>
                      <td>₾{v.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </main>
    </div>
  );
}
