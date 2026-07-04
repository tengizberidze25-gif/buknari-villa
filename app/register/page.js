'use client';

import { useState } from 'react';

export default function RegisterPage() {
  const [step, setStep] = useState('phone'); // phone | code | done
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSendOtp(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.message || 'დაფიქსირდა შეცდომა');
      } else {
        setStep('code');
      }
    } catch (err) {
      setError('კავშირის შეცდომა, სცადეთ თავიდან');
    }
    setLoading(false);
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.message || 'დაფიქსირდა შეცდომა');
      } else {
        localStorage.setItem('buknari_owner_token', data.token);
        localStorage.setItem('buknari_owner_id', data.ownerId);
        setStep('done');
      }
    } catch (err) {
      setError('კავშირის შეცდომა, სცადეთ თავიდან');
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-texture" />
      <div className="auth-card">
        <a href="/" className="auth-logo">
          <img src="/logo-nav.png" alt="Buknari Villa" style={{ height: '56px', width: 'auto' }} />
        </a>

        {step === 'phone' && (
          <>
            <h1>მფლობელის რეგისტრაცია</h1>
            <p className="auth-sub">შეიყვანეთ თქვენი ტელეფონის ნომერი — გამოგიგზავნით დამადასტურებელ კოდს SMS-ით.</p>
            <form onSubmit={handleSendOtp}>
              <label>ტელეფონის ნომერი</label>
              <input
                type="tel"
                placeholder="599 123 456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              {error && <div className="auth-error">{error}</div>}
              <button type="submit" disabled={loading}>
                {loading ? 'იგზავნება...' : 'კოდის გაგზავნა'}
              </button>
            </form>
          </>
        )}

        {step === 'code' && (
          <>
            <h1>შეიყვანეთ კოდი</h1>
            <p className="auth-sub">
              SMS კოდი გამოგზავნილია ნომერზე <strong>{phone}</strong>
            </p>
            <form onSubmit={handleVerifyOtp}>
              <label>დამადასტურებელი კოდი</label>
              <input
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                required
              />
              {error && <div className="auth-error">{error}</div>}
              <button type="submit" disabled={loading}>
                {loading ? 'მოწმდება...' : 'დადასტურება'}
              </button>
              <button
                type="button"
                className="auth-secondary"
                onClick={() => {
                  setStep('phone');
                  setError('');
                }}
              >
                ← ნომრის შეცვლა
              </button>
            </form>
          </>
        )}

        {step === 'done' && (
          <>
            <h1>წარმატებით დარეგისტრირდით ✓</h1>
            <p className="auth-sub">ახლა შეგიძლიათ დაამატოთ თქვენი ვილა ან სახლი.</p>
            <a href="/add-villa" className="auth-cta">
              ვილის დამატება →
            </a>
          </>
        )}
      </div>
    </div>
  );
}
