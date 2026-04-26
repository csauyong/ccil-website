// CCiL — language switcher, nav toggle, and dynamic content rendering.
//
// TODO: Source events.json / sermons.json from a Google Sheet (or similar
// non-developer-editable backend) so the church team can update activities
// and sermon series without touching the repo. Sketch:
//   1. Form submissions land in a Google Sheet.
//   2. A published CSV/JSON endpoint, or a small GitHub Action, syncs the
//      sheet into /data/*.json on a schedule.
//   3. Until then, edit the JSON files directly and commit.
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

  // Escape user-controlled strings before injecting as HTML.
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  // Render one trilingual phrase as the three .lang-* spans the CSS expects.
  const triSpan = (obj, extraClass = '') => {
    if (!obj) return '';
    const cls = extraClass ? ` ${extraClass}` : '';
    return `<span class="lang-en${cls}">${esc(obj.en)}</span>` +
           `<span class="lang-tc${cls}">${esc(obj.tc)}</span>` +
           `<span class="lang-sc${cls}">${esc(obj.sc)}</span>`;
  };

  const metaItem = (m) => {
    const icon = m.icon ? `<i data-lucide="${esc(m.icon)}"></i>` : '';
    return `<span>${icon}${esc(m.text)}</span>`;
  };

  const metaLine = (items, sep = '<span class="dot">·</span>') =>
    (items || []).map(metaItem).join(sep);

  const eventRow = (e) => `
    <div class="ccil-event-row">
      <div class="ccil-event-date"><div class="day">${esc(e.day)}</div><div class="mon">${esc(e.monLabel)}</div></div>
      <div>
        <h4>${triSpan(e.title)}${e.titleCn ? `<span class="cn lang-en">${esc(e.titleCn)}</span>` : ''}</h4>
        <div class="meta">${metaLine(e.meta)}</div>
      </div>
      ${e.cta ? `<a class="ccil-btn ccil-btn-secondary ccil-btn-sm" href="${esc(e.cta.href)}">${triSpan(e.cta.label)}</a>` : ''}
    </div>`;

  const eventCard = (e) => {
    const h = e.homepage;
    if (!h) return '';
    return `
    <article class="ccil-event-card accent-${esc(h.accent || 'crimson')}">
      ${h.tag ? `<div class="ccil-event-tag">${triSpan(h.tag)}</div>` : ''}
      <h3 class="ccil-event-title">${triSpan(e.title)}${e.titleCn ? `<span class="cn lang-en">${esc(e.titleCn)}</span>` : ''}</h3>
      ${h.body ? `<p class="ccil-event-body">${triSpan(h.body)}</p>` : ''}
      <div class="ccil-event-meta">${metaLine(h.meta, '<span class="dot">·</span>')}</div>
    </article>`;
  };

  const sermonHeader = (s) => {
    if (!s) return '';
    return `
    <div class="ccil-eyebrow">${triSpan(s.eyebrow)}</div>
    <h2 class="ccil-h2">${triSpan(s.title)}${s.titleCn ? `<span class="ccil-h2-cn lang-en">${esc(s.titleCn)}</span>` : ''}</h2>
    <p class="lead" style="margin-top:16px">${triSpan(s.lead)}</p>
    ${s.dateRange ? `<p class="meta" style="margin-top:8px"><span class="verse-ref">${esc(s.dateRange)}</span></p>` : ''}`;
  };

  const fetchJSON = (url) => fetch(url, { cache: 'no-cache' }).then(r => {
    if (!r.ok) throw new Error(`${url}: ${r.status}`);
    return r.json();
  });

  const renderEvents = (events) => {
    const list = document.querySelector('[data-events-list]');
    if (list) list.innerHTML = events.map(eventRow).join('');

    const grid = document.querySelector('[data-events-grid-home]');
    if (grid) {
      grid.innerHTML = events.filter(e => e.homepage).slice(0, 3).map(eventCard).join('');
    }
  };

  const renderSermons = (data) => {
    const header = document.querySelector('[data-sermon-current]');
    if (header && data && data.currentSeries) {
      header.innerHTML = sermonHeader(data.currentSeries);
    }
  };

  const loadDynamicContent = () => {
    const needsEvents = document.querySelector('[data-events-list], [data-events-grid-home]');
    const needsSermons = document.querySelector('[data-sermon-current]');
    const tasks = [];
    if (needsEvents) tasks.push(fetchJSON('data/events.json').then(renderEvents));
    if (needsSermons) tasks.push(fetchJSON('data/sermons.json').then(renderSermons));
    if (!tasks.length) return Promise.resolve();
    return Promise.all(tasks).then(() => {
      if (window.lucide) window.lucide.createIcons();
    }).catch(err => console.error('CCiL data load failed:', err));
  };

  const init = () => {
    let lang = 'en';
    try { lang = localStorage.getItem(KEY) || 'en'; } catch (e) {}
    apply(lang);

    document.querySelectorAll('.ccil-langswitch button').forEach(btn => {
      btn.addEventListener('click', () => apply(btn.dataset.lang));
    });

    const nav = document.querySelector('.ccil-nav');
    const toggle = document.querySelector('.ccil-nav-toggle');
    if (nav && toggle) {
      const setOpen = (open) => {
        nav.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      };
      toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
      nav.querySelectorAll('.ccil-nav-link').forEach(a => a.addEventListener('click', () => setOpen(false)));
      window.addEventListener('resize', () => { if (window.innerWidth > 768) setOpen(false); });
    }

    if (window.lucide) window.lucide.createIcons();

    loadDynamicContent();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
