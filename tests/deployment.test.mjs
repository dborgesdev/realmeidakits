import { URL } from "node:url";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";

test("Apache isolates WordPress, PHP public routes and known React routes", () => {
  const rules = readFileSync(
    new URL("../public/.htaccess", import.meta.url),
    "utf8",
  );
  const app = rules.indexOf("RewriteRule ^app");
  const publicPage = rules.indexOf("app/index.php [L]");
  const spa = rules.indexOf("index.html [L]", publicPage);
  assert.ok(app >= 0 && app < publicPage && publicPage < spa);
  assert.match(rules, /RewriteCond %\{REQUEST_FILENAME\} -f/);
  assert.match(
    rules,
    /RewriteRule \^\(\?:orientacoes\|privacidade\|conta\|conclusao\|acompanhamento\|solicitacao/,
  );
  assert.doesNotMatch(rules, /RewriteRule \^\.\*.*index\.html/);
});
