import { supabaseAdmin } from '../../../lib/supabaseAdmin';
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

  const langName = targetLang === 'en' ? 'English' : 'Russian';

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
    const formData = await request.formData();

    const ownerId = formData.get('ownerId');
    const token = formData.get('token');

    if (!ownerId || !token || !verifyToken(token, ownerId)) {
      return Response.json({ ok: false, message: 'სესია ამოიწურა, გთხოვთ ხელახლა შეხვიდეთ' }, { status: 401 });
    }

    const title = (formData.get('title') || '').toString().trim();
    const description = (formData.get('description') || '').toString().trim();
    const locationName = (formData.get('location_name') || '').toString().trim();
    const pricePerNight = Number(formData.get('price_per_night')) || null;
    const maxGuests = Number(formData.get('max_guests')) || null;
    const bedrooms = Number(formData.get('bedrooms')) || null;
    const bathrooms = Number(formData.get('bathrooms')) || null;
    const contactPhone = (formData.get('contact_phone') || '').toString().trim();
    const contactWhatsapp = (formData.get('contact_whatsapp') || '').toString().trim();

    if (!title || !pricePerNight) {
      return Response.json({ ok: false, message: 'გთხოვთ შეავსოთ სავალდებულო ველები' }, { status: 400 });
    }

    // Create the villa row first (status pending — admin must approve)
    const { data: villa, error: villaError } = await supabaseAdmin
      .from('villas')
      .insert({
        owner_id: ownerId,
        title,
        description,
        location_name: locationName,
        price_per_night: pricePerNight,
        max_guests: maxGuests,
        bedrooms,
        bathrooms,
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

    // Upload photos
    const photos = formData.getAll('photos');
    let sortOrder = 0;

    for (const photo of photos) {
      if (!photo || typeof photo === 'string') continue;
      const bytes = await photo.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = photo.name.split('.').pop() || 'jpg';
      const path = `${villa.id}/${Date.now()}-${sortOrder}.${ext}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('villa-photos')
        .upload(path, buffer, { contentType: photo.type });

      if (!uploadError) {
        const { data: publicUrlData } = supabaseAdmin.storage
          .from('villa-photos')
          .getPublicUrl(path);

        await supabaseAdmin.from('villa_photos').insert({
          villa_id: villa.id,
          url: publicUrlData.publicUrl,
          sort_order: sortOrder,
        });
        sortOrder++;
      }
    }

    // Translate title + description (best effort, does not block success)
    const [titleEn, titleRu, descEn, descRu] = await Promise.all([
      translateText(title, 'en'),
      translateText(title, 'ru'),
      translateText(description, 'en'),
      translateText(description, 'ru'),
    ]);

    await supabaseAdmin
      .from('villas')
      .update({
        title_en: titleEn,
        title_ru: titleRu,
        description_en: descEn,
        description_ru: descRu,
        translation_status: titleEn || descEn ? 'done' : 'failed',
      })
      .eq('id', villa.id);

    return Response.json({ ok: true, villaId: villa.id });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
