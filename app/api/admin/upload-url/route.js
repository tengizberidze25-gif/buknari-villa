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
    const { token, villaId, filename, sortOrder } = await request.json();

    if (!token || !verifyAdminToken(token)) {
      return Response.json({ ok: false, message: 'ავტორიზაცია საჭიროა' }, { status: 401 });
    }
    if (!villaId || !filename) {
      return Response.json({ ok: false, message: 'არასრული მოთხოვნა' }, { status: 400 });
    }

    const { data: villa } = await supabaseAdmin.from('villas').select('id').eq('id', villaId).single();
    if (!villa) {
      return Response.json({ ok: false, message: 'ვილა ვერ მოიძებნა' }, { status: 404 });
    }

    const ext = (filename.split('.').pop() || '').toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
    if (!allowedExtensions.includes(ext)) {
      return Response.json(
        { ok: false, message: 'დაშვებულია მხოლოდ სურათის ფაილები (jpg, png, webp, heic)' },
        { status: 400 }
      );
    }

    const path = `${villaId}/${Date.now()}-${sortOrder ?? 0}.${ext}`;

    const { data, error } = await supabaseAdmin.storage.from('villa-photos').createSignedUploadUrl(path);

    if (error || !data) {
      return Response.json({ ok: false, message: 'ატვირთვის ბმულის შექმნა ვერ მოხერხდა' }, { status: 500 });
    }

    return Response.json({ ok: true, path, token: data.token, signedUrl: data.signedUrl });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
