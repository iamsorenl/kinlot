"use client";

// Renders a stored UTC timestamp in the *viewer's* local timezone. Must be a
// client component: the server has no idea what timezone the visitor is in.
export default function LocalTime({ value }: { value: string | Date | null }) {
  if (!value) return null;
  return (
    <>
      {new Date(value).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })}
    </>
  );
}
