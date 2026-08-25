/* «Савви на конференциях» — блок видео-выступлений на тильда-главной.
 *
 * Наш блок (в Тильде его нет). Дизайн — вариант D мокапа
 * mockups/video-section.html («прожектор с переключателем»): одна крупная
 * витрина с бейджем конференции, заголовком и спикером, вкладки-переключатели
 * снизу. Видео — ВК Видео: iframe video_ext.php создаётся только по клику
 * на сцену (до этого страница ничего с ВК не грузит).
 *
 * Порядок на главной (решение фаундера): герой → «Нам доверяют» →
 * «Результаты клиентов» → ЭТОТ БЛОК → «Решения». Якорь — перед #shw-solutions.
 *
 * Добавить видео: дописать объект в VIDEOS (oid/id/list — из ссылки вида
 * vkvideo.ru/video{oid}_{id}?list={list}). Вкладки появляются автоматически,
 * когда видео больше одного.
 */
(function () {
  'use strict';

  // Версия из подключения скрипта (?v=N) переносится на CSS — /widget/*
  // у старых посетителей мог засесть в годовом кэше.
  function cssVer() {
    var n = document.querySelectorAll('script[src*="suvvy-videos.js"]');
    var s = document.currentScript || n[n.length - 1];
    var m = s && s.src.match(/\?v=\d+/);
    return m ? m[0] : '';
  }

  var BEFORE = 'shw-solutions';
  var AFTER = 'shw-cases';

  var VIDEOS = [
    {
      conf: 'АМОКОНФ 2026',
      title: 'Выступление Антона Бесщетникова на АМОКОНФ',
      meta: 'Антон Бесщетников · фаундер Савви',
      oid: '-230256025', id: '456239057', list: 'f18a87775e6eafe264',
      // Тизер: 4 фрагмента выступления по 4с (ffmpeg из ролика ВК), 335 КБ,
      // без звука — крутится в сцене; клик открывает полный ВК-плеер.
      teaser: 'videos/amoconf-teaser.mp4',
    },
    {
      conf: 'Moscow Startup Summit',
      title: 'Савви — финалист премии',
      meta: 'Премия Moscow Startup Summit · startupsummit.ru/awards',
      // Прямой mp4 — крутится живым предпросмотром (без звука) прямо в сцене.
      mp4: 'https://c80ejklh5b.a.trbcdn.net/common/assets/startupsummit/awards_how_it_was_last_year.mp4',
      preview: true,
    },
  ];

  var PLAY_SVG = '<svg viewBox="0 0 24 24" fill="#11253E" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  var CHEVRON_L = '<svg viewBox="0 0 24 24" fill="none" stroke="#11253E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>';
  var CHEVRON_R = '<svg viewBox="0 0 24 24" fill="none" stroke="#11253E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 5.5 16 12l-6.5 6.5"/></svg>';

  // Автосмена: свой тизер доигрывает до конца (loop не ставим), длинный
  // mp4-предпросмотр обрезаем по таймеру — и переключаемся на следующее видео.
  var PREVIEW_CAP_S = 18;

  function embedUrl(v) {
    var u = 'https://vkvideo.ru/video_ext.php?oid=' + v.oid + '&id=' + v.id + '&hd=2&autoplay=1';
    if (v.list) u += '&list=' + v.list;
    return u;
  }

  function baseUrl() {
    var self = document.currentScript || (function () {
      var n = document.querySelectorAll('script[src*="suvvy-videos.js"]');
      return n[n.length - 1];
    })();
    return self ? self.src.replace(/suvvy-videos\.js.*$/, '') : '/widget/';
  }
  var BASE = baseUrl();

  function injectCss() {
    var href = BASE + 'suvvy-videos.css' + cssVer();
    if (document.querySelector('link[href="' + href + '"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    document.head.appendChild(l);
  }
  injectCss();

  var current = 0;

  function stageHtml(v) {
    // Живой беззвучный предпросмотр: свой тизер (v.teaser, относительный путь
    // от виджета) или сам mp4 (v.preview); без него — градиент.
    var pv = v.teaser ? BASE + v.teaser : (v.preview && v.mp4 ? v.mp4 : null);
    var back = pv
      ? '<video class="svid__previewvid" src="' + pv + '" muted autoplay playsinline></video>' +
        '<span class="svid__shade" aria-hidden="true"></span>'
      : '<span class="svid__bg" aria-hidden="true"></span>';
    return back +
      '<div class="svid__stagemeta">' +
        '<span class="svid__conf">' + v.conf + '</span>' +
        '<h3 class="svid__stagetitle">' + v.title + '</h3>' +
        '<p class="svid__stagedesc">' + v.meta + '</p>' +
      '</div>' +
      '<span class="svid__play">' + PLAY_SVG + '</span>';
  }

  function build() {
    var s = document.createElement('section');
    s.id = 'shw-videos';
    var tabs = VIDEOS.length > 1
      ? '<div class="svid__tabs">' + VIDEOS.map(function (v, i) {
          return '<button type="button" class="svid__tab' + (i === 0 ? ' is-active' : '') + '" data-tab="' + i + '">' +
            '<span class="svid__tabconf">' + v.conf + '</span>' +
            '<span class="svid__tabtitle">' + v.title + '</span>' +
          '</button>';
        }).join('') + '</div>'
      : '';
    // Стрелки — сиблинги сцены (внутри их снесло бы заменой innerHTML при переключении).
    var nav = VIDEOS.length > 1
      ? '<button type="button" class="svid__nav svid__nav--prev" data-nav="-1" aria-label="Предыдущее видео">' + CHEVRON_L + '</button>' +
        '<button type="button" class="svid__nav svid__nav--next" data-nav="1" aria-label="Следующее видео">' + CHEVRON_R + '</button>'
      : '';
    s.innerHTML =
      '<div class="svid__inner">' +
        '<h2 class="svid__title">Савви на конференциях</h2>' +
        '<div class="svid__panel">' +
          '<div class="svid__stagewrap">' +
            '<div class="svid__stage" role="button" tabindex="0" aria-label="Смотреть видео">' +
              stageHtml(VIDEOS[0]) +
            '</div>' +
            nav +
          '</div>' +
          tabs +
        '</div>' +
      '</div>';
    return s;
  }

  // Autoplay беззвучного предпросмотра: браузер не всегда стартует ролик вне
  // вьюпорта — запускаем явно при появлении сцены на экране (и ставим на паузу,
  // когда она уходит с экрана, чтобы не крутить впустую).
  function armPreview(stage, onDone) {
    var v = stage.querySelector('.svid__previewvid');
    if (!v) return;
    var tryPlay = function () { v.play().catch(function () {}); };
    tryPlay();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!document.contains(v)) return;
          if (e.isIntersecting) tryPlay();
          else v.pause();
        });
      }, { threshold: 0.15 }).observe(stage);
    }
    // Автосмена активного видео по истечении тизера. Пока сцена не на экране,
    // ролик стоит на паузе — timeupdate/ended не приходят, карусель не крутится.
    if (typeof onDone !== 'function') return;
    var done = false;
    var fire = function () {
      if (done || !document.contains(v)) return;
      done = true;
      onDone();
    };
    v.addEventListener('ended', fire);
    v.addEventListener('timeupdate', function () {
      if (v.currentTime >= PREVIEW_CAP_S) fire();
    });
  }

  function playCurrent(stage) {
    var v = VIDEOS[current];
    stage.classList.add('svid__stage--playing');
    if (v.mp4) {
      stage.innerHTML = '<video src="' + v.mp4 + '" controls autoplay playsinline></video>';
    } else {
      stage.innerHTML = '<iframe src="' + embedUrl(v) + '" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen frameborder="0"></iframe>';
    }
  }

  function wire(s) {
    var stage = s.querySelector('.svid__stage');

    function setActive(i) {
      current = ((i % VIDEOS.length) + VIDEOS.length) % VIDEOS.length;
      Array.prototype.forEach.call(s.querySelectorAll('.svid__tab'), function (t) {
        t.classList.toggle('is-active', +t.getAttribute('data-tab') === current);
      });
      stage.classList.remove('svid__stage--playing');
      stage.innerHTML = stageHtml(VIDEOS[current]);
      armPreview(stage, advance);
    }

    // Автосмена: тизер доиграл → следующее видео. Если посетитель уже смотрит
    // полный ролик, превью в сцене нет и advance не вызовется.
    function advance() {
      if (stage.classList.contains('svid__stage--playing')) return;
      setActive(current + 1);
    }

    armPreview(stage, advance);
    stage.addEventListener('click', function () {
      if (!stage.classList.contains('svid__stage--playing')) playCurrent(stage);
    });
    stage.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && !stage.classList.contains('svid__stage--playing')) {
        e.preventDefault();
        playCurrent(stage);
      }
    });
    Array.prototype.forEach.call(s.querySelectorAll('.svid__tab'), function (tab) {
      tab.addEventListener('click', function () {
        setActive(+tab.getAttribute('data-tab'));
      });
    });
    Array.prototype.forEach.call(s.querySelectorAll('.svid__nav'), function (btn) {
      btn.addEventListener('click', function () {
        setActive(current + (+btn.getAttribute('data-nav')));
      });
    });
  }

  // Тильда пересобирает <body> — следим и вставляем заново, пока не устоится.
  var tries = 0;
  (function boot() {
    var s = document.getElementById('shw-videos');
    if (!s) {
      var sol = document.getElementById(BEFORE);
      var cases = document.getElementById(AFTER);
      if (sol || cases) {
        s = build();
        if (sol) sol.parentNode.insertBefore(s, sol);
        else cases.parentNode.insertBefore(s, cases.nextSibling);
        wire(s);
      }
    }
    if (++tries > 100) return;
    setTimeout(boot, 150);
  })();
})();
