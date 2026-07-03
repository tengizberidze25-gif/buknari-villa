import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import crypto from 'crypto';

function verifyToken(token, ownerId) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split('.');
    const signature = parts.pop();
    const payload = parts.join('.');
    const [tokenOwnerId, expiresAt] = payload.split('.');

    if (tokenOwnerId !== ownerId) return false;
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
    const { ownerId, token, bookingId } = await request.json();

    if (!ownerId || !token || !verifyToken(token, ownerId)) {
      return Response.json({ ok: false, message: 'სესია ამოიწურა' }, { status: 401 });
    }
    if (!bookingId) {
      return Response.json({ ok: false, message: 'არასრული მოთხოვნა' }, { status: 400 });
    }

    const { data: booking } = await supabaseAdmin
      .from('villa_bookings')
      .select('id, status, villas!inner(owner_id)')
      .eq('id', bookingId)
      .single();

    if (!booking || booking.villas.owner_id !== ownerId || booking.status !== 'owner_block') {
      return Response.json({ ok: false, message: 'წვდომა უარყოფილია' }, { status: 403 });
    }

    const { error } = await supabaseAdmin.from('villa_bookings').delete().eq('id', bookingId);

    if (error) {
      return Response.json({ ok: false, message: 'გახსნა ვერ მოხერხდა' }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
