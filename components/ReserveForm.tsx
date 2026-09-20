"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ReserveForm({ spotId }: { spotId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    setPending(true);
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spot_id: spotId,
        start_ts: formData.get("start_ts"),
        end_ts: formData.get("end_ts"),
      }),
    });
    setPending(false);

    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Could not reserve this spot");
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "20rem" }}
    >
      <label htmlFor="start_ts">Start</label>
      <input id="start_ts" name="start_ts" type="datetime-local" required />
      <label htmlFor="end_ts">End</label>
      <input id="end_ts" name="end_ts" type="datetime-local" required />
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <button disabled={pending} type="submit">
        {pending ? "Reserving…" : "Reserve this spot"}
      </button>
    </form>
  );
}
