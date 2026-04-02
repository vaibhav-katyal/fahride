export type Coordinate = [number, number];

export interface PlaceSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export const fetchPlaceSuggestions = async (query: string) => {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=in&q=${encodeURIComponent(
    query
  )}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch places");
  }

  return (await response.json()) as PlaceSuggestion[];
};

export const reverseGeocode = async (lat: number, lon: number) => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to resolve location");
  }

  const data = (await response.json()) as {
    display_name?: string;
    address?: {
      city?: string;
      town?: string;
      village?: string;
      state?: string;
      county?: string;
    };
  };

  const area = data.address?.city || data.address?.town || data.address?.village || data.address?.county;
  return area && data.address?.state ? `${area}, ${data.address.state}` : data.display_name || "Current location";
};
