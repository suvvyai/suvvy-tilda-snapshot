/* «Нам доверяют» — логотипы клиентов на тильда-главной.
 *
 * Наш блок (в Тильде/астро его нет). Встаёт третьим: между «Результатами
 * клиентов Савви» и «Решениями» — якорь #shw-solutions (вставляемся перед ним),
 * пока того нет — после #shw-cases, совсем без них — после зеро-блока героя.
 *
 * Формат (правки 20.08.2026): белый фон без панели и плашек, 5 видимых слотов
 * в ряд, крупные логотипы. Каждый слот листает общий пул: новый логотип едет
 * сверху и тем же движением выталкивает старый вниз (один проезд, не две фазы).
 * Правило: в любой момент на экране НЕТ двух одинаковых логотипов — меняется
 * один слот за раз, новый берётся из тех, что сейчас не показаны.
 *
 * h — высота логотипа: плотность знаков разная, одной высотой строй не выровнять
 * (у квадратных общий кэп даёт вдвое меньшее пятно, чем у широких).
 * mode: 'dark' — белый логотип перекрашиваем в тёмный силуэт, иначе не виден.
 */
(function () {
  'use strict';

  // Версия из подключения скрипта (?v=N) переносится на CSS — /widget/*
  // у старых посетителей мог засесть в годовом кэше.
  function cssVer() {
    var n = document.querySelectorAll('script[src*="suvvy-clients.js"]');
    var s = document.currentScript || n[n.length - 1];
    var m = s && s.src.match(/\?v=\d+/);
    return m ? m[0] : '';
  }

  var BEFORE = 'shw-solutions';
  var AFTER = 'shw-cases';
  var AFTER_REC = 'rec841335670';

  var SLOTS = 5;
  var STEP_MS = 3200;   // как часто сменяется очередной слот
  var SLIDE_MS = 900;   // длительность проезда (совпадает с CSS)

  var LOGOS = [
    { f: 'astana-hub.png', alt: 'Astana Hub', h: 62, mode: 'native' },
    { f: 'el-cosmo.png', alt: "EL'COSMO", h: 56, mode: 'native' },
    { f: 'mmb-russia.png', alt: 'MMB Russia', h: 48, mode: 'native' },
    { f: 'vicekeeper.svg', alt: 'Vicekeeper', h: 67, mode: 'native' },
    { f: 'defure.svg', alt: 'Defure Furniture', h: 45, mode: 'native' },
    { f: 'simple-k.webp', alt: 'Simple K', h: 72, mode: 'native' },
    { f: 'finntrail.webp', alt: 'Finntrail', h: 31, mode: 'native' },
    { f: 'vyruchka.svg', alt: 'Ломбард «Выручка»', h: 62, mode: 'native' },
    { f: 'boostra.svg', alt: 'Boostra', h: 39, mode: 'native' },
    { f: 'brus-decor.png', alt: 'Brus Decor', h: 67, mode: 'native' },
    { f: 'soyuz-masterov.png', alt: 'Союз Мастеров', h: 72, mode: 'dark' },
  ];

  function baseUrl() {
    var self = document.currentScript || (function () {
      var n = document.querySelectorAll('script[src*="suvvy-clients.js"]');
      return n[n.length - 1];
    })();
    return self ? self.src.replace(/suvvy-clients\.js.*$/, '') : '/widget/';
  }
  var BASE = baseUrl();

  function logoHtml(l) {
    return '<img class="sclients__logo sclients__logo--' + l.mode + '" src="' +
      BASE + 'clients/' + l.f + '" alt="' + l.alt + '" title="' + l.alt +
      '" style="--h:' + l.h + 'px" loading="lazy" decoding="async">';
  }

  // стартовый набор — равномерно по пулу, все разные
  function startIndex(i) { return Math.floor((i * LOGOS.length) / SLOTS); }

  function build() {
    var slots = '';
    for (var i = 0; i < SLOTS; i++) {
      // в слоте две грани: видимая и запаркованная сверху
      slots +=
        '<div class="sclients__slot">' +
          '<div class="sclients__face is-current">' + logoHtml(LOGOS[startIndex(i)]) + '</div>' +
          '<div class="sclients__face is-above" aria-hidden="true"></div>' +
        '</div>';
    }
    var s = document.createElement('section');
    s.id = 'shw-clients';
    s.innerHTML =
      '<div class="sclients__inner">' +
        '<h2 class="sclients__title">Нам доверяют</h2>' +
        '<div class="sclients__slots">' + slots + '</div>' +
      '</div>';
    return s;
  }

  function rotate(section) {
    if (section.dataset.rotating === '1') return;
    section.dataset.rotating = '1';

    var slots = [].slice.call(section.querySelectorAll('.sclients__slot'));
    if (LOGOS.length <= slots.length) return; // нечего ротировать без повторов

    var pairs = slots.map(function (s) {
      return [].slice.call(s.querySelectorAll('.sclients__face'));
    });
    var current = pairs.map(function (p) {
      return p.filter(function (f) { return f.classList.contains('is-current'); })[0];
    });
    var shown = current.map(function (f) {
      var img = f.querySelector('img');
      var src = img ? img.getAttribute('src') : '';
      for (var i = 0; i < LOGOS.length; i++) {
        if (src.indexOf(LOGOS[i].f) !== -1) return i;
      }
      return -1;
    });

    var used = {};
    shown.forEach(function (i) { used[i] = true; });
    var pointer = 0;
    var turn = 0;

    function nextFree() {
      for (var step = 0; step < LOGOS.length; step++) {
        var cand = (pointer + step) % LOGOS.length;
        if (!used[cand]) { pointer = (cand + 1) % LOGOS.length; return cand; }
      }
      return pointer;
    }

    function tick() {
      var i = turn % slots.length;
      turn++;
      var nextIdx = nextFree();
      var cur = current[i];
      var nxt = pairs[i].filter(function (f) { return f !== cur; })[0];

      // запаркованную сверху грань наполняем следующим логотипом
      nxt.innerHTML = logoHtml(LOGOS[nextIdx]);
      nxt.removeAttribute('aria-hidden');
      cur.setAttribute('aria-hidden', 'true');

      delete used[shown[i]];
      shown[i] = nextIdx;
      used[nextIdx] = true;
      current[i] = nxt;
      cur.classList.remove('is-current');
      nxt.classList.add('is-current');

      // фиксируем стартовую позицию (-100%) до включения перехода.
      // Синхронный рефлоу, а не rAF: в фоновой вкладке rAF может не прийти,
      // и грань зависла бы наверху.
      void nxt.offsetHeight;

      // один проезд: новый съезжает на место, старый тем же движением уходит вниз
      nxt.classList.add('is-anim');
      cur.classList.add('is-anim');
      nxt.classList.remove('is-above');
      cur.classList.add('is-below');

      // по завершении паркуем ушедшую грань обратно наверх — без анимации
      setTimeout(function () {
        cur.classList.remove('is-anim');
        cur.classList.remove('is-below');
        cur.classList.add('is-above');
        cur.innerHTML = '';
        nxt.classList.remove('is-anim');
      }, SLIDE_MS + 60);
    }

    var timer = null;
    function start() { if (!timer) timer = setInterval(tick, STEP_MS); }
    function stop() { clearInterval(timer); timer = null; }
    start();

    // пауза, когда блок ушёл из вида или вкладка неактивна
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { e.isIntersecting ? start() : stop(); });
      }, { rootMargin: '120px' }).observe(section);
    }
    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : start();
    });
  }

  function injectCss() {
    var href = BASE + 'suvvy-clients.css' + cssVer();
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
      // Порядок по решению фаундера: герой+преимущества → «Нам доверяют» →
      // «Результаты клиентов». Основной якорь — сразу после герой-секции.
      var rec = document.getElementById(AFTER_REC);
      var cases = document.getElementById(AFTER);
      var sol = document.getElementById(BEFORE);
      var node = build();
      if (rec) rec.parentNode.insertBefore(node, rec.nextSibling);
      else if (cases) cases.parentNode.insertBefore(node, cases);
      else if (sol) sol.parentNode.insertBefore(node, sol);
      else node = null;
      if (node) rotate(node);
    }
    if (++tries > 100) return;
    setTimeout(boot, 150);
  })();
})();
