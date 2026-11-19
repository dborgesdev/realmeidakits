// DEMONSTRAÇÃO: real Chromium UI with intercepted API; no accounts, messages or charges.
// Run after wordpress-vouchers.php and pdftoppm rendering of its disposable PDF.
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { setTimeout } from "node:timers";
import { Buffer } from "node:buffer";
import console from "node:console";
const { fetch, WebSocket } = globalThis;
const root = resolve(".local-tools/voucher-qa");
const browser = spawn(
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  [
    "--headless=new",
    "--remote-debugging-port=9238",
    "--remote-debugging-address=127.0.0.1",
    "--user-data-dir=" + root + "/chrome",
    "--no-first-run",
    "--disable-background-networking",
    "--disable-extensions",
    "about:blank",
  ],
  { windowsHide: true, stdio: "ignore" },
);
const pause = (ms) => new Promise((done) => setTimeout(done, ms));
let ws;
try {
  let target;
  for (let i = 0; i < 100 && !target; i++) {
    try {
      target = (
        await (await fetch("http://127.0.0.1:9238/json/list")).json()
      ).find((page) => page.type === "page");
    } catch {
      /* starting */
    }
    if (!target) await pause(100);
  }
  assert.ok(target, "Chromium did not start");
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((done, fail) => {
    ws.onopen = done;
    ws.onerror = fail;
  });
  let sequence = 0;
  const pending = new Map();
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const handler = pending.get(data.id);
    if (handler) {
      pending.delete(data.id);
      if (data.error) handler.reject(data.error);
      else handler.resolve(data.result);
    }
  };
  const call = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++sequence;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const result = await call("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails)
      throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  await call("Page.enable");
  await call("Runtime.enable");
  const frame = (await call("Page.getFrameTree")).frameTree.frame.id;
  const markup = readFileSync(root + "/pickup-markup.html", "utf8");
  const css = readFileSync(
    "wordpress/plugins/re-almeida-kits/assets/pickup.css",
    "utf8",
  );
  const code = readFileSync(
    "wordpress/plugins/re-almeida-kits/assets/pickup.js",
    "utf8",
  );
  await call("Page.setDocumentContent", {
    frameId: frame,
    html:
      '<!doctype html><html lang="pt-BR"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:16px Arial;margin:16px;background:#f0f0f1;color:#1d2327}.button{padding:8px}input{box-sizing:border-box}' +
      css +
      "</style><title>DEMONSTRAÇÃO — conferência</title>" +
      markup +
      "</html>",
  });
  await evaluate(`window.confirm=()=>true; window.offline=false; window.used=false; window.calls=[];
    window.fetch=async(url,init)=>{window.calls.push(url); if(window.offline)throw new Error('Falha de conexão. Consulte novamente.');
    const action=url.split('/').pop(); const body=JSON.parse(init.body);
    if(action==='confirm')window.used=true;
    const voucher={token:'a'.repeat(64),request:999,participant:'DEMONSTRAÇÃO — participante',race:'DEMONSTRAÇÃO — corrida',modality:'Kit Oficial',state:window.used?'used':'released',label:window.used?'Utilizado':'Liberado',reason:window.used?'Retirada concluída.':'Pagamento e documentação regulares.',collectedAt:window.used?'2026-11-18 12:00:00Z':null,actor:999,operation:'DEMONSTRAÇÃO'};
    if(body.token==='b'.repeat(64))return{ok:false,json:async()=>({message:'Código inexistente ou inválido.'})};
    return{ok:true,json:async()=>action==='search'?{results:[voucher]}:voucher};};`);
  await evaluate(code);
  await evaluate(
    `document.querySelector('#rak-token').value='a'.repeat(64);document.querySelector('#rak-code').requestSubmit();`,
  );
  await pause(100);
  assert.equal(
    await evaluate(`window.calls.filter(url=>url.endsWith('/confirm')).length`),
    0,
    "Scanning confirmed pickup",
  );
  assert.match(
    await evaluate(`document.querySelector('#rak-results').textContent`),
    /Confirmar retirada/,
  );
  for (const width of [320, 390, 768, 1440]) {
    await call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: width < 500,
    });
    assert.equal(
      await evaluate(`document.documentElement.scrollWidth<=innerWidth`),
      true,
      `Horizontal overflow at ${width}`,
    );
    const shot = await call("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
    });
    writeFileSync(
      root + `/pickup-${width}.png`,
      Buffer.from(shot.data, "base64"),
    );
  }
  await evaluate(`document.querySelector('#rak-results button').click()`);
  await pause(100);
  assert.match(
    await evaluate(`document.querySelector('#rak-status').textContent`),
    /RETIRADA CONFIRMADA PELO SERVIDOR/,
  );
  assert.equal(
    await evaluate(`document.querySelectorAll('#rak-results button').length`),
    0,
  );
  await evaluate(
    `document.querySelector('#rak-query').value='DEMONSTRAÇÃO';document.querySelector('#rak-search').requestSubmit()`,
  );
  await pause(100);
  assert.match(
    await evaluate(`document.querySelector('#rak-results').textContent`),
    /Utilizado/,
  );
  await evaluate(
    `window.used=false;document.querySelector('#rak-code').requestSubmit()`,
  );
  await pause(100);
  await evaluate(
    `window.offline=true;document.querySelector('#rak-results button').click()`,
  );
  await pause(100);
  assert.match(
    await evaluate(`document.querySelector('#rak-status').textContent`),
    /Falha de conexão/,
  );
  assert.equal(
    await evaluate(`document.querySelectorAll('#rak-results button').length`),
    0,
  );
  await evaluate(
    `window.offline=false;document.querySelector('#rak-token').value='b'.repeat(64);document.querySelector('#rak-code').requestSubmit()`,
  );
  await pause(100);
  assert.match(
    await evaluate(`document.querySelector('#rak-status').textContent`),
    /Código inexistente ou inválido/,
  );
  await evaluate(
    readFileSync("wordpress/plugins/re-almeida-kits/assets/jsQR.js", "utf8"),
  );
  const image =
    "data:image/png;base64," +
    readFileSync(root + "/DEMONSTRACAO-voucher.png").toString("base64");
  const decoded = await evaluate(
    `(async()=>{const image=new Image();image.src=${JSON.stringify(image)};await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,image.width,image.height);return window.jsQR(data.data,data.width,data.height)?.data;})()`,
  );
  assert.match(
    decoded,
    /^http:\/\/127\.0\.0\.1:8097\/app\/wp-admin\/admin.php\?page=rak-pickup#voucher=[a-f0-9]{64}$/,
  );
  console.log(
    "OK Chromium: QR do PDF decodificado, consulta, confirmação explícita, utilizado, pesquisa manual, inválido, falha de conexão e larguras 320/390/768/1440. Câmera física não testada.",
  );
} finally {
  ws?.close();
  browser.kill();
}
