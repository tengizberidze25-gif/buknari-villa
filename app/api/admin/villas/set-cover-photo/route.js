import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
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
    const { token, villaId, photoId } = await request.json();
    if (!token || !verifyAdminToken(token)) {
      return Response.json({ ok: false, message: 'ავტორიზაცია საჭიროა' }, { status: 401 });
    }
    if (!villaId || !photoId) {
      return Response.json({ ok: false, message: 'არასრული მოთხოვნა' }, { status: 400 });
    }

    const { data: photos } = await supabaseAdmin
      .from('villa_photos')
      .select('id, sort_order')
      .eq('villa_id', villaId)
      .order('sort_order', { ascending: true });

    if (!photos || photos.length === 0) {
      return Response.json({ ok: false, message: 'ფოტოები ვერ მოიძებნა' }, { status: 404 });
    }

    const minOrder = photos[0].sort_order;
    if (photos[0].id === photoId) {
      return Response.json({ ok: true });
    }

    const { error } = await supabaseAdmin
      .from('villa_photos')
      .update({ sort_order: minOrder - 1 })
      .eq('id', photoId);

    if (error) {
      return Response.json({ ok: false, message: 'განახლება ვერ მოხერხდა' }, { status: 500 });
    }
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
