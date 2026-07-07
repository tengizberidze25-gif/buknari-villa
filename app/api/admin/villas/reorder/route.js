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
    const { token, id, sort_order } = await request.json();
    if (!token || !verifyAdminToken(token)) {
      return Response.json({ ok: false, message: 'ავტორიზაცია საჭიროა' }, { status: 401 });
    }
    if (!id || sort_order === undefined) {
      return Response.json({ ok: false, message: 'არასრული მოთხოვნა' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('villas')
      .update({ sort_order })
      .eq('id', id);

    if (error) {
      return Response.json({ ok: false, message: 'დალაგება ვერ მოხერხდა' }, { status: 500 });
    }
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
