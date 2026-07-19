'use client';

import { useLanguage } from '../../LanguageContext';
import { t } from '../../i18n';

// Approximate long-term climate averages for the Adjara Black Sea coast
// (Kobuleti/Batumi area) — general reference only, not a live forecast.
const AVG_TEMP_C = [7, 7, 9, 13, 18, 22, 24, 25, 22, 17, 13, 9];

const MONTH_LABELS = {
  ka: ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ru: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
  hy: ['Հունվ', 'Փետր', 'Մարտ', 'Ապր', 'Մայիս', 'Հունիս', 'Հուլիս', 'Օգոստ', 'Սեպտ', 'Հոկտ', 'Նոյեմ', 'Դեկտ'],
};

// A month "counts" as high season if its 15th day falls within the range —
// a simple, readable approximation for a month-level overview chart.
function isMonthInSeason(monthIndex, startMMDD, endMMDD) {
  if (!startMMDD || !endMMDD) return false;
  const [sm, sd] = startMMDD.split('-').map(Number);
  const [em, ed] = endMMDD.split('-').map(Number);
  const val = (monthIndex + 1) * 100 + 15;
  const startVal = sm * 100 + sd;
  const endVal = em * 100 + ed;
  if (startVal <= endVal) return val >= startVal && val <= endVal;
  return val >= startVal || val <= endVal;
}

export default function SeasonalityChart({ basePrice, seasonPrice, seasonStart, seasonEnd }) {
  const { lang } = useLanguage();
  const tt = (key) => t(lang, key);
  const labels = MONTH_LABELS[lang] || MONTH_LABELS.ka;

  if (!basePrice) return null;

  const prices = Array.from({ length: 12 }, (_, i) =>
    seasonPrice && isMonthInSeason(i, seasonStart, seasonEnd) ? seasonPrice : basePrice
  );
  const maxPrice = Math.max(...prices);

  return (
    <div className="seasonality-chart">
      <h3 className="seasonality-title">{tt('seasonalityTitle')}</h3>
      <p className="seasonality-hint">{tt('seasonalityHint')}</p>
      <div className="seasonality-row">
        {labels.map((label, i) => {
          const isHigh = prices[i] === seasonPrice && seasonPrice > basePrice;
          const barHeight = Math.max(18, Math.round((prices[i] / maxPrice) * 64));
          return (
            <div key={i} className="seasonality-month">
              <div className="seasonality-bar-track">
                <div
                  className={`seasonality-bar${isHigh ? ' high' : ''}`}
                  style={{ height: `${barHeight}px` }}
                  title={`₾${prices[i]}`}
                />
              </div>
              <div className="seasonality-price">₾{prices[i]}</div>
              <div className="seasonality-temp">{AVG_TEMP_C[i]}°</div>
              <div className="seasonality-label">{label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
