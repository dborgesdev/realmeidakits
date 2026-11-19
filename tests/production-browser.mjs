// DEMONSTRAÇÃO: real local WooCommerce pages and child theme, without payment submission.
import { spawn, spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { writeFileSync } from "node:fs";
import { setTimeout } from "node:timers";
import { Buffer } from "node:buffer";
import process from "node:process";
import console from "node:console";
import assert from "node:assert/strict";
const { fetch, WebSocket } = globalThis;
let raw = "";
for await (const chunk of process.stdin) raw += chunk;
const data = JSON.parse(raw);
const browser = spawn(
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  [
    "--headless=new",
    "--remote-debugging-port=9239",
    "--remote-debugging-address=127.0.0.1",
    "--user-data-dir=" + resolve(".local-tools/production-qa/chrome"),
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
        await (await fetch("http://127.0.0.1:9239/json/list")).json()
      ).find((page) => page.type === "page");
    } catch {
      /* startup */
    }
    if (!target) await pause(100);
  }
  assert.ok(target);
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((done, fail) => {
    ws.onopen = done;
    ws.onerror = fail;
  });
  let sequence = 0;
  const pending = new Map(),
    errors = [];
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown")
      errors.push(message.params.exceptionDetails.text);
    const p = pending.get(message.id);
    if (p) {
      pending.delete(message.id);
      if (message.error) p.reject(message.error);
      else p.resolve(message.result);
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
  const until = async (expression) => {
    for (let i = 0; i < 150; i++) {
      try {
        if (await evaluate("!!(" + expression + ")")) return;
      } catch {
        /* navigation */
      }
      await pause(100);
    }
    const diagnostic = await evaluate(
      `({path:location.pathname,details:[...document.querySelectorAll('details')].map(element=>element.id),fileInputs:document.querySelectorAll('input[type=file]').length,alerts:[...document.querySelectorAll('[role=alert]')].map(element=>element.textContent)})`,
    );
    throw new Error(
      "Timed out: " + expression + " " + JSON.stringify(diagnostic),
    );
  };
  await call("Page.enable");
  await call("Runtime.enable");
  await call("Network.enable");
  await call("Network.clearBrowserCookies");
  const widths = [320, 375, 768, 1024, 1440];
  const baseline = new Map();
  async function capture(name, route, reference = false) {
    for (const width of widths) {
      await call("Emulation.setDeviceMetricsOverride", {
        width,
        height: 1100,
        deviceScaleFactor: 1,
        mobile: width < 500,
      });
      await evaluate(`document.fonts.ready`);
      const layout = await evaluate(`(() => {
        const header = document.querySelector('.rak-site-header');
        const logo = header.querySelector('.brand');
        const inner = header.querySelector('.header-inner');
        const footer = document.querySelector('.rak-site-footer');
        const credit = footer.querySelector('.developer-credit');
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          header: [header.offsetHeight, logo.offsetWidth, logo.offsetHeight],
          container: [inner.offsetWidth, inner.getBoundingClientRect().left, document.documentElement.clientWidth],
          links: [...header.querySelectorAll('nav a')].map(a => a.textContent.trim()),
          active: header.querySelector('[aria-current]')?.textContent.trim(),
          credit: [credit.textContent.trim(), credit.getAttribute('href'), credit.target, credit.rel],
          icon: [...document.querySelectorAll('link[rel=icon]')].map(link => link.getAttribute('href')),
        };
      })()`);
      assert.equal(layout.overflow, false, name + " overflow at " + width);
      const [container, left, available] = layout.container;
      assert.equal(
        container,
        Math.min(
          1192,
          available - (width <= 520 ? 32 : width <= 800 ? 40 : 64),
        ),
      );
      assert.ok(
        Math.abs(left - (available - container) / 2) <= 1,
        name + " header off center",
      );
      assert.deepEqual(layout.links, [
        "Início",
        "Solicitar kit",
        "Meus pedidos",
        "Minha conta",
      ]);
      assert.equal(layout.active, route);
      assert.deepEqual(layout.icon, ["/favicon.ico"]);
      assert.deepEqual(layout.credit, [
        "Desenvolvido por Douglas Borges - Smart Local",
        "https://smartlocal.com.br",
        "_blank",
        "noopener noreferrer",
      ]);
      if (reference) baseline.set(width, layout.header);
      else
        assert.deepEqual(
          layout.header,
          baseline.get(width),
          name + " header at " + width,
        );
      const shot = await call("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: true,
      });
      writeFileSync(
        resolve(
          ".local-tools/production-qa/chrome-" + name + "-" + width + ".png",
        ),
        Buffer.from(shot.data, "base64"),
      );
    }
  }
  await call("Page.navigate", { url: "http://127.0.0.1:8097/" });
  await until(
    `document.readyState==='complete' && !!document.querySelector('.home .hero')`,
  );
  await capture("home", "Início", true);
  await call("Page.navigate", { url: data.loginUrl });
  await until(
    `document.readyState==='complete'&&document.querySelector('#rak_phone')`,
  );
  assert.equal(
    await evaluate(`document.body.classList.contains('rak-native')`),
    true,
  );
  await evaluate(`document.fonts.ready`);
  assert.match(
    await evaluate(`getComputedStyle(document.querySelector('h1')).fontFamily`),
    /Montserrat/,
  );
  await evaluate(
    `(()=>{const field=document.querySelector('#rak_phone');field.value='+55 (21) 99999-0001';field.dispatchEvent(new Event('input',{bubbles:true}));})()`,
  );
  assert.equal(
    await evaluate(`document.querySelector('#rak_phone').value`),
    "(21) 99999-0001",
  );
  await evaluate(
    `(()=>{const field=document.querySelector('#rak_cpf');field.value='11111111111';field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('focusout',{bubbles:true}));})()`,
  );
  assert.equal(
    await evaluate(
      `document.querySelector('#rak_cpf').getAttribute('aria-invalid')`,
    ),
    "true",
  );
  await capture("login", "Minha conta");
  const recovery = await evaluate(
    `document.querySelector('a[href*="lost-password"]').href`,
  );
  await call("Page.navigate", { url: recovery });
  await until(
    `document.readyState==='complete' && document.querySelector('.lost_reset_password')`,
  );
  await capture("recuperacao", "Minha conta");
  await call("Emulation.setDeviceMetricsOverride", {
    width: 375,
    height: 900,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await until(`innerWidth === 375 && document.querySelector('.rak-site-header.menu-ready') &&
    getComputedStyle(document.querySelector('.rak-site-header button')).display === 'grid'`);
  await evaluate(`document.querySelector('.rak-site-header button').focus()`);
  assert.ok(
    await evaluate(`document.activeElement.classList.contains('menu-toggle')`),
  );
  await call("Input.dispatchKeyEvent", {
    type: "rawKeyDown",
    key: " ",
    code: "Space",
    windowsVirtualKeyCode: 32,
  });
  await call("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: " ",
    code: "Space",
    windowsVirtualKeyCode: 32,
  });
  assert.ok(
    await evaluate(
      `document.querySelector('.rak-site-header button').getAttribute('aria-expanded') === 'true'`,
    ),
  );
  await evaluate(`document.querySelector('.rak-site-header nav a').focus()`);
  await call("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  assert.ok(
    await evaluate(
      `document.activeElement.classList.contains('menu-toggle') && document.activeElement.getAttribute('aria-expanded') === 'false' && getComputedStyle(document.activeElement).outlineStyle !== 'none'`,
    ),
  );
  await call("Page.navigate", { url: data.loginUrl });
  await until(
    `document.readyState==='complete'&&document.querySelector('#rak_phone')`,
  );
  for (const pair of data.cookie.split("; ")) {
    const at = pair.indexOf("=");
    await call("Network.setCookie", {
      name: pair.slice(0, at),
      value: pair.slice(at + 1),
      url: "http://127.0.0.1:8097",
      path: "/",
    });
  }
  await call("Page.navigate", { url: data.checkoutUrl });
  await until(
    `document.readyState==='complete'&&document.querySelector('form#order_review')`,
  );
  assert.equal(
    await evaluate(
      `!!document.querySelector('.rak-site-header img[src="/brand/logo-corredor-original.jpg"]')`,
    ),
    true,
    "Checkout must use official header",
  );
  await capture("checkout", "Solicitar kit");
  await call("Page.navigate", { url: data.receivedUrl });
  await until(
    `document.readyState==='complete'&&document.querySelector('.rak-order-next')`,
  );
  assert.ok(
    await evaluate(
      `document.querySelector('main').textContent.includes('O pagamento foi confirmado.')`,
    ),
  );
  assert.equal(
    await evaluate(`!!document.querySelector('.rak-site-header') && !!document.querySelector('.rak-site-footer') &&
      !!document.querySelector('.rak-order-next a[href$="pedido=${data.request}"]')`),
    true,
    "Order confirmation must show the official header, footer and order action",
  );
  await capture("confirmacao", "Meus pedidos");
  await call("Page.navigate", { url: data.pendingReceivedUrl });
  await until(
    `document.readyState==='complete'&&document.querySelector('.rak-order-next')`,
  );
  assert.ok(
    await evaluate(`document.querySelector('main').textContent.includes('Acompanhe a situação do pagamento') &&
      !document.querySelector('main').textContent.includes('O pagamento foi confirmado.')`),
    "Pending order was displayed as paid",
  );
  assert.deepEqual(errors, [], "JavaScript exceptions on native pages");
  await call("Page.navigate", {
    url: "http://127.0.0.1:8097/solicitacao/participantes",
  });
  await until(
    `document.readyState==='complete'&&document.querySelector('form button[type="submit"]')&&[...document.querySelectorAll('form button[type="submit"]')].some(button=>button.textContent.includes('Continuar'))`,
  );
  assert.equal(
    await evaluate(
      `document.body.textContent.includes('Salvar cadastro do participante')`,
    ),
    false,
    "Wizard still requires manual save",
  );
  await evaluate(
    `[...document.querySelectorAll('form button[type="submit"]')].find(button=>button.textContent.includes('Continuar')).click()`,
  );
  await until(`location.pathname==='/solicitacao/documentos'`);
  await until(`document.body.textContent.includes('Rascunho salvo.')`);
  assert.equal(
    await evaluate(`document.body.textContent.includes('DEMONSTRAÇÃO')`),
    true,
  );
  const fixture = spawnSync(
    resolve(".local-tools/php/php.exe"),
    [
      resolve("tests/production-ui-worker.php"),
      resolve(".local-tools/hostgator-qa/site/app"),
      String(data.request),
    ],
    { windowsHide: true },
  );
  assert.equal(fixture.status, 0, "Converted-order fixture transition failed");
  await call("Page.navigate", { url: "http://127.0.0.1:8097/conta" });
  await until(
    `document.readyState==='complete'&&document.body.textContent.includes('Pedidos recentes')`,
  );
  await until(
    `!document.body.textContent.includes('Carregando sua solicitação')`,
  );
  assert.equal(
    await evaluate(`document.body.textContent.includes('Retomar solicitação')`),
    false,
    "Converted order still appears as active draft",
  );
  await capture("conta", "Minha conta");
  const ordersUrl = "http://127.0.0.1:8097/acompanhamento";
  await call("Page.navigate", { url: ordersUrl });
  await until(`document.querySelector('.account-order-race')`);
  await capture("pedidos-fechado", "Meus pedidos");
  await evaluate(
    `document.querySelector('#pedido-${data.request} summary').focus()`,
  );
  await call("Input.dispatchKeyEvent", {
    type: "rawKeyDown",
    key: " ",
    code: "Space",
    windowsVirtualKeyCode: 32,
  });
  await call("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: " ",
    code: "Space",
    windowsVirtualKeyCode: 32,
  });
  assert.ok(
    await evaluate(`document.querySelector('#pedido-${data.request}').open`),
  );
  await call("Page.navigate", { url: ordersUrl + "?pedido=" + data.request });
  await until(
    `document.querySelector('#pedido-${data.request}[open] .account-order-groups')`,
  );
  assert.deepEqual(
    await evaluate(
      `[...document.querySelectorAll('#pedido-${data.request} .account-order-groups h3')].map(title => title.textContent)`,
    ),
    ["Participante", "Documentação", "Voucher", "Retirada"],
  );
  await capture("pedidos-expandido", "Meus pedidos");
  const documentTarget =
    "/conta?pedido=" + data.request + "&documentos=0#pedido-" + data.request;
  await call("Page.navigate", {
    url: "http://127.0.0.1:8097" + documentTarget,
  });
  await until(`document.getElementById('pedido-${data.request}')`);
  const orderDiagnostic = await evaluate(
    `(async()=>{const session=await(await fetch('/app/wp-admin/admin-ajax.php?action=rak_session',{headers:{'X-RAK-Session':'1'},credentials:'same-origin'})).json();const result=await(await fetch('/app/wp-json/re-almeida/v1/account/orders',{headers:{'X-WP-Nonce':session.nonce},credentials:'same-origin'})).json();return{ids:[...document.querySelectorAll('li[id]')].map(element=>element.id),orders:result.orders?.map(order=>({id:order.id,paid:order.paid,lines:order.lines.map(line=>({index:line.documentLine,status:line.documentStatus,documents:line.documents?.map(doc=>({status:doc.status,canReplace:doc.canReplace}))}))}))};})()`,
  );
  assert.equal(
    await evaluate(
      `!!document.getElementById('pedido-${data.request}-participante-0')`,
    ),
    true,
    "Order line diagnostic: " + JSON.stringify(orderDiagnostic),
  );
  const documentState = await evaluate(
    `({text:document.getElementById('pedido-${data.request}').textContent,ids:[...document.querySelectorAll('li[id]')].map(element=>element.id),canUpload:!!document.querySelector('#pedido-${data.request}-participante-0 input[type="file"]')})`,
  );
  assert.equal(
    documentState.canUpload,
    false,
    "A replacement already awaiting review must not show another upload",
  );
  assert.ok(
    documentState.text.includes("Recebido, aguardando análise"),
    "Document correction target did not show the replaced document",
  );
  await call("Network.clearBrowserCookies");
  await call("Page.navigate", {
    url: "http://127.0.0.1:8097" + documentTarget,
  });
  await call("Page.reload", { ignoreCache: true });
  await until(`document.body.textContent.includes('Entre ou crie')`);
  await evaluate(
    `[...document.querySelectorAll('button')].find(button=>button.textContent.trim()==='Entrar').click()`,
  );
  await until(
    `location.pathname!=='/conta'&&new URLSearchParams(location.search).has('rak_return')`,
  );
  assert.equal(
    await evaluate(`new URLSearchParams(location.search).get('rak_return')`),
    documentTarget,
    "Document correction target lost before login",
  );
  assert.deepEqual(errors, [], "JavaScript exceptions in React flow");
  console.log(
    "OK Chromium: 40 capturas em 320/375/768/1024/1440, paridade de cabeçalho, rodapé e favicon, menu e pedidos por teclado, sessão, máscaras e salvamento automático. Nenhum pagamento enviado.",
  );
} finally {
  ws?.close();
  browser.kill();
}
