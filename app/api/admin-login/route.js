import crypto from 'crypto';

export async function POST(request) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword || password !== adminPassword) {
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
