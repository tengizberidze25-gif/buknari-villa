// Reference points for each village: center coordinate and a representative
// seafront coordinate. The Buknari–Chakvi–Tsikhisdziri coastline runs in a
// fairly straight north–south line, so distance-to-sea is calculated as the
// perpendicular distance to that line (via the longitude difference) rather
// than a straight line to a single point — this stays accurate regardless of
// whether the villa sits toward the north or south end of the village.
const VILLAGE_REFERENCE_POINTS = {
  'ბუკნარი': {
    center: [41.745098, 41.739694],
    sea: [41.743655, 41.736077],
  },
  'ჩაქვი': {
    center: [41.718303, 41.733573],
    sea: [41.731858, 41.731154],
  },
  'ციხისძირი': {
    center: [41.758769, 41.744035],
    sea: [41.767107, 41.751141],
  },
};

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

// Straight-line (great-circle) distance between two coordinates, in meters.
export function haversineDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Perpendicular distance (in meters) from a point to the village's
// approximately north–south coastline, using the longitude difference.
function distanceToSeaLineMeters(lat, lng, seaLat, seaLng) {
  const metersPerDegLng = 111320 * Math.cos(toRad(lat));
  return Math.round(Math.abs(lng - seaLng) * metersPerDegLng);
}

// Returns { center, sea } distances in meters for a villa, or nulls if the
// village isn't recognized or coordinates are missing.
export function getAutoDistances(village, lat, lng) {
  const ref = VILLAGE_REFERENCE_POINTS[village];
  if (!ref || lat == null || lng == null) {
    return { center: null, sea: null };
  }
  const [centerLat, centerLng] = ref.center;
  const [seaLat, seaLng] = ref.sea;
  return {
    center: haversineDistanceMeters(lat, lng, centerLat, centerLng),
    sea: distanceToSeaLineMeters(lat, lng, seaLat, seaLng),
  };
}

export { VILLAGE_REFERENCE_POINTS };
