/* ============================================================
   CLEANCLUB — MOBILMENU
   ------------------------------------------------------------
   Under 1040px skjules navigationslinkene, og hamburgerknappen
   folder dem ud i stedet. Selve visningen styres af CSS via
   klassen .open på <nav> — her sættes den bare til og fra.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav').forEach(nav => {
    const knap = nav.querySelector('.burger');
    const menu = nav.querySelector('.links');
    if (!knap || !menu) return;

    const saet = aaben => {
      nav.classList.toggle('open', aaben);
      knap.setAttribute('aria-expanded', String(aaben));
      knap.setAttribute('aria-label', aaben ? 'Luk menu' : 'Åbn menu');
    };

    knap.addEventListener('click', e => {
      e.stopPropagation();
      saet(!nav.classList.contains('open'));
    });

    // Vælger man en side, skal menuen lukke bag én
    menu.addEventListener('click', e => {
      if (e.target.closest('a')) saet(false);
    });

    // Klik ved siden af, eller Escape, lukker også
    document.addEventListener('click', e => {
      if (!nav.contains(e.target)) saet(false);
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') saet(false);
    });

    // Går man tilbage til desktopbredde, skal menuen ikke hænge åben
    window.matchMedia('(min-width:1041px)').addEventListener('change', e => {
      if (e.matches) saet(false);
    });
  });
});
