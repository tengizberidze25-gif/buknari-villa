import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import crypto from 'crypto';

function normalizeSmsPhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.indexOf('995') === 0) digits = digits.substring(3);
  if (digits.length !== 9) return '';
  return '995' + digits;
}

export async function POST(request) {
  try {
    const { phone, code } = await request.json();
    const normalized = normalizeSmsPhone(phone);

    if (!normalized || !code) {
      return Response.json({ ok: false, message: 'არასწორი მონაცემები' }, { status: 400 });
    }

    const { data: rows, error } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('phone', normalized)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !rows || rows.length === 0) {
      return Response.json(
        { ok: false, message: 'კოდი ვერ მოიძებნა, მოითხოვეთ ახალი' },
        { status: 400 }
      );
    }

    const otp = rows[0];

    if (new Date(otp.expires_at) < new Date()) {
      return Response.json({ ok: false, message: 'კოდს ვადა გაუვიდა' }, { status: 400 });
    }

    if (otp.attempts >= 5) {
      return Response.json(
        { ok: false, message: 'ძალიან ბევრი მცდელობა, მოითხოვეთ ახალი კოდი' },
        { status: 429 }
      );
    }

    if (otp.code !== String(code).trim()) {
      await supabaseAdmin
        .from('otp_codes')
        .update({ attempts: otp.attempts + 1 })
        .eq('id', otp.id);
      return Response.json({ ok: false, message: 'კოდი არასწორია' }, { status: 400 });
    }

    // Mark this OTP as verified
    await supabaseAdmin.from('otp_codes').update({ verified: true }).eq('id', otp.id);

    // Find or create the owner
    const { data: existingOwners } = await supabaseAdmin
      .from('owners')
      .select('*')
      .eq('phone', normalized)
      .limit(1);

    let owner = existingOwners && existingOwners[0];

    if (!owner) {
      const { data: created, error: createError } = await supabaseAdmin
        .from('owners')
        .insert({ phone: normalized })
        .select()
        .single();

      if (createError) {
        return Response.json({ ok: false, message: 'მფლობელის შექმნა ვერ მოხერხდა' }, { status: 500 });
      }
      owner = created;
    }

    // Issue a simple signed session token (HMAC), valid 30 days
    const secret = process.env.SESSION_SECRET;
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const payload = `${owner.id}.${expiresAt}`;
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const token = Buffer.from(`${payload}.${signature}`).toString('base64');

    return Response.json({ ok: true, ownerId: owner.id, token });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
