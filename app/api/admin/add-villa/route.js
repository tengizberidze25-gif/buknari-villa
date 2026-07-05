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
    const { token } = body;

    if (!token || !verifyAdminToken(token)) {
      return Response.json({ ok: false, message: 'ავტორიზაცია საჭიროა' }, { status: 401 });
    }

    const ownerPhone = normalizeSmsPhone(body.ownerPhone);
    const ownerName = (body.ownerName || '').toString().trim();

    if (!ownerPhone) {
      return Response.json({ ok: false, message: 'მფლობელის ტელეფონი არასწორია' }, { status: 400 });
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

    // Find or create the owner
    const { data: existingOwners } = await supabaseAdmin
      .from('owners')
      .select('*')
      .eq('phone', ownerPhone)
      .limit(1);

    let owner = existingOwners && existingOwners[0];

    if (!owner) {
      const { data: created, error: createError } = await supabaseAdmin
        .from('owners')
        .insert({ phone: ownerPhone, full_name: ownerName || null })
        .select()
        .single();

      if (createError) {
        return Response.json({ ok: false, message: 'მფლობელის შექმნა ვერ მოხერხდა' }, { status: 500 });
      }
      owner = created;
    } else if (ownerName && !owner.full_name) {
      await supabaseAdmin.from('owners').update({ full_name: ownerName }).eq('id', owner.id);
    }

    // Create the villa — approved immediately since the admin is entering it directly
    const { data: villa, error: villaError } = await supabaseAdmin
      .from('villas')
      .insert({
        owner_id: owner.id,
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
        status: 'approved',
        translation_status: 'pending',
        is_available: true,
      })
      .select()
      .single();

    if (villaError || !villa) {
      return Response.json({ ok: false, message: 'ვილის შენახვა ვერ მოხერხდა' }, { status: 500 });
    }

    // Translate in the background (best effort)
    translateText(title, 'en')
      .then(async (titleEn) => {
        const [titleRu, titleHy, descEn, descRu, descHy, locEn, locRu, locHy] = await Promise.all([
          translateText(title, 'ru'),
          translateText(title, 'hy'),
          translateText(description, 'en'),
          translateText(description, 'ru'),
          translateText(description, 'hy'),
          translateText(locationName, 'en'),
          translateText(locationName, 'ru'),
          translateText(locationName, 'hy'),
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
            location_name_en: locEn,
            location_name_ru: locRu,
            location_name_hy: locHy,
            translation_status: titleEn || descEn ? 'done' : 'failed',
          })
          .eq('id', villa.id);
      })
      .catch(() => {});

    return Response.json({ ok: true, villaId: villa.id, ownerId: owner.id });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
