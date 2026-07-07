'use client';

import { useEffect, useState } from 'react';

export default function VillageSelect({ initialValue, onChange }) {
  const [villages, setVillages] = useState([]);
  const [value, setValue] = useState(initialValue || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/villages')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setVillages(data.villages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (onChange) onChange(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="form-row">
      <label>ქალაქი / სოფელი / დაბა *</label>
      <select
        name="village"
        className="village-select"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required
        disabled={loading}
      >
        <option value="">{loading ? 'იტვირთება...' : 'აირჩიეთ...'}</option>
        {villages.map((v) => (
          <option key={v.id} value={v.name}>
            {v.name}
          </option>
        ))}
      </select>
    </div>
  );
}
