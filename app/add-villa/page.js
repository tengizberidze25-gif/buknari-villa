'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

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

  function handlePhotoChange(e) {
    const files = Array.from(e.target.files || []).slice(0, 20);
    setPhotos(files);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const form = e.target;

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
          max_guests: form.max_guests.value,
          bedrooms: form.bedrooms.value,
          bathrooms: form.bathrooms.value,
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
            <label>ფოტოები (მაქს. 8)</label>
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
