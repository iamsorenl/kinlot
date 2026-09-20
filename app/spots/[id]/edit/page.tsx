import { notFound, redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import Header from "@/components/Header";
import SpotForm from "@/components/SpotForm";
import { updateSpot } from "@/app/spots/actions";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toISO = (v: string | Date | null) => (v ? new Date(v).toISOString() : null);

export default async function EditSpotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const rows = (await sql`
    SELECT * FROM spot WHERE id = ${id} AND owner_id = ${userId}
  `) as {
    name: string;
    description: string | null;
    addr: string | null;
    price_rate: string;
    price_unit: string;
    available_start: string | Date | null;
    available_end: string | Date | null;
    photo_url: string | null;
  }[];
  const spot = rows[0];
  if (!spot) notFound();

  return (
    <main style={{ maxWidth: "40rem", margin: "0 auto", padding: "1rem" }}>
      <Header />
      <h1>Edit spot</h1>
      <SpotForm
        action={updateSpot}
        defaultValues={{
          id,
          name: spot.name,
          description: spot.description,
          addr: spot.addr,
          price_rate: spot.price_rate,
          price_unit: spot.price_unit,
          available_start: toISO(spot.available_start),
          available_end: toISO(spot.available_end),
          photo_url: spot.photo_url,
        }}
      />
    </main>
  );
}
