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
    const { token, villaId } = await request.json();
    if (!token || !verifyAdminToken(token)) {
      return Response.json({ ok: false, message: 'ავტორიზაცია საჭიროა' }, { status: 401 });
    }
    if (!villaId) {
      return Response.json({ ok: false, message: 'villaId აუცილებელია' }, { status: 400 });
    }

    const { data: villa, error } = await supabaseAdmin
      .from('villas')
      .select('*, villa_photos(id, url, sort_order)')
      .eq('id', villaId)
      .single();

    if (error || !villa) {
      return Response.json({ ok: false, message: 'ვილა ვერ მოიძებნა' }, { status: 404 });
    }

    return Response.json({ ok: true, villa });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
