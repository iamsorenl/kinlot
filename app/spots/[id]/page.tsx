import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import SpotMap, { type Spot } from "@/components/SpotMap";
import Header from "@/components/Header";
import ReserveForm from "@/components/ReserveForm";
import LocalTime from "@/components/LocalTime";
import { priceLabel } from "@/lib/price";
import { deleteSpot } from "@/app/spots/actions";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SpotDetail = Spot & {
  description: string | null;
  zipcode: string | null;
  region: string | null;
  country: string | null;
  available_start: string | Date | null;
  available_end: string | Date | null;
  owner_id: string | null;
  is_protected: boolean;
};

export default async function SpotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const rows = (await sql`
    SELECT * FROM spot WHERE id = ${id}
  `) as SpotDetail[];
  const spot = rows[0];
  if (!spot) notFound();

  const userId = await getUserId();
  const upcoming = (await sql`
    SELECT id, start_ts, end_ts FROM rental
    WHERE spot_id = ${id} AND end_ts > now()
    ORDER BY start_ts
  `) as { id: string; start_ts: string; end_ts: string }[];

  const address = [
    spot.addr,
    spot.locality,
    spot.region,
    spot.zipcode,
    spot.country,
  ]
    .filter(Boolean)
    .join(", ");
  const hasStart = Boolean(spot.available_start);
  const hasEnd = Boolean(spot.available_end);

  return (
    <main style={{ maxWidth: "40rem", margin: "0 auto", padding: "1rem" }}>
      <Header />
      <p>
        <Link href="/">&larr; Back to map</Link>
      </p>
      <h1>{spot.name}</h1>
      {spot.description && <p>{spot.description}</p>}
      <p>{address}</p>
      <p>
        {hasStart || hasEnd ? (
          <>
            {hasStart && (
              <>
                Available <LocalTime value={spot.available_start} />
              </>
            )}
            {hasStart && hasEnd && " to "}
            {!hasStart && hasEnd && (
              <>
                Available until <LocalTime value={spot.available_end} />
              </>
            )}
            {hasStart && hasEnd && <LocalTime value={spot.available_end} />}
          </>
        ) : (
          "Availability not listed"
        )}
      </p>
      <p>
        <strong>{priceLabel(spot)}</strong>
      </p>
      {spot.owner_id !== null && spot.owner_id === userId && (
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {spot.is_protected ? (
            <em>Protected demo spot</em>
          ) : (
            <>
              <Link href={`/spots/${spot.id}/edit`}>Edit</Link>
              <form
                action={async (formData: FormData) => {
                  "use server";
                  await deleteSpot(formData);
                }}
              >
                <input type="hidden" name="id" value={spot.id} />
                <button type="submit">Delete</button>
              </form>
            </>
          )}
        </div>
      )}
      <div style={{ height: "20rem" }}>
        <SpotMap center={[spot.lat, spot.lng]} zoom={16} spots={[spot]} />
      </div>

      <h2>Reserve this spot</h2>
      {userId ? (
        <ReserveForm spotId={spot.id} />
      ) : (
        <p>
          <Link href="/login">Reserve this spot</Link>
        </p>
      )}

      <h2>Upcoming reservations</h2>
      {upcoming.length === 0 ? (
        <p>No upcoming reservations &mdash; this spot is open.</p>
      ) : (
        <ul>
          {upcoming.map((r) => (
            <li key={r.id}>
              <LocalTime value={r.start_ts} /> &ndash; <LocalTime value={r.end_ts} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
