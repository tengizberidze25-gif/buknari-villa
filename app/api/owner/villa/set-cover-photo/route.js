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
    const { ownerId, token, villaId, photoId } = await request.json();

    if (!ownerId || !token || !verifyToken(token, ownerId)) {
      return Response.json({ ok: false, message: 'სესია ამოიწურა' }, { status: 401 });
    }
    if (!villaId || !photoId) {
      return Response.json({ ok: false, message: 'არასრული მოთხოვნა' }, { status: 400 });
    }

    // Confirm ownership
    const { data: villa } = await supabaseAdmin
      .from('villas')
      .select('id, owner_id')
      .eq('id', villaId)
      .single();

    if (!villa || villa.owner_id !== ownerId) {
      return Response.json({ ok: false, message: 'წვდომა უარყოფილია' }, { status: 403 });
    }

    // Find the current lowest sort_order among this villa's photos
    const { data: photos } = await supabaseAdmin
      .from('villa_photos')
      .select('id, sort_order')
      .eq('villa_id', villaId)
      .order('sort_order', { ascending: true });

    if (!photos || photos.length === 0) {
      return Response.json({ ok: false, message: 'ფოტოები ვერ მოიძებნა' }, { status: 404 });
    }

    const minOrder = photos[0].sort_order;
    const target = photos.find((p) => p.id === photoId);
    if (!target) {
      return Response.json({ ok: false, message: 'ფოტო ვერ მოიძებნა' }, { status: 404 });
    }

    // Already the cover — nothing to do
    if (target.id === photos[0].id) {
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
