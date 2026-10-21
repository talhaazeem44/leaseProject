/**
 * Converts a flat FormData with dot-path field names (e.g. "bike.chassisNo",
 * "guarantor1.name") into a nested plain object of strings, so it can be fed
 * straight into a zod schema shaped like the nested domain model.
 */
export function formDataToNestedObject(formData: FormData): Record<string, unknown> {
  const root: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    const parts = key.split(".");
    let cursor = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (typeof cursor[part] !== "object" || cursor[part] === null) {
        cursor[part] = {};
      }
      cursor = cursor[part] as Record<string, unknown>;
    }
    cursor[parts[parts.length - 1]] = value;
  }

  return root;
}
