'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const MONTH_NAMES_KA = [
  'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
  'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი',
];

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
  const [remindingPhotos, setRemindingPhotos] = useState(false);
  const [remindPhotosMsg, setRemindPhotosMsg] = useState('');
  const [backfillingVillage, setBackfillingVillage] = useState(false);
  const [backfillVillageMsg, setBackfillVillageMsg] = useState('');
  const [backfillMsg, setBackfillMsg] = useState('');
  const [oldPhone, setOldPhone] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [changingPhone, setChangingPhone] = useState(false);
  const [phoneChangeMsg, setPhoneChangeMsg] = useState('');
  const [reorderingId, setReorderingId] = useState(null);

  // --- Village videos state ---
  const [villages, setVillages] = useState([]);
  const [videoVillage, setVideoVillage] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoMsg, setVideoMsg] = useState('');
  const [villageVideos, setVillageVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [deletingVideoId, setDeletingVideoId] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('buknari_admin_token');
    if (stored) setToken(stored);
  }, []);

  useEffect(() => {
    if (token) {
      load();
      loadVillages();
    }
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

  function loadVillages() {
    fetch('/api/villages')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setVillages(data.villages);
          if (data.villages.length > 0 && !videoVillage) {
            setVideoVillage(data.villages[0].name);
          }
        }
      })
      .catch(() => {});
  }

  function loadVillageVideos(villageName, currentToken) {
    if (!villageName) return;
    setLoadingVideos(true);
    fetch('/api/admin/village-videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: currentToken || token, action: 'list' }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setVillageVideos(data.videos.filter((v) => v.village === villageName));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingVideos(false));
  }

  useEffect(() => {
    if (token && videoVillage) loadVillageVideos(videoVillage, token);
  }, [videoVillage, token]);

  async function respond(villaId, action) {
    setActingId(villaId);
    try {
      const res = await fetch('/api/admin/villas/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, villaId, action }),
      });
      const data = await res.json();
      if (data.ok) {
        load();
      } else {
        alert(data.message || 'ქმედება ვერ შესრულდა');
      }
    } catch (e) {
      // ignore
    }
    setActingId(null);
  }

  async function deleteVilla(villaId, villaTitle) {
    const confirmed = window.confirm(
      `ნამდვილად გინდა "${villaTitle}" წაშლა? ეს ქმედება შეუქცევადია — წაიშლება ფოტოები, ჯავშნები და შეფასებებიც.`
    );
    if (!confirmed) return;

    setActingId(villaId);
    try {
      const res = await fetch('/api/admin/villas/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, villaId }),
      });
      const data = await res.json();
      if (data.ok) {
        setVillas((all) => all.filter((v) => v.id !== villaId));
      } else {
        alert(data.message || 'წაშლა ვერ მოხერხდა');
      }
    } catch (e) {
      alert('კავშირის შეცდომა');
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

  async function backfillVillage() {
    setBackfillingVillage(true);
    setBackfillVillageMsg('');
    try {
      const res = await fetch('/api/admin/backfill-village', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.ok) {
        setBackfillVillageMsg(`${data.updated} ვილას მიენიჭა "ბუკნარი" ✓`);
      } else {
        setBackfillVillageMsg(data.message || 'დაფიქსირდა შეცდომა');
      }
    } catch (e) {
      setBackfillVillageMsg('კავშირის შეცდომა');
    }
    setBackfillingVillage(false);
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

  async function remindOwnersPhotos() {
    setRemindingPhotos(true);
    setRemindPhotosMsg('');
    try {
      const res = await fetch('/api/admin/remind-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.ok) {
        setRemindPhotosMsg(`გაეგზავნა ${data.sent} SMS (სულ ${data.totalMissing} ვილას აკლია ფოტო).`);
      } else {
        setRemindPhotosMsg(data.message || 'დაფიქსირდა შეცდომა');
      }
    } catch (e) {
      setRemindPhotosMsg('კავშირის შეცდომა');
    }
    setRemindingPhotos(false);
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

  async function handleUploadVideo() {
    if (!videoVillage || !videoFile) {
      setVideoMsg('აირჩიეთ სოფელი/დაბა და ვიდეო ფაილი');
      return;
    }
    setUploadingVideo(true);
    setVideoMsg('');
    try {
      const urlRes = await fetch('/api/admin/village-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          action: 'get-upload-url',
          village: videoVillage,
          filename: videoFile.name,
        }),
      });
      const urlData = await urlRes.json();
      if (!urlData.ok) {
        setVideoMsg(urlData.message || 'ატვირთვის მომზადება ვერ მოხერხდა');
        setUploadingVideo(false);
        return;
      }

      const { error: uploadError } = await supabase.storage
        .from('village-videos')
        .uploadToSignedUrl(urlData.path, urlData.token, videoFile);

      if (uploadError) {
        setVideoMsg('ატვირთვა ვერ მოხერხდა: ' + uploadError.message);
        setUploadingVideo(false);
        return;
      }

      const confirmRes = await fetch('/api/admin/village-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          action: 'confirm',
          village: videoVillage,
          path: urlData.path,
        }),
      });
      const confirmData = await confirmRes.json();
      if (!confirmData.ok) {
        setVideoMsg(confirmData.message || 'ვიდეოს დამატება ვერ მოხერხდა');
        setUploadingVideo(false);
        return;
      }

      setVideoMsg('ვიდეო წარმატებით აიტვირთა ✓');
      setVideoFile(null);
      loadVillageVideos(videoVillage, token);
    } catch (e) {
      setVideoMsg('კავშირის შეცდომა');
    }
    setUploadingVideo(false);
  }

  async function deleteVideo(videoId) {
    if (!confirm('წავშალო ეს ვიდეო?')) return;
    setDeletingVideoId(videoId);
    try {
      const res = await fetch('/api/admin/village-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'delete', id: videoId }),
      });
      const data = await res.json();
      if (data.ok) {
        setVillageVideos((list) => list.filter((v) => v.id !== videoId));
      }
    } catch (e) {
      // ignore
    }
    setDeletingVideoId(null);
  }

  async function moveVideo(video, direction) {
    const idx = villageVideos.findIndex((v) => v.id === video.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= villageVideos.length) return;

    const other = villageVideos[swapIdx];
    const myOrder = video.sort_order;
    const otherOrder = other.sort_order;

    const newList = [...villageVideos];
    newList[idx] = { ...other, sort_order: myOrder };
    newList[swapIdx] = { ...video, sort_order: otherOrder };
    setVillageVideos(newList);

    try {
      await fetch('/api/admin/village-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'reorder', id: video.id, sort_order: otherOrder }),
      });
      await fetch('/api/admin/village-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'reorder', id: other.id, sort_order: myOrder }),
      });
    } catch (e) {
      loadVillageVideos(videoVillage, token);
    }
  }

  async function moveVilla(villa, direction, list) {
    const idx = list.findIndex((v) => v.id === villa.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= list.length) return;

    const other = list[swapIdx];
    const myOrder = villa.sort_order || 0;
    const otherOrder = other.sort_order || 0;

    setReorderingId(villa.id);

    // Optimistic UI update
    setVillas((all) =>
      all.map((v) => {
        if (v.id === villa.id) return { ...v, sort_order: otherOrder };
        if (v.id === other.id) return { ...v, sort_order: myOrder };
        return v;
      })
    );

    try {
      await fetch('/api/admin/villas/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, id: villa.id, sort_order: otherOrder }),
      });
      await fetch('/api/admin/villas/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, id: other.id, sort_order: myOrder }),
      });
    } catch (e) {
      load();
    }
    setReorderingId(null);
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

  const filtered = villas
    .filter((v) => (filter === 'all' ? true : v.status === filter))
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

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

        <a
          href="/admin/settings"
          className="guest-logout-link"
          style={{ marginBottom: '24px', display: 'inline-block', marginLeft: '16px' }}
        >
          ⚙ საიტის პარამეტრები
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
            disabled={backfillingVillage}
            onClick={backfillVillage}
          >
            {backfillingVillage ? 'მიმდინარეობს...' : 'ყველა ვილას "ბუკნარი" მინიჭება (ერთჯერადი)'}
          </button>
          {backfillVillageMsg && <p className="dashboard-empty-hint" style={{ marginTop: '8px' }}>{backfillVillageMsg}</p>}
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

        <div style={{ marginBottom: '24px' }}>
          <button
            type="button"
            className="guest-logout-link"
            disabled={remindingPhotos}
            onClick={remindOwnersPhotos}
          >
            {remindingPhotos ? 'იგზავნება...' : 'SMS შეხსენება — ფოტოს ატვირთვა'}
          </button>
          {remindPhotosMsg && <p className="dashboard-empty-hint" style={{ marginTop: '8px' }}>{remindPhotosMsg}</p>}
        </div>

        <div className="admin-phone-change-box">
          <h3 className="villa-amenities-title">სოფლების/დაბების ვიდეოები</h3>
          <p className="dashboard-empty-hint">
            აირჩიეთ სოფელი/დაბა და ატვირთეთ ვიდეო (მაქს. 50MB) — მომხმარებელი ამ ვიდეოს დაინახავს, როცა ამ ლოკაციას აირჩევს.
          </p>
          <div className="video-upload-form">
            <div className="video-upload-field">
              <label>სოფელი / დაბა</label>
              <select value={videoVillage} onChange={(e) => setVideoVillage(e.target.value)}>
                {villages.map((v) => (
                  <option key={v.id} value={v.name}>{v.name}</option>
                ))}
              </select>
            </div>
            <div className="video-upload-field">
              <label>ვიდეო ფაილი</label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              />
              {videoFile && <span className="video-upload-filename">{videoFile.name}</span>}
            </div>
            <button
              type="button"
              className="video-upload-btn"
              disabled={uploadingVideo || !videoFile}
              onClick={handleUploadVideo}
            >
              {uploadingVideo ? 'იტვირთება...' : '+ ვიდეოს ატვირთვა'}
            </button>
          </div>
          {videoMsg && <p className="dashboard-empty-hint" style={{ marginTop: '8px' }}>{videoMsg}</p>}

          {loadingVideos && <p className="dashboard-empty-hint" style={{ marginTop: '12px' }}>იტვირთება...</p>}

          {!loadingVideos && villageVideos.length === 0 && (
            <p className="dashboard-empty-hint" style={{ marginTop: '12px' }}>
              {videoVillage}-ს ჯერ არ აქვს ვიდეო.
            </p>
          )}

          {!loadingVideos && villageVideos.length > 0 && (
            <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {villageVideos.map((v, idx) => (
                <div key={v.id} style={{ position: 'relative' }}>
                  <video src={v.url} controls style={{ width: '200px', borderRadius: 'var(--radius-md)' }} />
                  <button
                    type="button"
                    className="existing-photo-remove"
                    disabled={deletingVideoId === v.id}
                    onClick={() => deleteVideo(v.id)}
                    style={{ position: 'absolute', top: '6px', right: '6px' }}
                    aria-label="ვიდეოს წაშლა"
                  >
                    ✕
                  </button>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
                    <button
                      type="button"
                      className="guest-logout-link"
                      disabled={idx === 0}
                      onClick={() => moveVideo(v, 'up')}
                      style={{ padding: '4px 10px', fontSize: '13px' }}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="guest-logout-link"
                      disabled={idx === villageVideos.length - 1}
                      onClick={() => moveVideo(v, 'down')}
                      style={{ padding: '4px 10px', fontSize: '13px' }}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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

        {filtered.map((villa, idx) => (
          <div key={villa.id} className="dashboard-villa-section">
            <div className="admin-villa-header">
              <div>
                <h2 className="dashboard-villa-title">
                  {villa.display_id ? <span className="admin-villa-id">#{villa.display_id}</span> : null} {villa.title}
                </h2>
                <div className="booking-request-dates">
                  {villa.location_name} · ₾{villa.price_per_night}/ღამე
                </div>
                <div className="dashboard-empty-hint">
                  მფლობელი: {villa.owners?.full_name || '—'} · {villa.owners?.phone || '—'}
                </div>
                <div className="owner-villa-stats">
                  <span>👁 {villa.views_count || 0} ნახვა</span>
                  <span>📩 {villa.request_count || 0} მოთხოვნა</span>
                  <span>📅 {MONTH_NAMES_KA[new Date().getMonth()]}: {villa.month_occupancy || 0}% დაკავებული</span>
                </div>
              </div>
              <span className={`admin-status-badge admin-status-${villa.status}`}>
                {STATUS_LABELS[villa.status] || villa.status}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {villa.status !== 'approved' && (
                <button
                  disabled={actingId === villa.id}
                  className="btn-confirm"
                  onClick={() => respond(villa.id, 'approve')}
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
<a
href={`/admin/edit-villa/${villa.id}`}
                className="guest-logout-link"
                style={{ padding: '6px 14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
              >
                ✎ რედაქტირება
              </a>
              <button
                type="button"
                className="guest-logout-link"
                disabled={idx === 0 || reorderingId === villa.id}
                onClick={() => moveVilla(villa, 'up', filtered)}
                style={{ padding: '6px 14px' }}
              >
                ↑ წინ
              </button>
              <button
                type="button"
                className="guest-logout-link"
                disabled={idx === filtered.length - 1 || reorderingId === villa.id}
                onClick={() => moveVilla(villa, 'down', filtered)}
                style={{ padding: '6px 14px' }}
              >
                ↓ უკან
              </button>
              <button
                type="button"
                className="btn-decline"
                disabled={actingId === villa.id}
                onClick={() => deleteVilla(villa.id, villa.title)}
                style={{ padding: '6px 14px' }}
              >
                🗑 წაშლა
              </button>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
