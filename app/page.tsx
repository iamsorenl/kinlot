import { sql } from "@/lib/db";
import SpotMap, { type Spot } from "@/components/SpotMap";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

export default async function Home() {
  const spots = (await sql`
    SELECT id, name, addr, locality, price_rate, price_unit, lat, lng FROM spot ORDER BY name
  `) as Spot[];

  return (
    <main style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          margin: "0.5rem 1rem",
        }}
      >
        <h1 style={{ margin: 0 }}>ParkMe2 &mdash; find and reserve parking</h1>
        <Header />
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
