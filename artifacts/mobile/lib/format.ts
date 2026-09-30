export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function daysAgo(n: number, hour = 12) {
  const d = new Date();
  d.setUTCHours(hour, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}

export function dayKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function fmtPace(distanceKm: number, durationMin: number, units: "metric" | "imperial") {
  if (!distanceKm || !durationMin) return "—";
  const perUnit = durationMin / (units === "metric" ? distanceKm : distanceKm * 0.621371);
  const m = Math.floor(perUnit);
  const s = Math.round((perUnit - m) * 60);
  return `${m}:${String(s).padStart(2, "0")} /${units === "metric" ? "km" : "mi"}`;
}

export function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}

export function kmDisplay(km: number, units: "metric" | "imperial") {
  const v = units === "metric" ? km : km * 0.621371;
  return `${Math.round(v * 10) / 10} ${units === "metric" ? "km" : "mi"}`;
}
