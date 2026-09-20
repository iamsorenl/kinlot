// Timezone convention: every timestamp is stored and passed between client
// and server as UTC (ISO 8601 with trailing "Z"). The only place a timestamp
// is ever naive/local is inside an <input type="datetime-local">, which has
// no timezone of its own — it's whatever the browser's clock says. These
// helpers run in the browser, so `new Date(...)` there resolves naive
// strings using the visitor's real local timezone, which is the only place
// that timezone is knowable.

// datetime-local string ("YYYY-MM-DDTHH:mm") -> UTC ISO string, interpreted
// in the browser's local timezone. Returns null for empty/invalid input.
export function toUTCISO(local: string | null | undefined): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// UTC ISO string (or Date, as returned by the DB driver) -> datetime-local
// string in the browser's local timezone, for populating a form input.
export function toLocalInput(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
