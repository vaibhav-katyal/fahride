const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_ONLY_REGEX = /^\d{2}:\d{2}$/;

export const parseRideDateTime = (dateValue: string, timeValue: string): Date | null => {
  if (!DATE_ONLY_REGEX.test(dateValue) || !TIME_ONLY_REGEX.test(timeValue)) {
    return null;
  }

  const parsed = new Date(`${dateValue}T${timeValue}:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

export const isFutureRide = (dateValue: string, timeValue: string, now = new Date()) => {
  const departureAt = parseRideDateTime(dateValue, timeValue);
  if (!departureAt) {
    return false;
  }
  return departureAt.getTime() > now.getTime();
};
