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
          ReportLabel: 'Buknari Villa Photo Reminder',
        },
        Receivers: [{ Receiver: phone }],
      }),
    });
    return true;
  } catch (e) {
    return false;
  }
}

export async function POST(request) {
  try {
    const { token } = await request.json();
    if (!token || !verifyAdminToken(token)) {
      return Response.json({ ok: false, message: 'ავტორიზაცია საჭიროა' }, { status: 401 });
    }

    // ვილები, რომლებიც არ არის უარყოფილი (pending ან approved) — approved-ს შორის
    // ფოტოს გარეშე თეორიულად აღარ უნდა იყოს (admin approve-ს ვბლოკავთ), მაგრამ
    // ეს pending-ზეც ვამოწმებთ, სანამ owner-მა submit-ისას ფოტო არ ატვირთა (ძველი ჩანაწერები).
    const { data: villas, error } = await supabaseAdmin
      .from('villas')
      .select('id, title, owner_id, status, owners(phone, full_name)')
      .neq('status', 'declined');

    if (error) {
      return Response.json({ ok: false, message: 'მონაცემების წამოღება ვერ მოხერხდა' }, { status: 500 });
    }

    const { data: photoRows } = await supabaseAdmin.from('villa_photos').select('villa_id');
    const villaIdsWithPhotos = new Set((photoRows || []).map((p) => p.villa_id));
    const missingPhotoVillas = (villas || []).filter((v) => !villaIdsWithPhotos.has(v.id));

    const seenPhones = new Set();
    let sent = 0;

    for (const villa of missingPhotoVillas) {
      const phone = villa.owners?.phone;
      if (!phone) continue;
      const normalized = normalizeSmsPhone(phone);
      if (!normalized || seenPhones.has(normalized)) continue;
      seenPhones.add(normalized);

      const ownerName = (villa.owners?.full_name || '').trim();
      const greeting = ownerName ? `გამარჯობა, ${ownerName}! ` : '';

      const text = `${greeting}ბუკნარი ვილა "${villa.title}": გთხოვთ ატვირთოთ მინიმუმ 1 ფოტო თქვენს კაბინეტში (buknarivilla.ge) — ფოტოს გარეშე ვილა ვერ გამოქვეყნდება.`;

      const ok = await sendSms(normalized, text);
      if (ok) sent++;
    }

    return Response.json({ ok: true, sent, totalMissing: missingPhotoVillas.length });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
