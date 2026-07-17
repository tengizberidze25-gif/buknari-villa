import { supabaseAdmin } from '../../../lib/supabaseAdmin';

function normalizePhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.indexOf('995') === 0) digits = digits.substring(3);
  if (digits.length !== 9) return '';
  return '995' + digits;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = normalizePhone(searchParams.get('phone'));
    if (!phone) {
      return Response.json({ ok: true, hasReward: false });
    }

    const { data } = await supabaseAdmin
      .from('referral_rewards')
      .select('id, discount_pct')
      .eq('phone', phone)
      .eq('used', false)
      .order('created_at', { ascending: true })
      .limit(1);

    if (!data || data.length === 0) {
      return Response.json({ ok: true, hasReward: false });
    }

    return Response.json({ ok: true, hasReward: true, discountPct: data[0].discount_pct });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
