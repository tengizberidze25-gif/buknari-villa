import crypto from 'crypto';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

function safeCompare(a, b) {
  // Compare HMAC digests (fixed length) instead of raw strings,
  // so string length differences can't leak timing information.
  const key = 'admin-login-compare';
  const digestA = crypto.createHmac('sha256', key).update(String(a)).digest();
  const digestB = crypto.createHmac('sha256', key).update(String(b)).digest();
  return crypto.timingSafeEqual(digestA, digestB);
}

export async function POST(request) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return Response.json({ ok: false, message: 'სერვერის კონფიგურაცია არასრულია' }, { status: 500 });
    }

    // Lockout: max 5 failed attempts per 15 minutes
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: recentFails } = await supabaseAdmin
      .from('security_attempts')
      .select('id')
      .eq('key', 'admin_login_fail')
      .gte('created_at', fifteenMinAgo);

    if (recentFails && recentFails.length >= 5) {
      return Response.json(
        { ok: false, message: 'ძალიან ბევრი მცდელობა, სცადეთ 15 წუთში' },
        { status: 429 }
      );
    }

    if (!password || !safeCompare(password, adminPassword)) {
      await supabaseAdmin.from('security_attempts').insert({ key: 'admin_login_fail' });
      return Response.json({ ok: false, message: 'პაროლი არასწორია' }, { status: 401 });
    }

    const secret = process.env.SESSION_SECRET;
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
    const payload = `admin.${expiresAt}`;
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const token = Buffer.from(`${payload}.${signature}`).toString('base64');

    return Response.json({ ok: true, token });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
