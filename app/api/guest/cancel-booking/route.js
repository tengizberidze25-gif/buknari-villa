import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import crypto from 'crypto';

function normalizeSmsPhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.indexOf('995') === 0) digits = digits.substring(3);
  if (digits.length !== 9) return '';
  return '995' + digits;
}

function verifyToken(token, phone) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split('.');
    const signature = parts.pop();
    const payload = parts.join('.');
    const [tokenPhone, expiresAt] = payload.split('.');

    if (tokenPhone !== phone) return false;
    if (Date.now() > Number(expiresAt)) return false;

    const secret = process.env.SESSION_SECRET;
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return signature === expectedSig;
  } catch (e) {
    return false;
  }
}

export async function POST(request) {
  try {
    const { phone, token, bookingId } = await request.json();
    const normalized = normalizeSmsPhone(phone);

    if (!normalized || !token || !bookingId || !verifyToken(token, normalized)) {
      return Response.json({ ok: false, message: 'სესია ამოიწურა' }, { status: 401 });
    }

    // Server-side ownership check: this booking must actually belong to this phone number
    const { data: booking } = await supabaseAdmin
      .from('villa_bookings')
      .select('id, guest_phone')
      .eq('id', bookingId)
      .single();

    if (!booking || normalizeSmsPhone(booking.guest_phone) !== normalized) {
      return Response.json({ ok: false, message: 'ჯავშანი ვერ მოიძებნა' }, { status: 404 });
    }

    const { error } = await supabaseAdmin.from('villa_bookings').delete().eq('id', bookingId);

    if (error) {
      return Response.json({ ok: false, message: 'გაუქმება ვერ მოხერხდა' }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
