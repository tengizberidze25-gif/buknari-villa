import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import crypto from 'crypto';

function verifyAdminToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split('.');
    const signature = parts.pop();
    const payload = parts.join('.');
    const [role, expiresAt] = payload.split('.');

    if (role !== 'admin') return false;
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
    const { token } = await request.json();

    if (!token || !verifyAdminToken(token)) {
      return Response.json({ ok: false, message: 'ავტორიზაცია საჭიროა' }, { status: 401 });
    }

    const { data: villas, error } = await supabaseAdmin
      .from('villas')
      .select('*, owners(full_name, phone)')
      .order('created_at', { ascending: false });

    if (error) {
      return Response.json({ ok: false, message: 'მონაცემების წამოღება ვერ მოხერხდა' }, { status: 500 });
    }

    const { data: bookings } = await supabaseAdmin
      .from('villa_bookings')
      .select('villa_id, status, check_in, check_out')
      .neq('status', 'owner_block');

    const requestCounts = {};
    (bookings || []).forEach((b) => {
      requestCounts[b.villa_id] = (requestCounts[b.villa_id] || 0) + 1;
    });

    // Current-month occupancy — confirmed bookings + owner-blocked dates count.
    const { data: blockingBookings } = await supabaseAdmin
      .from('villa_bookings')
      .select('villa_id, status, check_in, check_out')
      .in('status', ['confirmed', 'owner_block']);

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 1); // exclusive

    const bookedDaysByVilla = {};
    (blockingBookings || []).forEach((b) => {
      if (!bookedDaysByVilla[b.villa_id]) bookedDaysByVilla[b.villa_id] = new Set();
      let d = new Date(b.check_in);
      const end = new Date(b.check_out);
      while (d < end) {
        if (d >= monthStart && d < monthEnd) {
          bookedDaysByVilla[b.villa_id].add(d.getDate());
        }
        d.setDate(d.getDate() + 1);
      }
    });

    const villasWithStats = (villas || []).map((v) => ({
      ...v,
      request_count: requestCounts[v.id] || 0,
      month_occupancy: Math.round(((bookedDaysByVilla[v.id]?.size || 0) / daysInMonth) * 100),
    }));

    return Response.json({ ok: true, villas: villasWithStats });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
