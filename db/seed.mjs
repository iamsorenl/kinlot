import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { hashPassword } from "../lib/auth-core.ts";

const SCHEMA_SQL = readFileSync(new URL("./schema.sql", import.meta.url), "utf8");

// Real public parking in Santa Cruz, CA. Rates verified against city sources
// (santacruzca.gov parking pages, beachboardwalk.com) as of 2026-07.
// price_rate is $ per price_unit ('hour' default, or 'day' for flat-rate lots); 0 = free.
// owner_id stays NULL = public default, not user-editable.
const CITY_SPOTS = [
  {
    name: "Soquel/Front Parking Garage",
    description:
      "Multi-level city garage at Soquel Avenue and Front Street in downtown Santa Cruz, open daily except Thanksgiving, Christmas, and New Year's Day, with EV charging and pay-on-foot stations. $2/hr, $16 daily max.",
    addr: "601 Front St",
    lat: 36.973343,
    lng: -122.02469,
    price_rate: 2,
  },
  {
    name: "Locust Street Parking Garage",
    description:
      "City parking garage at Cedar and Locust streets, home of the city Parking Office, one block from Pacific Avenue; open daily except major holidays. $2/hr, $16 daily max.",
    addr: "124 Locust St",
    lat: 36.975232,
    lng: -122.027434,
    price_rate: 2,
  },
  {
    name: "River/Front Parking Garage",
    description:
      "City garage between River and Front streets next to the Galleria complex at the north end of downtown, with EV charging stations; open daily except major holidays. $2/hr, $16 daily max.",
    addr: "24 River St",
    lat: 36.975938,
    lng: -122.025449,
    price_rate: 2,
  },
  {
    name: "Cedar/Church Parking Garage (Lot 3)",
    description:
      "Pay-by-space city garage at Cedar and Church streets near the Pacific Avenue shopping district; fees charged 8am-8pm daily including holidays, payable at paystation or Parkmobile. Free outside enforcement hours.",
    addr: "800 Cedar St",
    lat: 36.973452,
    lng: -122.027091,
    price_rate: 2,
  },
  {
    name: "Pearl Alley Parking Lot (Lot 8)",
    description:
      "Pay-by-space downtown surface lot at Cedar and Lincoln streets with EV charging stations; fees charged 8am-8pm daily including holidays via paystation or Parkmobile. $2/hr, $16 daily max.",
    addr: "710 Cedar St",
    lat: 36.972665,
    lng: -122.026942,
    price_rate: 2,
  },
  {
    name: "Front/Cathcart Parking Lot (Lot 7)",
    description:
      "Pay-by-space city surface lot at Front and Cathcart streets, a short walk to Pacific Avenue and the downtown farmers market area; fees charged 8am-8pm daily including holidays. $2/hr, $16 daily max.",
    addr: "505 Front St",
    lat: 36.972078,
    lng: -122.024401,
    price_rate: 2,
  },
  {
    name: "Elm Street Parking Lot (Lot 9)",
    description:
      "Pay-by-space city surface lot at Cedar and Elm streets at the south end of downtown; fees charged 8am-8pm seven days a week via paystation or Parkmobile. $2/hr, $16 daily max.",
    addr: "120 Elm St",
    lat: 36.970935,
    lng: -122.025624,
    price_rate: 2,
  },
  {
    name: "Front Street South Parking Lot (Lot 11)",
    description:
      "Free city surface lot on Front Street just north of Laurel Street beside the San Lorenzo River levee. 3-hour limit Monday-Saturday 8am-8pm; unlimited Sundays and holidays.",
    addr: "328 Front St",
    lat: 36.969772,
    lng: -122.023758,
    price_rate: 0,
  },
  {
    name: "City Hall Parking Lot (Lot 13)",
    description:
      "Free visitor lot at the Santa Cruz City Hall complex on Church Street between Chestnut and Center streets. 3-hour limit Monday-Saturday 8am-6pm; unlimited Sundays. Some stalls reserved for city employees.",
    addr: "809 Center St",
    lat: 36.974352,
    lng: -122.029557,
    price_rate: 0,
  },
  {
    name: "Santa Cruz Municipal Wharf Parking",
    description:
      "Drive-on parking along the Municipal Wharf above Main Beach, steps from wharf restaurants and sea lion viewing. Summer $3/hr ($24 daily max); winter $1/hr with first hour free. Free on major holidays.",
    addr: "21 Municipal Wharf",
    lat: 36.962571,
    lng: -122.023648,
    price_rate: 3,
  },
  {
    name: "Santa Cruz Beach Boardwalk Main Parking Lot",
    description:
      "Large open-air lot on Beach Street directly across from the Boardwalk and Main Beach, opening 6am daily; no in-and-out privileges, no overnight parking. Flat daily rate; $25 summer weekdays, $35 summer weekends/holidays, less off-season.",
    addr: "400 Beach St",
    lat: 36.965276,
    lng: -122.019321,
    price_rate: 25,
    price_unit: "day",
  },
];

// Demo account so "My spots" isn't empty for someone exploring the app.
// Publicly documented in README — not a real user, no real data behind it.
// Its listings are marked is_protected so the demo login can't vandalize
// them for everyone else (see app/spots/actions.ts).
const DEMO_EMAIL = "demo@parkme2.app";
const DEMO_SPOTS = [
  {
    name: "Demo Driveway (test listing)",
    description:
      "Sample listing owned by the demo account, so 'My spots' has something in it when exploring ParkMe2. Not a real parking spot.",
    addr: "115 Cooper St",
    lat: 36.974627,
    lng: -122.026765,
    price_rate: 5,
  },
  {
    name: "Demo Garage Spot (test listing)",
    description:
      "Second sample listing from the demo account, showing what an hourly spot looks like end to end. Not a real parking spot.",
    addr: "1100 Pacific Ave",
    lat: 36.974923,
    lng: -122.02697,
    price_rate: 3,
  },
];

// Additive-only: applies the schema (creates what's missing, never drops)
// and inserts seed data if it isn't already there. Safe to run repeatedly,
// including against a database that already has real data in it.
export async function applySchemaAndSeed(sql) {
  // Naive split on ";" — schema.sql must not contain a literal ";" inside a
  // comment or string, or this will split mid-statement.
  for (const stmt of SCHEMA_SQL.split(";").map((s) => s.trim()).filter(Boolean)) {
    await sql.query(stmt);
  }

  const [{ count: cityCount }] = await sql`
    SELECT count(*)::int AS count FROM spot WHERE owner_id IS NULL
  `;
  if (cityCount === 0) {
    for (const s of CITY_SPOTS) {
      await sql`
        INSERT INTO spot (name, description, addr, zipcode, locality, region, country, lat, lng, price_rate, price_unit)
        VALUES (${s.name}, ${s.description}, ${s.addr}, '95060', 'Santa Cruz', 'California', 'US', ${s.lat}, ${s.lng}, ${s.price_rate}, ${s.price_unit ?? "hour"})
      `;
    }
  }

  let [demo] = await sql`SELECT id FROM account WHERE email = ${DEMO_EMAIL}`;
  if (!demo) {
    [demo] = await sql`
      INSERT INTO account (email, password_hash)
      VALUES (${DEMO_EMAIL}, ${hashPassword("demo12345")})
      RETURNING id
    `;
    for (const s of DEMO_SPOTS) {
      await sql`
        INSERT INTO spot (name, description, addr, zipcode, locality, region, country, lat, lng, price_rate, price_unit, owner_id, is_protected)
        VALUES (${s.name}, ${s.description}, ${s.addr}, '95060', 'Santa Cruz', 'California', 'US', ${s.lat}, ${s.lng}, ${s.price_rate}, 'hour', ${demo.id}, TRUE)
      `;
    }
  }

  const [{ count }] = await sql`SELECT count(*)::int AS count FROM spot`;
  return count;
}

// Only run the CLI body when this file is executed directly (not when
// db/reset.mjs imports applySchemaAndSeed).
if (import.meta.url === `file://${process.argv[1]}`) {
  const sql = neon(process.env.DATABASE_URL);
  const count = await applySchemaAndSeed(sql);
  console.log(`Schema up to date. ${count} spots in the database.`);
}
