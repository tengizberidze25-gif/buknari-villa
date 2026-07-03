import { supabaseAdmin } from '../../../lib/supabaseAdmin';

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

  const res = await fetch(url, {
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
        ReportLabel: 'Buknari Villa OTP',
      },
      Receivers: [{ Receiver: phone }],
    }),
  });

  const body = await res.text();
  let parsed = null;
  try {
    parsed = JSON.parse(body);
  } catch (e) {}
  const hasError =
    parsed && ['400', '401', '403', '500'].indexOf(String(parsed.Status || '')) !== -1;

  return { ok: res.status === 200 && !hasError, status: res.status, body };
}

export async function POST(request) {
  try {
    const { phone } = await request.json();
    const normalized = normalizeSmsPhone(phone);

    if (!normalized) {
      return Response.json(
        { ok: false, message: 'ტელეფონის ნომერი არასწორია' },
        { status: 400 }
      );
    }

    // Rate limit: block if a code was requested for this phone in the last 60s
    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: recent } = await supabaseAdmin
      .from('otp_codes')
      .select('id')
      .eq('phone', normalized)
      .gte('created_at', sixtySecondsAgo)
      .limit(1);

    if (recent && recent.length > 0) {
      return Response.json(
        { ok: false, message: 'გთხოვთ დაელოდოთ 60 წამი ხელახლა მოთხოვნამდე' },
        { status: 429 }
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error: insertError } = await supabaseAdmin.from('otp_codes').insert({
      phone: normalized,
      code,
      expires_at: expiresAt,
    });

    if (insertError) {
      return Response.json({ ok: false, message: 'ბაზის შეცდომა' }, { status: 500 });
    }

    const smsResult = await sendSms(normalized, `თქვენი დამადასტურებელი კოდია: ${code}`);

    if (!smsResult.ok) {
      return Response.json(
        { ok: false, message: 'SMS-ის გაგზავნა ვერ მოხერხდა', debug: smsResult.body },
        { status: 502 }
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
