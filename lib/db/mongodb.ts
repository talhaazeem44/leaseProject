import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB ?? "lease_management";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function createClientPromise(): Promise<MongoClient> {
  return new MongoClient(uri).connect();
}

const clientPromise =
  process.env.NODE_ENV === "development"
    ? (globalThis._mongoClientPromise ??= createClientPromise())
    : createClientPromise();

export default clientPromise;
export { dbName };
