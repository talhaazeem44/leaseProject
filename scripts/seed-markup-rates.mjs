import { MongoClient } from "mongodb";
import { readFileSync } from "node:fs";

function loadEnvLocal() {
  try {
    const content = readFileSync(new URL("../.env.local", import.meta.url), "utf-8");
    for (const line of content.split("\n")) {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
    }
  } catch {
    // .env.local not present; rely on existing environment/defaults
  }
}

loadEnvLocal();

const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB ?? "lease_management";

const placeholderRates = [
  { tenureMonths: 6, ratePercent: 5, label: "6 Months" },
  { tenureMonths: 12, ratePercent: 10, label: "12 Months" },
  { tenureMonths: 18, ratePercent: 15, label: "18 Months" },
  { tenureMonths: 24, ratePercent: 20, label: "24 Months" },
];

const client = new MongoClient(uri);
await client.connect();
const collection = client.db(dbName).collection("markupRates");

for (const rate of placeholderRates) {
  await collection.updateOne(
    { tenureMonths: rate.tenureMonths },
    { $setOnInsert: { ...rate, updatedAt: new Date() } },
    { upsert: true }
  );
}

console.log(`Seeded ${placeholderRates.length} placeholder markup rates into "${dbName}".`);
console.log("Edit real values any time at /settings/markup-rates.");

await client.close();
