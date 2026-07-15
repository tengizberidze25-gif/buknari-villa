import { supabaseAdmin } from '../../../lib/supabaseAdmin';

function normalizeSmsPhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.indexOf('995') === 0) digits = digits.substring(3);
  if (digits.length !== 9) return '';
  return '995' + digits;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const villaId = body.villaId;
    const phone = (body.phone || '').toString().trim();
    const checkIn = body.checkIn;
    const checkOut = body.checkOut;

    if (!villaId || !phone || !checkIn || !checkOut) {
      return Response.json({ ok: false, message: 'გთხოვთ შეავსოთ ყველა ველი' }, { status: 400 });
    }

    const normalized = normalizeSmsPhone(phone);
    if (!normalized) {
      return Response.json({ ok: false, message: 'ტელეფონის ნომერი არასწორია' }, { status: 400 });
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      return Response.json({ ok: false, message: 'გამგზავრების თარიღი ჩამოსვლის შემდეგ უნდა იყოს' }, { status: 400 });
    }

    const { data: villa } = await supabaseAdmin.from('villas').select('id').eq('id', villaId).single();
    if (!villa) {
      return Response.json({ ok: false, message: 'ვილა ვერ მოიძებნა' }, { status: 404 });
    }

    const { error } = await supabaseAdmin.from('availability_notifications').insert({
      villa_id: villaId,
      phone: normalized,
      check_in: checkIn,
      check_out: checkOut,
    });

    if (error) {
      return Response.json({ ok: false, message: 'შენახვა ვერ მოხერხდა' }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
