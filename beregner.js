/* ============================================================
   CLEANCLUB — PRISBEREGNER
   ------------------------------------------------------------
   To valg styrer beregneren:
     ydelse  = vinduer | hojtryk
     kunde   = privat  | erhverv

   Al prispolitik ligger i PRIS-objektet nedenfor. Skal priserne
   justeres, rettes de KUN dér — resten af filen regner bare.

   HVER SATS ER KONTROLLERET MOD RIGTIGE DANSKE UDBYDERE, ikke mod
   forretningsplanen alene. Hvor planen lå uden for det observerede
   marked, vinder markedet — det er noteret ved den enkelte sats.
   Alle beløb er den endelige pris til kunden: Cleanclub er ikke
   momsregistreret, og de fleste danske udbydere skilter inkl. moms,
   så tallene er direkte sammenlignelige.

   Beregneren viser en FRA-pris for den valgte kombination.
   ============================================================ */

const PRIS = {

  vinduer: {

    /* ---------- 3.1 · Vinduespudsning, privat ---------- */
    privat: {
      minimum: 450,               // minimumspris pr. besøg

      /* Pris pr. vindue falder med antallet — opsætning og kørsel fylder mest
         på de små opgaver. Kalibreret så HVER pris ligger inde i det
         researchede markedsspænd på 30–75 kr./vindue:
           4 vinduer → 47 kr.   18 vinduer → 43 kr.   60 vinduer → 30 kr.
         Kilder: rengoeringidanmark.dk og din-vinduespudser.dk (30–75 kr./vindue),
         din-vinduespudser (parcelhus 15–20 vinduer = 350–550 kr.),
         Spejlblank København (enkeltbestilling fra 545 kr.).
         BEMÆRK: dette er lavere end forretningsplanens tabel, som lå over markedet. */
      prVindue: { basis: 48, fald: .30, gulv: 30 },

      /* Hjælpetekst under skyderen, så kunden kan orientere sig uden at tælle */
      hint: [
        { til: 9,        tekst: 'Cirka som en lejlighed' },
        { til: 14,       tekst: 'Cirka som et rækkehus' },
        { til: 24,       tekst: 'Cirka som et parcelhus' },
        { til: 39,       tekst: 'Cirka som en villa' },
        { til: Infinity, tekst: 'Stor villa med glaspartier' }
      ],

      /* Hver 14. dag findes bevidst ikke her — det er en erhvervsfrekvens.
         Private vinduer bliver ikke snavsede så hurtigt, og ingen af
         konkurrenterne i København tilbyder det til private. */
      frekvens: {
        u4:  { navn: 'fast aftale hver 4. uge',  rabat: .20, besoeg: 13,  besoegTekst: 'Ca. 13 besøg om året' },
        u8:  { navn: 'fast aftale hver 8. uge',  rabat: .15, besoeg: 6.5, besoegTekst: 'Ca. 6–7 besøg om året' },
        u12: { navn: 'fast aftale hver 12. uge', rabat: .10, besoeg: 4.3, besoegTekst: 'Ca. 4 besøg om året' },
        en:  { navn: 'én enkelt gang',           rabat: 0,   besoeg: 1,   besoegTekst: null }
      },

      // Indvendigt: din-vinduespudser.dk oplyser +50–100 %, planen +60–80 %
      indvendigt: { nej: { f: 1, navn: 'udvendigt' }, ja: { f: 1.70, navn: 'ud- og indvendigt' } },
      // Sprosser: standardrude 10–50 kr. mod dannebrog 20–80 kr. (din-vinduespudser)
      sprosser:   { nej: { f: 1 }, ja: { f: 1.30 }, ukendt: { f: 1 } },
      // Svær adgang: din-vinduespudser oplyser +25–50 % pr. vindue i højden
      adgang:     { let: { f: 1 }, svaer: { f: 1.35 } },

      foerstegang: .25            // planens nedre ende af 25–50 %; ingen ekstern kilde fundet
    },

    /* ---------- 3.2 + 3.3 · Vinduespudsning, erhverv ---------- */
    erhverv: {
      minimum: 350,               // minimumspris pr. besøg
      prRude: 40,                 // grundpris pr. rude, stueetage, let adgang

      /* En engangsopgave koster mere pr. besøg end en fast aftale: kørsel og
         opsætning fordeles ikke, ruderne er snavsede første gang, og der er
         ingen gentagelsesværdi. Markedet gør det samme — et kontor med 25 ruder
         koster ca. 2.000 kr. som engangsopgave mod ca. 1.100 kr./md. på aftale. */
      engangsFaktor: 1.5,

      etage:      { stue: { f: 1, navn: 'stueetage' }, f1: { f: 1.3, navn: '1. sal' }, f2: { f: 1.6, navn: '2. sal eller højere' } },
      indvendigt: { nej: { f: 1, navn: 'udvendigt' }, ja: { f: 1.70, navn: 'ud- og indvendigt' } },
      forhold: {
        ingen: { f: 1,    navn: null },
        glas:  { f: 1.2,  navn: 'store glaspartier' },
        svaer: { f: 1.3,  navn: 'svær adgang' },
        begge: { f: 1.56, navn: 'glaspartier og svær adgang' }   // 1,2 × 1,3
      },

      frekvens: {
        /* svingerTekst beskriver hvor mange besøg der falder i en ENKELT måned.

           Hvorfor det svinger: en måned er 30-31 dage, altså 4 hele uger plus
           2-3 dage i overskud. Om en bestemt ugedag rammer 4 eller 5 gange
           afhænger af, hvor i ugen måneden starter. Pudser vi hver tirsdag,
           har en 31-dages måned der begynder på en tirsdag fem tirsdage
           (1., 8., 15., 22., 29.) — en 30-dages måned der begynder på en
           onsdag har kun fire.

           Det går præcist op over et år:
             Ugentligt   52 besøg → 5x + 4(12−x) = 52 → x = 4
                         altså 4 måneder med fem besøg, 8 måneder med fire.
             Hver 14. dag 26 besøg → 3x + 2(12−x) = 26 → x = 2
                         altså 2 måneder med tre besøg, 10 måneder med to.

           Netop den udsving er hele pointen med fast månedspris: kunden
           betaler det samme hver måned, og vi bærer skævheden.

           Månedligt og kvartalsvis svinger IKKE (der er altid ét besøg
           henholdsvis ét pr. kvartal), så de har svingerTekst: null og får
           en anden forklaring i visVinduerErhverv. */
        uge:     { navn: 'ugentligt',    rabat: .25, besoeg: 52, svingerTekst: 'fire eller fem' },
        dage14:  { navn: 'hver 14. dag', rabat: .20, besoeg: 26, svingerTekst: 'to eller tre' },
        maaned:  { navn: 'månedligt',    rabat: .15, besoeg: 12, svingerTekst: null },
        kvartal: { navn: 'kvartalsvis',  rabat: .10, besoeg: 4,  svingerTekst: null }
      }
    }
  },

  /* ---------- 3.4 · Højtryksrens ----------
     Ét fælles satskort for privat og erhverv. NanoClean oplyser eksplicit at
     erhverv og offentlige kunder afregnes til SAMME m²-satser som private, og
     at det kun er meget store opgaver der får særskilt tilbud. Derfor er der
     ikke opfundet et separat erhvervs-satskort — arealtrappen gør arbejdet.

     Markedet, alt sammen som endelig pris til kunden (de fleste danske
     udbydere skilter inkl. moms, og Cleanclub er ikke momsregistreret,
     så tallene er direkte sammenlignelige):
       NanoClean      36 kr./m² under 100 m², 20 kr./m² derover
       Aktiv Rens Kbh 29 kr./m² betonfliser, 45–65 kr./m² brosten og granit
       Jysk Algeservice 27 kr./m² ved 150 m², 23 kr./m² ved 250 m²
       Radorens       25 kr./m²
       Hollywood      25–40 kr./m² standard
       HappyHelper    30–60 kr./m² terrasse, 30–50 kr./m² indkørsel
       Værktøjspriser 29–50 kr./m² basis
     Cleanclub lægger sig i den øvre halvdel — ikke i bunden hos
     volumenudbyderne, men inden for det observerede spænd overalt. */
  hojtrykSatser: {
    minimum: 1800,              /* Markedets minimumspriser: Hollywood 1.563,
                                   HappyHelper 2.500–4.000, NanoClean 3.240,
                                   Jysk 3.500. Vi ligger lavt og bevidst. */
    trin: [
      { til: 40,       kr: 55 },
      { til: 80,       kr: 45 },
      { til: 150,      kr: 36 },
      { til: 300,      kr: 29 },
      { til: Infinity, kr: 25 }
    ],

    // HappyHelper: murværk og facade 100–150 kr./m², 100 m² facade ≈ 10–15.000
    facade: 95,

    /* Tillæg, observeret i markedet:
         Imprægnering  NanoClean +10, Jysk +14, Værktøjspriser +10–16,
                       Aktiv Rens +20–35, HappyHelper +20–40  → 16
         Algebehandling NanoClean +6–10, Hollywood-delta +10–15 → 12
         Fugesand      Jysk +7, NanoClean +10, Værktøjspriser +13–30 → 10 */
    impraegnering: 16,          // kr./m²
    alge:          12,          // kr./m²
    fugesand:      10           // kr./m²
  },

  hojtryk: {

    privat: {
      overflade: {
        terrasse:  { navn: 'terrasse og fliser', fast: null },
        indkorsel: { navn: 'indkørsel',          fast: null },
        sti:       { navn: 'fortov og stier',    fast: null },
        facade:    { navn: 'facade og murværk',  fast: 'facade' }
      }
    },

    erhverv: {
      overflade: {
        parkering: { navn: 'parkeringsplads',        fast: null },
        gaard:     { navn: 'gårdsplads og indgang',  fast: null },
        fortov:    { navn: 'fortov og facadeareal',  fast: null },
        facade:    { navn: 'facade og murværk',      fast: 'facade' }
      },

      /* Markedet oplyser 15–25 % rabat på årlige serviceaftaler.
         Vi lægger os under det spænd, så rabatten kan holdes. */
      frekvens: {
        en:   { navn: 'én gang',                      rabat: 0,   gange: 1 },
        aar1: { navn: 'fast aftale én gang om året',  rabat: .10, gange: 1 },
        aar2: { navn: 'fast aftale to gange om året', rabat: .15, gange: 2 }
      }
    }
  },

  /* ---------- Servicefradrag ----------
     Bekræftet for 2026: loftet er 18.300 kr. pr. person over 18 år i
     husstanden, og fradragets skatteværdi er ca. 26 %. Vinduespudsning
     (ude og inde) og fliserens er begge på listen over dækkede ydelser.
     Kilder: Bolius, BDO og Skattestyrelsens satser for 2026. */
  fradrag: {
    sats: .26,
    loft: 18300,                  // maks. fradragsberettiget arbejdsløn pr. person pr. år
    arbejdsloenVinduer: .80,      // konservativt sat — vinduespudsning har næsten ingen materialer
    arbejdsloenHojtryk: .70       // lavere, fordi midler og imprægnering er materialer
  }
};


/* ============================================================
   Hjælpere
   ============================================================ */

const nf = new Intl.NumberFormat('da-DK');

/* Runder NED til nærmeste 10 — en fra-pris skal aldrig lyde højere end den er */
const ned10  = n => Math.floor(n / 10) * 10;
const ned100 = n => Math.floor(n / 100) * 100;

const kr = n => nf.format(n) + ' kr.';

const q  = (sel, root = document) => root.querySelector(sel);
const qa = (sel, root = document) => [...root.querySelectorAll(sel)];

const linje = (venstre, hoejre) => `<li><span>${venstre}</span><b>${hoejre}</b></li>`;

function fradragTekst(beloeb, arbejdsloen) {
  const F = PRIS.fradrag;
  // Fradraget kan aldrig overstige årets loft pr. person
  const arbejdsloenBeloeb = Math.min(beloeb * arbejdsloen, F.loft);
  const vaerdi = ned10(Math.round(arbejdsloenBeloeb * F.sats));
  return { vaerdi, netto: ned100(beloeb - vaerdi), ramtLoft: beloeb * arbejdsloen > F.loft };
}

/* Fælles m²-model for højtryksrens — samme satser for privat og erhverv.
   Trappen må aldrig gøre et større areal billigere end et mindre, så
   resultatet klemmes opad undervejs. */
function rensPris(areal, flade) {
  const H = PRIS.hojtrykSatser;
  if (flade.fast) return areal * H[flade.fast];

  const sats = t => H.trin.find(x => t <= x.til).kr;
  let pris = areal * sats(areal);
  for (const t of H.trin) {
    if (areal > t.til && t.til !== Infinity) pris = Math.max(pris, t.til * sats(t.til));
  }
  return pris;
}


/* ============================================================
   Regnemodeller
   ============================================================ */

function regnVinduerPrivat(s) {
  const P = PRIS.vinduer.privat;
  const frek = P.frekvens[s.frekvens];

  const stkPris = Math.max(P.prVindue.gulv, P.prVindue.basis - s.vinduer * P.prVindue.fald);
  const tillaeg = P.indvendigt[s.indvendigt].f * P.sprosser[s.sprosser].f * P.adgang[s.adgang].f;

  const raa      = s.vinduer * stkPris * tillaeg;
  const enkelt   = Math.max(raa, P.minimum);
  const medRabat = Math.max(raa * (1 - frek.rabat), P.minimum);

  return {
    frek,
    prBesoeg:    ned10(medRabat),
    stk:         Math.round(ned10(medRabat) / s.vinduer),
    enkelt:      ned10(enkelt),
    besparelse:  ned10(enkelt) - ned10(medRabat),
    aar:         ned100(medRabat * frek.besoeg),
    foerstegang: ned10(medRabat * P.foerstegang),
    minimumBed:  raa * (1 - frek.rabat) < P.minimum
  };
}

function regnVinduerErhverv(s) {
  const E = PRIS.vinduer.erhverv;
  const frek = E.frekvens[s.frekvens];

  const faktor = E.etage[s.etage].f * E.indvendigt[s.indvendigt].f * E.forhold[s.forhold].f;

  const raa      = s.ruder * E.prRude * faktor;
  const engangs  = ned10(Math.max(raa * E.engangsFaktor, E.minimum));
  const medRabat = Math.max(raa * (1 - frek.rabat), E.minimum);
  const prBesoeg = ned10(medRabat);

  return {
    frek, prBesoeg, engangs,
    maaned:     ned10(prBesoeg * frek.besoeg / 12),
    aar:        ned100(prBesoeg * frek.besoeg),
    besparelse: engangs - prBesoeg,
    besparelsePct: Math.round((1 - prBesoeg / engangs) * 100),
    minimumBed: raa * (1 - frek.rabat) < E.minimum
  };
}

function regnHojtryk(P, s, rabat = 0) {
  const H = PRIS.hojtrykSatser;
  const flade = P.overflade[s.overflade];
  const a = s.m2;

  const rens = rensPris(a, flade);
  const impr = s.impraegnering === 'ja' ? a * H.impraegnering : 0;
  const alge = s.alge          === 'ja' ? a * H.alge          : 0;
  const fuge = (s.fugesand === 'ja' && !flade.fast) ? a * H.fugesand : 0;

  const raa   = (rens + impr + alge + fuge) * (1 - rabat);
  const total = Math.max(raa, H.minimum);

  return {
    flade,
    rens:  ned10(Math.max(rens * (1 - rabat), H.minimum - (impr + alge + fuge) * (1 - rabat))),
    impr:  ned10(impr * (1 - rabat)),
    alge:  ned10(alge * (1 - rabat)),
    fuge:  ned10(fuge * (1 - rabat)),
    fuld:  ned10(Math.max(rens + impr + alge + fuge, H.minimum)),
    total: ned10(total),
    prM2:  Math.round(total / a),
    minimumBed: raa < H.minimum
  };
}


/* ============================================================
   Visning
   ============================================================ */

function visVinduerPrivat(s) {
  const P = PRIS.vinduer.privat;
  const r = regnVinduerPrivat(s);
  const f = fradragTekst(r.aar, PRIS.fradrag.arbejdsloenVinduer);
  const engangs = s.frekvens === 'en';

  const note = [
    `${s.vinduer} vinduer`,
    P.indvendigt[s.indvendigt].navn,
    s.sprosser === 'ja' ? 'sprosser' : null,
    s.adgang === 'svaer' ? 'svær adgang' : null,
    r.frek.navn
  ].filter(Boolean).join(' · ');

  let linjer = '';
  if (!r.minimumBed) linjer += linje('Svarer til', kr(r.stk) + ' pr. vindue');
  if (!engangs) {
    linjer += linje('Uden fast aftale ville det koste', 'fra ' + kr(r.enkelt));
    linjer += linje('Du sparer ved fast aftale', kr(r.besparelse) + ' pr. gang');
    if (r.frek.besoegTekst) linjer += linje(r.frek.besoegTekst, 'fra ' + kr(r.aar));
  } else if (!r.minimumBed) {
    // Minimumsprisen gælder også for abonnenter, så sammenligningen giver kun mening over den
    linjer += linje('Med fast aftale hver 8. uge', 'fra ' + kr(ned10(Math.max(r.enkelt * .85, P.minimum))));
  }
  linjer += linje('Første besøg, hvis vinduerne er meget snavsede', '+ op til ' + kr(r.foerstegang));
  if (r.minimumBed) linjer += linje('Vores minimumspris pr. besøg', kr(P.minimum));

  const pct = Math.round(PRIS.fradrag.arbejdsloenVinduer * 100);

  return {
    pris: 'Fra ' + nf.format(r.prBesoeg) + ' kr.',
    enhed: '/ gang',
    note, linjer,
    save: engangs
      ? { t: 'Husk servicefradraget',
          p: `Arbejdslønnen er fradragsberettiget. Med ca. ${pct}&nbsp;% arbejdsløn sparer du omkring
              <b>${kr(fradragTekst(r.prBesoeg, PRIS.fradrag.arbejdsloenVinduer).vaerdi)}</b> i skat på dette besøg.` }
      : { t: 'Husk servicefradraget',
          p: `Arbejdslønnen er fradragsberettiget. Med ca. ${pct}&nbsp;% arbejdsløn sparer du omkring
              <b>${kr(f.vaerdi)} i skat</b> om året — så det reelt starter ved ca. <b>${kr(f.netto)}</b>
              ${f.ramtLoft ? `Beløbet er her lagt an efter årets loft på ${kr(PRIS.fradrag.loft)}
              pr. person i husstanden — er I to voksne, kan I trække mere fra.` : ''}` }
  };
}

function visVinduerErhverv(s) {
  const E = PRIS.vinduer.erhverv;
  const r = regnVinduerErhverv(s);

  const note = [
    `${s.ruder} ruder`,
    E.etage[s.etage].navn,
    E.indvendigt[s.indvendigt].navn,
    E.forhold[s.forhold].navn,
    r.frek.navn
  ].filter(Boolean).join(' · ');

  let linjer = '';
  linjer += linje('Fast månedlig fakturering', 'fra ' + kr(r.maaned));
  linjer += linje('Som engangsopgave koster et besøg', 'fra ' + kr(r.engangs));
  linjer += linje('I sparer ved fast aftale', kr(r.besparelse) + ' pr. besøg');
  linjer += linje(`${r.frek.besoeg} besøg om året`, 'fra ' + kr(r.aar));
  if (r.minimumBed) linjer += linje('Vores minimumspris pr. besøg', kr(E.minimum));

  return {
    pris: 'Fra ' + nf.format(r.prBesoeg) + ' kr.',
    enhed: '/ besøg',
    note, linjer,
    save: {
      t: 'Ét beløb hver måned',
      p: r.frek.svingerTekst
        // Ugentligt og hver 14. dag: antal besøg svinger fra måned til måned
        ? `I faktureres <b>${kr(r.maaned)} om måneden</b>, uanset om der falder ${r.frek.svingerTekst}
           besøg i den enkelte måned. Én samlet faktura til bogholderiet, og et tal der er til
           at budgettere med.`
        : s.frekvens === 'maaned'
          // Månedligt: ét besøg, én faktura — intet at udjævne
          ? `Ét besøg, én faktura, <b>${kr(r.maaned)}</b> hver måned året rundt. Beløbet er det
             samme hver gang, så der er ikke noget at holde øje med i bogholderiet.`
          // Kvartalsvis: fire besøg om året fordelt ud over tolv måneder
          : `Vi kommer fire gange om året, men beløbet fordeles over alle tolv måneder. I betaler
             <b>${kr(r.maaned)} om måneden</b> i stedet for en større regning hvert kvartal.`
    }
  };
}

function visHojtrykPrivat(s) {
  const P = PRIS.hojtryk.privat;
  const r = regnHojtryk(P, s);

  const note = [
    `${s.m2} m² ${r.flade.navn}`,
    s.impraegnering === 'ja' ? 'med imprægnering' : null,
    s.alge === 'ja' ? 'med algebehandling' : null,
    (s.fugesand === 'ja' && !r.flade.fast) ? 'med ny fugesand' : null
  ].filter(Boolean).join(' · ');

  let linjer = '';
  linjer += linje(`Rens af ${s.m2} m²`, 'fra ' + kr(r.rens));
  if (r.impr) linjer += linje('Imprægnering', '+ ' + kr(r.impr));
  if (r.alge) linjer += linje('Algebehandling', '+ ' + kr(r.alge));
  if (r.fuge) linjer += linje('Ny fugesand i fliserne', '+ ' + kr(r.fuge));
  linjer += linje('Svarer til', kr(r.prM2) + ' pr. m²');
  if (r.minimumBed) linjer += linje('Vores minimumspris for højtryksrens', kr(PRIS.hojtrykSatser.minimum));

  const f = fradragTekst(r.total, PRIS.fradrag.arbejdsloenHojtryk);

  // Servicefradraget dækker rens af fliser, terrasse og indkørsel — ikke facaderens
  const save = s.overflade === 'facade'
    ? { t: 'Sådan foregår det',
        p: `Facaderens er ikke omfattet af servicefradraget. Til gengæld kigger vi altid forbi
            og ser murværket an først, så du får en fast pris — ikke et interval.` }
    : { t: 'Husk servicefradraget',
        p: `Rens af fliser og terrasse er omfattet af servicefradraget. Arbejdslønnen udgør ca.
            ${Math.round(PRIS.fradrag.arbejdsloenHojtryk * 100)}&nbsp;% af prisen, så du sparer omkring
            <b>${kr(f.vaerdi)} i skat</b> — og lander reelt på ca. <b>${kr(f.netto)}</b>` };

  return { pris: 'Fra ' + nf.format(r.total) + ' kr.', enhed: '', note, linjer, save };
}

function visHojtrykErhverv(s) {
  const E = PRIS.hojtryk.erhverv;
  const frek = E.frekvens[s.frekvens];
  const r = regnHojtryk(E, s, frek.rabat);

  const note = [
    `${s.m2} m² ${r.flade.navn}`,
    s.impraegnering === 'ja' ? 'med imprægnering' : null,
    s.alge === 'ja' ? 'med algebehandling' : null,
    (s.fugesand === 'ja' && !r.flade.fast) ? 'med ny fugesand' : null,
    frek.navn
  ].filter(Boolean).join(' · ');

  let linjer = '';
  linjer += linje(`Rens af ${s.m2} m²`, 'fra ' + kr(r.rens));
  if (r.impr) linjer += linje('Imprægnering', '+ ' + kr(r.impr));
  if (r.alge) linjer += linje('Algebehandling', '+ ' + kr(r.alge));
  if (r.fuge) linjer += linje('Ny fugesand', '+ ' + kr(r.fuge));
  linjer += linje('Svarer til', kr(r.prM2) + ' pr. m²');
  if (frek.rabat) {
    linjer += linje('Rabat ved fast aftale', '−' + Math.round(frek.rabat * 100) + ' %');
    linjer += linje('Uden fast aftale', 'fra ' + kr(r.fuld));
  }
  if (frek.gange > 1) linjer += linje(`${frek.gange} gange om året`, 'fra ' + kr(ned100(r.total * frek.gange)));
  if (r.minimumBed) linjer += linje('Vores minimumspris for højtryksrens', kr(PRIS.hojtrykSatser.minimum));

  return {
    pris: 'Fra ' + nf.format(r.total) + ' kr.',
    enhed: frek.gange > 1 ? '/ gang' : '',
    note, linjer,
    save: {
      t: 'En driftsomkostning',
      p: `Regningen er en almindelig driftsomkostning i regnskabet. Med en fast aftale ved I
          samtidig præcis hvad arealet koster om året — og vi kommer, uden at nogen skal huske at ringe.`
    }
  };
}


/* ============================================================
   Tilstand og opsætning
   ============================================================ */

const state = {
  ydelse: 'vinduer',
  kunde:  'privat',

  vinduer: {
    privat:  { vinduer: 18, frekvens: 'u8', indvendigt: 'nej', sprosser: 'nej', adgang: 'let' },
    erhverv: { ruder: 25, etage: 'stue', frekvens: 'dage14', indvendigt: 'nej', forhold: 'ingen' }
  },
  hojtryk: {
    privat:  { m2: 40,  overflade: 'terrasse',  impraegnering: 'nej', alge: 'nej', fugesand: 'nej' },
    erhverv: { m2: 200, overflade: 'parkering', impraegnering: 'nej', alge: 'nej', fugesand: 'nej',
               frekvens: 'en' }
  }
};

const visning = {
  vinduer: { privat: visVinduerPrivat, erhverv: visVinduerErhverv },
  hojtryk: { privat: visHojtrykPrivat, erhverv: visHojtrykErhverv }
};

const reduceret = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function taelOp(el, tekst) {
  const tal = parseInt(tekst.replace(/\D/g, ''), 10);
  const fra = parseInt(el.dataset.sidste || '0', 10);

  // Den rigtige pris skrives altid først. Optællingen nedenfor er ren pynt —
  // hvis den ikke når at køre (skjult fane, reduceret bevægelse), står tallet korrekt alligevel.
  el.firstChild.nodeValue = tekst;
  el.dataset.sidste = tal || 0;

  if (reduceret || !tal || fra === tal || document.hidden) return;

  const start    = performance.now();
  const varighed = 340;
  const praefiks = tekst.slice(0, tekst.search(/\d/));
  const suffiks  = tekst.slice(tekst.search(/\d/)).replace(/^[\d.]+/, '');
  const koersel  = ++taelOp.koersel;

  function tik(nu) {
    if (koersel !== taelOp.koersel) return;          // en nyere optælling har overtaget
    const p = Math.min((nu - start) / varighed, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.firstChild.nodeValue = p < 1
      ? praefiks + nf.format(Math.round(fra + (tal - fra) * e)) + suffiks
      : tekst;
    if (p < 1) requestAnimationFrame(tik);
  }
  requestAnimationFrame(tik);
}
taelOp.koersel = 0;

function opdater(straks) {
  const ud = visning[state.ydelse][state.kunde](state[state.ydelse][state.kunde]);
  const prisEl = q('#res-price');

  q('#res-enhed').textContent = ud.enhed;

  // Under træk i en skyder skal tallet følge fingeren, ikke tælle op hver gang
  if (straks) {
    taelOp.koersel++;                                // afbryd en igangværende optælling
    prisEl.firstChild.nodeValue = ud.pris;
    prisEl.dataset.sidste = ud.pris.replace(/\D/g, '') || 0;
  } else {
    taelOp(prisEl, ud.pris);
  }

  q('#res-note').textContent = ud.note;
  q('#res-lines').innerHTML  = ud.linjer;
  q('#res-save-t').innerHTML = ud.save.t;
  q('#res-save-p').innerHTML = ud.save.p;
}

function saetValg(ydelse, kunde) {
  if (ydelse) state.ydelse = ydelse;
  if (kunde)  state.kunde  = kunde;

  qa('.seg-ydelse button').forEach(b => b.classList.toggle('on', b.dataset.ydelse === state.ydelse));
  qa('.seg-kunde  button').forEach(b => b.classList.toggle('on', b.dataset.kunde  === state.kunde));
  qa('.panel').forEach(p =>
    p.hidden = !(p.dataset.ydelse === state.ydelse && p.dataset.kunde === state.kunde));

  fugesandSynlighed();
  opdater();
}

/* Fugesand giver ingen mening på en facade */
function fugesandSynlighed() {
  qa('[data-felt=fugesand]').forEach(f => {
    const p = f.closest('.panel');
    f.hidden = state[p.dataset.ydelse][p.dataset.kunde].overflade === 'facade';
  });
}

function start() {
  const calc = q('#calc');
  if (!calc) return;

  qa('.seg-ydelse button', calc).forEach(b =>
    b.addEventListener('click', () => saetValg(b.dataset.ydelse, null)));
  qa('.seg-kunde button', calc).forEach(b =>
    b.addEventListener('click', () => saetValg(null, b.dataset.kunde)));

  // Chips
  qa('.opt', calc).forEach(b => b.addEventListener('click', () => {
    const felt  = b.closest('.opts');
    const panel = b.closest('.panel');
    state[panel.dataset.ydelse][panel.dataset.kunde][felt.dataset.key] = b.dataset.val;
    qa('.opt', felt).forEach(x => x.toggleAttribute('data-on', x === b));
    fugesandSynlighed();
    opdater();
  }));

  // Skydere
  qa('.slide input', calc).forEach(r => {
    const vis   = q('#' + r.id + '-val');
    const hint  = q('#' + r.id + '-hint');
    const panel = r.closest('.panel');

    const opdaterSkyder = straks => {
      state[panel.dataset.ydelse][panel.dataset.kunde][r.dataset.key] = +r.value;
      vis.textContent = r.value + (+r.value === +r.max ? '+' : '');
      r.style.setProperty('--fyld', ((r.value - r.min) / (r.max - r.min) * 100) + '%');
      if (hint) hint.textContent = PRIS.vinduer.privat.hint.find(h => +r.value <= h.til).tekst;
      opdater(straks);
    };

    r.addEventListener('input', () => opdaterSkyder(true));
    opdaterSkyder(false);
  });

  // Links andre steder på siden der åbner beregneren på et bestemt valg
  qa('[data-goto-ydelse],[data-goto-kunde]').forEach(a =>
    a.addEventListener('click', () => saetValg(a.dataset.gotoYdelse, a.dataset.gotoKunde)));

  saetValg(state.ydelse, state.kunde);
}

document.addEventListener('DOMContentLoaded', start);
