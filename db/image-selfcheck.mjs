// Self-check for lib/image.ts's magic-byte sniffing, the server-side check
// that keeps a spot photo upload honest even if the browser lies about
// Content-Type. No DB or network access.
import assert from "node:assert/strict";
import { sniffImageType, MAX_PHOTO_BYTES } from "../lib/image.ts";

assert.equal(
  sniffImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]))?.mime,
  "image/jpeg",
  "jpeg signature",
);
assert.equal(
  sniffImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.mime,
  "image/png",
  "png signature",
);
assert.equal(
  sniffImageType(Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))?.mime,
  "image/gif",
  "gif signature",
);
assert.equal(
  sniffImageType(
    Buffer.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]),
  )?.mime,
  "image/webp",
  "webp signature",
);
assert.equal(
  sniffImageType(Buffer.from('<script>alert(1)</script>', "utf8")),
  null,
  "non-image bytes rejected even with a spoofed .jpg filename/content-type",
);
assert.equal(sniffImageType(Buffer.from([])), null, "empty buffer rejected");
assert.ok(MAX_PHOTO_BYTES > 0, "size limit is set");

console.log("image-selfcheck: 7 assertions passed");
