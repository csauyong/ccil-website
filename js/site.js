// CCiL — language switcher + lucide icon init
(function () {
  const KEY = 'ccil-lang';
  const valid = ['en', 'tc', 'sc'];

  const apply = (lang) => {
    if (!valid.includes(lang)) lang = 'en';
    document.documentElement.setAttribute('data-lang', lang);
    document.querySelectorAll('.ccil-langswitch button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    try { localStorage.setItem(KEY, lang); } catch (e) {}
  };

  const init = () => {
    let lang = 'en';
    try { lang = localStorage.getItem(KEY) || 'en'; } catch (e) {}
    apply(lang);

    document.querySelectorAll('.ccil-langswitch button').forEach(btn => {
      btn.addEventListener('click', () => apply(btn.dataset.lang));
    });

    if (window.lucide) window.lucide.createIcons();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
