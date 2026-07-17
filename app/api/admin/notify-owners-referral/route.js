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
        ReportLabel: 'Buknari Villa Owner Notice',
      },
      Receivers: [{ Receiver: phone }],
    }),
  });
  return res.ok;
}

const MESSAGE = `გამარჯობა! Buknari Villa-ზე ჩავრთეთ ახალი ფუნქცია — სტუმრები, რომლებიც სხვა სტუმრის მიერ გაზიარებული ბმულით მოდიან, ავტომატურად იღებენ ფასდაკლებას (ნაგულისხმევად 10%). სტუმარი ბმულს იღებს მხოლოდ დასვენების დასრულების შემდეგ — არა უბრალო ჯავშნის მოთხოვნისას.

ეს კარგია, რადგან სტუმრები თავად გვირჩევენ ახალ სტუმრებს — ეს არის უფასო რეკლამა, რომელიც არაფერს გიჯდებათ, გარდა მცირე ფასდაკლებისა, რომელსაც ისედაც ითვალისწინებდით.

თუ არ გსურთ, ეს თქვენს ვილაზე გავრცელდეს — ამის გამორთვა შეგიძლიათ თავად, ვილის რედაქტირების გვერდზე, checkbox-ით "სარეფერალო სისტემის გამორთვა".

სტუმართან ფასზე შეთანხმებისას გთხოვთ, გაითვალისწინოთ ეს ინფორმაცია. კითხვების შემთხვევაში დამირეკეთ.`;

export async function POST(request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!verifyAdminToken(token)) {
      return Response.json({ ok: false, message: 'ავტორიზაცია საჭიროა' }, { status: 401 });
    }

    const { data: owners, error } = await supabaseAdmin.from('owners').select('id, phone, full_name');

    if (error) {
      return Response.json({ ok: false, message: 'owner-ების წამოღება ვერ მოხერხდა' }, { status: 500 });
    }

    let sent = 0;
    let failed = 0;
    const results = [];

    for (const owner of owners || []) {
      if (!owner.phone) continue;
      const ok = await sendSms(owner.phone, MESSAGE);
      if (ok) sent++;
      else failed++;
      results.push({ name: owner.full_name || '', phone: owner.phone, ok });
    }

    return Response.json({ ok: true, sent, failed, total: (owners || []).length, results });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
