import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";

type Coordinate = [number, number];

interface LiveRideMapProps {
  from: string;
  to: string;
}

interface PlaceResult {
  lat: string;
  lon: string;
}

const carIcon = L.divIcon({
  html: '<div style="font-size:20px;transform:translate(-2px,-4px)">🚗</div>',
  className: "live-car-icon",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const getCoordinates = async (query: string): Promise<Coordinate> => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&q=${encodeURIComponent(query)}`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch coordinates");
  }

  const data = (await response.json()) as PlaceResult[];
  if (!data.length) {
    throw new Error("Location not found");
  }

  return [Number(data[0].lat), Number(data[0].lon)];
};

const getRoute = async (start: Coordinate, end: Coordinate): Promise<Coordinate[]> => {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
    );

    if (!response.ok) {
      throw new Error("Route fetch failed");
    }

    const data = (await response.json()) as {
      routes?: Array<{ geometry?: { coordinates?: number[][] } }>;
    };

    const coordinates = data.routes?.[0]?.geometry?.coordinates;
    if (!coordinates || !coordinates.length) {
      throw new Error("No route geometry");
    }

    return coordinates.map(([lng, lat]) => [lat, lng]);
  } catch {
    // Fallback to direct line when route API is unavailable.
    return [start, end];
  }
};

const LiveRideMap = ({ from, to }: LiveRideMapProps) => {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const animationTimerRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const clearAnimation = () => {
      if (animationTimerRef.current !== null) {
        window.clearInterval(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    };

    const loadMapData = async () => {
      setIsLoading(true);
      setError(null);
      clearAnimation();

      try {
        const [start, end] = await Promise.all([getCoordinates(from), getCoordinates(to)]);
        const routePoints = await getRoute(start, end);

        if (isCancelled) return;

        if (!mapElementRef.current) {
          setError("Map container unavailable");
          setIsLoading(false);
          return;
        }

        if (!mapRef.current) {
          mapRef.current = L.map(mapElementRef.current, {
            zoomControl: true,
            scrollWheelZoom: true,
            dragging: true,
            touchZoom: true,
            doubleClickZoom: true,
          });

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }).addTo(mapRef.current);
        }

        if (!layerGroupRef.current) {
          layerGroupRef.current = L.layerGroup().addTo(mapRef.current);
        }

        layerGroupRef.current.clearLayers();

        const polyline = L.polyline(routePoints as L.LatLngExpression[], {
          color: "#16a34a",
          weight: 5,
          opacity: 0.7,
        }).addTo(layerGroupRef.current);

        const pickupMarker = L.marker(routePoints[0] as L.LatLngExpression)
          .bindTooltip("Pickup", { permanent: true, direction: "top", offset: [0, -10] })
          .addTo(layerGroupRef.current);

        const dropMarker = L.marker(routePoints[routePoints.length - 1] as L.LatLngExpression)
          .bindTooltip("Drop", { permanent: true, direction: "top", offset: [0, -10] })
          .addTo(layerGroupRef.current);

        void pickupMarker;
        void dropMarker;

        const carMarker = L.marker(routePoints[0] as L.LatLngExpression, { icon: carIcon })
          .bindTooltip("Live trip", { direction: "top", offset: [0, -10] })
          .addTo(layerGroupRef.current);

        mapRef.current.fitBounds(polyline.getBounds(), { padding: [24, 24] });

        let step = 0;
        animationTimerRef.current = window.setInterval(() => {
          if (!routePoints.length) return;
          step = (step + 1) % routePoints.length;
          carMarker.setLatLng(routePoints[step] as L.LatLngExpression);
        }, 900);
      } catch {
        if (!isCancelled) {
          setError("Unable to load live route right now");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadMapData();

    return () => {
      isCancelled = true;
      clearAnimation();
    };
  }, [from, to]);

  useEffect(() => {
    return () => {
      if (animationTimerRef.current !== null) {
        window.clearInterval(animationTimerRef.current);
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      layerGroupRef.current = null;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-secondary text-xs text-muted-foreground">
        Loading live map...
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-secondary text-xs text-muted-foreground">
        {error}
      </div>
    );
  }

  return <div ref={mapElementRef} className="absolute inset-0 h-full w-full" />;
};

export default LiveRideMap;
