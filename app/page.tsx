import { sql } from "@/lib/db";
import SpotMap, { type Spot } from "@/components/SpotMap";
import Header from "@/components/Header";
import AvailabilityFilter from "@/components/AvailabilityFilter";
import { overlapsWindow } from "@/lib/overlap";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const { start, end } = await searchParams;
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  const hasValidWindow =
    startDate && endDate && !Number.isNaN(startDate.getTime()) &&
    !Number.isNaN(endDate.getTime()) && endDate > startDate;

  const spots = (
    hasValidWindow
      ? await sql`
          SELECT id, name, addr, locality, price_rate, price_unit, lat, lng
          FROM spot s
          WHERE NOT EXISTS (
            SELECT 1 FROM rental r
            WHERE r.spot_id = s.id AND ${overlapsWindow(start!, end!)}
          )
          ORDER BY name
        `
      : await sql`
          SELECT id, name, addr, locality, price_rate, price_unit, lat, lng
          FROM spot ORDER BY name
        `
  ) as Spot[];

  return (
    <main style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          margin: "0.5rem 1rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <h1 style={{ margin: 0 }}>ParkMe2 &mdash; find and reserve parking</h1>
        <Header />
      </div>
      <div style={{ margin: "0 1rem 0.5rem" }}>
        <AvailabilityFilter
          key={`${start ?? ""}|${end ?? ""}`}
          initialStartISO={start ?? ""}
          initialEndISO={end ?? ""}
        />
        {(start || end) && !hasValidWindow && (
          <p style={{ color: "crimson" }}>Invalid time window &mdash; showing all spots.</p>
        )}
        {hasValidWindow && (
          <p style={{ color: "#555" }}>
            Showing {spots.length} spot{spots.length === 1 ? "" : "s"} free for that window.
          </p>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <SpotMap center={[36.974, -122.03]} zoom={13} spots={spots} />
      </div>
      <p style={{ margin: "0.5rem 1rem", color: "#555" }}>
        Browse the map without an account &mdash; sign up to list a spot or reserve one.
      </p>
    </main>
  );
}
