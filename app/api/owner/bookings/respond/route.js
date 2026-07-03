import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
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
    const { ownerId, token, bookingId, action } = await request.json();

    if (!ownerId || !token || !verifyToken(token, ownerId)) {
      return Response.json({ ok: false, message: 'სესია ამოიწურა' }, { status: 401 });
    }
    if (!bookingId || !['confirm', 'decline'].includes(action)) {
      return Response.json({ ok: false, message: 'არასრული მოთხოვნა' }, { status: 400 });
    }

    // Confirm this booking belongs to a villa owned by this owner
    const { data: booking } = await supabaseAdmin
      .from('villa_bookings')
      .select('id, villa_id, villas!inner(owner_id)')
      .eq('id', bookingId)
      .single();

    if (!booking || booking.villas.owner_id !== ownerId) {
      return Response.json({ ok: false, message: 'წვდომა უარყოფილია' }, { status: 403 });
    }

    const newStatus = action === 'confirm' ? 'confirmed' : 'declined';

    const { error } = await supabaseAdmin
      .from('villa_bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (error) {
      return Response.json({ ok: false, message: 'განახლება ვერ მოხერხდა' }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
