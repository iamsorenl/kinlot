"use server";

import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { geocode } from "@/lib/geocode";

type State = { error: string } | undefined;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readFields(formData: FormData): { error: string } | {
  name: string;
  description: string | null;
  address: string;
  price_rate: number;
  price_unit: "hour" | "day";
  available_start: string | null;
  available_end: string | null;
} {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim();
  const price_rate = Number(formData.get("price_rate"));
  const price_unit = String(formData.get("price_unit") ?? "");
  const available_start = String(formData.get("available_start") ?? "") || null;
  const available_end = String(formData.get("available_end") ?? "") || null;

  if (!name) return { error: "Name is required" };
  if (!address) return { error: "Address is required" };
  if (!Number.isFinite(price_rate) || price_rate < 0)
    return { error: "Price must be a number, 0 or more" };
  if (price_unit !== "hour" && price_unit !== "day")
    return { error: "Price unit must be hour or day" };
  if (available_start && available_end && available_start >= available_end)
    return { error: "Availability start must be before end" };
  return { name, description, address, price_rate, price_unit, available_start, available_end };
}

export async function createSpot(_state: State, formData: FormData): Promise<State> {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const f = readFields(formData);
  if ("error" in f) return f;

  const geo = await geocode(f.address);
  if (!geo) return { error: "Address not found" };

  await sql`
    INSERT INTO spot
      (name, description, addr, zipcode, locality, region, country,
       lat, lng, price_rate, price_unit, available_start, available_end, owner_id)
    VALUES
      (${f.name}, ${f.description}, ${f.address}, ${geo.zipcode}, ${geo.locality},
       ${geo.region}, ${geo.country}, ${geo.lat}, ${geo.lng}, ${f.price_rate},
       ${f.price_unit}, ${f.available_start}, ${f.available_end}, ${userId})
  `;
  redirect("/my-spots");
}

export async function updateSpot(_state: State, formData: FormData): Promise<State> {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) return { error: "Not found or not yours" };

  const f = readFields(formData);
  if ("error" in f) return f;

  const stored = (await sql`
    SELECT addr, is_protected FROM spot WHERE id = ${id} AND owner_id = ${userId}
  `) as { addr: string | null; is_protected: boolean }[];
  if (!stored[0]) return { error: "Not found or not yours" };
  if (stored[0].is_protected)
    return { error: "This is a protected demo spot and can't be edited" };

  let rows: { id: string }[];
  if (stored[0].addr !== f.address) {
    const geo = await geocode(f.address);
    if (!geo) return { error: "Address not found" };
    rows = (await sql`
      UPDATE spot SET
        name = ${f.name}, description = ${f.description}, addr = ${f.address},
        zipcode = ${geo.zipcode}, locality = ${geo.locality}, region = ${geo.region},
        country = ${geo.country}, lat = ${geo.lat}, lng = ${geo.lng},
        price_rate = ${f.price_rate}, price_unit = ${f.price_unit},
        available_start = ${f.available_start}, available_end = ${f.available_end}
      WHERE id = ${id} AND owner_id = ${userId} AND is_protected = FALSE
      RETURNING id
    `) as { id: string }[];
  } else {
    rows = (await sql`
      UPDATE spot SET
        name = ${f.name}, description = ${f.description},
        price_rate = ${f.price_rate}, price_unit = ${f.price_unit},
        available_start = ${f.available_start}, available_end = ${f.available_end}
      WHERE id = ${id} AND owner_id = ${userId} AND is_protected = FALSE
      RETURNING id
    `) as { id: string }[];
  }
  if (!rows[0]) return { error: "Not found or not yours" };
  redirect("/my-spots");
}

export async function deleteSpot(formData: FormData): Promise<State> {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) return { error: "Not found or not yours" };

  const stored = (await sql`
    SELECT is_protected FROM spot WHERE id = ${id} AND owner_id = ${userId}
  `) as { is_protected: boolean }[];
  if (!stored[0]) return { error: "Not found or not yours" };
  if (stored[0].is_protected)
    return { error: "This is a protected demo spot and can't be deleted" };

  const rows = (await sql`
    DELETE FROM spot WHERE id = ${id} AND owner_id = ${userId} AND is_protected = FALSE
    RETURNING id
  `) as { id: string }[];
  if (!rows[0]) return { error: "Not found or not yours" };
  redirect("/");
}
