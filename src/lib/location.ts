export type Coordinate = [number, number];

export interface PlaceSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
const GEO_BASE = `${API_BASE}/geo`;
const suggestionCache = new Map<string, PlaceSuggestion[]>();
const coordinateCache = new Map<string, Coordinate>();
const reverseCache = new Map<string, string>();

const LOCAL_LOCATION_COORDS: Record<string, Coordinate> = {
  "chitkara university": [30.5166, 76.6597],
  "banur": [30.5539, 76.7195],
  "chandigarh": [30.7333, 76.7794],
  "sector 17": [30.7415, 76.7842],
  "zirakpur": [30.642, 76.8173],
  "zirkapur": [30.642, 76.8173],
  "jhansla": [30.5178, 76.6647],
  "dera bassi": [30.5889, 76.8456],
  "mohali": [30.7046, 76.7179],
  "sahibzada ajit singh nagar": [30.7046, 76.7179],
};

const titleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const haversineDistanceKm = (from: Coordinate, to: Coordinate) => {
  const earthRadiusKm = 6371;
  const dLat = ((to[0] - from[0]) * Math.PI) / 180;
  const dLon = ((to[1] - from[1]) * Math.PI) / 180;
  const lat1 = (from[0] * Math.PI) / 180;
  const lat2 = (to[0] * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getLocalSuggestions = (query: string): PlaceSuggestion[] => {
  const normalized = normalizeLocationText(query);
  if (!normalized) return [];

  const matches = Object.entries(LOCAL_LOCATION_COORDS)
    .filter(([key]) => key.includes(normalized) || normalized.includes(key))
    .slice(0, 5);

  return matches.map(([key, coords], index) => ({
    place_id: -1 * (index + 1),
    display_name: titleCase(key),
    lat: String(coords[0]),
    lon: String(coords[1]),
  }));
};

export const normalizeLocationText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[()\[\]{}]/g, " ")
    .replace(/[,/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const getLocationBaseName = (value: string) => {
  const firstSegment = value.split(",")[0]?.trim() || value.trim();
  return firstSegment;
};

export const resolveLocationCoordinate = (query: string): Coordinate | null => {
  const normalized = normalizeLocationText(query);
  if (!normalized) return null;

  if (LOCAL_LOCATION_COORDS[normalized]) {
    return LOCAL_LOCATION_COORDS[normalized];
  }

  const partialMatch = Object.entries(LOCAL_LOCATION_COORDS).find(
    ([key]) => normalized.includes(key) || key.includes(normalized)
  );

  return partialMatch ? partialMatch[1] : null;
};

export const getNearestKnownLocationLabel = (lat: number, lon: number): string | null => {
  const origin: Coordinate = [lat, lon];
  let nearest: { key: string; distance: number } | null = null;

  Object.entries(LOCAL_LOCATION_COORDS).forEach(([key, coords]) => {
    const distance = haversineDistanceKm(origin, coords);
    if (!nearest || distance < nearest.distance) {
      nearest = { key, distance };
    }
  });

  if (!nearest || nearest.distance > 30) {
    return null;
  }

  return titleCase(nearest.key);
};

export const fetchPlaceSuggestions = async (query: string) => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const normalized = normalizeLocationText(trimmed);
  const cached = suggestionCache.get(normalized);
  if (cached) return cached;

  const local = getLocalSuggestions(trimmed);

  try {
    const response = await fetch(
      `${GEO_BASE}/search?q=${encodeURIComponent(trimmed)}&limit=5`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch suggestions");
    }

    const payload = (await response.json()) as ApiResponse<PlaceSuggestion[]>;
    const suggestions = payload.data || [];
    const merged = suggestions.length ? suggestions : local;
    suggestionCache.set(normalized, merged);
    return merged;
  } catch {
    suggestionCache.set(normalized, local);
    return local;
  }
};

export const geocodeLocationName = async (query: string): Promise<Coordinate> => {
  const normalized = normalizeLocationText(query);
  const cached = coordinateCache.get(normalized);
  if (cached) return cached;

  const direct = resolveLocationCoordinate(query);
  if (direct) {
    coordinateCache.set(normalized, direct);
    return direct;
  }

  const suggestions = await fetchPlaceSuggestions(query);
  const first = suggestions[0];

  if (!first) {
    throw new Error("Unable to resolve location coordinates");
  }

  const resolved: Coordinate = [Number.parseFloat(first.lat), Number.parseFloat(first.lon)];
  coordinateCache.set(normalized, resolved);
  return resolved;
};

export const reverseGeocode = async (lat: number, lon: number) => {
  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  const cached = reverseCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `${GEO_BASE}/reverse?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to reverse geocode");
    }

    const payload = (await response.json()) as ApiResponse<{ label: string }>;
    if (payload.data?.label) {
      reverseCache.set(cacheKey, payload.data.label);
      return payload.data.label;
    }
  } catch {
    // Fallback to local approximation below.
  }

  const nearestLabel = getNearestKnownLocationLabel(lat, lon);
  if (nearestLabel) {
    const fallback = `${nearestLabel}, Punjab`;
    reverseCache.set(cacheKey, fallback);
    return fallback;
  }

  const fallback = `Lat ${lat.toFixed(4)}, Lng ${lon.toFixed(4)}`;
  reverseCache.set(cacheKey, fallback);
  return fallback;
};

export const getBrowserCurrentLocation = () =>
  new Promise<Coordinate>((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Location services are not available in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve([position.coords.latitude, position.coords.longitude]);
      },
      () => {
        reject(new Error("Unable to get your current location."));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000,
      }
    );
  });
