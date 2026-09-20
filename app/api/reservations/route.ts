import { sql } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { overlapsWindow } from "@/lib/overlap";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return Response.json({ error: "Log in to reserve" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const spotId = String(body?.spot_id ?? "");
  const startTs = String(body?.start_ts ?? "");
  const endTs = String(body?.end_ts ?? "");

  if (!UUID_RE.test(spotId))
    return Response.json({ error: "Invalid spot" }, { status: 400 });

  const start = new Date(startTs);
  const end = new Date(endTs);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
    return Response.json({ error: "Invalid start or end time" }, { status: 400 });
  if (end <= start)
    return Response.json({ error: "End time must be after start time" }, { status: 400 });
  if (start < new Date())
    return Response.json({ error: "Start time can't be in the past" }, { status: 400 });

  const spotRows = await sql`SELECT id FROM spot WHERE id = ${spotId}`;
  if (!spotRows[0]) return Response.json({ error: "Spot not found" }, { status: 404 });

  try {
    // Overlap check (new_start < existing_end AND new_end > existing_start) done
    // server-side inside the INSERT itself, so nothing can slip in between a
    // check and a separate insert. The DB's EXCLUDE constraint (schema.sql)
    // is the backstop for two of these landing at the exact same instant.
    const rows = (await sql`
      INSERT INTO rental (spot_id, account_id, start_ts, end_ts)
      SELECT ${spotId}, ${userId}, ${startTs}, ${endTs}
      WHERE NOT EXISTS (
        SELECT 1 FROM rental
        WHERE spot_id = ${spotId} AND ${overlapsWindow(startTs, endTs)}
      )
      RETURNING id
    `) as { id: string }[];

    if (!rows[0])
      return Response.json(
        { error: "That window overlaps an existing reservation" },
        { status: 409 },
      );

    return Response.json({ id: rows[0].id }, { status: 201 });
  } catch (e) {
    if ((e as { code?: string }).code === "23P01") {
      // Exclusion constraint caught a race between two simultaneous bookings.
      return Response.json(
        { error: "That window overlaps an existing reservation" },
        { status: 409 },
      );
    }
    throw e;
  }
}
