"use client";

import { useActionState, useState } from "react";
import { toLocalInput, toUTCISO } from "@/lib/time";

type State = { error: string } | undefined;

type DefaultValues = {
  id?: string;
  name?: string;
  description?: string | null;
  addr?: string | null;
  price_rate?: string;
  price_unit?: string;
  // UTC ISO strings (or null), as stored in the DB.
  available_start?: string | null;
  available_end?: string | null;
  photo_url?: string | null;
};

export default function SpotForm({
  action,
  defaultValues = {},
}: {
  action: (state: State, formData: FormData) => Promise<State>;
  defaultValues?: DefaultValues;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  // The visible datetime-local inputs hold browser-local wall time and are
  // never submitted directly (no `name`). Hidden inputs carry the UTC ISO
  // conversion under the real field names — see lib/time.ts.
  const [startLocal, setStartLocal] = useState(() =>
    toLocalInput(defaultValues.available_start),
  );
  const [endLocal, setEndLocal] = useState(() =>
    toLocalInput(defaultValues.available_end),
  );

  return (
    <form
      action={formAction}
      style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
    >
      {defaultValues.id && (
        <input type="hidden" name="id" value={defaultValues.id} />
      )}
      <label htmlFor="name">Name</label>
      <input id="name" name="name" required defaultValue={defaultValues.name ?? ""} />
      <label htmlFor="description">Description</label>
      <textarea
        id="description"
        name="description"
        defaultValue={defaultValues.description ?? ""}
      />
      <label htmlFor="address">Address</label>
      <input
        id="address"
        name="address"
        required
        defaultValue={defaultValues.addr ?? ""}
      />
      <label htmlFor="price_rate">Price</label>
      <input
        id="price_rate"
        name="price_rate"
        type="number"
        step="0.01"
        min="0"
        required
        defaultValue={defaultValues.price_rate ?? ""}
      />
      <label htmlFor="price_unit">Per</label>
      <select
        id="price_unit"
        name="price_unit"
        defaultValue={defaultValues.price_unit ?? "hour"}
      >
        <option value="hour">Hour</option>
        <option value="day">Day</option>
      </select>
      <label htmlFor="available_start">Available from</label>
      <input
        id="available_start"
        type="datetime-local"
        value={startLocal}
        onChange={(e) => setStartLocal(e.target.value)}
      />
      <input type="hidden" name="available_start" value={toUTCISO(startLocal) ?? ""} />
      <label htmlFor="available_end">Available until</label>
      <input
        id="available_end"
        type="datetime-local"
        value={endLocal}
        onChange={(e) => setEndLocal(e.target.value)}
      />
      <input type="hidden" name="available_end" value={toUTCISO(endLocal) ?? ""} />
      <label htmlFor="photo">Photo</label>
      {defaultValues.photo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={defaultValues.photo_url} alt="" style={{ maxWidth: "12rem" }} />
      )}
      <input id="photo" name="photo" type="file" accept="image/*" />
      {state?.error && <p style={{ color: "crimson" }}>{state.error}</p>}
      <button disabled={pending} type="submit">
        Save
      </button>
    </form>
  );
}
