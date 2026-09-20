// Server-side image validation for spot photo uploads. Never trust the
// browser's reported File.type — it's just the client's say-so. Sniff the
// actual file bytes (magic numbers) instead.

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

const SIGNATURES: { mime: string; ext: string; bytes: number[] }[] = [
  { mime: "image/jpeg", ext: "jpg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", ext: "png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: "image/gif", ext: "gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  // WEBP: "RIFF"...."WEBP" — bytes 0-3 and 8-11.
];

// Returns the real MIME type and a filename extension if `bytes` starts with
// a known image signature, or null if it doesn't look like a supported
// image at all.
export function sniffImageType(bytes: Uint8Array): { mime: string; ext: string } | null {
  for (const sig of SIGNATURES) {
    if (sig.bytes.every((b, i) => bytes[i] === b)) return { mime: sig.mime, ext: sig.ext };
  }
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
}
