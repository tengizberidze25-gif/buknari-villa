'use client';

function localized(obj, field, lang) {
  if (lang !== 'ka' && obj[`${field}_${lang}`]) return obj[`${field}_${lang}`];
  return obj[field];
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

function computeStayTotal(checkIn, checkOut, basePrice, seasonPrice, seasonStart, seasonEnd) {
  if (!basePrice) return 0;
  let total = 0;
  let cursor = new Date(checkIn);
  const end = new Date(checkOut);
  while (cursor < end) {
    const useSeasonPrice = seasonPrice && isDateInSeason(cursor, seasonStart, seasonEnd);
    total += useSeasonPrice ? seasonPrice : basePrice;
    cursor = new Date(cursor.getTime() + 86400000);
  }
  return total;
}

const STATUS_LABELS = {
  pending: { text: 'მოლოდინში — მფლობელის დადასტურებას ელოდება', color: '#d9a441' },
  confirmed: { text: 'დადასტურებული', color: '#3fa87f' },
};

export default function InvoiceContent({ booking, villa }) {
  const title = localized(villa, 'title', 'ka') || villa.title;
  const checkIn = new Date(booking.check_in);
  const checkOut = new Date(booking.check_out);
  const nights = Math.round((checkOut - checkIn) / 86400000);
  const total = computeStayTotal(
    booking.check_in,
    booking.check_out,
    villa.price_per_night,
    villa.high_season_price,
    villa.high_season_start,
    villa.high_season_end
  );
  const statusInfo = STATUS_LABELS[booking.status] || { text: booking.status, color: '#999' };
  const shortRef = booking.id.slice(0, 8).toUpperCase();

  function fmt(d) {
    return d.toLocaleDateString('ka-GE', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  return (
    <div className="invoice-page">
      <div className="invoice-toolbar">
        <a href="/" className="invoice-back">← Buknari Villa</a>
        <button type="button" onClick={() => window.print()} className="invoice-print-btn">
          🖨️ ბეჭდვა / PDF-ად შენახვა
        </button>
      </div>

      <div className="invoice-sheet">
        <div className="invoice-header">
          <div>
            <div className="invoice-brand">Buknari Villa</div>
            <div className="invoice-brand-sub">buknarivilla.ge</div>
          </div>
          <div className="invoice-ref">
            <div className="invoice-ref-label">ჯავშნის ნომერი</div>
            <div className="invoice-ref-value">#{shortRef}</div>
          </div>
        </div>

        <h1 className="invoice-title">ჯავშნის დადასტურება</h1>

        <div className="invoice-status" style={{ color: statusInfo.color, borderColor: statusInfo.color }}>
          {statusInfo.text}
        </div>

        <div className="invoice-grid">
          <div>
            <div className="invoice-field-label">სტუმარი</div>
            <div className="invoice-field-value">{booking.guest_name}</div>
          </div>
          <div>
            <div className="invoice-field-label">ტელეფონი</div>
            <div className="invoice-field-value">{booking.guest_phone}</div>
          </div>
          <div>
            <div className="invoice-field-label">ვილა</div>
            <div className="invoice-field-value">{title}</div>
          </div>
          <div>
            <div className="invoice-field-label">მდებარეობა</div>
            <div className="invoice-field-value">{villa.village}</div>
          </div>
          <div>
            <div className="invoice-field-label">ჩამოსვლა</div>
            <div className="invoice-field-value">{fmt(checkIn)}</div>
          </div>
          <div>
            <div className="invoice-field-label">გამგზავრება</div>
            <div className="invoice-field-value">{fmt(checkOut)}</div>
          </div>
        </div>

        <div className="invoice-price-box">
          <div className="invoice-price-row">
            <span>
              ₾{villa.price_per_night} × {nights} ღამე
            </span>
            <span>₾{total.toLocaleString()}</span>
          </div>
          <div className="invoice-price-total">
            <span>ჯამში (სავარაუდო)</span>
            <span>₾{total.toLocaleString()}</span>
          </div>
        </div>

        <p className="invoice-disclaimer">
          ⚠️ ეს არის სავარაუდო ფასი, გამოთვლილი ვილის გვერდზე მითითებული ტარიფის მიხედვით. საბოლოო თანხა
          დასტურდება მფლობელთან პირდაპირ კომუნიკაციისას.
        </p>

        <div className="invoice-footer">
          <div>Buknari Villa · buknarivilla.ge</div>
          {villa.contact_phone ? <div>მფლობელის ტელეფონი: {villa.contact_phone}</div> : null}
        </div>
      </div>
    </div>
  );
}
