const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number) => (deg * Math.PI) / 180;

type Point = { lat: number; lon: number };

const haversine = (a: Point, b: Point): number => {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
};

// OSM relations often carry a "distance" tag: "12", "12 km", "7.5mi".
// Trust it when it parses, since the mapper measured the real route.
export const parseOsmDistance = (raw?: string): string | null => {
  if (!raw) return null;
  const match = raw.trim().match(/^([\d.]+)\s*(km|mi|m)?$/i);
  if (!match) return null;

  const value = parseFloat(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;

  const unit = match[2]?.toLowerCase();
  const km =
    unit === "mi" ? value * 1.609344 : unit === "m" ? value / 1000 : value;
  return km.toFixed(1);
};

// Sums the geometry Overpass already returned, so no routing API call is needed.
export const trailLengthKm = (members: any[]): string => {
  let total = 0;

  for (const member of members ?? []) {
    const geometry: Point[] = member?.geometry ?? [];
    for (let i = 1; i < geometry.length; i++) {
      total += haversine(geometry[i - 1], geometry[i]);
    }
  }

  return total > 0 ? total.toFixed(1) : "—";
};
