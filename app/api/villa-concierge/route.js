import { supabaseAdmin } from '../../../lib/supabaseAdmin';

const RATE_LIMIT_PER_HOUR = 8;

function getClientIp(request) {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

function localized(villa, field, lang) {
  if (lang === 'en' && villa[`${field}_en`]) return villa[`${field}_en`];
  if (lang === 'ru' && villa[`${field}_ru`]) return villa[`${field}_ru`];
  if (lang === 'hy' && villa[`${field}_hy`]) return villa[`${field}_hy`];
  return villa[field];
}

function buildSystemPrompt(villa, lang, avgRating, reviewCount) {
  const langNames = { ka: 'ქართულად', en: 'in English', ru: 'на русском', hy: 'հայերեն' };
  const replyLang = langNames[lang] || 'ქართულად';

  const facts = [
    `სახელი: ${localized(villa, 'title', lang) || villa.title}`,
    `სოფელი/ლოკაცია: ${villa.village || 'უცნობია'}`,
    `ფასი ღამეში: ₾${villa.price_per_night || 'უცნობია'}`,
    villa.high_season_price ? `მაღალი სეზონის ფასი: ₾${villa.high_season_price}` : null,
    `მინიმალური ღამეები: ${villa.min_nights || 1}`,
    villa.max_guests ? `მაქს. სტუმრები: ${villa.max_guests}` : null,
    villa.bedrooms ? `საძინებლები: ${villa.bedrooms}` : null,
    villa.bathrooms ? `სააბაზანოები: ${villa.bathrooms}` : null,
    villa.distance_sea_m ? `მანძილი ზღვამდე: ${villa.distance_sea_m} მეტრი` : null,
    villa.distance_center_m ? `მანძილი ცენტრამდე: ${villa.distance_center_m} მეტრი` : null,
    villa.checkin_time ? `Check-in: ${villa.checkin_time}` : null,
    villa.checkout_time ? `Check-out: ${villa.checkout_time}` : null,
    villa.cancellation_policy ? `გაუქმების პირობები: ${localized(villa, 'cancellation_policy', lang)}` : null,
    villa.house_rules ? `წესები: ${localized(villa, 'house_rules', lang)}` : null,
    villa.nearby_food ? `ახლომდებარე კვება: ${localized(villa, 'nearby_food', lang)}` : null,
    villa.nearby_shops ? `ახლომდებარე მაღაზიები: ${localized(villa, 'nearby_shops', lang)}` : null,
    localized(villa, 'description', lang) ? `აღწერა: ${localized(villa, 'description', lang)}` : null,
    avgRating ? `საშუალო შეფასება: ${avgRating}/5 (${reviewCount} შეფასება)` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return `შენ ხარ Buknari Villa-ს ვირტუალური კონსიერჟი — მეგობრული, გამოცდილი ტურისტული ასისტენტი, რომელიც ეხმარება პოტენციურ სტუმრებს ამ კონკრეტული ვილის შესახებ კითხვებზე.

ვილის რეალური მონაცემები (მხოლოდ ამაზე დაეყრდნო, არაფერი გამოიგონო):
${facts}

წესები:
- უპასუხე ${replyLang}, მოკლედ და კონკრეტულად (მაქსიმუმ 3-4 წინადადება)
- თუ კითხვაზე პასუხი ზემოთ მოცემულ მონაცემებში არ არის — პატიოსნად თქვი, რომ ეს დეტალი არ იცი და ურჩიე მფლობელს დაუკავშირდეს პირდაპირ
- არასდროს გამოიგონო ფასი, თარიღი, ან პირობა, რაც მონაცემებში არ წერია
- თუ სტუმარი აშკარად დაინტერესებულია დაჯავშნით, წაახალისე გამოიყენოს გვერდზე არსებული ჯავშნის ფორმა ან WhatsApp ღილაკი
- ამინდის, სეზონურობის, ან ზოგადი ტურისტული კითხვების შემთხვევაში (მაგ. "ცივია სექტემბერში?") გამოიყენე ზოგადი ცოდნა შავი ზღვის სანაპიროს (ქობულეთი/ბუკნარის მიდამოები) შესახებ, მაგრამ მკაფიოდ მონიშნე, რომ ეს საშუალო შეხედულებაა
- იყავი თბილი და მოკლე, არა ფორმალური ან ბიუროკრატიული`;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { villaId, message, history, lang } = body;

    if (!villaId || !message || typeof message !== 'string' || message.length > 500) {
      return Response.json({ ok: false, message: 'არასწორი მოთხოვნა' }, { status: 400 });
    }

    const ip = getClientIp(request);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentAttempts } = await supabaseAdmin
      .from('security_attempts')
      .select('id')
      .eq('key', `concierge:${ip}`)
      .gte('created_at', oneHourAgo);

    if (recentAttempts && recentAttempts.length >= RATE_LIMIT_PER_HOUR) {
      return Response.json(
        { ok: false, message: 'ბევრი შეტყობინება გაიგზავნა — სცადეთ მოგვიანებით' },
        { status: 429 }
      );
    }
    await supabaseAdmin.from('security_attempts').insert({ key: `concierge:${ip}` });

    const { data: villa } = await supabaseAdmin.from('villas').select('*').eq('id', villaId).single();
    if (!villa || villa.status !== 'approved') {
      return Response.json({ ok: false, message: 'ვილა ვერ მოიძებნა' }, { status: 404 });
    }

    const { data: reviews } = await supabaseAdmin
      .from('villa_reviews')
      .select('rating')
      .eq('villa_id', villaId);
    const reviewCount = reviews?.length || 0;
    const avgRating = reviewCount
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
      : null;

    const systemPrompt = buildSystemPrompt(villa, lang, avgRating, reviewCount);

    const safeHistory = Array.isArray(history)
      ? history.slice(-6).filter((h) => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
      : [];

    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CONCIERGE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        system: systemPrompt,
        messages: [...safeHistory, { role: 'user', content: message }],
      }),
    });

    if (!apiRes.ok) {
      return Response.json({ ok: false, message: 'პასუხის მიღება ვერ მოხერხდა' }, { status: 502 });
    }

    const data = await apiRes.json();
    const reply = data.content?.find((c) => c.type === 'text')?.text || '';

    return Response.json({ ok: true, reply });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
