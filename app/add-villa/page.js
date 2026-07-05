'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AMENITIES } from '../amenities';

export default function AddVillaPage() {
  const [ownerId, setOwnerId] = useState(null);
  const [token, setToken] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const storedOwnerId = localStorage.getItem('buknari_owner_id');
    const storedToken = localStorage.getItem('buknari_owner_token');
    if (!storedOwnerId || !storedToken) {
      window.location.href = '/register';
      return;
    }
    setOwnerId(storedOwnerId);
    setToken(storedToken);
  }, []);

  const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  const MAX_PHOTO_SIZE = 15 * 1024 * 1024; // 15MB

  function handlePhotoChange(e) {
    const files = Array.from(e.target.files || []).slice(0, 20);
    const valid = [];
    const rejected = [];

    for (const file of files) {
      const looksLikeImage =
        ALLOWED_PHOTO_TYPES.includes(file.type) ||
        /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
      if (!looksLikeImage) {
        rejected.push(`${file.name} — მხოლოდ სურათებია დაშვებული`);
      } else if (file.size > MAX_PHOTO_SIZE) {
        rejected.push(`${file.name} — ზომა აღემატება 15MB-ს`);
      } else {
        valid.push(file);
      }
    }

    setPhotos(valid);
    setError(rejected.length > 0 ? `არ აიტვირთა: ${rejected.join(', ')}` : '');
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
      // 1) Create the villa row (small JSON payload — no photo bytes here,
      // this avoids Vercel's ~4.5MB function body limit / 413 errors)
      const createRes = await fetch('/api/add-villa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId,
          token,
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

      // 2) Upload each photo directly from the browser to Supabase Storage,
      // using a short-lived signed URL — the file bytes never pass through
      // our Vercel function, so large iPhone photos (HEIC) won't hit the 413 limit.
      for (let i = 0; i < photos.length; i++) {
        const file = photos[i];

        const urlRes = await fetch('/api/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ownerId, token, villaId, filename: file.name, sortOrder: i }),
        });
        const urlData = await urlRes.json();
        if (!urlData.ok) continue; // skip this photo, keep going with the rest

        const { error: uploadError } = await supabase.storage
          .from('villa-photos')
          .uploadToSignedUrl(urlData.path, urlData.token, file);

        if (uploadError) continue;

        await fetch('/api/add-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ownerId, token, villaId, path: urlData.path, sortOrder: i }),
        });
      }

      setDone(true);
    } catch (err) {
      setError('კავშირის შეცდომა, სცადეთ თავიდან');
    }
    setLoading(false);
  }

  if (!ownerId) return null;

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-texture" />
        <div className="auth-card">
          <a href="/" className="auth-logo">
            <img src="/logo-nav.png" alt="Buknari Villa" style={{ height: '34px', width: 'auto' }} />
          </a>
          <h1>განცხადება გაგზავნილია ✓</h1>
          <p className="auth-sub">
            თქვენი ვილა გადაეცა განხილვას. საიტზე გამოჩნდება დამტკიცების შემდეგ — ჩვეულებრივ 24 საათის განმავლობაში.
          </p>
          <a href="/" className="auth-cta">
            მთავარ გვერდზე დაბრუნება →
          </a>
          <a href="/dashboard" className="auth-cta" style={{ marginTop: '10px' }}>
            ჯავშნების მართვა →
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
        <h1>ვილის დამატება</h1>
        <p className="auth-sub">შეავსეთ ინფორმაცია ქართულად — ტექსტი ავტომატურად ითარგმნება ინგლისურად და რუსულად.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>სათაური *</label>
            <input name="title" type="text" placeholder="ზღვის ხედის ვილა, მეზონინით" required />
          </div>

          <div className="form-row">
            <label>აღწერა</label>
            <textarea name="description" rows={4} placeholder="აღწერეთ თქვენი ვილა — რამდენ ოთახს, რა ხედს, რა კომფორტს სთავაზობთ სტუმრებს" />
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
              , იპოვე შენი ვილის ადგილი, დააჭირე მარჯვენა ღილაკს ზუსტ წერტილზე და დააკოპირე გამოსული კოორდინატები (მაგ. 41.7180, 41.7550) — ჩააკოპირე ორივე ველში.
            </p>
            <div className="form-grid-2">
              <input name="lat" type="number" step="any" placeholder="Latitude, მაგ. 41.7180" />
              <input name="lng" type="number" step="any" placeholder="Longitude, მაგ. 41.7550" />
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
                  <div className="photo-preview" key={i}>
                    {file.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'იგზავნება...' : 'განცხადების გაგზავნა'}
          </button>
        </form>
      </div>
    </div>
  );
}
