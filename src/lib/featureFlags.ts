const TRUE_VALUES = new Set(["1", "true", "yes", "on", "enabled"]);
const FALSE_VALUES = new Set(["0", "false", "no", "off", "disabled"]);

export const isFeatureEnabled = (flagName: string, fallback = false) => {
  const rawValue = (import.meta.env as Record<string, unknown>)[flagName];

  if (typeof rawValue === "boolean") {
    return rawValue;
  }

  if (typeof rawValue !== "string") {
    return fallback;
  }

  const normalized = rawValue.trim().toLowerCase();

  if (TRUE_VALUES.has(normalized)) {
    return true;
  }

  if (FALSE_VALUES.has(normalized)) {
    return false;
  }

  return fallback;
};
