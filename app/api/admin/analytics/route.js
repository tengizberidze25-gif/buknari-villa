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

function isDateInSeason(date, startMMDD, endMMDD) {
  if (!startMMDD || !endMMDD) return false;
  const [sm, sd] = startMMDD.split('-').map(Number);
  const [em, ed] = endMMDD.split('-').map(Number);
  const val = (date.getMonth() + 1) * 100 + date.getDate();
  const startVal = sm * 100 + sd;
  const endVal = em * 100 + ed;
  if (startVal <= endVal) return val >= startVal && val <= endVal;
  return val >= startVal || val <= endVal;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// Mirrors the pricing logic used on the villa page — an estimate based on
// listed nightly rates, not the actual final price negotiated with the guest.
function estimateStayTotal(checkIn, checkOut, basePrice, seasonPrice, seasonStart, seasonEnd) {
  if (!basePrice) return 0;
  let total = 0;
  let cursor = new Date(checkIn);
  const end = new Date(checkOut);
  while (cursor < end) {
    const useSeasonPrice = seasonPrice && isDateInSeason(cursor, seasonStart, seasonEnd);
    total += useSeasonPrice ? seasonPrice : basePrice;
    cursor = addDays(cursor, 1);
  }
  return total;
}

const MONTH_LABELS_KA = ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'];

export async function POST(request) {
  try {
    const { token } = await request.json();
    if (!token || !verifyAdminToken(token)) {
      return Response.json({ ok: false, message: 'ავტორიზაცია საჭიროა' }, { status: 401 });
    }

    const { data: villas } = await supabaseAdmin
      .from('villas')
      .select('id, title, price_per_night, high_season_price, high_season_start, high_season_end, status');

    const villaMap = {};
    (villas || []).forEach((v) => {
      villaMap[v.id] = v;
    });

    const { data: bookings } = await supabaseAdmin
      .from('villa_bookings')
      .select('villa_id, status, check_in, check_out, created_at')
      .neq('status', 'owner_block');

    const confirmed = (bookings || []).filter((b) => b.status === 'confirmed');

    let totalNights = 0;
    let totalRevenue = 0;
    const perVilla = {};

    confirmed.forEach((b) => {
      const villa = villaMap[b.villa_id];
      if (!villa) return;
      const nights = Math.max(
        0,
        Math.round((new Date(b.check_out) - new Date(b.check_in)) / (1000 * 60 * 60 * 24))
      );
      const revenue = estimateStayTotal(
        b.check_in,
        b.check_out,
        villa.price_per_night,
        villa.high_season_price,
        villa.high_season_start,
        villa.high_season_end
      );
      totalNights += nights;
      totalRevenue += revenue;

      if (!perVilla[b.villa_id]) {
        perVilla[b.villa_id] = { title: villa.title, bookings: 0, nights: 0, revenue: 0 };
      }
      perVilla[b.villa_id].bookings += 1;
      perVilla[b.villa_id].nights += nights;
      perVilla[b.villa_id].revenue += revenue;
    });

    const topVillas = Object.values(perVilla)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Current-month occupancy average across active villas.
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const bookedDaysByVilla = {};
    (bookings || [])
      .filter((b) => b.status === 'confirmed' || b.status === 'pending')
      .forEach((b) => {
        if (!bookedDaysByVilla[b.villa_id]) bookedDaysByVilla[b.villa_id] = new Set();
        let d = new Date(b.check_in);
        const end = new Date(b.check_out);
        while (d < end) {
          if (d >= monthStart && d < monthEnd) bookedDaysByVilla[b.villa_id].add(d.getDate());
          d = addDays(d, 1);
        }
      });
    const activeVillas = (villas || []).filter((v) => v.status === 'approved');
    const occupancySum = activeVillas.reduce(
      (sum, v) => sum + (bookedDaysByVilla[v.id]?.size || 0) / daysInMonth,
      0
    );
    const avgOccupancy = activeVillas.length ? Math.round((occupancySum / activeVillas.length) * 100) : 0;

    // Monthly trend — bookings made (by created_at) over the last 6 months.
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = (bookings || []).filter((b) => {
        const created = new Date(b.created_at);
        return created >= d && created < nextD && b.status !== 'cancelled';
      }).length;
      monthlyTrend.push({ label: MONTH_LABELS_KA[d.getMonth()], count });
    }

    return Response.json({
      ok: true,
      totalConfirmedBookings: confirmed.length,
      totalNights,
      totalRevenue: Math.round(totalRevenue),
      activeVillasCount: activeVillas.length,
      avgOccupancy,
      topVillas,
      monthlyTrend,
    });
  } catch (err) {
    return Response.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
