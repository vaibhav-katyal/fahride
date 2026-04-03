import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";
import { useNavigate } from "react-router-dom";
import type { Ride } from "./RideCard";
import RideCard from "./RideCard";

interface HomeLiveMapProps {
  currentLocation: [number, number] | null;
  locationLabel: string;
  isLocating: boolean;
  filteredRides?: Ride[];
  rideCoordinates?: Map<string, [number, number]>;
  currentUser?: { email?: string };
}

type Coordinate = [number, number];

const createNearbyCarIcon = (angle: number = 0) =>
  L.divIcon({
    html: `
      <div style="display:flex;align-items:center;justify-content:center;cursor:pointer;">
        <img src="/car.png" alt="car" style="width:32px;height:32px;transform:rotate(${angle}deg);filter:drop-shadow(0 1px 2px rgba(0,0,0,0.15));" />
      </div>
    `,
    className: "home-nearby-car-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

const createCurrentLocationIcon = () =>
  L.divIcon({
    html: `
      <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;inset:0;border-radius:9999px;background:#2563eb;opacity:0.22;animation:live-map-pulse 1.8s infinite;"></div>
        <div style="position:absolute;inset:6px;border-radius:9999px;background:#2563eb;opacity:0.35;"></div>
        <div style="position:relative;width:10px;height:10px;border-radius:9999px;background:#2563eb;box-shadow:0 0 0 2px rgba(255,255,255,0.85);"></div>
      </div>
    `,
    className: "home-live-location-icon",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const HomeLiveMap = ({ currentLocation, locationLabel, isLocating, filteredRides = [], rideCoordinates = new Map(), currentUser }: HomeLiveMapProps) => {
  const navigate = useNavigate();
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const currentMarkerRef = useRef<L.Marker | null>(null);
  const rideMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const hasCenteredRef = useRef(false);
  const [hoveredRideId, setHoveredRideId] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapElementRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapElementRef.current, {
        zoomControl: false,
        scrollWheelZoom: true,
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true,
      }).setView([30.7333, 76.7794], 13);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(mapRef.current);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png", {
        attribution: false,
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(mapRef.current);

      layerGroupRef.current = L.layerGroup().addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      layerGroupRef.current = null;
      currentMarkerRef.current = null;
      hasCenteredRef.current = false;
    };
  }, []);

  // Update current location marker
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current || !currentLocation) return;

    if (!currentMarkerRef.current) {
      currentMarkerRef.current = L.marker(currentLocation as L.LatLngExpression, {
        icon: createCurrentLocationIcon(),
      })
        .bindTooltip("You are here", { direction: "top", offset: [0, -10] })
        .addTo(layerGroupRef.current);
    } else {
      currentMarkerRef.current.setLatLng(currentLocation as L.LatLngExpression);
    }

    if (!hasCenteredRef.current) {
      mapRef.current.setView(currentLocation as L.LatLngExpression, 15, { animate: true });
      hasCenteredRef.current = true;
    }
  }, [currentLocation]);

  // Update ride markers
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return;

    // Clear old ride markers
    rideMarkersRef.current.forEach((marker) => {
      layerGroupRef.current?.removeLayer(marker);
    });
    rideMarkersRef.current.clear();

    // Add new ride markers for filtered rides
    filteredRides.forEach((ride) => {
      const rideCoords = rideCoordinates.get(ride.id);
      if (!rideCoords) return;

      const marker = L.marker(rideCoords as L.LatLngExpression, {
        icon: createNearbyCarIcon(0),
      })
        .addTo(layerGroupRef.current!)
        .on("click", () => {
          navigate(`/ride/${ride.id}`);
        })
        .on("mouseover", () => {
          setHoveredRideId(ride.id);
          marker.setIcon(createNearbyCarIcon(45));
        })
        .on("mouseout", () => {
          setHoveredRideId(null);
          marker.setIcon(createNearbyCarIcon(0));
        });

      rideMarkersRef.current.set(ride.id, marker);
    });
  }, [filteredRides, rideCoordinates, navigate]);

  return (
    <div className="absolute inset-0 h-full w-full bg-[#eef1f4]">
      <div ref={mapElementRef} className="absolute inset-0 h-full w-full" />

      <div className="pointer-events-auto absolute left-3 top-3 z-[999]">
        <div className="rounded-2xl border border-black/15 bg-white/95 px-4 py-3 shadow-[0_12px_32px_rgba(17,24,39,0.12)] backdrop-blur-lg">
          <p className="text-sm font-semibold text-slate-900">{isLocating ? "Detecting..." : locationLabel}</p>
        </div>
      </div>

      <div className="pointer-events-auto absolute right-3 top-3 z-[999] md:right-6 md:top-6">
        <button
          type="button"
          onClick={() => {
            if (mapRef.current && currentLocation) {
              mapRef.current.setView(currentLocation as L.LatLngExpression, 15, { animate: true });
              hasCenteredRef.current = true;
            }
          }}
          disabled={!currentLocation}
          className="flex items-center justify-center rounded-full border border-black/10 bg-white/92 w-10 h-10 shadow-[0_8px_22px_rgba(17,24,39,0.14)] backdrop-blur-xl transition-colors hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          title="Center map to your location"
        >
          <svg className="w-5 h-5 text-slate-700" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11 10.07 7.5 12 7.5s3.5 1.57 3.5 3.5z" />
          </svg>
        </button>
      </div>

      {/* Hover Card */}
      {hoveredRideId && filteredRides.find((r) => r.id === hoveredRideId) && (
        <div className="pointer-events-none absolute left-3 bottom-3 z-[500] md:left-6 md:bottom-6 max-w-sm">
          <div className="pointer-events-auto">
            {(() => {
              const ride = filteredRides.find((r) => r.id === hoveredRideId)!;
              const isOwnRide = currentUser ? ride.driverEmail === currentUser.email : false;
              return <RideCard ride={ride} isOwnRide={isOwnRide} />;
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeLiveMap;
