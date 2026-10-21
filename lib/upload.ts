import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "customers");
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * Saves an uploaded customer photo to local disk under public/uploads and
 * returns the URL it's servable at. Returns undefined if no file was supplied.
 * Local-disk storage is a stopgap for development; swap for Vercel Blob (or
 * similar) once this is deployed, since serverless filesystems aren't durable.
 */
export async function saveCustomerPhoto(file: File | null): Promise<string | undefined> {
  if (!file || file.size === 0) return undefined;

  if (!file.type.startsWith("image/")) {
    throw new Error("Photo must be an image file");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("Photo must be smaller than 5MB");
  }

  const extension = EXTENSION_BY_MIME[file.type] ?? "jpg";
  const filename = `${randomUUID()}.${extension}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return `/uploads/customers/${filename}`;
}
