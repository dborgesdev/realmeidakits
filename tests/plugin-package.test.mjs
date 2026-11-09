import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import { createHash } from "node:crypto";
import { URL } from "node:url";
test("installable ZIP has one plugin root and exactly the current runtime files", () => {
  const zip = readFileSync(
    new URL("../wordpress/releases/re-almeida-kits.zip", import.meta.url),
  );
  const expected = [
    "re-almeida-kits.php",
    "readme.txt",
    ...readdirSync(
      new URL(
        "../wordpress/plugins/re-almeida-kits/includes/",
        import.meta.url,
      ),
    ).map((f) => `includes/${f}`),
    ...readdirSync(
      new URL("../wordpress/plugins/re-almeida-kits/assets/", import.meta.url),
    ).map((f) => `assets/${f}`),
  ].sort();
  const entries = [];
  let at = 0;
  while (at < zip.length - 4) {
    if (zip.readUInt32LE(at) !== 0x02014b50) {
      at++;
      continue;
    }
    const method = zip.readUInt16LE(at + 10),
      size = zip.readUInt32LE(at + 20);
    const nameLength = zip.readUInt16LE(at + 28),
      extraLength = zip.readUInt16LE(at + 30),
      commentLength = zip.readUInt16LE(at + 32);
    const name = zip.subarray(at + 46, at + 46 + nameLength).toString("utf8");
    assert.ok(
      name.startsWith("re-almeida-kits/") &&
        !name.includes("..") &&
        !name.includes("\\"),
    );
    const relative = name.slice("re-almeida-kits/".length);
    entries.push(relative);
    const offset = zip.readUInt32LE(at + 42);
    assert.equal(zip.readUInt32LE(offset), 0x04034b50);
    const start =
      offset +
      30 +
      zip.readUInt16LE(offset + 26) +
      zip.readUInt16LE(offset + 28);
    const bytes = zip.subarray(start, start + size);
    assert.ok(method === 0 || method === 8);
    const content = method === 8 ? inflateRawSync(bytes) : bytes;
    assert.deepEqual(
      content,
      readFileSync(
        new URL(
          `../wordpress/plugins/re-almeida-kits/${relative}`,
          import.meta.url,
        ),
      ),
      `${relative} must match source`,
    );
    at += 46 + nameLength + extraLength + commentLength;
  }
  assert.deepEqual(entries.sort(), expected);
  const checksum = readFileSync(
    new URL(
      "../wordpress/releases/re-almeida-kits.zip.sha256",
      import.meta.url,
    ),
    "utf8",
  ).split(" ")[0];
  assert.equal(createHash("sha256").update(zip).digest("hex"), checksum);
});
