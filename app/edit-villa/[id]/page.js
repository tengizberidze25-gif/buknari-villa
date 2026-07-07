'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import LocationPicker from '../../LocationPicker';
import VillageSelect from '../../VillageSelect';
import SubLocationSelect from '../../SubLocationSelect';
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
  const [selectedVillage, setSelectedVillage] = useState('');

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
          setSelectedVillage(data.villa.village || '');
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
