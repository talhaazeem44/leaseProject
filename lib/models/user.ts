import type { ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId;
  username: string;
  passwordHash: string;
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
  createdAt: Date;
}
