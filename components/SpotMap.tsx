"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { priceLabel } from "@/lib/price";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Image imports may be a URL string or a { src } object depending on bundler.
const url = (img: unknown) =>
  typeof img === "string" ? img : (img as { src: string }).src;

export type Spot = {
  id: string;
  name: string;
  addr: string | null;
  locality: string | null;
  price_rate: string;
  price_unit: "hour" | "day";
  lat: number;
  lng: number;
};


const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export default function SpotMap({
  center,
  zoom,
  spots,
}: {
  center: [number, number];
  zoom: number;
  spots: Spot[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let cancelled = false;

    // Leaflet touches `window` at import time, so load it only in the browser.
    import("leaflet").then((mod) => {
      // Leaflet ships UMD; depending on bundler interop the API may sit on `default`.
      const L = (("default" in mod ? mod.default : mod) ??
        mod) as typeof import("leaflet");
      if (cancelled || !ref.current) return;

      // Fix Leaflet's default icon paths, which break under bundlers.
      const icon = L.icon({
        iconUrl: url(markerIcon),
        iconRetinaUrl: url(markerIcon2x),
        shadowUrl: url(markerShadow),
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      map = L.map(ref.current).setView(center, zoom);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      for (const spot of spots) {
        L.marker([spot.lat, spot.lng], { icon })
          .addTo(map)
          .bindPopup(
            `<strong>${esc(spot.name)}</strong><br>` +
              `${esc([spot.addr, spot.locality].filter(Boolean).join(", "))}<br>` +
              `${esc(priceLabel(spot))}<br>` +
              `<a href="/spots/${encodeURIComponent(spot.id)}">View spot</a>`
          );
      }
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
    // Mount-only: markers are built once from the initial `spots`/`center`/
    // `zoom` props and never diffed against later prop changes. A caller
    // whose spot list can change (e.g. a filtered list) must force a
    // remount — pass a `key` that changes with the filter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref} style={{ height: "100%", width: "100%" }} />;
}
