type Geo = {
  lat: number;
  lng: number;
  zipcode: string | null;
  locality: string | null;
  region: string | null;
  country: string | null;
};

export async function geocode(address: string): Promise<Geo | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(address)}`,
    { headers: { "User-Agent": "Kinlot/0.1 (iamsorenl@gmail.com)" } },
  );
  if (!res.ok) return null;
  const [hit] = await res.json();
  if (!hit) return null;
  const a = hit.address ?? {};
  return {
    lat: Number(hit.lat),
    lng: Number(hit.lon),
    zipcode: a.postcode ?? null,
    locality: a.city ?? a.town ?? a.village ?? null,
    region: a.state ?? null,
    country: a.country ?? null,
  };
}
