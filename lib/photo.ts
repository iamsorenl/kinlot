import { put } from "@vercel/blob";
import { sniffImageType, MAX_PHOTO_BYTES } from "@/lib/image";

// Reads the "photo" field from a spot form's FormData, validates it, and
// uploads it to Vercel Blob (single photo per spot). Returns null if no
// file was submitted (caller should leave the existing photo, if any,
// untouched), { url } on success, or { error } if the file is invalid.
export async function uploadSpotPhoto(
  formData: FormData,
): Promise<{ url: string } | { error: string } | null> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return null;

  if (file.size > MAX_PHOTO_BYTES) return { error: "Photo must be 5MB or smaller" };

  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffImageType(buffer);
  if (!sniffed) return { error: "Photo must be a JPEG, PNG, GIF, or WEBP image" };

  try {
    const blob = await put(`spots/${crypto.randomUUID()}.${sniffed.ext}`, buffer, {
      access: "public",
      contentType: sniffed.mime,
    });
    return { url: blob.url };
  } catch (e) {
    console.error("Vercel Blob upload failed:", e);
    return { error: "Couldn't upload photo right now — try again, or skip it for now" };
  }
}
