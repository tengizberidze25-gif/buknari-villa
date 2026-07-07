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
    const { token, action, name, id } = await request.json();
    if (!token || !verifyAdminToken(token)) {
      return Response.json({ ok: false, message: 'ავტორიზაცია საჭიროა' }, { status: 401 });
    }

    if (action === 'add') {
      const cleanName = (name || '').toString().trim();
      if (!cleanName) {
        return Response.json({ ok: false, message: 'სახელი აუცილებელია' }, { status: 400 });
      }
      const { data: maxRow } = await supabaseAdmin
        .from('villages')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();
      const nextOrder = (maxRow?.sort_order || 0) + 1;

      const { error } = await supabaseAdmin
        .from('villages')
        .insert({ name: cleanName, sort_order: nextOrder });

      if (error) {
        return Response.json({ ok: false, message: 'დამატება ვერ მოხერხდა (შესაძლოა უკვე არსებობს)' }, { status: 500 });
      }
      return Response.json({ ok: true });
    }

    if (action === 'delete') {
      if (!id) {
        return Response.json({ ok: false, message: 'ID აუცილებელია' }, { status: 400 });
      }
      const { error } = await supabaseAdmin.from('villages').delete().eq('id', id);
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
