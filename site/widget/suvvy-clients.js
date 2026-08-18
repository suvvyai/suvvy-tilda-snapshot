/* «Нам доверяют» — лента логотипов клиентов на тильда-главной.
 *
 * Наш блок (не портирован из Тильды/астро — таких там нет). Встаёт между
 * «Результатами клиентов Савви» и «Решениями»: якорь — #shw-solutions
 * (вставляемся перед ним), пока того нет — после #shw-cases, совсем без них —
 * после зеро-блока героя. Boot-цикл сам доводит порядок до нужного.
 *
 * Логотипы приглушены единообразно: filter brightness(0) + opacity — любой
 * цветной/белый логотип становится одинаково серым силуэтом; при наведении
 * возвращается родной цвет. «Союз Мастеров» — белый PNG: без brightness(0)
 * на белом фоне он невидим, поэтому подход силуэтов ещё и обязателен.
 */
(function () {
  'use strict';

  var BEFORE = 'shw-solutions';
  var AFTER = 'shw-cases';
  var AFTER_REC = 'rec841335670';

  // h — высота логотипа в пикселях: у знаков разная плотность, одной высотой
  // на всех строй не выровнять (сверялось на глаз по превью).
  var LOGOS = [
    { f: 'mmb-russia.png', alt: 'MMB Russia', h: 32 },
    { f: 'vicekeeper.svg', alt: 'Vicekeeper', h: 46 },
    { f: 'defure.svg', alt: 'Defure Furniture', h: 30 },
    { f: 'boostra.svg', alt: 'Boostra', h: 26 },
    { f: 'brus-decor.png', alt: 'Brus Decor', h: 46 },
    { f: 'vyruchka.svg', alt: 'Ломбард «Выручка»', h: 38 },
    { f: 'soyuz-masterov.png', alt: 'Союз Мастеров', h: 48 },
    { f: 'el-cosmo.png', alt: "EL'COSMO", h: 40 },
  ];

  function baseUrl() {
    var self = document.currentScript || (function () {
      var n = document.querySelectorAll('script[src*="suvvy-clients.js"]');
      return n[n.length - 1];
    })();
    return self ? self.src.replace(/suvvy-clients\.js.*$/, '') : '/widget/';
  }
  var BASE = baseUrl();

  function build() {
    var s = document.createElement('section');
    s.id = 'shw-clients';
    s.innerHTML =
      '<div class="sclients__inner">' +
        '<div class="sclients__label">Нам доверяют</div>' +
        '<div class="sclients__row">' +
          LOGOS.map(function (l) {
            return '<img class="sclients__logo" src="' + BASE + 'clients/' + l.f +
              '" alt="' + l.alt + '" title="' + l.alt + '" style="height:' + l.h + 'px"' +
              ' loading="lazy" decoding="async">';
          }).join('') +
        '</div>' +
      '</div>';
    return s;
  }

  function injectCss() {
    var href = BASE + 'suvvy-clients.css';
    if (document.querySelector('link[href="' + href + '"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    document.head.appendChild(l);
  }
  injectCss();

  // Та же схема, что у остальных наших блоков: Тильда пересобирает <body>,
  // поэтому следим и вставляем заново, пока страница не устоится.
  var tries = 0;
  (function boot() {
    var s = document.getElementById('shw-clients');
    if (!s) {
      var sol = document.getElementById(BEFORE);
      var cases = document.getElementById(AFTER);
      var rec = document.getElementById(AFTER_REC);
      if (sol) sol.parentNode.insertBefore(build(), sol);
      else if (cases) cases.parentNode.insertBefore(build(), cases.nextSibling);
      else if (rec) rec.parentNode.insertBefore(build(), rec.nextSibling);
    }
    if (++tries > 100) return;
    setTimeout(boot, 150);
  })();
})();
