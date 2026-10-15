import { URL } from "node:url";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";

test("production serves only dist assets with SPA fallback and no backend or custom domain", () => {
  const config = JSON.parse(
    readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8"),
  );
  assert.equal(config.assets.directory, "./dist");
  assert.equal(config.assets.not_found_handling, "single-page-application");
  assert.equal(config.workers_dev, true);
  assert.equal(config.main, undefined);
  assert.equal(config.routes, undefined);
});
