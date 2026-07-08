// მიახლოებითი კურსი — ლარიდან დოლარში/ევროში. ეს არ არის ცოცხალი კურსი
// (გარე API ამ გარემოში არ არის ხელმისაწვდომი), ამიტომ დროდადრო ხელით
// განაახლე ეს ორი რიცხვი საჭიროებისამებრ (მაგ. National Bank of Georgia-ს კურსის მიხედვით).
const GEL_TO_USD = 0.37; // 1 ₾ ≈ $0.37  (ანუ ₾2.70 ≈ $1)
const GEL_TO_EUR = 0.34; // 1 ₾ ≈ €0.34  (ანუ ₾2.95 ≈ €1)

// მხოლოდ არა-ქართული ვერსიისთვის ვაჩვენებთ სავარაუდო კონვერტაციას —
// ქართველი სტუმარი ლარში აზროვნებს და დამატებითი რიცხვი მხოლოდ ხელს უშლის.
export function approxPrice(gelAmount, lang) {
  const amount = Number(gelAmount);
  if (!amount || lang === 'ka') return null;

  const usd = Math.round(amount * GEL_TO_USD);
  const eur = Math.round(amount * GEL_TO_EUR);

  return `~$${usd} / ~€${eur}`;
}
