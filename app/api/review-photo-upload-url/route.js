import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import crypto from 'crypto';

function verifyBookingToken(bookingId, token) {
  const secret = process.env.SESSION_SECRET;
  const expected = crypto.createHmac('sha256', secret).update(bookingId).digest('hex');
  return token === expected;
}

export async function POST(request) {
  try {
    const { bookingId, token, filename } = await request.json();

    if (!bookingId || !token || !verifyBookingToken(bookingId, token)) {
      return Response.json({ ok: false, message: 'ბმული არასწორია' }, { status: 403 });
    }
    if (!filename) {
      return Response.json({ ok: false, message: 'ფაილის სახელი აუცილებელია' }, { status: 400 });
    }

    const extMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1] : 'jpg';
    const path = `${bookingId}/${Date.now()}.${ext}`;

    const { data, error } = await supabaseAdmin.storage.from('review-photos').createSignedUploadUrl(path);

    if (error) {
      return Response.json({ ok: false, message: 'ატვირთვის ბმულის შექმნა ვერ მოხერხდა' }, { status: 500 });
    }

    return Response.json({ ok: true, path, token: data.token });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
