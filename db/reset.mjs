// Destructive full reset: drops rental/spot/account and rebuilds them from
// scratch via the seed data. For local/dev use only.
//
// Guarded on purpose — this used to be what `npm run seed` did unconditionally,
// which is how a previous run dropped the production tables. Now it refuses
// to run unless you explicitly opt in and it always prints which database
// it's about to nuke first.
import { neon } from "@neondatabase/serverless";
import { applySchemaAndSeed } from "./seed.mjs";

if (process.env.ALLOW_DESTRUCTIVE_RESET !== "1") {
  console.error(
    "Refusing to run: this DROPS rental, spot, and account and rebuilds them from seed data.\n" +
      "Set ALLOW_DESTRUCTIVE_RESET=1 to confirm you want this, e.g.:\n" +
      "  ALLOW_DESTRUCTIVE_RESET=1 npm run db:reset",
  );
  process.exit(1);
}

const host = new URL(process.env.DATABASE_URL).hostname;
console.log(`About to DROP and rebuild rental, spot, account on: ${host}`);

const sql = neon(process.env.DATABASE_URL);
await sql.query("DROP TABLE IF EXISTS rental");
await sql.query("DROP TABLE IF EXISTS spot");
await sql.query("DROP TABLE IF EXISTS account");

const count = await applySchemaAndSeed(sql);
console.log(`Reset complete. ${count} spots in the database.`);
