// DEMONSTRAÇÃO: loopback-only integration; synthetic credentials via stdin, never logged.
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { setTimeout } from "node:timers";
import process from "node:process";
import assert from "node:assert/strict";
import console from "node:console";
const { fetch, URL, URLSearchParams, FormData, Blob, AbortSignal } = globalThis;
let input = "";
for await (const chunk of process.stdin) input += chunk;
const data = JSON.parse(input),
  expected = data.mode === "pdf" ? 200 : 409;
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
const request = (url, init = {}) =>
  fetch(url, { ...init, signal: AbortSignal.timeout(20000) });
try {
  let ready = false;
  for (let i = 0; i < 80 && !ready; i++) {
    try {
      ready = (await request("http://127.0.0.1:8097/app/wp-login.php")).ok;
    } catch {
      /* starting */
    }
    if (!ready) await pause(100);
  }
  assert.ok(ready, "Local HTTP server unavailable");
  let response = await request(data.voucherUrl, {
    headers: { Cookie: data.cookie },
    redirect: "manual",
  });
  assert.equal(
    response.status,
    expected,
    "Authenticated direct voucher result",
  );
  if (expected === 200) {
    assert.match(response.headers.get("content-type"), /application\/pdf/);
    assert.match(response.headers.get("content-disposition"), /^inline/);
    assert.ok((await response.text()).startsWith("%PDF"));
  }
  response = await request(data.voucherUrl, { redirect: "manual" });
  assert.equal(response.status, 302);
  const login = new URL(
    response.headers.get("location"),
    "http://127.0.0.1:8097",
  );
  assert.equal(login.origin, "http://127.0.0.1:8097");
  assert.match(login.searchParams.get("rak_return"), /action=rak_open_voucher/);
  assert.equal(
    login.searchParams.get("rak_return"),
    new URL(data.voucherUrl).pathname + new URL(data.voucherUrl).search,
    "PDF login destination encoding",
  );
  const cookies = new Map();
  const collect = (response) => {
    for (const entry of response.headers.getSetCookie()) {
      const [pair] = entry.split(";");
      const at = pair.indexOf("=");
      cookies.set(pair.slice(0, at), pair.slice(at + 1));
    }
  };
  response = await request(login);
  collect(response);
  const html = await response.text();
  const nonce = /name="woocommerce-login-nonce"[^>]*value="([^"]+)"/.exec(
    html,
  )?.[1];
  assert.ok(nonce, "Native WooCommerce login form/nonce missing");
  const body = new URLSearchParams({
    username: data.login,
    password: data.password,
    login: "1",
    "woocommerce-login-nonce": nonce,
    rak_return: login.searchParams.get("rak_return"),
    redirect: login.searchParams.get("rak_return"),
  });
  response = await request(login, {
    method: "POST",
    headers: {
      Cookie: [...cookies].map(([key, value]) => key + "=" + value).join("; "),
    },
    body,
    redirect: "manual",
  });
  collect(response);
  assert.equal(response.status, 302, "Native login must redirect");
  const destination = new URL(response.headers.get("location"), login);
  assert.equal(destination.pathname, new URL(data.voucherUrl).pathname);
  assert.equal(destination.search, new URL(data.voucherUrl).search);
  response = await request(destination, {
    headers: {
      Cookie: [...cookies].map(([key, value]) => key + "=" + value).join("; "),
    },
    redirect: "manual",
  });
  assert.equal(
    response.status,
    expected,
    "PDF destination was lost after native login",
  );
  if (data.mode !== "pdf") {
    const identityUrl =
      "http://127.0.0.1:8097/app/wp-json/re-almeida/v1/account/identity-document";
    const identityHeaders = { Cookie: data.cookie, "X-WP-Nonce": data.nonce };
    const identity = new FormData();
    identity.set(
      "file",
      new Blob(["DEMONSTRAÇÃO"], { type: "application/pdf" }),
      "DEMONSTRACAO.pdf",
    );
    response = await request(identityUrl, {
      method: "POST",
      headers: identityHeaders,
      body: identity,
    });
    assert.equal(
      response.status,
      415,
      "Identity upload accepted false PDF MIME",
    );
    identity.set(
      "file",
      new Blob(
        [
          "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\nxref\n0 3\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \ntrailer\n<< /Root 1 0 R /Size 3 >>\nstartxref\n110\n%%EOF\n",
        ],
        { type: "application/pdf" },
      ),
      "DEMONSTRACAO.pdf",
    );
    response = await request(identityUrl, {
      method: "POST",
      headers: identityHeaders,
      body: identity,
    });
    assert.equal(response.status, 200, "Identity upload rejected PDF");
    assert.equal((await response.json()).registered, true);
    const upload = new FormData();
    upload.set("line", "0");
    upload.set("requirement", "qa-doc");
    upload.set(
      "file",
      new Blob([readFileSync(".local-tools/hostgator-qa/qa-image.jpg")], {
        type: "image/jpeg",
      }),
      "DEMONSTRACAO.jpg",
    );
    response = await request(
      "http://127.0.0.1:8097/app/wp-json/re-almeida/v1/account/orders/" +
        data.request +
        "/documents",
      {
        method: "POST",
        headers: { Cookie: data.cookie, "X-WP-Nonce": data.nonce },
        body: upload,
      },
    );
    assert.equal(
      response.status,
      200,
      "Actual multipart replacement was rejected",
    );
    assert.equal((await response.json()).saved, true);
  }
  response = await request("http://127.0.0.1:8097/app/", {
    redirect: "manual",
  });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "http://127.0.0.1:8097/");
  response = await request(
    "http://127.0.0.1:8097/app/wp-json/re-almeida/v1/corridas",
  );
  assert.equal(response.status, 200);
  response = await request(
    "http://127.0.0.1:8097/app/wp-admin/admin-ajax.php?action=rak_session",
    { headers: { "X-RAK-Session": "1" } },
  );
  assert.equal(response.status, 200);
  if (data.browser) {
    const child = spawn("node", [resolve("tests/production-browser.mjs")], {
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    child.stdin.end(
      JSON.stringify({
        loginUrl: login.href,
        checkoutUrl: data.checkoutUrl,
        receivedUrl: data.receivedUrl,
        pendingReceivedUrl: data.pendingReceivedUrl,
        cookie: data.cookie,
        request: data.request,
      }),
    );
    let output = "",
      errors = "";
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.stderr.on("data", (chunk) => {
      errors += chunk;
    });
    const code = await new Promise((done) => child.on("close", done));
    assert.equal(code, 0, "Native browser QA: " + errors);
    console.log(output.trim());
  }
  console.log(
    "OK HTTP real: PDF direto " +
      expected +
      ", login WooCommerce preservando destino, " +
      (data.mode === "pdf"
        ? "PDF liberado inline"
        : "RG/CNH em PDF, MIME inválido e reenvio multipart") +
      ", /app/ redirecionado e REST/Ajax preservados.",
  );
} finally {
  server.kill();
}
