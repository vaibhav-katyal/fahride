export type RideAvailabilityKind = "available" | "last_seat" | "full" | "expired";

type RideScheduleLike = {
  date?: string;
  departureTime: string;
  seats: number;
};

export interface RideAvailabilityState {
  kind: RideAvailabilityKind;
  canRequest: boolean;
  badgeLabel: string;
  headline?: string;
  subtext?: string;
  ctaLabel?: string;
}

const parseTimeString = (value: string) => {
  const normalized = value.trim().toUpperCase();

  const twelveHourMatch = normalized.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))$/);
  if (twelveHourMatch) {
    const hours = Number.parseInt(twelveHourMatch[1] || "", 10);
    const minutes = Number.parseInt(twelveHourMatch[2] || "", 10);
    const period = twelveHourMatch[3];

    if (!Number.isFinite(hours) || !Number.isFinite(minutes) || !period) {
      return null;
    }

    return {
      hours: hours % 12 + (period === "PM" ? 12 : 0),
      minutes,
    };
  }

  const twentyFourHourMatch = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHourMatch) {
    const hours = Number.parseInt(twentyFourHourMatch[1] || "", 10);
    const minutes = Number.parseInt(twentyFourHourMatch[2] || "", 10);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return null;
    }

    return { hours, minutes };
  }

  return null;
};

const getRideDepartureDate = (ride: Pick<RideScheduleLike, "date" | "departureTime">) => {
  if (!ride.date) return null;

  const parsedDate = new Date(`${ride.date}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return null;

  const parsedTime = parseTimeString(ride.departureTime);
  if (!parsedTime) return null;

  parsedDate.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);
  return parsedDate;
};

export const formatRideDate = (date?: string): string => {
  if (!date) return "";

  const parsedDate = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  parsedDate.setHours(0, 0, 0, 0);

  if (parsedDate.getTime() === today.getTime()) {
    return "Today";
  } else if (parsedDate.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: parsedDate.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
};

export const getRideAvailabilityState = (
  ride: RideScheduleLike,
  now: Date = new Date()
): RideAvailabilityState => {
  const departureDate = getRideDepartureDate(ride);
  const hasDeparted = departureDate ? departureDate.getTime() <= now.getTime() : false;

  if (hasDeparted) {
    return {
      kind: "expired",
      canRequest: false,
      badgeLabel: "Ride ended",
      headline: "Sorry, you are late",
      subtext: "This ride has already departed.",
      ctaLabel: "Ride ended",
    };
  }

  if (ride.seats <= 0) {
    return {
      kind: "full",
      canRequest: false,
      badgeLabel: "Fully booked",
      headline: "Sorry!! Seats are full now",
      subtext: "Try another ride or check back later.",
      ctaLabel: "Seats full",
    };
  }

  if (ride.seats === 1) {
    return {
      kind: "last_seat",
      canRequest: true,
      badgeLabel: "Last seat left",
      headline: "Hurry up, one seat left",
      subtext: "One of you has already joined.",
      ctaLabel: "Request last seat",
    };
  }

  return {
    kind: "available",
    canRequest: true,
    badgeLabel: "Open",
  };
};