import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import Header from "@/components/Header";
import ProfileForm from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const rows = (await sql`
    SELECT name, phone, email FROM account WHERE id = ${userId}
  `) as { name: string | null; phone: string | null; email: string }[];
  const account = rows[0];
  if (!account) redirect("/login");

  return (
    <main style={{ maxWidth: "40rem", margin: "0 auto", padding: "1rem" }}>
      <Header />
      <h1>Edit profile</h1>
      <ProfileForm defaultValues={account} />
    </main>
  );
}
