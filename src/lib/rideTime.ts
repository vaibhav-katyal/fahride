const toMinutes = (value: string) => {
  const [hoursText, minutesText] = value.split(":");
  const hours = Number.parseInt(hoursText || "", 10);
  const minutes = Number.parseInt(minutesText || "", 10);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
};

const normalizeLocalDate = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10) - 1;
  const day = Number.parseInt(match[3], 10);

  const date = new Date(year, month, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
};

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const normalizeRepeatDay = (value: string) => {
  const token = value.trim().toLowerCase();

  if (token.length < 3) {
    return null;
  }

  const normalized = `${token[0].toUpperCase()}${token.slice(1, 3)}`;
  return WEEK_DAYS.includes(normalized as (typeof WEEK_DAYS)[number])
    ? (normalized as (typeof WEEK_DAYS)[number])
    : null;
};

export const getRepeatRideLiveMessage = (repeatDays: string[] | undefined) => {
  const status = getRepeatRideLiveStatus(repeatDays);
  return status?.message ?? null;
};

export const getRepeatRideLiveStatus = (repeatDays: string[] | undefined) => {
  if (!Array.isArray(repeatDays) || repeatDays.length === 0) {
    return null;
  }

  const normalizedDays = Array.from(
    new Set(
      repeatDays
        .map(normalizeRepeatDay)
        .filter((day): day is (typeof WEEK_DAYS)[number] => Boolean(day))
    )
  );

  if (normalizedDays.length === 0) {
    return null;
  }

  const todayIndex = new Date().getDay();
  const todayName = WEEK_DAYS[todayIndex];

  if (normalizedDays.includes(todayName)) {
    return {
      tone: "live-today" as const,
      message: "Ride is live today.",
    };
  }

  for (let offset = 1; offset <= 7; offset += 1) {
    const nextIndex = (todayIndex + offset) % 7;
    const nextDay = WEEK_DAYS[nextIndex];
    if (normalizedDays.includes(nextDay)) {
      return {
        tone: "next-live" as const,
        message: `Ride will come live on ${nextDay}.`,
      };
    }
  }

  return {
    tone: "next-live" as const,
    message: `Ride will come live on: ${normalizedDays.join(", ")}.`,
  };
};

export const isRideRequestWindowClosed = (rideDate: string | undefined, departureTime: string) => {
  if (!rideDate) {
    return false;
  }

  const normalizedRideDate = normalizeLocalDate(rideDate);
  if (!normalizedRideDate) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (normalizedRideDate.getTime() < today.getTime()) {
    return true;
  }

  if (normalizedRideDate.getTime() > today.getTime()) {
    return false;
  }

  const rideDepartureMinutes = toMinutes(departureTime);
  if (rideDepartureMinutes === null) {
    return false;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return rideDepartureMinutes <= currentMinutes;
};
