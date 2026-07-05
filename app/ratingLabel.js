const LABELS = {
  ka: {
    best: 'საუკეთესო',
    excellent: 'შესანიშნავი',
    veryGood: 'ძალიან კარგი',
    good: 'კარგი',
    fair: 'დამაკმაყოფილებელი',
  },
  en: {
    best: 'Exceptional',
    excellent: 'Excellent',
    veryGood: 'Very good',
    good: 'Good',
    fair: 'Fair',
  },
  ru: {
    best: 'Превосходно',
    excellent: 'Отлично',
    veryGood: 'Очень хорошо',
    good: 'Хорошо',
    fair: 'Удовлетворительно',
  },
  hy: {
    best: 'Բացառիկ',
    excellent: 'Գերազանց',
    veryGood: 'Շատ լավ',
    good: 'Լավ',
    fair: 'Բավարար',
  },
};

export function ratingLabel(score, lang = 'ka') {
  const l = LABELS[lang] || LABELS.ka;
  if (score >= 9) return l.best;
  if (score >= 8) return l.excellent;
  if (score >= 7) return l.veryGood;
  if (score >= 6) return l.good;
  return l.fair;
}

export function averageRating(reviews) {
  if (!reviews || reviews.length === 0) return null;
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}
