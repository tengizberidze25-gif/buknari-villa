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
        .from('village_videos')
        .select('id, village, url, sort_order, created_at')
        .order('village', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) {
        return Response.json({ ok: false, message: 'ჩატვირთვა ვერ მოხერხდა' }, { status: 500 });
      }
      return Response.json({ ok: true, videos: data });
    }

    if (action === 'get-upload-url') {
      const { village, filename } = body;
      if (!village || !filename) {
        return Response.json({ ok: false, message: 'არასრული მოთხოვნა' }, { status: 400 });
      }

      const VILLAGE_SLUGS = {
        'ბუკნარი': 'buknari',
        'ჩაქვი': 'chakvi',
        'ციხისძირი': 'tsikhisdziri',
      };
      const safeVillage = VILLAGE_SLUGS[village] || village.replace(/[^a-zA-Z0-9_-]/g, '') || 'location';

      const extMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
      const ext = extMatch ? extMatch[1] : 'mp4';
      const path = `${safeVillage}/${Date.now()}.${ext}`;

      const { data, error } = await supabaseAdmin.storage
        .from('village-videos')
        .createSignedUploadUrl(path);

      if (error) {
        return Response.json({ ok: false, message: 'ატვირთვის ბმულის შექმნა ვერ მოხერხდა' }, { status: 500 });
      }
      return Response.json({ ok: true, path, token: data.token });
    }

    if (action === 'confirm') {
      const { village, path } = body;
      if (!village || !path) {
        return Response.json({ ok: false, message: 'არასრული მოთხოვნა' }, { status: 400 });
      }

      const { data: publicUrlData } = supabaseAdmin.storage.from('village-videos').getPublicUrl(path);
      const publicUrl = publicUrlData.publicUrl;

      const { data: maxRow } = await supabaseAdmin
        .from('village_videos')
        .select('sort_order')
        .eq('village', village)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();
      const nextOrder = (maxRow?.sort_order || 0) + 1;

      const { error } = await supabaseAdmin
        .from('village_videos')
        .insert({ village, url: publicUrl, sort_order: nextOrder });

      if (error) {
        return Response.json({ ok: false, message: 'ვიდეოს დამატება ვერ მოხერხდა' }, { status: 500 });
      }
      return Response.json({ ok: true });
    }

    if (action === 'reorder') {
      const { id, sort_order } = body;
      if (!id || sort_order === undefined) {
        return Response.json({ ok: false, message: 'არასრული მოთხოვნა' }, { status: 400 });
      }
      const { error } = await supabaseAdmin
        .from('village_videos')
        .update({ sort_order })
        .eq('id', id);

      if (error) {
        return Response.json({ ok: false, message: 'დალაგება ვერ მოხერხდა' }, { status: 500 });
      }
      return Response.json({ ok: true });
    }

    if (action === 'delete') {
      const { id } = body;
      if (!id) {
        return Response.json({ ok: false, message: 'ID აუცილებელია' }, { status: 400 });
      }
      const { error } = await supabaseAdmin.from('village_videos').delete().eq('id', id);
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
