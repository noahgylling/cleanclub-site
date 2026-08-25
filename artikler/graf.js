/* ============================================================
   CLEANCLUB — GRAFER
   ------------------------------------------------------------
   Tegner kort og grafer ud fra data-attributter, så en artikel
   kan skrive <figure class="kort" data-graf="linje" ...> og få
   en færdig graf uden at nogen rører SVG i hånden.

   Læsbarhed er kravet, ikke pynt: tallene står PÅ grafen, ikke
   kun i et tooltip, søjlerne har deres værdi skrevet ovenpå, og
   der er ingen legende at slå op i. Man skal kunne aflæse den
   uden at pege på noget.
   ============================================================ */
(() => {
  const roligt = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, a = {}) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const dk = n => n.toLocaleString('da-DK');

  /* ---------- fælles: kortets hoved ---------- */
  function hoved(fig) {
    const d = fig.dataset;
    const h = document.createElement('div');
    h.className = 'kort-top';
    h.innerHTML = `
      <div class="kort-tal">
        <p class="kort-lab">${d.label || ''}</p>
        <strong class="kort-stor" data-tael="${d.stor || ''}">${d.stor || ''}</strong>
        ${d.trend ? `<span class="kort-trend">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 11L6 7L9 10L14 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 4H14V8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>${d.trend}</span>` : ''}
      </div>
      <div class="kort-figur">${ruder()}</div>`;
    return h;
  }

  /* stablede vinduesruder — husets eget motiv i stedet for dollarsedler */
  const ruder = () => `
    <svg viewBox="0 0 130 110" aria-hidden="true">
      <defs>
        <linearGradient id="rG1" x1="0" y1="0" x2=".3" y2="1">
          <stop offset="0%" stop-color="#F7F6F1"/><stop offset="100%" stop-color="#EFEDE4"/>
        </linearGradient>
        <linearGradient id="rG2" x1="0" y1="0" x2=".2" y2="1">
          <stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#F2F0E8"/>
        </linearGradient>
        <filter id="rS" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#1C2E24" flood-opacity=".13"/>
        </filter>
      </defs>
      <g transform="translate(6,10) rotate(-16 40 24)" filter="url(#rS)">
        <rect width="78" height="48" rx="5" fill="url(#rG1)" stroke="#E5E2D8"/>
        <path d="M39 0v48M0 24h78" stroke="#E5E2D8" stroke-width="1.4"/>
      </g>
      <g transform="translate(22,28) rotate(-7 40 24)" filter="url(#rS)">
        <rect width="78" height="48" rx="5" fill="url(#rG2)" stroke="#E5E2D8"/>
        <path d="M39 0v48M0 24h78" stroke="#E5E2D8" stroke-width="1.4"/>
      </g>
      <g transform="translate(38,46) rotate(-1 40 24)" filter="url(#rS)">
        <rect width="78" height="48" rx="5" fill="#FFFFFF" stroke="#E5E2D8"/>
        <path d="M39 0v48M0 24h78" stroke="#E5E2D8" stroke-width="1.4"/>
        <circle cx="62" cy="12" r="5" fill="#D9A93F" opacity=".5"/>
      </g>
    </svg>`;

  /* ---------- blød kurve gennem punkterne (Catmull-Rom) ---------- */
  const kurve = p => {
    let d = `M ${p[0].x} ${p[0].y}`;
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c, t = .32;
      d += ` C ${b.x + (c.x - a.x) * t} ${b.y + (c.y - a.y) * t}, ${c.x - (e.x - b.x) * t} ${c.y - (e.y - b.y) * t}, ${c.x} ${c.y}`;
    }
    return d;
  };

  /* ============ LINJEGRAF ============ */
  function linje(fig) {
    const v = fig.dataset.vaerdier.split(',').map(Number);
    const lab = fig.dataset.labels.split(',');
    const enhed = fig.dataset.enhed || '';
    const frem = fig.dataset.fremhaev ? +fig.dataset.fremhaev : v.length - 1;

    const W = 380, H = 210, pad = {t: 46, b: 40, l: 16, r: 16};
    const max = Math.max(...v), min = Math.min(...v), spd = max - min || 1;
    const X = i => pad.l + (i / (v.length - 1)) * (W - pad.l - pad.r);
    const Y = n => H - pad.b - ((n - min) / spd) * (H - pad.t - pad.b);
    const pkt = v.map((n, i) => ({x: X(i), y: Y(n)}));

    const svg = el('svg', {viewBox: `0 0 ${W} ${H}`, class: 'graf', role: 'img',
      'aria-label': `${fig.dataset.label}. ${lab.map((l, i) => `${l}: ${dk(v[i])} ${enhed}`).join('. ')}`});

    svg.innerHTML = `<defs>
      <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2C4638" stop-opacity=".26"/>
        <stop offset="100%" stop-color="#2C4638" stop-opacity="0"/>
      </linearGradient>
      <filter id="gGlow" x="-100%" y="-100%" width="300%" height="300%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#1C2E24" flood-opacity=".25"/>
      </filter>
    </defs>`;

    // lodrette hjælpelinjer
    v.forEach((_, i) => svg.appendChild(el('line', {
      x1: X(i), y1: pad.t - 12, x2: X(i), y2: H - pad.b,
      stroke: '#E5E2D8', 'stroke-width': 1, 'stroke-dasharray': '3 5'
    })));

    const areal = el('path', {d: `${kurve(pkt)} L ${X(v.length - 1)} ${H - pad.b} L ${X(0)} ${H - pad.b} Z`, fill: 'url(#gA)', class: 'graf-areal'});
    const strg  = el('path', {d: kurve(pkt), fill: 'none', stroke: '#2C4638', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'graf-linje'});
    svg.append(areal, strg);

    // det fremhævede punkt — altid synligt, ikke kun ved hover
    const ring = el('circle', {cx: X(frem), cy: Y(v[frem]), r: 8.5, fill: '#FFFFFF', stroke: '#D9A93F', 'stroke-width': 3.5, filter: 'url(#gGlow)', class: 'graf-prik'});
    svg.appendChild(ring);

    // værdien skrevet PÅ grafen
    const boks = el('g', {class: 'graf-boks'});
    const bx = Math.min(Math.max(X(frem), 46), W - 46), by = Y(v[frem]) - 30;
    boks.appendChild(el('rect', {x: bx - 42, y: by - 19, width: 84, height: 27, rx: 13, fill: '#1C2E24'}));
    const txt = el('text', {x: bx, y: by, 'text-anchor': 'middle', class: 'graf-boks-t'});
    txt.textContent = `${dk(v[frem])} ${enhed}`.trim();
    boks.appendChild(txt);
    svg.appendChild(boks);

    // navne under
    lab.forEach((l, i) => {
      const t = el('text', {x: X(i), y: H - 12, 'text-anchor': 'middle', class: 'graf-navn'});
      t.textContent = l;
      svg.appendChild(t);
    });

    // hover / tastatur flytter fremhævningen
    const flyt = i => {
      ring.setAttribute('cx', X(i)); ring.setAttribute('cy', Y(v[i]));
      const nx = Math.min(Math.max(X(i), 46), W - 46), ny = Y(v[i]) - 30;
      boks.querySelector('rect').setAttribute('x', nx - 42);
      boks.querySelector('rect').setAttribute('y', ny - 19);
      txt.setAttribute('x', nx); txt.setAttribute('y', ny);
      txt.textContent = `${dk(v[i])} ${enhed}`.trim();
    };
    svg.addEventListener('mousemove', e => {
      const r = svg.getBoundingClientRect();
      const rx = ((e.clientX - r.left) / r.width) * W;
      let n = 0, bedst = Infinity;
      v.forEach((_, i) => { const d = Math.abs(X(i) - rx); if (d < bedst) { bedst = d; n = i; } });
      flyt(n);
    });
    svg.addEventListener('mouseleave', () => flyt(frem));

    return {svg, animer: () => {
      if (roligt) return;
      const len = strg.getTotalLength();
      strg.style.strokeDasharray = len; strg.style.strokeDashoffset = len;
      areal.style.opacity = 0; ring.style.opacity = 0; boks.style.opacity = 0;
      strg.animate([{strokeDashoffset: len}, {strokeDashoffset: 0}], {duration: 1300, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards'});
      areal.animate([{opacity: 0}, {opacity: 1}], {duration: 900, delay: 500, fill: 'forwards'});
      [ring, boks].forEach(n => n.animate([{opacity: 0, transform: 'scale(.6)'}, {opacity: 1, transform: 'none'}],
        {duration: 500, delay: 1000, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'forwards'}));
    }};
  }

  /* ============ SØJLEGRAF ============ */
  function soejle(fig) {
    const v = fig.dataset.vaerdier.split(',').map(Number);
    const lab = fig.dataset.labels.split(',');
    const enhed = fig.dataset.enhed || '';
    const max = Math.max(...v);

    const box = document.createElement('div');
    box.className = 'soejler';
    box.setAttribute('role', 'img');
    box.setAttribute('aria-label', `${fig.dataset.label}. ${lab.map((l, i) => `${l}: ${dk(v[i])} ${enhed}`).join('. ')}`);
    v.forEach((n, i) => {
      const s = document.createElement('div');
      s.className = 'soejle' + (n === max ? ' top' : '');
      s.innerHTML = `<b>${dk(n)}<em>${enhed}</em></b><div class="spor"><i style="--h:${Math.round((n / max) * 100)}%"></i></div><span>${lab[i]}</span>`;
      box.appendChild(s);
    });
    return {svg: box, animer: () => {
      if (roligt) { box.classList.add('vis'); return; }
      requestAnimationFrame(() => box.classList.add('vis'));
    }};
  }

  /* ---------- byg alle kort ---------- */
  document.querySelectorAll('.kort').forEach(fig => {
    const skab = fig.dataset.graf === 'soejle' ? soejle : linje;
    const {svg, animer} = skab(fig);
    const indre = document.createElement('div');
    indre.className = 'kort-indre';
    if (fig.dataset.stor || fig.dataset.label) indre.appendChild(hoved(fig));
    indre.appendChild(svg);
    fig.insertBefore(indre, fig.firstChild);

    if (roligt || !('IntersectionObserver' in window)) { animer(); return; }
    new IntersectionObserver((p, o) => {
      if (!p[0].isIntersecting) return;
      animer(); taelOp(indre); o.disconnect();
    }, {threshold: .35}).observe(fig);
  });

  /* ---------- store tal tæller op ---------- */
  function taelOp(rod) {
    const e = rod.querySelector('[data-tael]');
    if (!e || roligt) return;
    const m = e.textContent.trim().match(/^([\d.]+)(.*)$/);
    if (!m) return;
    const slut = parseInt(m[1].replace(/\./g, ''), 10), hale = m[2];
    if (!isFinite(slut)) return;
    const t0 = performance.now(), varighed = 1000;
    const tik = n => {
      const t = Math.min((n - t0) / varighed, 1);
      e.textContent = dk(Math.round(slut * (1 - Math.pow(1 - t, 3)))) + hale;
      if (t < 1) requestAnimationFrame(tik);
    };
    requestAnimationFrame(tik);
  }
})();
