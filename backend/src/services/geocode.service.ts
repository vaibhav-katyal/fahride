type Coordinate = [number, number];

interface NominatimPlace {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface NominatimReverse {
  display_name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    county?: string;
  };
}

const SEARCH_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const REVERSE_CACHE_TTL_MS = 1000 * 60 * 30;
const NOMINATIM_MIN_GAP_MS = 1100;

const searchCache = new Map<string, { at: number; value: NominatimPlace[] }>();
const reverseCache = new Map<string, { at: number; value: string }>();

let lastNominatimCallAt = 0;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const enforceNominatimRateLimit = async () => {
  const now = Date.now();
  const waitMs = NOMINATIM_MIN_GAP_MS - (now - lastNominatimCallAt);
  if (waitMs > 0) {
    await sleep(waitMs);
  }
  lastNominatimCallAt = Date.now();
};

const buildUserAgent = () => {
  const configured = process.env.NOMINATIM_USER_AGENT?.trim();
  if (configured) return configured;
  return "Poolmate/1.0 (contact: support@poolmate.local)";
};

const parseCoordinates = (lat: number, lon: number): Coordinate => [lat, lon];

export const searchGeocode = async (query: string, limit = 5) => {
  const normalized = query.trim().toLowerCase();
  const cached = searchCache.get(normalized);
  if (cached && Date.now() - cached.at < SEARCH_CACHE_TTL_MS) {
    return cached.value;
  }

  await enforceNominatimRateLimit();

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=in&limit=${Math.max(
    1,
    Math.min(limit, 10)
  )}&q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": buildUserAgent(),
      "Accept-Language": "en",
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim search failed with status ${response.status}`);
  }

  const data = (await response.json()) as NominatimPlace[];
  searchCache.set(normalized, { at: Date.now(), value: data });
  return data;
};

export const reverseGeocode = async (lat: number, lon: number) => {
  const [safeLat, safeLon] = parseCoordinates(lat, lon);
  const key = `${safeLat.toFixed(4)},${safeLon.toFixed(4)}`;
  const cached = reverseCache.get(key);

  if (cached && Date.now() - cached.at < REVERSE_CACHE_TTL_MS) {
    return cached.value;
  }

  await enforceNominatimRateLimit();

  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${safeLat}&lon=${safeLon}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": buildUserAgent(),
      "Accept-Language": "en",
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim reverse failed with status ${response.status}`);
  }

  const data = (await response.json()) as NominatimReverse;
  const area = data.address?.city || data.address?.town || data.address?.village || data.address?.county;
  const resolved = area && data.address?.state ? `${area}, ${data.address.state}` : data.display_name || "Current location";

  reverseCache.set(key, { at: Date.now(), value: resolved });
  return resolved;
};
