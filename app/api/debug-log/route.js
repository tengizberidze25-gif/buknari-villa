import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function POST(request) {
  try {
    const body = await request.json();
    await supabaseAdmin.from('security_attempts').insert({
      key: `clienterror:${JSON.stringify(body).slice(0, 400)}`,
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false });
  }
}

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from('security_attempts')
      .select('key, created_at')
      .like('key', 'clienterror:%')
      .order('created_at', { ascending: false })
      .limit(20);

    const html = `<pre style="white-space:pre-wrap;font-family:monospace;padding:20px;">${(data || [])
      .map((r) => `${r.created_at}\n${r.key}\n\n`)
      .join('')}</pre>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (e) {
    return new Response('error: ' + String(e), { headers: { 'Content-Type': 'text/plain' } });
  }
}
