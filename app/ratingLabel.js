export function ratingLabel(score) {
  if (score >= 9) return 'საუკეთესო';
  if (score >= 8) return 'შესანიშნავი';
  if (score >= 7) return 'ძალიან კარგი';
  if (score >= 6) return 'კარგი';
  return 'დამაკმაყოფილებელი';
}

export function averageRating(reviews) {
  if (!reviews || reviews.length === 0) return null;
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}
