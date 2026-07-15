import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
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

export async function POST(request) {
  try {
    const body = await request.json();
    const { token, villaId } = body;

    if (!token || !verifyAdminToken(token)) {
      return Response.json({ ok: false, message: 'ავტორიზაცია საჭიროა' }, { status: 401 });
    }
    if (!villaId) {
      return Response.json({ ok: false, message: 'არასრული მოთხოვნა' }, { status: 400 });
    }

    const title = (body.title || '').toString().trim();
    const description = (body.description || '').toString().trim();
    const village = (body.village || '').toString().trim();
    const locationName = (body.location_name || '').toString().trim();
    const lat = body.lat ? Number(body.lat) : null;
    const lng = body.lng ? Number(body.lng) : null;
    const pricePerNight = Number(body.price_per_night) || null;
    const minNights = Number(body.min_nights) || null;
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

    const { error } = await supabaseAdmin
      .from('villas')
      .update({
        title,
        description,
        village,
        location_name: locationName,
        lat,
        lng,
        price_per_night: pricePerNight,
        min_nights: minNights,
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
      })
      .eq('id', villaId);

    if (error) {
      return Response.json({ ok: false, message: 'ვილის განახლება ვერ მოხერხდა' }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
