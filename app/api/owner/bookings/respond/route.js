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
          ReportLabel: 'Buknari Villa Booking',
        },
        Receivers: [{ Receiver: phone }],
      }),
    });
  } catch (e) {
    // Best-effort
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
    // Best-effort
  }
}

async function notifyAvailability(villaId, freedCheckIn, freedCheckOut, villaTitle) {
  const { data: notifications } = await supabaseAdmin
    .from('availability_notifications')
    .select('id, phone, check_in, check_out')
    .eq('villa_id', villaId)
    .eq('notified', false);

  if (!notifications || notifications.length === 0) return;

  for (const n of notifications) {
    const overlaps = new Date(n.check_in) < new Date(freedCheckOut) && new Date(n.check_out) > new Date(freedCheckIn);
    if (!overlaps) continue;

    const normalized = normalizeSmsPhone(n.phone);
    if (normalized) {
      await sendSms(
        normalized,
        `სასიხარულო ამბავი! "${villaTitle}" გათავისუფლდა თქვენთვის საინტერესო თარიღებში. დაჯავშნეთ სანამ სხვამ დაიკავებს: https://buknarivilla.ge`
      );
    }
    await supabaseAdmin.from('availability_notifications').update({ notified: true }).eq('id', n.id);
  }
}

export async function POST(request) {
  try {
    const { ownerId, token, bookingId, action } = await request.json();

    if (!ownerId || !token || !verifyToken(token, ownerId)) {
      return Response.json({ ok: false, message: 'სესია ამოიწურა' }, { status: 401 });
    }
    if (!bookingId || !['confirm', 'decline'].includes(action)) {
      return Response.json({ ok: false, message: 'არასრული მოთხოვნა' }, { status: 400 });
    }

    // Confirm this booking belongs to a villa owned by this owner
    const { data: booking } = await supabaseAdmin
      .from('villa_bookings')
      .select('id, villa_id, check_in, check_out, guest_phone, guest_email, villas!inner(owner_id, title)')
      .eq('id', bookingId)
      .single();

    if (!booking || booking.villas.owner_id !== ownerId) {
      return Response.json({ ok: false, message: 'წვდომა უარყოფილია' }, { status: 403 });
    }

    const newStatus = action === 'confirm' ? 'confirmed' : 'declined';

    const { error } = await supabaseAdmin
      .from('villa_bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (error) {
      return Response.json({ ok: false, message: 'განახლება ვერ მოხერხდა' }, { status: 500 });
    }

    if (action === 'confirm' && booking.guest_phone) {
      const normalized = normalizeSmsPhone(booking.guest_phone);
      if (normalized) {
        await sendSms(
          normalized,
          `თქვენი ჯავშანი დადასტურდა! "${booking.villas.title}" — ${booking.check_in} → ${booking.check_out}. მადლობა, რომ ირჩევთ Buknari Villa-ს.`
        );
      }
    }

    if (action === 'confirm' && booking.guest_email) {
      await sendEmail(
        booking.guest_email,
        `ჯავშანი დადასტურდა — ${booking.villas.title}`,
        `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>თქვენი ჯავშანი დადასტურდა! 🎉</h2>
            <p><strong>${booking.villas.title}</strong></p>
            <p>${booking.check_in} → ${booking.check_out}</p>
            <p>მადლობა, რომ ირჩევთ Buknari Villa-ს.</p>
            <p style="color: #888; font-size: 13px; margin-top: 24px;">Buknari Villa — buknarivilla.ge</p>
          </div>
        `
      );
    }

    if (action === 'decline') {
      // Best-effort: let anyone waiting for these dates know they just opened up
      await notifyAvailability(booking.villa_id, booking.check_in, booking.check_out, booking.villas.title);
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
