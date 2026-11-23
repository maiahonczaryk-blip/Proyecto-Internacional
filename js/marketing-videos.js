/* ============================================
   The Spain Connection — Vídeos Personalizados (Laboratorio de Marketing)
   ============================================
   Cada vídeo oficial se publica en /videos en inglés (<id>) y en español (<id>-es) como:
     · <id>.mp4  → vídeo base SIN la tarjeta de contacto (hueco limpio en la escena final)
     · <id>.json → posición, tiempos y animación exactos de la tarjeta
     · <id>.jpg  → póster
   Al exportar, el navegador:
     1. Dibuja la tarjeta de contacto del usuario registrado (foto, nombre, cargo, teléfono, email).
     2. Decodifica el vídeo base (WebCodecs + mp4box.js), superpone la tarjeta con la misma
        animación de entrada y el mismo barrido de "olas" de marca, y lo re-codifica en H.264.
     3. Copia el audio original (voz + música) sin pérdida y genera un MP4 (mp4-muxer).
   Fallback sin WebCodecs: grabación en tiempo real con MediaRecorder.
   ============================================ */

window.App = window.App || {};

App.marketingVideos = (function () {
  const VERSION = '20261123_v2';
  const BASE = 'videos/';
  const PAD = 46; // margen de sombra (igual que el motor de render)

  const VIDEOS = [
    {
      id: 'what-is-the-spain-connection', icon: '🌍', accent: '#0672C5', duration: '1:59', durationEs: '2:12',
      fileName: 'What_is_The_Spain_Connection', fileNameEs: 'Que_es_The_Spain_Connection',
      titleEn: 'What is The Spain Connection?', titleEs: '¿Qué es The Spain Connection?',
      descEn: 'The big picture: why Spain, how the platform works, our partners (RE/MAX Inmomás, Fuster, UCI, Inmomás Holidays) and every role — brokers, realtors, ambassadors & collaborators.',
      descEs: 'La visión general: por qué España, cómo funciona la plataforma, los socios (RE/MAX Inmomás, Fuster, UCI, Inmomás Holidays) y el rol de brokers, realtors, embajadores y colaboradores.',
      roles: 'all'
    },
    {
      id: 'buyers-guide', icon: '📘', accent: '#fe8933', duration: '1:56', durationEs: '2:14',
      fileName: 'Buyers_Guide_The_Spain_Connection', fileNameEs: 'Guia_del_Comprador_The_Spain_Connection',
      titleEn: "Buyer's Guide — Your Home in Spain", titleEs: 'Guía del Comprador — Tu casa en España',
      descEn: 'For your buyers: lifestyle, cost of living, new builds, the buying process, costs & taxes, visas and the partner team.',
      descEs: 'Para tus compradores: estilo de vida, coste de vida, obra nueva, proceso de compra, costes e impuestos, visados y el equipo de socios.',
      roles: 'all'
    },
    {
      id: 'broker-presentation', icon: '🏢', accent: '#0672C5', duration: '1:47', durationEs: '1:58',
      fileName: 'Broker_Presentation_The_Spain_Connection', fileNameEs: 'Presentacion_Brokers_The_Spain_Connection',
      titleEn: 'Broker Presentation', titleEs: 'Presentación para Brokers',
      descEn: 'Turnkey Spain division for brokerages: 3-step model, broker portal, VIP trips and the 25% buyer-side commission.',
      descEs: 'División llave en mano para agencias: modelo en 3 pasos, portal del broker, viajes VIP y el 25 % de la comisión de compra.',
      roles: ['admin', 'agent_inmomas', 'embajador', 'broker']
    },
    {
      id: 'realtor-presentation', icon: '🏠', accent: '#059669', duration: '1:31', durationEs: '1:44',
      fileName: 'Realtor_Presentation_The_Spain_Connection', fileNameEs: 'Presentacion_Realtors_The_Spain_Connection',
      titleEn: 'Realtor Presentation', titleEs: 'Presentación para Realtors',
      descEn: 'For agents & Realtors®: refer with your link, we handle Spain, you earn 15% direct (or via your broker).',
      descEs: 'Para agentes y Realtors®: refieren con su enlace, nosotros gestionamos España y cobran un 15 % directo (o vía su broker).',
      roles: ['admin', 'agent_inmomas', 'embajador', 'broker', 'realtor', 'colaborador']
    },
    {
      id: 'ambassador-presentation', icon: '👑', accent: '#d97706', duration: '1:35', durationEs: '1:43',
      fileName: 'Ambassador_Presentation_The_Spain_Connection', fileNameEs: 'Presentacion_Embajadores_The_Spain_Connection',
      titleEn: 'Ambassador Presentation', titleEs: 'Presentación para Embajadores',
      descEn: 'Executive program: build an umbrella network of brokers, agents & buyers — 15% net across it, 25% on direct buyers.',
      descEs: 'Programa ejecutivo: construir una red paraguas de brokers, agentes y compradores — 15 % neto sobre la red y 25 % por comprador directo.',
      roles: ['admin', 'agent_inmomas']
    }
  ];

  const FONT = '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif';
  const C = { navy: '#25364A', blue: '#0672C5', slate: '#4B5A70', orange: '#FE8933' };

  /* ---------- Utilidades ---------- */

  const esc = (v) => String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const isEn = () => document.body.classList.contains('lang-en') || document.body.classList.contains('lang-en-ca');
  const eo3 = (p) => 1 - Math.pow(1 - p, 3);
  const eio = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  /* ---------- Idioma del vídeo (EN / ES) ---------- */
  let selectedLang = null; // null → sigue el idioma de la interfaz
  const curLang = () => selectedLang || (isEn() ? 'en' : 'es');
  /** Devuelve el vídeo con el id de recurso del idioma elegido (<id> o <id>-es). */
  function localized(video, lang) {
    const es = (lang || curLang()) === 'es';
    return Object.assign({}, video, {
      id: es ? `${video.id}-es` : video.id,
      baseId: video.id,
      lang: es ? 'es' : 'en',
      fileName: es ? (video.fileNameEs || video.fileName) + '_ES' : video.fileName + '_EN',
      duration: es ? (video.durationEs || video.duration) : video.duration
    });
  }

  function videosForRole(role, isAdminViewer) {
    return VIDEOS.filter(v => isAdminViewer || v.roles === 'all' || v.roles.includes(role));
  }

  function slugify(name) {
    return String(name || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'Partner';
  }

  const metaCache = {};
  function loadMeta(id) {
    if (!metaCache[id]) {
      metaCache[id] = fetch(`${BASE}${id}.json?v=${VERSION}`).then(r => {
        if (!r.ok) throw new Error('Video metadata not found');
        return r.json();
      }).catch(e => { delete metaCache[id]; throw e; });
    }
    return metaCache[id];
  }

  function loadScript(src, globalName) {
    if (window[globalName]) return Promise.resolve(window[globalName]);
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = `${src}?v=${VERSION}`;
      s.onload = () => (window[globalName] ? resolve(window[globalName]) : reject(new Error(globalName + ' unavailable')));
      s.onerror = () => reject(new Error('Could not load ' + src));
      document.head.appendChild(s);
    });
  }

  function loadImg(src) {
    return new Promise((resolve, reject) => {
      if (!src) return resolve(null);
      const img = new Image();
      if (/^https?:/i.test(src)) img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  /* ---------- 1. Tarjeta de contacto (idéntica en estilo a la del vídeo) ---------- */

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function fitFont(ctx, text, weight, maxSize, maxWidth, minSize = 14) {
    let size = maxSize;
    ctx.font = `${weight} ${size}px ${FONT}`;
    while (size > minSize && ctx.measureText(text).width > maxWidth) {
      size -= 1;
      ctx.font = `${weight} ${size}px ${FONT}`;
    }
    return size;
  }

  function drawTracked(ctx, text, x, y, tracking) {
    for (const ch of text) {
      ctx.fillText(ch, x, y);
      x += ctx.measureText(ch).width + tracking;
    }
  }

  /** Devuelve un canvas (w+2·PAD × h+2·PAD) con sombra + tarjeta blanca personalizada. */
  async function buildCardCanvas(data, card, lang) {
    const { w, h } = card;
    const r = card.r || 26;
    const cv = document.createElement('canvas');
    cv.width = w + PAD * 2;
    cv.height = h + PAD * 2;
    const ctx = cv.getContext('2d');

    // Sombra suave (como shadow_img del motor: alpha≈0.27, desenfoque 20, desplazada 12px)
    ctx.save();
    ctx.shadowColor = 'rgba(16, 34, 60, 0.30)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 12;
    roundRect(ctx, PAD, PAD, w, h, r);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
    roundRect(ctx, PAD, PAD, w, h, r);
    ctx.fillStyle = '#fff';
    ctx.fill();

    const [photo, logo] = await Promise.all([loadImg(data.photo), loadImg(data.agencyLogo)]);

    // Foto circular con aro naranja
    let tx = PAD + 40;
    if (photo) {
      const s = Math.min(h - 56, 158);
      const px = PAD + 34, py = PAD + (h - s) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(px + s / 2, py + s / 2, s / 2, 0, Math.PI * 2);
      ctx.clip();
      const ratio = Math.max(s / photo.width, s / photo.height);
      const iw = photo.width * ratio, ih = photo.height * ratio;
      ctx.drawImage(photo, px + (s - iw) / 2, py + (s - ih) / 2, iw, ih);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(px + s / 2, py + s / 2, s / 2 - 2, 0, Math.PI * 2);
      ctx.lineWidth = 5;
      ctx.strokeStyle = C.orange;
      ctx.stroke();
      tx = px + s + 34;
    }

    // Logo de agencia (opcional) arriba a la derecha
    let rightLimit = PAD + w - 34;
    if (logo) {
      const maxW = 170, maxH = 58;
      const sc = Math.min(maxW / logo.width, maxH / logo.height);
      const lw = logo.width * sc, lh = logo.height * sc;
      ctx.drawImage(logo, PAD + w - 30 - lw, PAD + 28, lw, lh);
      rightLimit = PAD + w - 30 - lw - 20;
    }

    const textW = Math.max(200, rightLimit - tx);
    const fullW = PAD + w - 34 - tx;
    const top = PAD + (h - 186) / 2; // bloque de texto centrado verticalmente (≈186px)

    ctx.fillStyle = C.blue;
    ctx.font = `700 17px ${FONT}`;
    ctx.textBaseline = 'alphabetic';
    drawTracked(ctx, (lang || curLang()) === 'es' ? 'TU CONTACTO DIRECTO' : 'YOUR DIRECT CONTACT', tx, top + 22, 2.6);

    ctx.fillStyle = C.navy;
    fitFont(ctx, data.name, 800, 42, textW, 24);
    ctx.fillText(data.name, tx, top + 74);

    if (data.title) {
      ctx.fillStyle = C.slate;
      fitFont(ctx, data.title, 500, 23, fullW, 15);
      ctx.fillText(data.title, tx, top + 116);
    }

    const contact = [data.mobile, data.email].filter(Boolean).join('   ·   ');
    if (contact) {
      ctx.fillStyle = C.blue;
      fitFont(ctx, contact, 650, 25, fullW, 15);
      ctx.fillText(contact, tx, top + 166);
    }
    return cv;
  }

  /* ---------- 2. Composición de la tarjeta en un fotograma (animación + barrido de olas) ---------- */

  function overlayState(meta, t) {
    const c = meta.card;
    const end = meta.sceneEnd;
    const tr = meta.wipe.trans;
    if (t < c.t0 - 0.001 || t >= end + tr / 2) return null;
    let e = eo3(Math.min(1, Math.max(0, (t - c.t0) / c.animDur)));
    let clip = null;
    if (t >= end) {
      // La escena siguiente cubre el fotograma final con las olas de marca → recortamos la tarjeta
      e = 1;
      const cc = eio(((t - end) / tr) / 0.5);
      const ext = meta.wipe.ext;
      clip = { edge: -ext + cc * (meta.width + 2 * ext), skew: meta.wipe.skew };
    }
    return { x: c.x - PAD - (1 - e) * c.dist, y: c.y - PAD, alpha: e, clip };
  }

  function drawOverlay(ctx, meta, cardCanvas, t, scale = 1) {
    const st = overlayState(meta, t);
    if (!st || st.alpha <= 0.003) return false;
    ctx.save();
    if (scale !== 1) ctx.scale(scale, scale);
    if (st.clip) {
      const H = meta.height, W = meta.width, { edge, skew } = st.clip;
      ctx.beginPath();
      ctx.moveTo(edge + skew, -10);
      ctx.lineTo(W + 10, -10);
      ctx.lineTo(W + 10, H + 10);
      ctx.lineTo(edge, H + 10);
      ctx.closePath();
      ctx.clip();
    }
    ctx.globalAlpha = st.alpha;
    ctx.drawImage(cardCanvas, Math.round(st.x), Math.round(st.y));
    ctx.restore();
    return true;
  }

  /* ---------- 3. Exportación MP4 con WebCodecs (rápida, calidad completa) ---------- */

  async function pickEncoderConfig(w, h) {
    const candidates = ['avc1.640028', 'avc1.4d0028', 'avc1.42e028', 'avc1.640032'];
    for (const codec of candidates) {
      const cfg = { codec, width: w, height: h, bitrate: 3_500_000, bitrateMode: 'variable', latencyMode: 'quality',
        framerate: 30, avc: { format: 'avc' } };
      try {
        const sup = await VideoEncoder.isConfigSupported(cfg);
        if (sup && sup.supported) return cfg;
      } catch (_) {}
    }
    throw new Error('H.264 encoding is not supported in this browser.');
  }

  function avcDescription(trak) {
    const DS = window.DataStream || (window.MP4Box && window.MP4Box.DataStream);
    for (const entry of trak.mdia.minf.stbl.stsd.entries) {
      const box = entry.avcC || entry.hvcC;
      if (box) {
        const stream = new DS(undefined, 0, DS.BIG_ENDIAN);
        box.write(stream);
        return new Uint8Array(stream.buffer, 8);
      }
    }
    return undefined;
  }

  function demux(buffer) {
    return new Promise((resolve, reject) => {
      const file = MP4Box.createFile();
      const out = { video: null, audio: null, vSamples: [], aSamples: [] };
      file.onError = (e) => reject(new Error('MP4 demux error: ' + e));
      file.onReady = (info) => {
        out.info = info;
        out.video = info.videoTracks[0];
        out.audio = info.audioTracks[0] || null;
        file.setExtractionOptions(out.video.id, 'v', { nbSamples: 100000 });
        if (out.audio) file.setExtractionOptions(out.audio.id, 'a', { nbSamples: 100000 });
        out.vTrak = file.getTrackById(out.video.id);
        out.aTrak = out.audio ? file.getTrackById(out.audio.id) : null;
        file.start();
      };
      file.onSamples = (id, user, samples) => {
        (user === 'v' ? out.vSamples : out.aSamples).push(...samples);
        const vDone = out.vSamples.length >= out.video.nb_samples;
        const aDone = !out.audio || out.aSamples.length >= out.audio.nb_samples;
        if (vDone && aDone) resolve(out);
      };
      buffer.fileStart = 0;
      file.appendBuffer(buffer);
      file.flush();
    });
  }

  async function exportWithWebCodecs(video, meta, cardCanvas, onProgress) {
    await Promise.all([loadScript('js/vendor/mp4box.all.min.js', 'MP4Box'), loadScript('js/vendor/mp4-muxer.js', 'Mp4Muxer')]);
    onProgress(0.02, 'download');
    const buf = await fetch(`${BASE}${video.id}.mp4?v=${VERSION}`).then(r => {
      if (!r.ok) throw new Error('Base video not found');
      return r.arrayBuffer();
    });
    const dm = await demux(buf);
    const W = dm.video.video.width, H = dm.video.video.height;
    const encCfg = await pickEncoderConfig(W, H);

    const audioCfg = dm.audio ? (() => {
      const entry = dm.aTrak.mdia.minf.stbl.stsd.entries[0];
      let asc;
      try { asc = entry.esds.esd.descs[0].descs[0].data; } catch (_) { asc = undefined; }
      return { codec: dm.audio.codec || 'mp4a.40.2', numberOfChannels: dm.audio.audio.channel_count, sampleRate: dm.audio.audio.sample_rate, description: asc };
    })() : null;

    const muxer = new Mp4Muxer.Muxer({
      target: new Mp4Muxer.ArrayBufferTarget(),
      video: { codec: 'avc', width: W, height: H, frameRate: meta.fps || 30 },
      audio: audioCfg ? { codec: 'aac', numberOfChannels: audioCfg.numberOfChannels, sampleRate: audioCfg.sampleRate } : undefined,
      fastStart: 'in-memory',
      firstTimestampBehavior: 'offset'
    });

    // Audio: copia directa de las muestras AAC originales (sin pérdida)
    if (audioCfg) {
      const ts = dm.audio.timescale;
      dm.aSamples.forEach((s, i) => {
        muxer.addAudioChunkRaw(new Uint8Array(s.data), 'key', Math.round(s.cts * 1e6 / ts), Math.round(s.duration * 1e6 / ts),
          i === 0 ? { decoderConfig: { codec: 'mp4a.40.2', numberOfChannels: audioCfg.numberOfChannels, sampleRate: audioCfg.sampleRate, description: audioCfg.description } } : undefined);
      });
    }

    const canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(W, H) : Object.assign(document.createElement('canvas'), { width: W, height: H });
    const ctx = canvas.getContext('2d');
    const total = dm.vSamples.length;
    const vts = dm.video.timescale;
    const firstCts = dm.vSamples.reduce((m, s) => Math.min(m, s.cts), Infinity);
    let encoded = 0, failure = null, frameIdx = 0;

    const encoder = new VideoEncoder({
      output: (chunk, md) => { muxer.addVideoChunk(chunk, md); encoded++; },
      error: (e) => { failure = e; }
    });
    encoder.configure(encCfg);

    const decoder = new VideoDecoder({
      output: (frame) => {
        try {
          const t = Math.round(((frame.timestamp / 1e6) - firstCts / vts) * meta.fps) / meta.fps;
          const keyFrame = frameIdx % 60 === 0;
          frameIdx++;
          const st = overlayState(meta, t);
          if (st && st.alpha > 0.003) {
            ctx.drawImage(frame, 0, 0, W, H);
            drawOverlay(ctx, meta, cardCanvas, t);
            const nf = new VideoFrame(canvas, { timestamp: frame.timestamp, duration: frame.duration || undefined });
            frame.close();
            encoder.encode(nf, { keyFrame });
            nf.close();
          } else {
            encoder.encode(frame, { keyFrame });
            frame.close();
          }
        } catch (e) { failure = e; frame.close(); }
      },
      error: (e) => { failure = e; }
    });
    decoder.configure({ codec: dm.video.codec, codedWidth: W, codedHeight: H, description: avcDescription(dm.vTrak) });

    for (let i = 0; i < total; i++) {
      if (failure) throw failure;
      const s = dm.vSamples[i];
      decoder.decode(new EncodedVideoChunk({
        type: s.is_sync ? 'key' : 'delta',
        timestamp: Math.round(s.cts * 1e6 / vts),
        duration: Math.round(s.duration * 1e6 / vts),
        data: s.data
      }));
      while ((decoder.decodeQueueSize > 12 || encoder.encodeQueueSize > 12) && !failure) await sleep(2);
      if (i % 15 === 0) onProgress(0.05 + 0.9 * (encoded / total), 'encode');
    }
    await decoder.flush();
    await encoder.flush();
    if (failure) throw failure;
    decoder.close();
    encoder.close();
    muxer.finalize();
    onProgress(1, 'done');
    return new Blob([muxer.target.buffer], { type: 'video/mp4' });
  }

  /* ---------- 4. Fallback: grabación en tiempo real (MediaRecorder) ---------- */

  async function exportWithRecorder(video, meta, cardCanvas, onProgress) {
    const el = document.createElement('video');
    el.src = `${BASE}${video.id}.mp4?v=${VERSION}`;
    el.crossOrigin = 'anonymous';
    el.playsInline = true;
    await new Promise((res, rej) => { el.onloadedmetadata = res; el.onerror = () => rej(new Error('Base video not found')); });
    const canvas = Object.assign(document.createElement('canvas'), { width: meta.width, height: meta.height });
    const ctx = canvas.getContext('2d');
    const stream = canvas.captureStream(meta.fps || 30);
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const src = ac.createMediaElementSource(el);
    const dest = ac.createMediaStreamDestination();
    src.connect(dest);
    dest.stream.getAudioTracks().forEach(tr => stream.addTrack(tr));
    const types = ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'];
    const mimeType = types.find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || '';
    const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 9_000_000 });
    const parts = [];
    rec.ondataavailable = (e) => e.data && e.data.size && parts.push(e.data);
    const stopped = new Promise(res => { rec.onstop = res; });
    let raf;
    const draw = () => {
      ctx.drawImage(el, 0, 0, meta.width, meta.height);
      drawOverlay(ctx, meta, cardCanvas, el.currentTime);
      onProgress(Math.min(0.99, el.currentTime / meta.duration), 'record');
      if (!el.ended) raf = requestAnimationFrame(draw);
    };
    rec.start(1000);
    await el.play();
    draw();
    await new Promise(res => { el.onended = res; });
    cancelAnimationFrame(raf);
    rec.stop();
    await stopped;
    ac.close();
    onProgress(1, 'done');
    return { blob: new Blob(parts, { type: mimeType || 'video/webm' }), ext: /mp4/.test(mimeType) ? 'mp4' : 'webm' };
  }

  async function exportPersonalized(videoId, data, onProgress = () => {}, lang) {
    const base = VIDEOS.find(v => v.id === videoId);
    if (!base) throw new Error('Unknown video');
    const video = localized(base, lang);
    const meta = await loadMeta(video.id);
    const cardCanvas = await buildCardCanvas(data, meta.card, video.lang);
    let blob, ext = 'mp4';
    if (window.VideoEncoder && window.VideoDecoder && window.VideoFrame) {
      blob = await exportWithWebCodecs(video, meta, cardCanvas, onProgress);
    } else {
      const r = await exportWithRecorder(video, meta, cardCanvas, onProgress);
      blob = r.blob; ext = r.ext;
    }
    return { blob, fileName: `${video.fileName}_${slugify(data.name)}.${ext}` };
  }

  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  /* ---------- 5. Vista previa (vídeo + tarjeta superpuesta en vivo) ---------- */

  async function openPreview(videoId, data, lang) {
    const video = localized(VIDEOS.find(v => v.id === videoId), lang);
    const meta = await loadMeta(video.id);
    const cardCanvas = await buildCardCanvas(data, meta.card, video.lang);
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; inset:0; z-index:9999; background:rgba(8,18,32,0.82); display:flex; align-items:center; justify-content:center; padding:24px;';
    overlay.innerHTML = `
      <div style="width:min(1100px, 100%); background:#0c1c30; border-radius:16px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.45);">
        <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; color:#fff;">
          <strong style="font-size:0.95rem;">${video.icon} ${esc(video.lang === 'es' ? video.titleEs : video.titleEn)} · <span style="color:#FFB37A;">${esc(data.name)}</span></strong>
          <button type="button" data-close style="background:transparent; border:none; color:#fff; font-size:1.4rem; cursor:pointer; line-height:1;">×</button>
        </div>
        <div style="position:relative; aspect-ratio:16/9; background:#000;">
          <video src="${BASE}${video.id}.mp4?v=${VERSION}" poster="${BASE}${video.id}.jpg?v=${VERSION}" controls playsinline style="position:absolute; inset:0; width:100%; height:100%;"></video>
          <canvas width="${meta.width}" height="${meta.height}" style="position:absolute; inset:0; width:100%; height:100%; pointer-events:none;"></canvas>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const el = overlay.querySelector('video');
    const cv = overlay.querySelector('canvas');
    const ctx = cv.getContext('2d');
    let raf;
    const loop = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      drawOverlay(ctx, meta, cardCanvas, el.currentTime);
      raf = requestAnimationFrame(loop);
    };
    loop();
    const close = () => { cancelAnimationFrame(raf); el.pause(); overlay.remove(); };
    overlay.querySelector('[data-close]').onclick = close;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    el.play().catch(() => {});
  }

  /* ---------- 6. Sección del Laboratorio ---------- */

  /**
   * @param {HTMLElement} container
   * @param {object} user  usuario objetivo
   * @param {object} opts  { isAdminViewer, getCardData: () => data|null (null si faltan datos), onMissing }
   */
  function renderSection(container, user, opts = {}) {
    if (!container || !user) return;
    const list = videosForRole(user.role, !!opts.isAdminViewer);
    if (!list.length) { container.innerHTML = ''; return; }
    const hasWebCodecs = !!(window.VideoEncoder && window.VideoDecoder);
    const lang = curLang();
    const langBtn = (code, label) => `<button type="button" data-video-lang="${code}" style="border:none; cursor:pointer; padding:6px 12px; font-size:0.78rem; font-weight:700; border-radius:999px; ${lang === code ? 'background:#0672C5; color:#fff;' : 'background:transparent; color:#334155;'}">${label}</button>`;

    container.innerHTML = `
      <div class="dashboard-section" style="margin-top:1.5rem;">
        <div style="margin-bottom:1rem;">
          <div style="font-size:0.73rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:#0672C5; margin-bottom:3px;">
            🎬 <span class="lang-en">PERSONALIZED VIDEOS · THE SPAIN CONNECTION</span><span class="lang-es">VÍDEOS PERSONALIZADOS · THE SPAIN CONNECTION</span>
          </div>
          <h2 style="margin:0 0 4px; font-size:1.16rem; font-weight:800; color:var(--text-primary, #0f172a);">
            <span class="lang-en">Explainer Videos With Your Contact Card</span>
            <span class="lang-es">Vídeos explicativos con tu tarjeta de contacto</span>
          </h2>
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin:6px 0 8px;">
            <span style="font-size:0.78rem; font-weight:700; color:#475569;"><span class="lang-en">Video language:</span><span class="lang-es">Idioma del vídeo:</span></span>
            <div style="display:inline-flex; gap:2px; background:#f1f5f9; border:1px solid #e2e8f0; border-radius:999px; padding:3px;">
              ${langBtn('en', '🇺🇸 English')}${langBtn('es', '🇪🇸 Español')}
            </div>
          </div>
          <p style="margin:0; font-size:0.83rem; color:#475569;">
            <span class="lang-en">Animated 1080p videos with voice-over. When exported, the closing scene shows your photo, name, role, phone and email.</span>
            <span class="lang-es">Vídeos animados en 1080p con voz en off. Al exportarlos, la escena final muestra tu foto, nombre, cargo, teléfono y email.</span>
          </p>
          ${hasWebCodecs ? '' : `<p style="margin:8px 0 0; font-size:0.78rem; color:#92400e; background:#fef3c7; border:1px solid #fde68a; border-radius:8px; padding:6px 10px; display:inline-block;">
            ⏱️ <span class="lang-en">Your browser will record the video in real time (keep this tab open). For a faster export use Chrome, Edge or Safari 17+.</span>
            <span class="lang-es">Tu navegador grabará el vídeo en tiempo real (mantén esta pestaña abierta). Para exportar más rápido usa Chrome, Edge o Safari 17+.</span></p>`}
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:1.15rem;">
          ${list.map(v0 => { const v = localized(v0, lang); return `
            <div style="background:#fff; border:1px solid #e2e8f0; border-top:4px solid ${v.accent}; border-radius:14px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 4px 14px rgba(15,23,42,0.04);">
              <button type="button" data-video-preview="${esc(v.baseId)}" style="position:relative; border:none; padding:0; cursor:pointer; background:#0c1c30; aspect-ratio:16/9; display:block;">
                <img src="${BASE}${esc(v.id)}.jpg?v=${VERSION}" alt="" loading="lazy" style="width:100%; height:100%; object-fit:cover; display:block;">
                <span style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center;">
                  <span style="width:58px; height:58px; border-radius:50%; background:rgba(254,137,51,0.95); color:#fff; display:flex; align-items:center; justify-content:center; font-size:1.4rem; box-shadow:0 6px 18px rgba(0,0,0,0.3);">▶</span>
                </span>
                <span style="position:absolute; right:10px; bottom:10px; background:rgba(12,28,48,0.85); color:#fff; font-size:0.72rem; font-weight:700; padding:3px 8px; border-radius:6px;">${v.lang === 'es' ? '🇪🇸 ES' : '🇺🇸 EN'} · ${esc(v.duration)}</span>
              </button>
              <div style="padding:1rem 1.15rem 1.15rem; display:flex; flex-direction:column; gap:10px; flex:1; justify-content:space-between;">
                <div>
                  <h3 style="margin:0 0 6px; font-size:1.02rem; font-weight:800; color:#0f172a;">${v.icon} <span class="lang-en">${esc(v.titleEn)}</span><span class="lang-es">${esc(v.titleEs)}</span></h3>
                  <p style="margin:0; font-size:0.8rem; color:#475569; line-height:1.45;"><span class="lang-en">${esc(v.descEn)}</span><span class="lang-es">${esc(v.descEs)}</span></p>
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap; padding-top:8px; border-top:1px solid #f1f5f9;">
                  <button type="button" class="btn btn-primary btn-sm" data-video-export="${esc(v.baseId)}" style="flex:1; justify-content:center; font-weight:700; padding:9px 14px; border-radius:9px;">
                    🎬 <span class="lang-en">Export With My Name</span><span class="lang-es">Exportar con mi nombre</span>
                  </button>
                  <button type="button" class="btn btn-outline btn-sm" data-video-preview="${esc(v.baseId)}" style="background:#fff; font-weight:600; padding:9px 13px; border-radius:9px;">
                    👁️ <span class="lang-en">Preview</span><span class="lang-es">Vista previa</span>
                  </button>
                </div>
                <div data-video-progress="${esc(v.baseId)}" style="display:none; height:8px; border-radius:999px; background:#e2e8f0; overflow:hidden;">
                  <div style="height:100%; width:0%; background:linear-gradient(90deg, #0672C5, #fe8933); transition:width 0.2s ease;"></div>
                </div>
              </div>
            </div>`; }).join('')}
        </div>
      </div>`;

    const getData = () => {
      const d = opts.getCardData ? opts.getCardData() : null;
      if (!d) { if (opts.onMissing) opts.onMissing(); return null; }
      return d;
    };

    container.querySelectorAll('[data-video-preview]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const d = getData();
        if (!d) return;
        try { await openPreview(btn.getAttribute('data-video-preview'), d, lang); }
        catch (err) { if (App.utils) App.utils.showToast(err.message || 'Preview error', 'error'); }
      });
    });

    container.querySelectorAll('[data-video-export]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-video-export');
        const d = getData();
        if (!d) return;
        if (opts.beforeExport) { try { await opts.beforeExport(); } catch (_) {} }
        const bar = container.querySelector(`[data-video-progress="${id}"]`);
        const fill = bar && bar.firstElementChild;
        const oldHtml = btn.innerHTML;
        btn.disabled = true;
        if (bar) bar.style.display = 'block';
        const setP = (p) => {
          const pct = Math.round(p * 100);
          if (fill) fill.style.width = pct + '%';
          btn.innerHTML = `<span class="spinner"></span> ${isEn() ? 'Creating your video…' : 'Creando tu vídeo…'} ${pct}%`;
        };
        setP(0);
        try {
          const { blob, fileName } = await exportPersonalized(id, d, setP, lang);
          downloadBlob(blob, fileName);
          if (App.utils) App.utils.showToast(isEn() ? 'Personalized video downloaded 🎬' : 'Vídeo personalizado descargado 🎬', 'success');
        } catch (err) {
          console.error('[MarketingVideos] export error:', err);
          if (App.utils) App.utils.showToast((isEn() ? 'Could not create the video: ' : 'No se pudo crear el vídeo: ') + (err.message || err), 'error');
        } finally {
          btn.disabled = false;
          btn.innerHTML = oldHtml;
          if (bar) { bar.style.display = 'none'; if (fill) fill.style.width = '0%'; }
          if (window.App && typeof window.App.updateLangDisplay === 'function') window.App.updateLangDisplay();
        }
      });
    });

    container.querySelectorAll('[data-video-lang]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedLang = btn.getAttribute('data-video-lang');
        renderSection(container, user, opts);
      });
    });

    if (window.App && typeof window.App.updateLangDisplay === 'function') window.App.updateLangDisplay();
  }

  return { VIDEOS, videosForRole, buildCardCanvas, exportPersonalized, openPreview, renderSection };
})();
