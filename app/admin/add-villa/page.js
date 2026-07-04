'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { AMENITIES } from '../../amenities';

export default function AdminAddVillaPage() {
  const [token, setToken] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('buknari_admin_token');
    if (!stored) {
      window.location.href = '/admin';
      return;
    }
    setToken(stored);
  }, []);

  function handlePhotoChange(e) {
    const files = Array.from(e.target.files || []).slice(0, 20);
    setPhotos(files);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const form = e.target;
    const selectedAmenities = Array.from(form.querySelectorAll('input[name="amenities"]:checked')).map(
      (el) => el.value
    );

    try {
      const createRes = await fetch('/api/admin/add-villa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          ownerPhone: form.owner_phone.value,
          ownerName: form.owner_name.value,
          title: form.title.value,
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
      const createData = await createRes.json();
      if (!createData.ok) {
        setError(createData.message || 'დაფიქსირდა შეცდომა');
        setLoading(false);
        return;
      }

      const villaId = createData.villaId;

      for (let i = 0; i < photos.length; i++) {
        const file = photos[i];
        const urlRes = await fetch('/api/admin/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, villaId, filename: file.name, sortOrder: i }),
        });
        const urlData = await urlRes.json();
        if (!urlData.ok) continue;

        const { error: uploadError } = await supabase.storage
          .from('villa-photos')
          .uploadToSignedUrl(urlData.path, urlData.token, file);

        if (uploadError) continue;

        await fetch('/api/admin/add-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, villaId, path: urlData.path, sortOrder: i }),
        });
      }

      setDone(true);
    } catch (err) {
      setError('კავშირის შეცდომა, სცადეთ თავიდან');
    }
    setLoading(false);
  }

  if (!token) return null;

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-texture" />
        <div className="auth-card">
          <a href="/" className="auth-logo">
            <img src="/logo-nav.png" alt="Buknari Villa" style={{ height: '56px', width: 'auto' }} />
          </a>
          <h1>ვილა დამატებულია ✓</h1>
          <p className="auth-sub">ვილა უკვე დამტკიცებული და საჯაროდ ხილვადია საიტზე.</p>
          <a href="/admin" className="auth-cta">
            ადმინ პანელში დაბრუნება →
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
          <img src="/logo-nav.png" alt="Buknari Villa" style={{ height: '56px', width: 'auto' }} />
        </a>
        <h1>ვილის დამატება (ადმინი)</h1>
        <p className="auth-sub">
          შეავსე მფლობელის ინფორმაცია და ვილის დეტალები — გამოქვეყნდება დაუყოვნებლივ, დამტკიცების გარეშე.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-row">
              <label>მფლობელის ტელეფონი *</label>
              <input name="owner_phone" type="tel" placeholder="599 123 456" required />
            </div>
            <div className="form-row">
              <label>მფლობელის სახელი</label>
              <input name="owner_name" type="text" placeholder="სახელი გვარი" />
            </div>
          </div>

          <div className="form-row">
            <label>სათაური *</label>
            <input name="title" type="text" placeholder="ზღვის ხედის ვილა, მეზონინით" required />
          </div>

          <div className="form-row">
            <label>აღწერა</label>
            <textarea name="description" rows={4} placeholder="აღწერეთ ვილა" />
          </div>

          <div className="form-grid-2">
            <div className="form-row">
              <label>ლოკაცია</label>
              <input name="location_name" type="text" placeholder="ბუკნარი, პირველი ხაზი" />
            </div>
            <div className="form-row">
              <label>ფასი ღამეში (₾) *</label>
              <input name="price_per_night" type="number" min="1" placeholder="200" required />
            </div>
          </div>

          <div className="form-row">
            <label>ვილის ადგილმდებარეობა რუკაზე (არასავალდებულო)</label>
            <p className="form-hint">
              გახსენი{' '}
              <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer">
                Google Maps
              </a>
              , დააკოპირე კოორდინატები.
            </p>
            <div className="form-grid-2">
              <input name="lat" type="number" step="any" placeholder="Latitude" />
              <input name="lng" type="number" step="any" placeholder="Longitude" />
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-row">
              <label>სტუმრები</label>
              <input name="max_guests" type="number" min="1" placeholder="4" />
            </div>
            <div className="form-row">
              <label>საძინებელი</label>
              <input name="bedrooms" type="number" min="0" placeholder="2" />
            </div>
            <div className="form-row">
              <label>სააბაზანო</label>
              <input name="bathrooms" type="number" min="0" placeholder="1" />
            </div>
          </div>

          <div className="form-row">
            <label>კეთილმოწყობა</label>
            <div className="amenities-grid">
              {AMENITIES.map((a) => (
                <label key={a.key} className="amenity-checkbox">
                  <input type="checkbox" name="amenities" value={a.key} />
                  <span>{a.icon} {a.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-row">
              <label>საკონტაქტო ტელეფონი</label>
              <input name="contact_phone" type="tel" placeholder="599 123 456" />
            </div>
            <div className="form-row">
              <label>WhatsApp ნომერი</label>
              <input name="contact_whatsapp" type="tel" placeholder="599 123 456" />
            </div>
          </div>

          <div className="form-row">
            <label>ფოტოები (მაქს. 20)</label>
            <input type="file" accept="image/*" multiple onChange={handlePhotoChange} />
            {photos.length > 0 && (
              <div className="photo-preview-list">
                {photos.map((file, i) => (
                  <div className="photo-preview" key={i}>{file.name}</div>
                ))}
              </div>
            )}
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'იგზავნება...' : 'ვილის დამატება და გამოქვეყნება'}
          </button>
        </form>
      </div>
    </div>
  );
}
