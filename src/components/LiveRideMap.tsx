import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";
import { geocodeLocationName, resolveLocationCoordinate } from "@/lib/location";
import { useSocket } from "@/context/SocketContext";

type Coordinate = [number, number];

interface LiveRideMapProps {
  from: string;
  to: string;
  rideId?: string;
  requestId?: string;
  isDriver?: boolean;
}

const createPulsingDotIcon = (color: string, label: string) =>
  L.divIcon({
    html: `
      <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;inset:0;border-radius:9999px;background:${color};opacity:0.22;animation:live-map-pulse 1.8s infinite;"></div>
        <div style="position:absolute;inset:6px;border-radius:9999px;background:${color};opacity:0.42;"></div>
        <div style="position:relative;width:10px;height:10px;border-radius:9999px;background:${color};box-shadow:0 0 0 2px rgba(255,255,255,0.85);"></div>
        <div style="position:absolute;top:32px;white-space:nowrap;font-size:10px;font-weight:700;color:#111827;background:rgba(255,255,255,0.9);padding:2px 6px;border-radius:9999px;box-shadow:0 1px 4px rgba(0,0,0,0.12);">${label}</div>
      </div>
    `,
    className: "live-pulse-icon",
    iconSize: [28, 42],
    iconAnchor: [14, 14],
    tooltipAnchor: [0, -12],
  });

const createStopIcon = (color: string) =>
  L.divIcon({
    html: `
      <div style="width:16px;height:16px;border-radius:9999px;border:3px solid ${color};background:#ffffff;box-shadow:0 1px 4px rgba(0,0,0,0.2);"></div>
    `,
    className: "live-stop-icon",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

const createCarIcon = (angle: number) =>
  L.divIcon({
    html: `
      <div style="position:relative;width:30px;height:30px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;inset:0;border-radius:9999px;background:#16a34a;opacity:0.2;animation:live-map-pulse 1.6s infinite;"></div>
        <div style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;transform:rotate(${angle}deg);font-size:20px;line-height:1;position:relative;z-index:1;">🚗</div>
      </div>
    `,
    className: "live-car-icon",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

const getCoordinates = async (query: string): Promise<Coordinate> => {
  try {
    return await geocodeLocationName(query);
  } catch {
    // Fall through to local fallback.
  }

  const local = resolveLocationCoordinate(query);
  if (local) {
    return local;
  }

  const seed = Array.from(query).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const latOffset = ((seed % 180) - 90) / 1000;
  const lonOffset = ((seed % 220) - 110) / 1000;
  return [30.7333 + latOffset, 76.7794 + lonOffset];
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

const getBearing = (start: Coordinate, end: Coordinate) => {
  const startLat = (start[0] * Math.PI) / 180;
  const startLng = (start[1] * Math.PI) / 180;
  const endLat = (end[0] * Math.PI) / 180;
  const endLng = (end[1] * Math.PI) / 180;

  const deltaLng = endLng - startLng;
  const y = Math.sin(deltaLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(deltaLng);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
};

const clearGeoWatch = (watchRef: React.MutableRefObject<number | null>) => {
  if (watchRef.current !== null && "geolocation" in navigator) {
    navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
  }
};

const LiveRideMap = ({ from, to, rideId, requestId, isDriver = false }: LiveRideMapProps) => {
  const { liveRideLocation, joinLiveRide, leaveLiveRide, sendRideLocation } = useSocket();
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentLocationWatchRef = useRef<number | null>(null);
  const currentLocationMarkerRef = useRef<L.Marker | null>(null);
  const carMarkerRef = useRef<L.Marker | null>(null);
  const routeBoundsRef = useRef<L.LatLngBounds | null>(null);
  const liveTrackingEnabledRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [distanceMiles, setDistanceMiles] = useState<number | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const clearAnimation = () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    const clearLocationWatch = () => {
      clearGeoWatch(currentLocationWatchRef);
    };

    if (rideId && requestId) {
      joinLiveRide(rideId, requestId);
    }

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

        if (currentLocationMarkerRef.current) {
          currentLocationMarkerRef.current.remove();
          currentLocationMarkerRef.current = null;
        }

        const polyline = L.polyline(routePoints as L.LatLngExpression[], {
          color: "#ef5b7f",
          weight: 4,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round",
          dashArray: "8 8",
        }).addTo(layerGroupRef.current);

        const pickupMarker = L.marker(routePoints[0] as L.LatLngExpression, { icon: createStopIcon("#ef5b7f") })
          .bindTooltip("Pickup", { permanent: false, direction: "top", offset: [0, -10] })
          .addTo(layerGroupRef.current);

        const dropMarker = L.marker(routePoints[routePoints.length - 1] as L.LatLngExpression, { icon: createStopIcon("#111827") })
          .bindTooltip("Drop", { permanent: false, direction: "top", offset: [0, -10] })
          .addTo(layerGroupRef.current);

        void pickupMarker;
        void dropMarker;

        const carMarker = L.marker(routePoints[0] as L.LatLngExpression, { icon: createCarIcon(0) })
          .bindTooltip("Live trip", { direction: "top", offset: [0, -10] })
          .addTo(layerGroupRef.current);
        carMarkerRef.current = carMarker;

        const routePulseMarker = L.marker(routePoints[0] as L.LatLngExpression, {
          icon: createPulsingDotIcon("#ef5b7f", "Route start"),
        }).addTo(layerGroupRef.current);

        void routePulseMarker;

        routeBoundsRef.current = polyline.getBounds();
        mapRef.current.fitBounds(routeBoundsRef.current, { padding: [40, 40] });

        const interpolate = (start: Coordinate, end: Coordinate, progress: number): Coordinate => {
          const eased = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          return [
            start[0] + (end[0] - start[0]) * eased,
            start[1] + (end[1] - start[1]) * eased,
          ];
        };

        const segmentDistance = (start: Coordinate, end: Coordinate) => {
          const latDelta = end[0] - start[0];
          const lngDelta = end[1] - start[1];
          return Math.sqrt(latDelta * latDelta + lngDelta * lngDelta);
        };

        const haversineMiles = (a: Coordinate, b: Coordinate) => {
          const R = 6371;
          const dLat = ((b[0] - a[0]) * Math.PI) / 180;
          const dLon = ((b[1] - a[1]) * Math.PI) / 180;
          const lat1 = (a[0] * Math.PI) / 180;
          const lat2 = (b[0] * Math.PI) / 180;
          const h =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
          const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
          const km = R * c;
          return km * 0.621371;
        };

        const totalMiles = routePoints.reduce((acc, point, idx) => {
          if (idx === 0) return 0;
          return acc + haversineMiles(routePoints[idx - 1], point);
        }, 0);
        setDistanceMiles(totalMiles);
        setEtaMinutes(Math.max(4, Math.round((totalMiles / 18) * 60)));

        const animate = (segmentIndex: number, startTime: number) => {
          if (isCancelled || routePoints.length < 2) return;

          const start = routePoints[segmentIndex];
          const end = routePoints[(segmentIndex + 1) % routePoints.length];
          const distance = Math.max(segmentDistance(start, end), 0.0001);
          const duration = Math.min(2800, Math.max(1100, distance * 140000));
          const bearing = getBearing(start, end);
          carMarker.setIcon(createCarIcon(bearing));

          const tick = (timestamp: number) => {
            if (isCancelled) return;

            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            carMarker.setLatLng(interpolate(start, end, progress) as L.LatLngExpression);

            const routeProgress = (segmentIndex + progress) / (routePoints.length - 1);
            setProgress(Math.min(Math.max(routeProgress, 0), 1));

            if (progress < 1) {
              animationFrameRef.current = window.requestAnimationFrame(tick);
              return;
            }

            if (segmentIndex >= routePoints.length - 2) {
              window.setTimeout(() => {
                if (!isCancelled) {
                  setProgress(0);
                  animationFrameRef.current = window.requestAnimationFrame((nextTimestamp) =>
                    animate(0, nextTimestamp)
                  );
                }
              }, 700);
              return;
            }

            const nextSegment = segmentIndex + 1;
            animationFrameRef.current = window.requestAnimationFrame((nextTimestamp) =>
              animate(nextSegment, nextTimestamp)
            );
          };

          animationFrameRef.current = window.requestAnimationFrame(tick);
        };

        if (!rideId || !requestId) {
          animationFrameRef.current = window.requestAnimationFrame((timestamp) => animate(0, timestamp));
        }

        if (isDriver && "geolocation" in navigator) {
          currentLocationWatchRef.current = navigator.geolocation.watchPosition(
            (position) => {
              const liveLocation: Coordinate = [position.coords.latitude, position.coords.longitude];

              if (!mapRef.current) return;

              if (!currentLocationMarkerRef.current) {
                currentLocationMarkerRef.current = L.marker(liveLocation, {
                  icon: createPulsingDotIcon("#2563eb", "You are here"),
                })
                  .bindTooltip("Live location", { direction: "top", offset: [0, -10] })
                  .addTo(layerGroupRef.current!);
              } else {
                currentLocationMarkerRef.current.setLatLng(liveLocation as L.LatLngExpression);
              }

              if (rideId && requestId) {
                liveTrackingEnabledRef.current = true;
                if (animationFrameRef.current !== null) {
                  window.cancelAnimationFrame(animationFrameRef.current);
                  animationFrameRef.current = null;
                }

                carMarkerRef.current?.setLatLng(liveLocation as L.LatLngExpression);

                sendRideLocation({
                  rideId,
                  requestId,
                  lat: liveLocation[0],
                  lon: liveLocation[1],
                  heading: Number.isFinite(position.coords.heading) ? position.coords.heading : undefined,
                  speed: Number.isFinite(position.coords.speed) ? position.coords.speed : undefined,
                  timestamp: new Date().toISOString(),
                });
              }
            },
            () => {
              // Silent fallback if the user denies location permission.
            },
            {
              enableHighAccuracy: true,
              maximumAge: 10000,
              timeout: 10000,
            }
          );
        }
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
      clearGeoWatch(currentLocationWatchRef);
      if (rideId && requestId) {
        leaveLiveRide();
      }
    };
  }, [from, to, rideId, requestId, isDriver, joinLiveRide, leaveLiveRide, sendRideLocation]);

  useEffect(() => {
    if (!rideId || !requestId || !liveRideLocation) return;
    if (liveRideLocation.rideId !== rideId || liveRideLocation.requestId !== requestId) return;

    liveTrackingEnabledRef.current = true;
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    carMarkerRef.current?.setLatLng([liveRideLocation.lat, liveRideLocation.lon] as L.LatLngExpression);

    if (mapRef.current) {
      mapRef.current.panTo([liveRideLocation.lat, liveRideLocation.lon] as L.LatLngExpression, {
        animate: true,
        duration: 0.5,
      });
    }
  }, [liveRideLocation, rideId, requestId]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      clearGeoWatch(currentLocationWatchRef);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      layerGroupRef.current = null;
    };
  }, []);

  return (
    <div className="absolute inset-0 h-full w-full bg-[#eef1f4]">
      <div ref={mapElementRef} className="absolute inset-0 h-full w-full" />

      <div className="pointer-events-none absolute left-3 right-3 top-3 z-[3] flex items-start justify-between gap-2">
        <div className="pointer-events-auto max-w-[75%] rounded-2xl border border-black/10 bg-white/92 px-3 py-2 shadow-[0_8px_22px_rgba(17,24,39,0.14)] backdrop-blur-xl">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ef5b7f]">
            <span className="h-2 w-2 rounded-full bg-[#ef5b7f] shadow-[0_0_0_6px_rgba(239,91,127,0.15)]" />
            Ride in progress
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-900">
            {from} → {to}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500">Tap zoom or drag to explore the route</p>
        </div>

        <div className="pointer-events-auto flex flex-col gap-2 relative z-[999]">
          <button
            type="button"
            onClick={() => {
              if (mapRef.current && routeBoundsRef.current) {
                mapRef.current.fitBounds(routeBoundsRef.current, { padding: [40, 40] });
              }
            }}
            className="rounded-full border border-black/10 bg-white/92 px-3 py-2 text-[11px] font-semibold text-slate-800 shadow-[0_8px_22px_rgba(17,24,39,0.14)] backdrop-blur-xl transition-colors hover:bg-white"
            title="View entire route"
          >
            Recenter
          </button>
          {isDriver && (
            <button
              type="button"
              onClick={() => {
                if (mapRef.current && currentLocationMarkerRef.current) {
                  const currentLoc = currentLocationMarkerRef.current.getLatLng();
                  mapRef.current.setView(currentLoc, 16, { animate: true });
                }
              }}
              className="flex items-center justify-center rounded-full border border-black/10 bg-white/92 w-10 h-10 shadow-[0_8px_22px_rgba(17,24,39,0.14)] backdrop-blur-xl transition-colors hover:bg-white"
              title="Center map to your location"
            >
              <svg className="w-5 h-5 text-slate-700" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11 10.07 7.5 12 7.5s3.5 1.57 3.5 3.5z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-[3] flex items-end justify-between gap-2">
        <div className="w-full rounded-2xl border border-black/10 bg-white/95 px-3 py-2 shadow-[0_10px_26px_rgba(17,24,39,0.14)] backdrop-blur-xl">
          <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-700">
            <span>{distanceMiles ? `${distanceMiles.toFixed(1)} mi` : "-- mi"}</span>
            <span>{etaMinutes ? `${etaMinutes} min` : "-- min"}</span>
            <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <div className="relative h-1.5 rounded-full bg-slate-200">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-[#ef5b7f] transition-all duration-300"
              style={{ width: `${Math.max(6, progress * 100)}%` }}
            />
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white bg-[#ef5b7f] shadow"
              style={{ left: `calc(${Math.max(6, progress * 100)}% - 7px)` }}
            />
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 z-[2] flex items-center justify-center bg-secondary/70 text-xs text-muted-foreground backdrop-blur-[1px]">
          Loading live map...
        </div>
      )}

      {error && !isLoading && (
        <div className="absolute inset-0 z-[2] flex items-center justify-center bg-secondary/80 text-xs text-muted-foreground">
          {error}
        </div>
      )}
    </div>
  );
};

export default LiveRideMap;
