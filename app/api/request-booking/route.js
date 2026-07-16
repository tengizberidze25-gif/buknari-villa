import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import crypto from 'crypto';

function normalizeSmsPhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.indexOf('995') === 0) digits = digits.substring(3);
  if (digits.length !== 9) return '';
  return '995' + digits;
}

function generateCancelCode() {
  // Short, URL-safe random code — no login needed to use it, so length still
  // matters for security, but it doesn't need to carry a signature since it's
  // looked up directly against the one row it belongs to.
  return crypto.randomBytes(6).toString('base64url');
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
          ReportLabel: 'Buknari Villa Booking',
        },
        Receivers: [{ Receiver: phone }],
      }),
    });
  } catch (e) {
    // Best-effort — booking already succeeded even if SMS fails
  }
}

async function sendEmail(to, subject, html) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !to) return;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'Buknari Villa <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
      }),
    });
  } catch (e) {
    // Best-effort — booking already succeeded even if email fails
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const villaId = body.villaId;
    const checkIn = body.checkIn;
    const checkOut = body.checkOut;
    const guestName = (body.guestName || '').toString().trim();
    const guestPhone = (body.guestPhone || '').toString().trim();
    const guestEmail = (body.guestEmail || '').toString().trim();
    const guestMessage = (body.guestMessage || '').toString().trim();

    if (!villaId || !checkIn || !checkOut || !guestName || !guestPhone) {
      return Response.json({ ok: false, message: 'გთხოვთ შეავსოთ ყველა ველი' }, { status: 400 });
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      return Response.json({ ok: false, message: 'გამგზავრების თარიღი ჩამოსვლის შემდეგ უნდა იყოს' }, { status: 400 });
    }

    // Rate limit: max 3 booking requests per phone number per hour —
    // prevents calendar-squatting spam and SMS-cost abuse
    const normalizedForLimit = guestPhone.replace(/\D/g, '');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentAttempts } = await supabaseAdmin
      .from('security_attempts')
      .select('id')
      .eq('key', `booking:${normalizedForLimit}`)
      .gte('created_at', oneHourAgo);

    if (recentAttempts && recentAttempts.length >= 3) {
      return Response.json(
        { ok: false, message: 'ძალიან ბევრი მოთხოვნა ამ ნომრიდან, სცადეთ მოგვიანებით' },
        { status: 429 }
      );
    }

    await supabaseAdmin.from('security_attempts').insert({ key: `booking:${normalizedForLimit}` });

    // Confirm the villa exists and is approved
    const { data: villa } = await supabaseAdmin
      .from('villas')
      .select('id, title, status, owner_id, min_nights')
      .eq('id', villaId)
      .single();

    if (!villa || villa.status !== 'approved') {
      return Response.json({ ok: false, message: 'ვილა ვერ მოიძებნა' }, { status: 404 });
    }

    const nightsRequested = Math.round((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    const requiredMinNights = villa.min_nights || 1;
    if (nightsRequested < requiredMinNights) {
      return Response.json(
        { ok: false, message: `მინიმალური ჯავშნის ვადაა ${requiredMinNights} ღამე` },
        { status: 400 }
      );
    }

    // Check for overlap with existing pending/confirmed/owner_block bookings
    const { data: existing } = await supabaseAdmin
      .from('villa_bookings')
      .select('id, check_in, check_out')
      .eq('villa_id', villaId)
      .in('status', ['pending', 'confirmed', 'owner_block']);

    const overlaps = (existing || []).some(
      (b) => new Date(checkIn) < new Date(b.check_out) && new Date(checkOut) > new Date(b.check_in)
    );

    if (overlaps) {
      return Response.json({ ok: false, message: 'სამწუხაროდ, ეს თარიღები უკვე დაკავებულია' }, { status: 409 });
    }

    const { data: inserted, error } = await supabaseAdmin
      .from('villa_bookings')
      .insert({
        villa_id: villaId,
        check_in: checkIn,
        check_out: checkOut,
        guest_name: guestName,
        guest_phone: guestPhone,
        guest_email: guestEmail,
        guest_message: guestMessage,
        status: 'pending',
        cancel_code: generateCancelCode(),
      })
      .select()
      .single();

    if (error || !inserted) {
      return Response.json({ ok: false, message: 'მოთხოვნის გაგზავნა ვერ მოხერხდა' }, { status: 500 });
    }

    // Notify the owner by SMS (best-effort, doesn't block the response)
    const { data: owner } = await supabaseAdmin
      .from('owners')
      .select('phone')
      .eq('id', villa.owner_id)
      .single();

    if (owner?.phone) {
      const normalized = normalizeSmsPhone(owner.phone);
      if (normalized) {
        await sendSms(
          normalized,
          `ახალი ჯავშნის მოთხოვნა "${villa.title}" — ${checkIn} → ${checkOut}. სტუმარი: ${guestName}, ${guestPhone}. იხილეთ: https://buknarivilla.ge/dashboard`
        );
      }
    }

    // Confirm to the guest, with a self-service cancel link (no login needed)
    const normalizedGuest = normalizeSmsPhone(guestPhone);
    const cancelUrl = `https://buknarivilla.ge/cancel/${inserted.cancel_code}`;
    if (normalizedGuest) {
      await sendSms(
        normalizedGuest,
        `თქვენი ჯავშნის მოთხოვნა მიღებულია — "${villa.title}", ${checkIn} → ${checkOut}. მფლობელი დაგიკავშირდებათ დასადასტურებლად. გაუქმება: ${cancelUrl}`
      );
    }

    if (guestEmail) {
      await sendEmail(
        guestEmail,
        `ჯავშნის მოთხოვნა მიღებულია — ${villa.title}`,
        `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>თქვენი ჯავშნის მოთხოვნა მიღებულია</h2>
            <p><strong>${villa.title}</strong></p>
            <p>${checkIn} → ${checkOut}</p>
            <p>მფლობელი მალე დაგიკავშირდებათ დასადასტურებლად.</p>
            <p><a href="${cancelUrl}">ჯავშნის გაუქმება</a></p>
            <p style="color: #888; font-size: 13px; margin-top: 24px;">Buknari Villa — buknarivilla.ge</p>
          </div>
        `
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
