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
          ReportLabel: 'Buknari Villa Admin',
        },
        Receivers: [{ Receiver: phone }],
      }),
    });
  } catch (e) {
    // Best-effort
  }
}

export async function POST(request) {
  try {
    const { token, villaId, action } = await request.json();

    if (!token || !verifyAdminToken(token)) {
      return Response.json({ ok: false, message: 'ავტორიზაცია საჭიროა' }, { status: 401 });
    }
    if (!villaId || !['approve', 'decline'].includes(action)) {
      return Response.json({ ok: false, message: 'არასრული მოთხოვნა' }, { status: 400 });
    }

    const { data: villa } = await supabaseAdmin
      .from('villas')
      .select('id, title, owner_id, owners(phone)')
      .eq('id', villaId)
      .single();

    if (!villa) {
      return Response.json({ ok: false, message: 'ვილა ვერ მოიძებნა' }, { status: 404 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'declined';

    const { error } = await supabaseAdmin
      .from('villas')
      .update({ status: newStatus })
      .eq('id', villaId);

    if (error) {
      return Response.json({ ok: false, message: 'განახლება ვერ მოხერხდა' }, { status: 500 });
    }

    const ownerPhone = normalizeSmsPhone(villa.owners?.phone);
    if (ownerPhone) {
      const msg =
        action === 'approve'
          ? `თქვენი ვილა "${villa.title}" დამტკიცდა და უკვე ჩანს საიტზე buknarivilla.ge 🎉`
          : `თქვენი ვილა "${villa.title}" ვერ დამტკიცდა. დამატებითი ინფორმაციისთვის დაგვიკავშირდით.`;
      await sendSms(ownerPhone, msg);
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
