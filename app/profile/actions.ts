"use server";

import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getUserId } from "@/lib/auth";

type State = { error: string; success?: undefined } | { success: true; error?: undefined } | undefined;

export async function updateProfile(_state: State, formData: FormData): Promise<State> {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const name = String(formData.get("name") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email.includes("@") || email.length > 254)
    return { error: "Enter a valid email address" };

  try {
    await sql`
      UPDATE account SET name = ${name}, phone = ${phone}, email = ${email}
      WHERE id = ${userId}
    `;
  } catch (e) {
    if ((e as { code?: string }).code === "23505")
      return { error: "That email is already in use" };
    throw e;
  }

  return { success: true };
}
