"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toLocalInput, toUTCISO } from "@/lib/time";

export default function AvailabilityFilter({
  initialStartISO,
  initialEndISO,
}: {
  // UTC ISO strings from the URL query params, or "".
  initialStartISO: string;
  initialEndISO: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  // Converted client-side so the prefilled inputs show the viewer's local
  // wall time for the UTC instant in the URL, not the server's.
  const initialStart = toLocalInput(initialStartISO || null);
  const initialEnd = toLocalInput(initialEndISO || null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const startLocal = String(formData.get("start") ?? "");
    const endLocal = String(formData.get("end") ?? "");

    if (!startLocal && !endLocal) {
      router.push("/");
      return;
    }
    const start = toUTCISO(startLocal);
    const end = toUTCISO(endLocal);
    if (!start || !end) {
      setError("Enter both a start and end time");
      return;
    }
    if (end <= start) {
      setError("End time must be after start time");
      return;
    }
    router.push(`/?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}
    >
      <label htmlFor="avail-start">Available from</label>
      <input id="avail-start" name="start" type="datetime-local" defaultValue={initialStart} />
      <label htmlFor="avail-end">until</label>
      <input id="avail-end" name="end" type="datetime-local" defaultValue={initialEnd} />
      <button type="submit">Filter</button>
      {(initialStart || initialEnd) && (
        <button type="button" onClick={() => router.push("/")}>
          Clear
        </button>
      )}
      {error && <span style={{ color: "crimson" }}>{error}</span>}
    </form>
  );
}
