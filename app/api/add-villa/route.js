import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import crypto from 'crypto';

function normalizeSmsPhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.indexOf('995') === 0) digits = digits.substring(3);
  if (digits.length !== 9) return '';
  return '995' + digits;
}

async function sendSms(phone, text) {
  const publicKey = process.env.BULKSMS_PUBLIC_KEY;
  const privateKey = process.env.BULKSMS_API_TOKEN;
  const sender = process.env.BULKSMS_SENDER || 'BUKNARI';

  const url =
    'https://api.bulksms.ge/gateway/api/sms/v1/message/send?publicKey=' +
    encodeURIComponent(publicKey);

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + privateKey,
      },
      body: JSON.stringify({
        Text: text,
        Purpose: 'INF',
        Options: {
          Originator: sender,
          Encoding: 'UNICODE',
          SmsType: 'SMS',
          ReportLabel: 'Buknari Villa Admin',
        },
        Receivers: [{ Receiver: phone }],
      }),
    });
  } catch (e) {
    // Best-effort
  }
}

function verifyToken(token, ownerId) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split('.');
    const signature = parts.pop();
    const payload = parts.join('.');
    const [tokenOwnerId, expiresAt] = payload.split('.');

    if (tokenOwnerId !== ownerId) return false;
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
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `Translate the following Georgian real-estate listing text into natural, tourist-friendly ${langName}. Reply with ONLY the translation, no preamble, no quotes:\n\n${text}`,
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
    const body = await request.json();
    const { ownerId, token } = body;

    if (!ownerId || !token || !verifyToken(token, ownerId)) {
      return Response.json({ ok: false, message: 'სესია ამოიწურა, გთხოვთ ხელახლა შეხვიდეთ' }, { status: 401 });
    }

    const title = (body.title || '').toString().trim();
    const description = (body.description || '').toString().trim();
    const locationName = (body.location_name || '').toString().trim();
    const lat = body.lat ? Number(body.lat) : null;
    const lng = body.lng ? Number(body.lng) : null;
    const pricePerNight = Number(body.price_per_night) || null;
    const maxGuests = Number(body.max_guests) || null;
    const bedrooms = Number(body.bedrooms) || null;
    const bathrooms = Number(body.bathrooms) || null;
    const amenities = Array.isArray(body.amenities) ? body.amenities : [];
    const contactPhone = (body.contact_phone || '').toString().trim();
    const contactWhatsapp = (body.contact_whatsapp || '').toString().trim();

    if (!title || !pricePerNight) {
      return Response.json({ ok: false, message: 'გთხოვთ შეავსოთ სავალდებულო ველები' }, { status: 400 });
    }

    // Create the villa row (status pending — admin must approve)
    const { data: villa, error: villaError } = await supabaseAdmin
      .from('villas')
      .insert({
        owner_id: ownerId,
        title,
        description,
        location_name: locationName,
        lat,
        lng,
        price_per_night: pricePerNight,
        max_guests: maxGuests,
        bedrooms,
        bathrooms,
        amenities,
        contact_phone: contactPhone,
        contact_whatsapp: contactWhatsapp,
        status: 'pending',
        translation_status: 'pending',
      })
      .select()
      .single();

    if (villaError || !villa) {
      return Response.json({ ok: false, message: 'ვილის შენახვა ვერ მოხერხდა' }, { status: 500 });
    }

    // Notify the admin by SMS that a new villa needs review (best-effort)
    const adminPhone = normalizeSmsPhone(process.env.ADMIN_PHONE);
    if (adminPhone) {
      await sendSms(
        adminPhone,
        `ახალი ვილა დაემატა და ელოდება დამტკიცებას: "${title}" — ${locationName || '—'}, ₾${pricePerNight}/ღამე. იხილეთ: https://buknarivilla.ge/admin`
      );
    }

    // Translate title + description (best effort, does not block success)
    translateText(title, 'en')
      .then(async (titleEn) => {
        const [titleRu, titleHy, descEn, descRu, descHy] = await Promise.all([
          translateText(title, 'ru'),
          translateText(title, 'hy'),
          translateText(description, 'en'),
          translateText(description, 'ru'),
          translateText(description, 'hy'),
        ]);
        await supabaseAdmin
          .from('villas')
          .update({
            title_en: titleEn,
            title_ru: titleRu,
            title_hy: titleHy,
            description_en: descEn,
            description_ru: descRu,
            description_hy: descHy,
            translation_status: titleEn || descEn ? 'done' : 'failed',
          })
          .eq('id', villa.id);
      })
      .catch(() => {});

    return Response.json({ ok: true, villaId: villa.id });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
