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
          ReportLabel: 'Buknari Villa Location Reminder',
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

    const { data: villas, error } = await supabaseAdmin
      .from('villas')
      .select('id, title, owner_id, owners(phone, full_name)')
      .eq('status', 'approved')
      .or('lat.is.null,lng.is.null');

    if (error) {
      return Response.json({ ok: false, message: 'მონაცემების წამოღება ვერ მოხერხდა' }, { status: 500 });
    }

    const seenPhones = new Set();
    let sent = 0;

    for (const villa of villas || []) {
      const phone = villa.owners?.phone;
      if (!phone) continue;
      const normalized = normalizeSmsPhone(phone);
      if (!normalized || seenPhones.has(normalized)) continue;
      seenPhones.add(normalized);

      const text = `ბუკნარი ვილა: გთხოვთ შეხვიდეთ თქვენს კაბინეტში (buknarivilla.ge) და მონიშნეთ თქვენი ვილის ზუსტი ადგილმდებარეობა რუკაზე — ეს დაეხმარება სტუმრებს იპოვონ თქვენი ვილა.`;

      const ok = await sendSms(normalized, text);
      if (ok) sent++;
    }

    return Response.json({ ok: true, sent, totalMissing: (villas || []).length });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
