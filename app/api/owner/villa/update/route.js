import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
import crypto from 'crypto';

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
    const { ownerId, token, villaId } = body;

    if (!ownerId || !token || !verifyToken(token, ownerId)) {
      return Response.json({ ok: false, message: 'სესია ამოიწურა' }, { status: 401 });
    }
    if (!villaId) {
      return Response.json({ ok: false, message: 'არასრული მოთხოვნა' }, { status: 400 });
    }

    // Confirm ownership before touching anything
    const { data: existing } = await supabaseAdmin
      .from('villas')
      .select('id, owner_id')
      .eq('id', villaId)
      .single();

    if (!existing || existing.owner_id !== ownerId) {
      return Response.json({ ok: false, message: 'წვდომა უარყოფილია' }, { status: 403 });
    }

    const title = (body.title || '').toString().trim();
    const description = (body.description || '').toString().trim();
    const locationName = (body.location_name || '').toString().trim();
    const village = (body.village || '').toString().trim();
    const lat = body.lat ? Number(body.lat) : null;
    const lng = body.lng ? Number(body.lng) : null;
    const pricePerNight = Number(body.price_per_night) || null;
    const minNights = Number(body.min_nights) || null;
    const highSeasonPrice = Number(body.high_season_price) || null;
    const highSeasonStart = (body.high_season_start || '').toString().trim() || null;
    const highSeasonEnd = (body.high_season_end || '').toString().trim() || null;
    const maxGuests = Number(body.max_guests) || null;
    const bedrooms = Number(body.bedrooms) || null;
    const bathrooms = Number(body.bathrooms) || null;
    const distanceCenterM = Number(body.distance_center_m) || null;
    const distanceSeaM = Number(body.distance_sea_m) || null;
    const nearbyFood = (body.nearby_food || '').toString().trim();
    const nearbyShops = (body.nearby_shops || '').toString().trim();
    const checkinTime = (body.checkin_time || '').toString().trim();
    const checkoutTime = (body.checkout_time || '').toString().trim();
    const cancellationPolicy = (body.cancellation_policy || '').toString().trim();
    const houseRules = (body.house_rules || '').toString().trim();
    const faq = (body.faq || '').toString().trim();
    const amenities = Array.isArray(body.amenities) ? body.amenities : [];
    const contactPhone = (body.contact_phone || '').toString().trim();
    const contactWhatsapp = (body.contact_whatsapp || '').toString().trim();

    if (!title || !pricePerNight) {
      return Response.json({ ok: false, message: 'გთხოვთ შეავსოთ სავალდებულო ველები' }, { status: 400 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('villas')
      .update({
        title,
        description,
        location_name: locationName,
        village,
        lat,
        lng,
        price_per_night: pricePerNight,
        min_nights: minNights,
        high_season_price: highSeasonPrice,
        high_season_start: highSeasonStart,
        high_season_end: highSeasonEnd,
        max_guests: maxGuests,
        bedrooms,
        bathrooms,
        distance_center_m: distanceCenterM,
        distance_sea_m: distanceSeaM,
        nearby_food: nearbyFood,
        nearby_shops: nearbyShops,
        checkin_time: checkinTime,
        checkout_time: checkoutTime,
        cancellation_policy: cancellationPolicy,
        house_rules: houseRules,
        faq,
        amenities,
        contact_phone: contactPhone,
        contact_whatsapp: contactWhatsapp,
        translation_status: 'pending',
      })
      .eq('id', villaId);

    if (updateError) {
      return Response.json({ ok: false, message: 'ვილის განახლება ვერ მოხერხდა' }, { status: 500 });
    }

    // Re-translate in the background (best effort) since the text may have changed
    translateText(title, 'en')
      .then(async (titleEn) => {
        const [
          titleRu, titleHy, descEn, descRu, descHy, locEn, locRu, locHy,
          foodEn, foodRu, foodHy, shopsEn, shopsRu, shopsHy,
          cancelEn, cancelRu, cancelHy, rulesEn, rulesRu, rulesHy,
          faqEn, faqRu, faqHy,
        ] = await Promise.all([
          translateText(title, 'ru'),
          translateText(title, 'hy'),
          translateText(description, 'en'),
          translateText(description, 'ru'),
          translateText(description, 'hy'),
          translateText(locationName, 'en'),
          translateText(locationName, 'ru'),
          translateText(locationName, 'hy'),
          translateText(nearbyFood, 'en'),
          translateText(nearbyFood, 'ru'),
          translateText(nearbyFood, 'hy'),
          translateText(nearbyShops, 'en'),
          translateText(nearbyShops, 'ru'),
          translateText(nearbyShops, 'hy'),
          translateText(cancellationPolicy, 'en'),
          translateText(cancellationPolicy, 'ru'),
          translateText(cancellationPolicy, 'hy'),
          translateText(houseRules, 'en'),
          translateText(houseRules, 'ru'),
          translateText(houseRules, 'hy'),
          translateText(faq, 'en'),
          translateText(faq, 'ru'),
          translateText(faq, 'hy'),
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
            nearby_food_en: foodEn,
            nearby_food_ru: foodRu,
            nearby_food_hy: foodHy,
            nearby_shops_en: shopsEn,
            nearby_shops_ru: shopsRu,
            nearby_shops_hy: shopsHy,
            cancellation_policy_en: cancelEn,
            cancellation_policy_ru: cancelRu,
            cancellation_policy_hy: cancelHy,
            house_rules_en: rulesEn,
            house_rules_ru: rulesRu,
            house_rules_hy: rulesHy,
            faq_en: faqEn,
            faq_ru: faqRu,
            faq_hy: faqHy,
            translation_status: titleEn || descEn ? 'done' : 'failed',
          })
          .eq('id', villaId);
      })
      .catch(() => {});

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
