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
    const { phone, token } = await request.json();
    const normalized = normalizeSmsPhone(phone);

    if (!normalized || !token || !verifyToken(token, normalized)) {
      return Response.json({ ok: false, message: 'სესია ამოიწურა' }, { status: 401 });
    }

    const { data: candidates, error } = await supabaseAdmin
      .from('villa_bookings')
      .select('id, villa_id, check_in, check_out, status, created_at, guest_phone, villas(title, title_en, title_ru, title_hy, location_name, location_name_en, location_name_ru, location_name_hy)')
      .ilike('guest_phone', `%${normalized.slice(-9)}%`)
      .order('created_at', { ascending: false });

    if (error) {
      return Response.json({ ok: false, message: 'ჯავშნების წამოღება ვერ მოხერხდა' }, { status: 500 });
    }

    // guest_phone is stored exactly as the guest typed it at booking time (not normalized),
    // so we normalize here before comparing to make sure formatting differences don't hide bookings
    const bookings = (candidates || [])
      .filter((b) => normalizeSmsPhone(b.guest_phone) === normalized)
      .map(({ guest_phone, ...rest }) => rest);

    return Response.json({ ok: true, bookings });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
