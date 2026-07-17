import { supabaseAdmin } from '../../../lib/supabaseAdmin';

const DEFAULT_REFERRAL_PCT = 10;

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from('site_settings')
      .select('key, value')
      .eq('key', 'referral_discount_pct')
      .maybeSingle();

    const referralDiscountPct = data?.value ? Number(data.value) : DEFAULT_REFERRAL_PCT;

    return Response.json({ ok: true, referralDiscountPct });
  } catch (err) {
    return Response.json({ ok: true, referralDiscountPct: DEFAULT_REFERRAL_PCT });
  }
}
