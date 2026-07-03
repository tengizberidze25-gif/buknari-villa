import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function POST(request) {
  try {
    const body = await request.json();
    const villaId = body.villaId;
    const checkIn = body.checkIn;
    const checkOut = body.checkOut;
    const guestName = (body.guestName || '').toString().trim();
    const guestPhone = (body.guestPhone || '').toString().trim();
    const guestMessage = (body.guestMessage || '').toString().trim();

    if (!villaId || !checkIn || !checkOut || !guestName || !guestPhone) {
      return Response.json({ ok: false, message: 'გთხოვთ შეავსოთ ყველა ველი' }, { status: 400 });
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      return Response.json({ ok: false, message: 'გამგზავრების თარიღი ჩამოსვლის შემდეგ უნდა იყოს' }, { status: 400 });
    }

    // Confirm the villa exists and is approved
    const { data: villa } = await supabaseAdmin
      .from('villas')
      .select('id, status')
      .eq('id', villaId)
      .single();

    if (!villa || villa.status !== 'approved') {
      return Response.json({ ok: false, message: 'ვილა ვერ მოიძებნა' }, { status: 404 });
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

    const { error } = await supabaseAdmin.from('villa_bookings').insert({
      villa_id: villaId,
      check_in: checkIn,
      check_out: checkOut,
      guest_name: guestName,
      guest_phone: guestPhone,
      guest_message: guestMessage,
      status: 'pending',
    });

    if (error) {
      return Response.json({ ok: false, message: 'მოთხოვნის გაგზავნა ვერ მოხერხდა' }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
