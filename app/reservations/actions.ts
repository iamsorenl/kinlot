"use server";

import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getUserId } from "@/lib/auth";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function cancelReservation(formData: FormData) {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const id = String(formData.get("id") ?? "");
  if (UUID_RE.test(id)) {
    await sql`DELETE FROM rental WHERE id = ${id} AND account_id = ${userId}`;
  }
  redirect("/my-reservations");
}
