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

async function translateText(text, targetLang) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !text) return null;

  const langNames = { en: 'English', ru: 'Russian', hy: 'Armenian' };
  const langName = langNames[targetLang] || 'English';

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `Translate the following Georgian real-estate location name into natural, tourist-friendly ${langName}. Reply with ONLY the translation, no preamble, no quotes:\n\n${text}`,
          },
        ],
      }),
    });
    const data = await res.json();
    return data?.content?.[0]?.text?.trim() || null;
  } catch (e) {
    return null;
  }
}

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token || !verifyAdminToken(token)) {
      return Response.json({ ok: false, message: 'ავტორიზაცია საჭიროა' }, { status: 401 });
    }

    const { data: villas, error } = await supabaseAdmin
      .from('villas')
      .select('id, location_name, location_name_en')
      .not('location_name', 'is', null)
      .is('location_name_en', null);

    if (error) {
      return Response.json({ ok: false, message: 'ვილების წამოღება ვერ მოხერხდა' }, { status: 500 });
    }

    let processed = 0;
    for (const villa of villas || []) {
      if (!villa.location_name || !villa.location_name.trim()) continue;
      const [en, ru, hy] = await Promise.all([
        translateText(villa.location_name, 'en'),
        translateText(villa.location_name, 'ru'),
        translateText(villa.location_name, 'hy'),
      ]);
      await supabaseAdmin
        .from('villas')
        .update({ location_name_en: en, location_name_ru: ru, location_name_hy: hy })
        .eq('id', villa.id);
      processed += 1;
    }

    return Response.json({ ok: true, processed, total: (villas || []).length });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
