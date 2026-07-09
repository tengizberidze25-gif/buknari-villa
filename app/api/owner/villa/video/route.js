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

async function verifyOwnership(villaId, ownerId) {
  const { data: villa } = await supabaseAdmin
    .from('villas')
    .select('id, owner_id, video_path')
    .eq('id', villaId)
    .single();

  if (!villa || villa.owner_id !== ownerId) return null;
  return villa;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { ownerId, token, villaId, action } = body;

    if (!ownerId || !token || !verifyToken(token, ownerId)) {
      return Response.json({ ok: false, message: 'სესია ამოიწურა' }, { status: 401 });
    }
    if (!villaId) {
      return Response.json({ ok: false, message: 'არასრული მოთხოვნა' }, { status: 400 });
    }

    const villa = await verifyOwnership(villaId, ownerId);
    if (!villa) {
      return Response.json({ ok: false, message: 'წვდომა უარყოფილია' }, { status: 403 });
    }

    if (action === 'get-upload-url') {
      const { filename } = body;
      if (!filename) {
        return Response.json({ ok: false, message: 'ფაილის სახელი აუცილებელია' }, { status: 400 });
      }

      const extMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
      const ext = extMatch ? extMatch[1] : 'mp4';
      const path = `${villaId}/${Date.now()}.${ext}`;

      const { data, error } = await supabaseAdmin.storage
        .from('villa-videos')
        .createSignedUploadUrl(path);

      if (error) {
        return Response.json({ ok: false, message: 'ატვირთვის ბმულის შექმნა ვერ მოხერხდა' }, { status: 500 });
      }
      return Response.json({ ok: true, path, token: data.token });
    }

    if (action === 'confirm') {
      const { path } = body;
      if (!path) {
        return Response.json({ ok: false, message: 'არასრული მოთხოვნა' }, { status: 400 });
      }

      // Remove the previous video file, if there was one, to avoid orphaned storage
      if (villa.video_path) {
        await supabaseAdmin.storage.from('villa-videos').remove([villa.video_path]);
      }

      const { data: publicUrlData } = supabaseAdmin.storage.from('villa-videos').getPublicUrl(path);
      const publicUrl = publicUrlData.publicUrl;

      const { error } = await supabaseAdmin
        .from('villas')
        .update({ video_url: publicUrl, video_path: path })
        .eq('id', villaId);

      if (error) {
        return Response.json({ ok: false, message: 'ვიდეოს შენახვა ვერ მოხერხდა' }, { status: 500 });
      }
      return Response.json({ ok: true, url: publicUrl });
    }

    if (action === 'delete') {
      if (villa.video_path) {
        await supabaseAdmin.storage.from('villa-videos').remove([villa.video_path]);
      }
      const { error } = await supabaseAdmin
        .from('villas')
        .update({ video_url: null, video_path: null })
        .eq('id', villaId);

      if (error) {
        return Response.json({ ok: false, message: 'წაშლა ვერ მოხერხდა' }, { status: 500 });
      }
      return Response.json({ ok: true });
    }

    return Response.json({ ok: false, message: 'უცნობი მოქმედება' }, { status: 400 });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
