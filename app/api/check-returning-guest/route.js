import { supabaseAdmin } from '../../../lib/supabaseAdmin';

function extractCorePhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.length > 9) digits = digits.slice(-9);
  return digits;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const core = extractCorePhone(searchParams.get('phone'));
    if (core.length !== 9) {
      return Response.json({ ok: true, isReturning: false });
    }

    // guest_phone is stored exactly as the guest typed it (no fixed format),
    // so match on the last 9 digits rather than an exact/normalized string.
    const { count } = await supabaseAdmin
      .from('villa_bookings')
      .select('id', { count: 'exact', head: true })
      .ilike('guest_phone', `%${core}`)
      .in('status', ['confirmed', 'pending']);

    return Response.json({ ok: true, isReturning: (count || 0) > 0 });
  } catch (err) {
    return Response.json({ ok: true, isReturning: false });
  }
}
