import { supabaseAdmin } from '../../../lib/supabaseAdmin';
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
    const { ownerId, token, villaId, filename, sortOrder } = await request.json();

    if (!ownerId || !token || !verifyToken(token, ownerId)) {
      return Response.json({ ok: false, message: 'სესია ამოიწურა' }, { status: 401 });
    }
    if (!villaId || !filename) {
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

    const ext = (filename.split('.').pop() || 'jpg').toLowerCase();
    const path = `${villaId}/${Date.now()}-${sortOrder ?? 0}.${ext}`;

    const { data, error } = await supabaseAdmin.storage
      .from('villa-photos')
      .createSignedUploadUrl(path);

    if (error || !data) {
      return Response.json({ ok: false, message: 'ატვირთვის ბმულის შექმნა ვერ მოხერხდა' }, { status: 500 });
    }

    return Response.json({
      ok: true,
      path,
      token: data.token,
      signedUrl: data.signedUrl,
    });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
