/* ============================================================
   CLEANCLUB — ARTIKELADFÆRD
   ------------------------------------------------------------
   Alt herinde er pynt oven på en side, der virker uden JS.
   Slår brugeren bevægelse fra i sit styresystem, kører intet
   af det — vi tjekker prefers-reduced-motion én gang og
   springer over i stedet for at animere hurtigere.
   ============================================================ */
(() => {
  const roligt = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------
     Hvem scroller egentlig?
     style.css sætter `overflow-x:hidden` på <body>. Efter CSS-reglerne
     bliver den anden akse så `auto`, og dermed er det BODY der ruller
     — ikke vinduet. window.scrollY står derfor stille på 0, og alt der
     bygger på den (læsebjælke, flydende knap, skinnen) holder op med
     at virke. Vi spørger derfor den der faktisk har rullet.
     ------------------------------------------------------------ */
  const rulle = () => window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
  const rulleMax = () => Math.max(
    document.documentElement.scrollHeight, document.body.scrollHeight
  ) - window.innerHeight;
  const naarDerRulles = fn => {
    addEventListener('scroll', fn, {passive: true});
    document.body.addEventListener('scroll', fn, {passive: true});
  };

  /* ---------- Symboler (inline SVG, ingen ikonpakke) ---------- */
  const SVG = {
    // vinduesramme med sprosser — brandets eget motiv
    vindue: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="3" width="18" height="18"/><path d="M12 3v18M3 12h18"/></svg>',
    info:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.6v.1"/></svg>',
    advar:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 4 2.6 20h18.8L12 4Z"/><path d="M12 10v4M12 17.3v.1"/></svg>',
    pil:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12h13M12 5l7 7-7 7"/></svg>'
  };

  /* ---------- 1. Læseprogression ---------- */
  const bar = document.createElement('div');
  bar.className = 'progress';
  bar.innerHTML = '<i></i>';
  document.body.appendChild(bar);
  const fyld = bar.querySelector('i');

  /* ---------- 2. Flydende CTA ---------- */
  const flyd = document.createElement('a');
  flyd.className = 'float-cta';
  flyd.href = '../index.html#priser';
  flyd.innerHTML = 'Beregn din pris' + SVG.pil;
  document.body.appendChild(flyd);

  const paaScroll = () => {
    const h = rulleMax();
    const p = h > 0 ? rulle() / h : 0;
    fyld.style.width = (p * 100).toFixed(2) + '%';
    flyd.classList.toggle('on', p > .12 && p < .97);
  };
  naarDerRulles(paaScroll);
  paaScroll();

  /* ---------- 3. Glyf i artikelhovedet ---------- */
  const head = document.querySelector('.art-head .wrap');
  if (head) {
    const g = document.createElement('div');
    g.className = 'glyph';
    g.innerHTML = SVG.vindue;
    head.parentElement.appendChild(g);
  }
  requestAnimationFrame(() => document.querySelector('.art-head')?.classList.add('lit'));

  /* ---------- 4. Ikoner i faktabokse ---------- */
  document.querySelectorAll('.fact h4').forEach(h => h.insertAdjacentHTML('afterbegin', SVG.info));
  document.querySelectorAll('.warn h4').forEach(h => h.insertAdjacentHTML('afterbegin', SVG.advar));

  /* ---------- 5. Scroll-reveals ---------- */
  const emner = document.querySelectorAll(
    '.prose h2, .fact, .warn, .art-table, .pull, .faq, .kilder, .band, ' +
    '.hub-grid, .omr-grid, .rel-grid, .ov-grid, .ov-intro, .sec-head'
  );
  emner.forEach(el => el.setAttribute('data-rv',''));

  if (roligt || !('IntersectionObserver' in window)) {
    emner.forEach(el => el.classList.add('vis'));
  } else {
    const io = new IntersectionObserver((poster, obs) => {
      poster.forEach((p, i) => {
        if (!p.isIntersecting) return;
        // lille forskydning, så ting ikke lander på præcis samme tid
        setTimeout(() => p.target.classList.add('vis'), i * 70);
        obs.unobserve(p.target);
      });
    }, {rootMargin: '0px 0px -12% 0px', threshold: .12});
    emner.forEach(el => io.observe(el));
  }

  /* ---------- 6. Tal der tæller op ---------- */
  const tal = document.querySelectorAll('.fact .big');
  tal.forEach(el => {
    const tekst = el.textContent.trim();
    const m = tekst.match(/^([\d.]+)(.*)$/);          // "18.300 kr." → 18300 + " kr."
    if (!m) return;
    const slut = parseInt(m[1].replace(/\./g, ''), 10);
    if (!isFinite(slut) || slut < 100) return;
    const hale = m[2];
    const dansk = n => n.toLocaleString('da-DK');

    if (roligt) return;
    el.textContent = dansk(0) + hale;

    const koer = () => {
      const varighed = 1100, start = performance.now();
      const tik = naa => {
        const t = Math.min((naa - start) / varighed, 1);
        const lempet = 1 - Math.pow(1 - t, 3);        // ease-out cubic
        el.textContent = dansk(Math.round(slut * lempet)) + hale;
        if (t < 1) requestAnimationFrame(tik);
      };
      requestAnimationFrame(tik);
    };
    new IntersectionObserver((p, o) => {
      if (p[0].isIntersecting) { koer(); o.disconnect(); }
    }, {threshold:.5}).observe(el);
  });

  /* ---------- 7. Indholdsfortegnelse følger med ---------- */
  const links = [...document.querySelectorAll('.rail a')];
  const maal = links.map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
  if (maal.length) {
    const spot = () => {
      let aktiv = 0;
      maal.forEach((m, i) => { if (m.getBoundingClientRect().top <= 190) aktiv = i; });
      links.forEach((a, i) => a.classList.toggle('on', i === aktiv));
    };
    naarDerRulles(spot);
    spot();
  }

  /* ---------- 8. Tabeller: giv hver celle sit kolonnenavn med ----------
     Bruges kun af mobil-CSS'en (td::before), men skal stå i DOM'en
     uanset skærmbredde, så en drejning af telefonen ikke efterlader
     celler uden mærkat. */
  document.querySelectorAll('.art-table').forEach(t => {
    const nav = [...t.querySelectorAll('tr')][0];
    if (!nav) return;
    const navne = [...nav.children].map(c => c.textContent.trim());
    [...t.querySelectorAll('tr')].slice(1).forEach(r =>
      [...r.children].forEach((c, i) => { if (navne[i]) c.setAttribute('data-t', navne[i]); }));
  });

  /* ---------- 9. Blød scroll til ankre ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const m = document.getElementById(a.getAttribute('href').slice(1));
      if (!m) return;
      e.preventDefault();
      m.scrollIntoView({behavior: roligt ? 'auto' : 'smooth', block:'start'});
    });
  });
})();
