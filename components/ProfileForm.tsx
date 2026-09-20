"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/profile/actions";

export default function ProfileForm({
  defaultValues,
}: {
  defaultValues: { name: string | null; phone: string | null; email: string };
}) {
  const [state, formAction, pending] = useActionState(updateProfile, undefined);

  return (
    <form
      action={formAction}
      style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
    >
      <label htmlFor="name">Name</label>
      <input id="name" name="name" defaultValue={defaultValues.name ?? ""} />
      <label htmlFor="phone">Phone</label>
      <input id="phone" name="phone" type="tel" defaultValue={defaultValues.phone ?? ""} />
      <label htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        required
        defaultValue={defaultValues.email}
      />
      {state?.error && <p style={{ color: "crimson" }}>{state.error}</p>}
      {state?.success && <p style={{ color: "green" }}>Saved.</p>}
      <button disabled={pending} type="submit">
        Save
      </button>
    </form>
  );
}
