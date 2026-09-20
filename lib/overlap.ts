import { sql } from "@/lib/db";

// A rental's [start_ts, end_ts) window overlaps a query window [start, end)
// when it starts before the window ends and ends after the window starts.
// Shared by the reservation insert (app/api/reservations/route.ts, where
// it's embedded in an atomic INSERT ... WHERE NOT EXISTS to avoid a
// check-then-insert race) and the availability filter on the home page.
export const overlapsWindow = (start: string, end: string) =>
  sql`start_ts < ${end}::timestamptz AND end_ts > ${start}::timestamptz`;
