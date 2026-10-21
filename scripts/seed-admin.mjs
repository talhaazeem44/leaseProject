import { MongoClient } from "mongodb";
import { readFileSync } from "node:fs";
import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import readline from "node:readline/promises";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

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

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, KEY_LENGTH);
  return `${salt}:${derivedKey.toString("hex")}`;
}

loadEnvLocal();

const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB ?? "lease_management";

// Usage: node scripts/seed-admin.mjs [username] [password]
// Falls back to ADMIN_USERNAME / ADMIN_PASSWORD env vars, then an interactive prompt.
let username = process.argv[2] ?? process.env.ADMIN_USERNAME;
let password = process.argv[3] ?? process.env.ADMIN_PASSWORD;

if (!username || !password) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  username ??= (await rl.question("Admin username: ")).trim();
  password ??= (await rl.question("Admin password: ")).trim();
  rl.close();
}

if (!username || !password) {
  console.error("Username and password are required.");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const client = new MongoClient(uri);
await client.connect();
const collection = client.db(dbName).collection("users");

const passwordHash = await hashPassword(password);
await collection.updateOne(
  { username },
  { $set: { username, passwordHash }, $setOnInsert: { createdAt: new Date() } },
  { upsert: true }
);

console.log(`Admin user "${username}" is ready in "${dbName}".`);

await client.close();
