'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import LocationPicker from '../../LocationPicker';
import VillageSelect from '../../VillageSelect';
import { AMENITIES } from '../../amenities';

export default function EditVillaPage({ params }) {
  const villaId = params.id;

  const [ownerId, setOwnerId] = useState(null);
  const [token, setToken] = useState(null);
  const [villa, setVilla] = useState(null);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);
  const [convertingPhotos, setConvertingPhotos] = useState(false);
  const [removingPhotoId, setRemovingPhotoId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedOwnerId = localStorage.getItem('buknari_owner_id');
    const storedToken = localStorage.getItem('buknari_owner_token');
    if (!storedOwnerId || !storedToken) {
      window.location.href = '/register';
      return;
    }
    setOwnerId(storedOwnerId);
    setToken(storedToken);

    fetch('/api/owner/villa/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId: storedOwnerId, token: storedToken, villaId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok) {
          setError(data.message || 'ვილა ვერ მოიძებნა');
        } else {
          setVilla(data.villa);
          setExistingPhotos(data.villa.villa_photos || []);
        }
      })
      .catch(() => setError('კავშირის შეცდომა'))
      .finally(() => setLoading(false));
  }, [villaId]);

  const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  const MAX_PHOTO_SIZE = 15 * 1024 * 1024; // 15MB

  async function handlePhotoChange(e) {
    const files = Array.from(e.target.files || []).slice(0, 20);
    const valid = [];
    const rejected = [];
    setConvertingPhotos(true);

    for (const file of files) {
      const isHeic =
        /\.(heic|heif)$/i.test(file.name) ||
        file.type === 'image/heic' ||
        file.type === 'image/heif';
      const looksLikeImage = ALLOWED_PHOTO_TYPES.includes(file.type) || isHeic;

      if (!looksLikeImage) {
        rejected.push(`${file.name} — მხოლოდ სურათებია დაშვებული`);
        continue;
      }
      if (file.size > MAX_PHOTO_SIZE) {
        rejected.push(`${file.name} — ზომა აღემატება 15MB-ს`);
        continue;
      }

      if (isHeic) {
        try {
          const heic2any = (await import('heic2any')).default;
          const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
          const jpegBlob = Array.isArray(converted) ? converted[0] : converted;
          const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
          valid.push(new File([jpegBlob], newName, { type: 'image/jpeg' }));
        } catch (err) {
          rejected.push(`${file.name} — HEIC ფაილის დამუშავება ვერ მოხერხდა`);
        }
      } else {
        valid.push(file);
      }
    }

    setNewPhotos(valid);
    setConvertingPhotos(false);
    setError(rejected.length > 0 ? `არ აიტვირთა: ${rejected.join(', ')}` : '');
  }

  const [settingCoverId, setSettingCoverId] = useState(null);

  async function removeExistingPhoto(photoId) {
    if (!confirm('წავშალო ეს ფოტო?')) return;
    setRemovingPhotoId(photoId);
    try {
      const res = await fetch('/api/owner/villa/delete-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId, token, villaId, photoId }),
      });
      const data = await res.json();
      if (data.ok) {
        setExistingPhotos((list) => list.filter((p) => p.id !== photoId));
      } else {
        setError(data.message || 'ფოტოს წაშლა ვერ მოხერხდა');
      }
    } catch (e) {
      setError('კავშირის შეცდომა');
    }
    setRemovingPhotoId(null);
  }

  async function setCoverPhoto(photoId) {
    setSettingCoverId(photoId);
    try {
      const res = await fetch('/api/owner/villa/set-cover-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId, token, villaId, photoId }),
      });
      const data = await res.json();
      if (data.ok) {
        setExistingPhotos((list) => {
          const target = list.find((p) => p.id === photoId);
          const others = list.filter((p) => p.id !== photoId);
          return [target, ...others];
        });
      } else {
        setError(data.message || 'მთავარი ფოტოს დაყენება ვერ მოხერხდა');
      }
    } catch (e) {
      setError('კავშირის შეცდომა');
    }
    setSettingCoverId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const form = e.target;
    const selectedAmenities = Array.from(form.querySelectorAll('input[name="amenities"]:checked')).map(
      (el) => el.value
    );

    try {
      const updateRes = await fetch('/api/owner/villa/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId,
          token,
          villaId,
          title: form.title.value,
          village: form.village.value,
          description: form.description.value,
          location_name: form.location_name.value,
          price_per_night: form.price_per_night.value,
          lat: form.lat.value,
          lng: form.lng.value,
          max_guests: form.max_guests.value,
          bedrooms: form.bedrooms.value,
          bathrooms: form.bathrooms.value,
          amenities: selectedAmenities,
          contact_phone: form.contact_phone.value,
          contact_whatsapp: form.contact_whatsapp.value,
        }),
      });
      const updateData = await updateRes.json();
      if (!updateData.ok) {
        setError(updateData.message || 'დაფიქსირდა შეცდომა');
        setSaving(false);
        return;
      }

      // Upload any newly added photos
      const startSortOrder = existingPhotos.length;
      for (let i = 0; i < newPhotos.length; i++) {
        const file = newPhotos[i];

        const urlRes = await fetch('/api/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ownerId,
            token,
            villaId,
            filename: file.name,
            sortOrder: startSortOrder + i,
          }),
        });
        const urlData = await urlRes.json();
        if (!urlData.ok) continue;

        const { error: uploadError } = await supabase.storage
          .from('villa-photos')
          .uploadToSignedUrl(urlData.path, urlData.token, file);

        if (uploadError) continue;

        await fetch('/api/add-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ownerId, token, villaId, path: urlData.path, sortOrder: startSortOrder + i }),
        });
      }

      setSaved(true);
      setNewPhotos([]);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setError('კავშირის შეცდომა, სცადეთ თავიდან');
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm('დარწმუნებული ხართ, რომ გსურთ ამ ვილის სამუდამოდ წაშლა? ეს მოქმედება ვერ გაუქმდება.')) return;
    setDeleting(true);
    setError('');
    try {
      const res = await fetch('/api/owner/villa/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId, token, villaId }),
      });
      const data = await res.json();
      if (data.ok) {
        window.location.href = '/dashboard';
      } else {
        setError(data.message || 'წაშლა ვერ მოხერხდა');
        setDeleting(false);
      }
    } catch (e) {
      setError('კავშირის შეცდომა');
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-texture" />
        <div className="auth-card">
          <p className="booking-loading">იტვირთება...</p>
        </div>
      </div>
    );
  }

  if (!villa) {
    return (
      <div className="auth-page">
        <div className="auth-texture" />
        <div className="auth-card">
          <a href="/" className="auth-logo">
            <img src="/logo-nav.png" alt="Buknari Villa" style={{ height: '34px', width: 'auto' }} />
          </a>
          <div className="auth-error">{error || 'ვილა ვერ მოიძებნა'}</div>
          <a href="/dashboard" className="auth-cta">
            დაშბორდზე დაბრუნება →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <div className="auth-texture" />
      <div className="form-card">
        <a href="/" className="auth-logo">
          <img src="/logo-nav.png" alt="Buknari Villa" style={{ height: '34px', width: 'auto' }} />
        </a>
        <h1>ვილის რედაქტირება</h1>
        <p className="auth-sub">ცვლილებები დაუყოვნებლივ აისახება საიტზე. სათაური/აღწერა/ლოკაცია ავტომატურად ხელახლა ითარგმნება.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>სათაური *</label>
            <input name="title" type="text" defaultValue={villa.title} required />
          </div>

          <div className="form-row">
            <label>აღწერა</label>
            <textarea name="description" rows={4} defaultValue={villa.description || ''} />
          </div>

          <VillageSelect initialValue={villa.village} />

          <div className="form-grid-2">
            <div className="form-row">
              <label>ლოკაცია</label>
              <input name="location_name" type="text" defaultValue={villa.location_name || ''} />
            </div>
            <div className="form-row">
              <label>ფასი ღამეში (₾) *</label>
              <input name="price_per_night" type="number" min="1" defaultValue={villa.price_per_night || ''} required />
            </div>
          </div>

          <LocationPicker initialLat={villa.lat} initialLng={villa.lng} />

          <div className="form-grid-3">
            <div className="form-row">
              <label>სტუმრები</label>
              <input name="max_guests" type="number" min="1" defaultValue={villa.max_guests || ''} />
            </div>
            <div className="form-row">
              <label>საძინებელი</label>
              <input name="bedrooms" type="number" min="0" defaultValue={villa.bedrooms || ''} />
            </div>
            <div className="form-row">
              <label>სააბაზანო</label>
              <input name="bathrooms" type="number" min="0" defaultValue={villa.bathrooms || ''} />
            </div>
          </div>

          <div className="form-row">
            <label>კეთილმოწყობა</label>
            <div className="amenities-grid">
              {AMENITIES.map((a) => (
                <label key={a.key} className="amenity-checkbox">
                  <input
                    type="checkbox"
                    name="amenities"
                    value={a.key}
                    defaultChecked={(villa.amenities || []).includes(a.key)}
                  />
                  <span>{a.icon} {a.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-row">
              <label>საკონტაქტო ტელეფონი</label>
              <input name="contact_phone" type="tel" defaultValue={villa.contact_phone || ''} />
            </div>
            <div className="form-row">
              <label>WhatsApp ნომერი</label>
              <input name="contact_whatsapp" type="tel" defaultValue={villa.contact_whatsapp || ''} />
            </div>
          </div>

          <div className="form-row">
            <label>არსებული ფოტოები</label>
            {existingPhotos.length === 0 && <p className="form-hint">ფოტო ჯერ არ არის დამატებული.</p>}
            {existingPhotos.length > 0 && (
              <div className="existing-photo-grid">
                {existingPhotos.map((p, idx) => (
                  <div key={p.id} className="existing-photo-item">
                    <img src={p.url} alt="" />
                    {idx === 0 && <span className="existing-photo-cover-badge">მთავარი</span>}
                    {idx !== 0 && (
                      <button
                        type="button"
                        className="existing-photo-set-cover"
                        disabled={settingCoverId === p.id}
                        onClick={() => setCoverPhoto(p.id)}
                        aria-label="მთავარ ფოტოდ დაყენება"
                        title="მთავარ ფოტოდ დაყენება"
                      >
                        ★
                      </button>
                    )}
                    <button
                      type="button"
                      className="existing-photo-remove"
                      disabled={removingPhotoId === p.id}
                      onClick={() => removeExistingPhoto(p.id)}
                      aria-label="ფოტოს წაშლა"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-row">
            <label>ახალი ფოტოების დამატება (მაქს. 20)</label>
            <input type="file" accept="image/*" multiple onChange={handlePhotoChange} />
            {newPhotos.length > 0 && (
              <div className="photo-preview-list">
                {newPhotos.map((file, i) => (
                  <div className="photo-preview" key={i}>{file.name}</div>
                ))}
              </div>
            )}
            {convertingPhotos && (
              <p className="dashboard-empty-hint" style={{ marginTop: '8px' }}>
                HEIC ფოტოები მუშავდება, გთხოვთ დაელოდოთ...
              </p>
            )}
          </div>

          {error && <div className="auth-error">{error}</div>}
          {saved && <p className="dashboard-empty-hint">ცვლილებები შენახულია ✓</p>}

          <button type="submit" disabled={saving || convertingPhotos}>
            {saving ? 'ინახება...' : 'ცვლილებების შენახვა'}
          </button>
        </form>

        <div className="danger-zone">
          <button type="button" className="btn-delete-villa" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'იშლება...' : 'ვილის სამუდამოდ წაშლა'}
          </button>
        </div>
      </div>
    </div>
  );
}
