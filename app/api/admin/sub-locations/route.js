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
    const body = await request.json();
    const { token, action } = body;

    if (!token || !verifyAdminToken(token)) {
      return Response.json({ ok: false, message: 'ავტორიზაცია საჭიროა' }, { status: 401 });
    }

    if (action === 'list') {
      const { data, error } = await supabaseAdmin
        .from('sub_locations')
        .select('id, village, name, sort_order')
        .order('village', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) {
        return Response.json({ ok: false, message: 'ჩატვირთვა ვერ მოხერხდა' }, { status: 500 });
      }
      return Response.json({ ok: true, subLocations: data });
    }

    if (action === 'add') {
      const { village, name } = body;
      const cleanVillage = (village || '').toString().trim();
      const cleanName = (name || '').toString().trim();
      if (!cleanVillage || !cleanName) {
        return Response.json({ ok: false, message: 'ყველა ველი აუცილებელია' }, { status: 400 });
      }

      const { data: maxRow } = await supabaseAdmin
        .from('sub_locations')
        .select('sort_order')
        .eq('village', cleanVillage)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();
      const nextOrder = (maxRow?.sort_order || 0) + 1;

      const { error } = await supabaseAdmin
        .from('sub_locations')
        .insert({ village: cleanVillage, name: cleanName, sort_order: nextOrder });

      if (error) {
        return Response.json({ ok: false, message: 'დამატება ვერ მოხერხდა' }, { status: 500 });
      }
      return Response.json({ ok: true });
    }

    if (action === 'delete') {
      const { id } = body;
      if (!id) {
        return Response.json({ ok: false, message: 'ID აუცილებელია' }, { status: 400 });
      }
      const { error } = await supabaseAdmin.from('sub_locations').delete().eq('id', id);
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
