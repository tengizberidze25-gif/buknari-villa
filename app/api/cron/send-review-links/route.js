import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import crypto from 'crypto';

function normalizeSmsPhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.indexOf('995') === 0) digits = digits.substring(3);
  if (digits.length !== 9) return '';
  return '995' + digits;
}

function generateReferralCode() {
  // Short, URL-safe, unguessable — never derived from the phone number.
  return crypto.randomBytes(5).toString('base64url');
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
          ReportLabel: 'Buknari Villa Review Request',
        },
        Receivers: [{ Receiver: phone }],
      }),
    });
  } catch (e) {
    // Best-effort
  }
}

export async function GET(request) {
  // Verify this request is really coming from Vercel Cron (not a random visitor)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);

    // Confirmed bookings whose checkout date has already passed and haven't been asked for a review yet
    const { data: bookings, error } = await supabaseAdmin
      .from('villa_bookings')
      .select('id, check_out, guest_phone, villas(title)')
      .eq('status', 'confirmed')
      .eq('review_sms_sent', false)
      .lt('check_out', today);

    if (error) {
      return Response.json({ ok: false, message: error.message }, { status: 500 });
    }

    let sentCount = 0;

    const { data: referralSetting } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'referral_discount_pct')
      .maybeSingle();
    const referralDiscountPct = referralSetting?.value ? Number(referralSetting.value) : 10;

    for (const booking of bookings || []) {
      const normalized = normalizeSmsPhone(booking.guest_phone);
      if (normalized) {
        const secret = process.env.SESSION_SECRET;
        const reviewToken = crypto.createHmac('sha256', secret).update(booking.id).digest('hex');
        const reviewUrl = `https://buknarivilla.ge/review/${booking.id}?t=${reviewToken}`;

        // Issue a fresh, opaque referral code now that the stay is confirmed
        // and actually completed — this is the only point a shareable link
        // is created, which keeps the reward program abuse-resistant.
        const referralCode = generateReferralCode();
        await supabaseAdmin.from('referral_codes').insert({
          code: referralCode,
          phone: normalized,
          booking_id: booking.id,
        });
        const referralUrl = `https://buknarivilla.ge/?ref=${referralCode}`;

        await sendSms(
          normalized,
          `როგორი იყო თქვენი დასვენება "${booking.villas?.title || ''}"-ში? დაგვეხმარეთ სხვა სტუმრებს, დატოვეთ შეფასება: ${reviewUrl}\n\nგააზიარეთ Buknari Villa მეგობრებთან და მიიღეთ ${referralDiscountPct}% ფასდაკლება შემდეგ ჯავშანზე: ${referralUrl}`
        );
        sentCount++;
      }

      await supabaseAdmin.from('villa_bookings').update({ review_sms_sent: true }).eq('id', booking.id);
    }

    return Response.json({ ok: true, checked: (bookings || []).length, sent: sentCount });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
