import { io } from "next/cache";
import clientPromise, { dbName } from "./mongodb";
import type { Lease } from "../models/lease";
import type { MarkupRate } from "../models/markup-rate";
import type { User } from "../models/user";

// Cache Components can't see the MongoDB driver's internal I/O as a suspension
// point, so `await io()` marks every query against these collections as
// request-time data, excluding it from the static shell.
export async function getLeasesCollection() {
  await io();
  const client = await clientPromise;
  return client.db(dbName).collection<Lease>("leases");
}

export async function getMarkupRatesCollection() {
  await io();
  const client = await clientPromise;
  return client.db(dbName).collection<MarkupRate>("markupRates");
}

export async function getUsersCollection() {
  await io();
  const client = await clientPromise;
  return client.db(dbName).collection<User>("users");
}
