// სწორი მრავლობითი ფორმა რიცხვის მიხედვით (ინგლისური: bedroom/bedrooms,
// რუსული: სამნაწილიანი წესი 1/2-4/5+, ქართული და სომხური რიცხვის შემდეგ არ იცვლება).
const FORMS = {
  bedroom: {
    ka: { one: 'საძინებელი', other: 'საძინებელი' },
    en: { one: 'bedroom', other: 'bedrooms' },
    ru: { one: 'спальня', few: 'спальни', many: 'спален' },
    hy: { one: 'ննջասենյակ', other: 'ննջասենյակ' },
  },
  guest: {
    ka: { one: 'სტუმარი', other: 'სტუმარი' },
    en: { one: 'guest', other: 'guests' },
    ru: { one: 'гость', few: 'гостя', many: 'гостей' },
    hy: { one: 'հյուր', other: 'հյուր' },
  },
  bathroom: {
    ka: { one: 'სააბაზანო', other: 'სააბაზანო' },
    en: { one: 'bathroom', other: 'bathrooms' },
    ru: { one: 'санузел', few: 'санузла', many: 'санузлов' },
    hy: { one: 'սանհանգույց', other: 'սանհանգույց' },
  },
  review: {
    ka: { one: 'შეფასება', other: 'შეფასება' },
    en: { one: 'review', other: 'reviews' },
    ru: { one: 'отзыв', few: 'отзыва', many: 'отзывов' },
    hy: { one: 'կարծիք', other: 'կարծիք' },
  },
};

function russianForm(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'one';
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return 'few';
  return 'many';
}

export function countLabel(count, lang, noun) {
  const forms = FORMS[noun]?.[lang] || FORMS[noun]?.ka;
  if (!forms) return '';

  if (lang === 'ru') {
    const form = russianForm(Number(count));
    return forms[form] || forms.many;
  }

  return Number(count) === 1 ? forms.one : forms.other;
}
