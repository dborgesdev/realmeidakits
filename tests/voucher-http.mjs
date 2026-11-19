// DEMONSTRAÇÃO: isolated local HTTP server, temporary synthetic sessions received on stdin.
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { setTimeout } from "node:timers";
import { URL } from "node:url";
import process from "node:process";
import console from "node:console";
const { fetch } = globalThis;
let input = "";
for await (const chunk of process.stdin) input += chunk;
const data = JSON.parse(input);
const server = spawn(
  resolve(".local-tools/php/php.exe"),
  [
    "-S",
    "127.0.0.1:8097",
    "-t",
    resolve(".local-tools/hostgator-qa/site"),
    resolve(".local-tools/hostgator-qa/router.php"),
  ],
  { windowsHide: true, stdio: "ignore" },
);
const pause = (ms) => new Promise((done) => setTimeout(done, ms));
try {
  let ready = false;
  for (let i = 0; i < 100 && !ready; i++) {
    try {
      ready = (await fetch("http://127.0.0.1:8097/app/wp-login.php")).ok;
    } catch {
      /* startup */
    }
    if (!ready) await pause(100);
  }
  assert.ok(ready, "Local HTTP server did not start");
  const api = "http://127.0.0.1:8097/app/wp-json/re-almeida/v1/pickup/";
  const post = (action, cookie, nonce, body) =>
    fetch(api + action, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
        "X-WP-Nonce": nonce,
      },
      body: JSON.stringify(body),
    });
  let response = await post("lookup", "", "", { token: data.token });
  assert.equal(response.status, 403);
  response = await post("lookup", data.otherCookie, data.otherNonce, {
    token: data.token,
  });
  assert.equal(response.status, 403);
  response = await post("lookup", data.ownerCookie, "invalid", {
    token: data.token,
  });
  assert.equal(response.status, 403);
  response = await post("lookup", data.ownerCookie, data.ownerNonce, {
    token: data.token,
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).state, "released");
  assert.match(response.headers.get("cache-control"), /no-store/);
  response = await post("search", data.ownerCookie, data.ownerNonce, {
    q: String(data.request),
  });
  assert.equal(response.status, 200);
  assert.ok(
    (await response.json()).results.some(
      (result) => result.token === data.token,
    ),
  );
  response = await post("lookup", data.ownerCookie, data.ownerNonce, {
    token: "0".repeat(64),
  });
  assert.equal(response.status, 404);
  response = await fetch(data.pdfUrl, {
    headers: { Cookie: data.ownerCookie },
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /application\/pdf/);
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.ok((await response.text()).startsWith("%PDF-1.4"));
  const otherUrl = new URL(data.pdfUrl);
  otherUrl.searchParams.set("_wpnonce", data.otherPdfNonce);
  response = await fetch(otherUrl, { headers: { Cookie: data.otherCookie } });
  assert.equal(response.status, 404);
  response = await fetch(data.pdfUrl, { redirect: "manual" });
  assert.equal(response.status, 302);
  console.log(
    "OK HTTP real: PDF autenticado, isolamento entre titulares, login obrigatório, nonce, capacidade, consulta QR, busca manual, inválido e no-store.",
  );
} finally {
  server.kill();
}
