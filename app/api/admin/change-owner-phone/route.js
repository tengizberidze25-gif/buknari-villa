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

function normalizeSmsPhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.indexOf('995') === 0) digits = digits.substring(3);
  if (digits.length !== 9) return '';
  return '995' + digits;
}

export async function POST(request) {
  try {
    const { token, oldPhone, newPhone } = await request.json();

    if (!token || !verifyAdminToken(token)) {
      return Response.json({ ok: false, message: 'ავტორიზაცია საჭიროა' }, { status: 401 });
    }

    const normalizedOld = normalizeSmsPhone(oldPhone);
    const normalizedNew = normalizeSmsPhone(newPhone);

    if (!normalizedOld || !normalizedNew) {
      return Response.json({ ok: false, message: 'ტელეფონის ნომერი არასწორია' }, { status: 400 });
    }
    if (normalizedOld === normalizedNew) {
      return Response.json({ ok: false, message: 'ახალი ნომერი იგივეა, რაც ძველი' }, { status: 400 });
    }

    const { data: owner } = await supabaseAdmin
      .from('owners')
      .select('id, phone, full_name')
      .eq('phone', normalizedOld)
      .single();

    if (!owner) {
      return Response.json({ ok: false, message: 'ამ ნომრით მფლობელი ვერ მოიძებნა' }, { status: 404 });
    }

    // Make sure the new number isn't already used by a different owner
    const { data: collision } = await supabaseAdmin
      .from('owners')
      .select('id')
      .eq('phone', normalizedNew)
      .neq('id', owner.id)
      .maybeSingle();

    if (collision) {
      return Response.json({ ok: false, message: 'ეს ახალი ნომერი უკვე სხვა მფლობელზეა რეგისტრირებული' }, { status: 409 });
    }

    const { error } = await supabaseAdmin
      .from('owners')
      .update({ phone: normalizedNew })
      .eq('id', owner.id);

    if (error) {
      return Response.json({ ok: false, message: 'ნომრის განახლება ვერ მოხერხდა' }, { status: 500 });
    }

    return Response.json({ ok: true, ownerName: owner.full_name || null });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
