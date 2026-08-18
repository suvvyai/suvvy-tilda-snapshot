/* «Нам доверяют» — панель логотипов клиентов на тильда-главной.
 *
 * Наш блок (в Тильде/астро его нет). Встаёт между «Результатами клиентов Савви»
 * и «Решениями»: якорь — #shw-solutions (вставляемся перед ним), пока того нет —
 * после #shw-cases, совсем без них — после зеро-блока героя.
 *
 * Оформление — по референсу пользователя: тёмная панель, логотипы рядами
 * со сдвигом (кирпичная кладка), у каждого — скобки-уголки по бокам.
 * Заголовок в общем стиле сайта: слева, как у «Результатов клиентов Савви».
 *
 * Фон — светлый градиент, как у блока «Подключение каналов», логотипы на
 * стеклянных плашках (backdrop-blur). На светлом почти все живут родными
 * цветами (mode: native); белые логотипы (astana hub, «Союз Мастеров»)
 * перекрашиваются в тёмный силуэт (mode: dark), иначе они невидимы.
 */
(function () {
  'use strict';

  var BEFORE = 'shw-solutions';
  var AFTER = 'shw-cases';
  var AFTER_REC = 'rec841335670';

  // h — высота логотипа: плотность знаков разная, одной высотой строй не выровнять.
  // Ряды 4/4/3 со сдвигом, как в референсе; порядок подобран, чтобы соседние
  // «тяжёлые» знаки не слипались.
  var ROWS = [
    [
      { f: 'astana-hub.png', alt: 'Astana Hub', h: 36, mode: 'dark' },
      { f: 'el-cosmo.png', alt: "EL'COSMO", h: 40, mode: 'native' },
      { f: 'mmb-russia.png', alt: 'MMB Russia', h: 34, mode: 'native' },
      { f: 'vicekeeper.svg', alt: 'Vicekeeper', h: 48, mode: 'native' },
    ],
    [
      { f: 'defure.svg', alt: 'Defure Furniture', h: 32, mode: 'native' },
      { f: 'simple-k.webp', alt: 'Simple K', h: 56, mode: 'native' },
      { f: 'finntrail.webp', alt: 'Finntrail', h: 22, mode: 'native' },
      { f: 'vyruchka.svg', alt: 'Ломбард «Выручка»', h: 44, mode: 'native' },
    ],
    [
      { f: 'boostra.svg', alt: 'Boostra', h: 28, mode: 'native' },
      { f: 'brus-decor.png', alt: 'Brus Decor', h: 48, mode: 'native' },
      { f: 'soyuz-masterov.png', alt: 'Союз Мастеров', h: 52, mode: 'dark' },
    ],
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
        '<h2 class="sclients__title">Нам доверяют</h2>' +
        '<div class="sclients__panel">' +
          ROWS.map(function (row, i) {
            return '<div class="sclients__row sclients__row--' + (i + 1) + '">' +
              row.map(function (l) {
                return '<span class="sclients__cell">' +
                  '<img class="sclients__logo sclients__logo--' + l.mode + '" src="' +
                  BASE + 'clients/' + l.f + '" alt="' + l.alt + '" title="' + l.alt +
                  '" style="height:' + l.h + 'px" loading="lazy" decoding="async">' +
                '</span>';
              }).join('') +
            '</div>';
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

  // Тильда пересобирает <body> — следим и вставляем заново, пока не устоится.
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
