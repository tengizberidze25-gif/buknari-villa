const STORAGE_KEY = 'buknari_ref_code';

// Returns the stored referral phone code if present and not expired, else null.
export function getStoredReferralCode() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { code, expiresAt } = JSON.parse(raw);
    if (!code || !expiresAt || Date.now() > expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return code;
  } catch (e) {
    return null;
  }
}
