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

    // Confirm the villa belongs to this owner
    const { data: villa } = await supabaseAdmin
      .from('villas')
      .select('id, owner_id')
      .eq('id', villaId)
      .single();

    if (!villa || villa.owner_id !== ownerId) {
      return Response.json({ ok: false, message: 'წვდომა უარყოფილია' }, { status: 403 });
    }

    // Confirm the photo actually belongs to this villa
    const { data: photo } = await supabaseAdmin
      .from('villa_photos')
      .select('id, url, villa_id')
      .eq('id', photoId)
      .single();

    if (!photo || photo.villa_id !== villaId) {
      return Response.json({ ok: false, message: 'ფოტო ვერ მოიძებნა' }, { status: 404 });
    }

    // Best-effort: remove the underlying file from storage
    try {
      const marker = `/villa-photos/`;
      const idx = photo.url.indexOf(marker);
      if (idx !== -1) {
        const path = photo.url.substring(idx + marker.length);
        await supabaseAdmin.storage.from('villa-photos').remove([path]);
      }
    } catch (e) {
      // Non-fatal
    }

    const { error } = await supabaseAdmin.from('villa_photos').delete().eq('id', photoId);

    if (error) {
      return Response.json({ ok: false, message: 'ფოტოს წაშლა ვერ მოხერხდა' }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
