#!/usr/bin/env node
/**
 * Apply incremental SQL patches to Postgres (Supabase direct connection).
 * Requires DATABASE_URL in .env.local or environment.
 *
 * Usage: npm run db:patches
 *        npm run db:patches -- 18        # single patch only
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dbDir = join(root, "database");

const PATCHES = [
  "06-project-detail-fields.sql",
  "07-fuel-da-fields.sql",
  "08-gasoil-bons.sql",
  "09-commercial-quote-document-type.sql",
  "10-bon-livraison-document-type.sql",
  "11-organization-workspace.sql",
  "12-stock-sortie-magasin.sql",
  "13-rental-material.sql",
  "14-personnel-categories.sql",
  "15-rental-materials-catalog.sql",
  "16-fuel-rental-material.sql",
  "16-rental-material-fields.sql",
  "17-material-detail-categories.sql",
  "18-rental-bon-contract.sql",
  "19-gasoil-contacts.sql",
  "20-rental-material-location-mode.sql",
  "21-vat-rate-default-10.sql",
  "22-gasoil-bons-extra-columns.sql",
  "23-supplier-supply-types.sql",
  "24-supplier-dual-name.sql",
  "25-rental-material-columns-vat-20.sql",
  "26-rental-material-supplier-driver.sql",
  "27-supplier-rib.sql",
  "28-gasoil-contact-details.sql",
  "29-rental-bon-driver-contact.sql",
  "30-supplier-bank-name.sql",
  "31-traitements.sql",
  "32-project-reporting.sql",
  "33-articles-inventory-link.sql",
  "34-purchase-request-document.sql",
  "35-traitement-gasoil.sql",
  "36-sales-requests.sql",
  "37-traitement-achat-vente-link.sql",
  "38-site-pv.sql",
  "39-report-log-site-reports.sql",
  "40-finance-foundation.sql",
  "41-finance-roles.sql",
];

function loadDatabaseUrl() {
  for (const file of [".env.local", ".env"]) {
    const path = join(root, file);
    if (!existsSync(path)) continue;
    const text = readFileSync(path, "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^DATABASE_URL=(.+)$/);
      if (m) return m[1].trim().replace(/^["']|["']$/g, "");
    }
  }
  return process.env.DATABASE_URL || "";
}

async function main() {
  const only = process.argv[2];
  const databaseUrl = loadDatabaseUrl();
  if (!databaseUrl) {
    console.error("Missing DATABASE_URL in .env.local or environment.");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const list = only
    ? PATCHES.filter((f) => f.startsWith(`${only}-`) || f.startsWith(only))
    : PATCHES;

  for (const file of list) {
    const path = join(dbDir, file);
    if (!existsSync(path)) {
      console.warn(`Skip (missing): ${file}`);
      continue;
    }
    const sql = readFileSync(path, "utf8");
    process.stdout.write(`Applying ${file}… `);
    try {
      await client.query(sql);
      console.log("OK");
    } catch (e) {
      console.log("FAILED");
      console.error(e.message);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
