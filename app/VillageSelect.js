'use client';

import { useEffect, useState } from 'react';

export default function VillageSelect({ initialValue }) {
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

  return (
    <div className="form-row">
      <label>სოფელი / დაბა *</label>
      <select
        name="village"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required
        disabled={loading}
      >
        <option value="">
          {loading ? 'იტვირთება...' : 'აირჩიეთ...'}
        </option>
        {villages.map((v) => (
          <option key={v.id} value={v.name}>
            {v.name}
          </option>
        ))}
      </select>
    </div>
  );
}
