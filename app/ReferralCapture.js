'use client';

import { useEffect } from 'react';

const STORAGE_KEY = 'buknari_ref_code';
const EXPIRY_DAYS = 30;

// Captures a ?ref=<code> link parameter sitewide (any page, not just villa
// pages) so a referral survives normal browsing before the guest lands on a
// booking form. The code is an opaque, random identifier — never a phone
// number — issued to guests only after a completed, confirmed stay. Stored
// with an expiry so old links don't linger forever.
export default function ReferralCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = (params.get('ref') || '').trim();
      if (!ref || !/^[A-Za-z0-9_-]{4,16}$/.test(ref)) return;

      const expiresAt = Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ code: ref, expiresAt }));
    } catch (e) {
      // localStorage unavailable — referral capture just won't work, no harm
    }
  }, []);

  return null;
}
