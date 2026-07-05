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
    const { ownerId, token, villaId } = await request.json();

    if (!ownerId || !token || !verifyToken(token, ownerId)) {
      return Response.json({ ok: false, message: 'სესია ამოიწურა' }, { status: 401 });
    }
    if (!villaId) {
      return Response.json({ ok: false, message: 'არასრული მოთხოვნა' }, { status: 400 });
    }

    const { data: villa } = await supabaseAdmin
      .from('villas')
      .select('id, owner_id')
      .eq('id', villaId)
      .single();

    if (!villa || villa.owner_id !== ownerId) {
      return Response.json({ ok: false, message: 'წვდომა უარყოფილია' }, { status: 403 });
    }

    // Best-effort cleanup of dependent rows (in case there's no DB cascade configured)
    await supabaseAdmin.from('villa_photos').delete().eq('villa_id', villaId);
    await supabaseAdmin.from('villa_bookings').delete().eq('villa_id', villaId);
    await supabaseAdmin.from('villa_reviews').delete().eq('villa_id', villaId);

    // Best-effort cleanup of the storage folder for this villa's photos
    try {
      const { data: files } = await supabaseAdmin.storage.from('villa-photos').list(villaId);
      if (files && files.length > 0) {
        const paths = files.map((f) => `${villaId}/${f.name}`);
        await supabaseAdmin.storage.from('villa-photos').remove(paths);
      }
    } catch (e) {
      // Non-fatal — orphaned storage files can be cleaned up later
    }

    const { error: deleteError } = await supabaseAdmin.from('villas').delete().eq('id', villaId);

    if (deleteError) {
      return Response.json({ ok: false, message: 'ვილის წაშლა ვერ მოხერხდა' }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
