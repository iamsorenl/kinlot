import Link from "next/link";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import Header from "@/components/Header";
import LocalTime from "@/components/LocalTime";
import { cancelReservation } from "@/app/reservations/actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  spot_id: string;
  spot_name: string;
  start_ts: string;
  end_ts: string;
};

export default async function MyReservationsPage() {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const reservations = (await sql`
    SELECT r.id, r.spot_id, s.name AS spot_name, r.start_ts, r.end_ts
    FROM rental r
    JOIN spot s ON s.id = r.spot_id
    WHERE r.account_id = ${userId}
    ORDER BY r.start_ts
  `) as Row[];

  return (
    <main style={{ maxWidth: "40rem", margin: "0 auto", padding: "1rem" }}>
      <Header />
      <h1>My reservations</h1>
      {reservations.length === 0 ? (
        <p>
          No reservations yet. <Link href="/">Browse spots on the map</Link> to
          book one.
        </p>
      ) : (
        <ul style={{ padding: 0, listStyle: "none" }}>
          {reservations.map((r) => (
            <li key={r.id} style={{ marginBottom: "1rem" }}>
              <Link href={`/spots/${r.spot_id}`}>{r.spot_name}</Link>
              <br />
              <LocalTime value={r.start_ts} /> &ndash; <LocalTime value={r.end_ts} />
              <div>
                <form
                  action={async (formData: FormData) => {
                    "use server";
                    await cancelReservation(formData);
                  }}
                >
                  <input type="hidden" name="id" value={r.id} />
                  <button type="submit">Cancel</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
