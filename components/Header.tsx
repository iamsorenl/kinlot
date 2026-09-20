import Link from "next/link";
import { sql } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { logout } from "@/app/auth/actions";

export default async function Header() {
  const userId = await getUserId();
  let email: string | null = null;
  if (userId) {
    const rows = (await sql`
      SELECT email FROM account WHERE id = ${userId}
    `) as { email: string }[];
    email = rows[0]?.email ?? null;
  }

  return (
    <nav style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      {email ? (
        <>
          <span>{email}</span>
          <Link href="/my-spots">My spots</Link>
          <Link href="/my-reservations">My reservations</Link>
          <Link href="/spots/new">Add a spot</Link>
          <Link href="/profile">Edit profile</Link>
          <form action={logout}>
            <button type="submit">Log out</button>
          </form>
        </>
      ) : (
        <>
          <Link href="/login">Log in</Link>
          <Link href="/signup">Sign up</Link>
        </>
      )}
    </nav>
  );
}
