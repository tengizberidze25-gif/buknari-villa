'use client';

import { useEffect, useState } from 'react';

const OTHER_VALUE = '__other__';

export default function SubLocationSelect({ village, initialValue }) {
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState('');
  const [customText, setCustomText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!village) {
      setOptions([]);
      return;
    }
    setLoading(true);
    fetch(`/api/sub-locations?village=${encodeURIComponent(village)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setOptions(data.subLocations);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [village]);

  useEffect(() => {
    if (initialized || !initialValue) return;
    const match = options.find((o) => o.name === initialValue);
    if (match) {
      setSelected(match.name);
      setInitialized(true);
    } else if (options.length > 0) {
      setSelected(OTHER_VALUE);
      setCustomText(initialValue);
      setInitialized(true);
    }
  }, [options, initialValue, initialized]);

  return (
    <div className="form-row">
      <label>კონკრეტული ლოკაცია (არასავალდებულო)</label>
      <select
        className="village-select"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        disabled={!village || loading}
      >
        <option value="">{loading ? 'იტვირთება...' : 'აირჩიეთ...'}</option>
        {options.map((o) => (
          <option key={o.id} value={o.name}>
            {o.name}
          </option>
        ))}
        <option value={OTHER_VALUE}>სხვა...</option>
      </select>

      {selected === OTHER_VALUE && (
        <input
          type="text"
          placeholder="ჩაწერეთ ლოკაცია, მაგ. მესამე ხაზი"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          style={{ marginTop: '8px' }}
        />
      )}

      <input type="hidden" name="location_name" value={selected === OTHER_VALUE ? customText : selected} readOnly />
    </div>
  );
}
