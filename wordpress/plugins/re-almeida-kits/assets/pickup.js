(() => {
  const panel = document.querySelector('.rak-pickup');
  if (!panel) return;
  const status = document.querySelector('#rak-status');
  const results = document.querySelector('#rak-results');
  const video = document.querySelector('#rak-video');
  let stream;
  let busy = false;
  let scanGeneration = 0;
  const text = (tag, value) => {
    const element = document.createElement(tag);
    element.textContent = value;
    return element;
  };
  async function request(action, values) {
    const response = await window.fetch(panel.dataset.api + action, {
      method: 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: {'Content-Type': 'application/json', 'X-WP-Nonce': panel.dataset.nonce},
      body: JSON.stringify(values),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Operação recusada. Consulte novamente.');
    return data;
  }
  function stop() {
    scanGeneration++;
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
    video.srcObject = null;
    video.hidden = true;
    document.querySelector('#rak-stop').hidden = true;
  }
  async function run(work) {
    if (busy) return;
    busy = true;
    status.textContent = 'Consultando o servidor…';
    results.querySelectorAll('button').forEach(button => { button.disabled = true; });
    try { await work(); }
    catch (error) {
      status.textContent = error instanceof Error ? error.message : 'Falha de conexão. Consulte novamente antes de confirmar.';
      // Never keep an old confirmation action after an uncertain server response.
      results.replaceChildren();
    } finally { busy = false; }
  }
  function show(vouchers, confirmed = false) {
    results.replaceChildren();
    status.textContent = confirmed ? 'RETIRADA CONFIRMADA PELO SERVIDOR.' : vouchers.length ? 'Confira os dados antes de confirmar.' : 'Nenhum voucher encontrado.';
    for (const voucher of vouchers) {
      const card = document.createElement('section');
      card.className = 'rak-voucher-result';
      card.append(text('h2', voucher.participant), text('p', voucher.race + ' · ' + voucher.modality),
        text('p', 'Solicitação ' + voucher.request), text('strong', voucher.label), text('p', voucher.reason));
      if (voucher.collectedAt) card.append(text('p', new Date(voucher.collectedAt.replace(' ', 'T')).toLocaleString('pt-BR') + ' · Funcionário ' + voucher.actor + ' · Operação ' + voucher.operation));
      if (voucher.state === 'released') {
        const button = text('button', 'Confirmar retirada');
        button.type = 'button';
        button.className = 'button button-primary';
        button.addEventListener('click', () => {
          if (!window.confirm('Confirmar a entrega para ' + voucher.participant + ' — ' + voucher.race + '?')) return;
          void run(async () => show([await request('confirm', {token: voucher.token})], true));
        });
        card.append(button);
      }
      results.append(card);
    }
  }
  function tokenFrom(value) {
    value = value.trim();
    if (/^[a-f0-9]{64}$/.test(value)) return value;
    const url = new window.URL(value);
    if (url.origin !== window.location.origin) throw new Error('URL de voucher inválida.');
    const token = new window.URLSearchParams(url.hash.slice(1)).get('voucher');
    if (!/^[a-f0-9]{64}$/.test(token || '')) throw new Error('Código de voucher inválido.');
    return token;
  }
  const lookup = value => run(async () => show([await request('lookup', {token: tokenFrom(value)})]));
  document.querySelector('#rak-code').addEventListener('submit', event => {
    event.preventDefault(); stop(); void lookup(document.querySelector('#rak-token').value);
  });
  document.querySelector('#rak-search').addEventListener('submit', event => {
    event.preventDefault(); stop(); void run(async () => show((await request('search', {q: document.querySelector('#rak-query').value})).results));
  });
  document.querySelector('#rak-stop').addEventListener('click', stop);
  document.querySelector('#rak-camera').addEventListener('click', async () => {
    stop();
    try {
      const detector = 'BarcodeDetector' in window ? new window.BarcodeDetector({formats: ['qr_code']}) : null;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', {willReadFrequently: true});
      const generation = scanGeneration;
      const opened = await window.navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment'}, audio: false});
      if (generation !== scanGeneration) { opened.getTracks().forEach(track => track.stop()); return; }
      stream = opened;
      video.srcObject = stream; video.hidden = false;
      document.querySelector('#rak-stop').hidden = false;
      await video.play();
      status.textContent = 'Aponte a câmera para o QR Code.';
      const scan = async () => {
        if (generation !== scanGeneration || !stream) return;
        try {
          let value;
          if (detector) value = (await detector.detect(video))[0]?.rawValue;
          else if (video.videoWidth && context) {
            canvas.width = Math.min(video.videoWidth, 960);
            canvas.height = Math.round(video.videoHeight * canvas.width / video.videoWidth);
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const image = context.getImageData(0, 0, canvas.width, canvas.height);
            value = window.jsQR(image.data, image.width, image.height)?.data;
          }
          if (generation !== scanGeneration) return;
          if (value) { stop(); await lookup(value); return; }
          window.setTimeout(scan, 250);
        } catch { stop(); status.textContent = 'Não foi possível ler. Use a consulta manual.'; }
      };
      void scan();
    } catch { stop(); status.textContent = 'Câmera indisponível. Verifique a permissão e o HTTPS ou use a consulta manual.'; }
  });
  window.addEventListener('pagehide', stop);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  const initial = new window.URLSearchParams(window.location.hash.slice(1)).get('voucher');
  if (initial) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    void lookup(initial);
  }
})();
