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

  var BEFORE = 'shw-solutions';
  var AFTER = 'shw-cases';

  var VIDEOS = [
    {
      conf: 'АМОКОНФ 2026',
      title: 'Выступление Антона Бесщетникова',
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
    var href = BASE + 'suvvy-videos.css';
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
      ? '<video class="svid__previewvid" src="' + pv + '" muted loop autoplay playsinline></video>' +
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
    s.innerHTML =
      '<div class="svid__inner">' +
        '<h2 class="svid__title">Савви на конференциях</h2>' +
        '<div class="svid__panel">' +
          '<div class="svid__stage" role="button" tabindex="0" aria-label="Смотреть видео">' +
            stageHtml(VIDEOS[0]) +
          '</div>' +
          tabs +
        '</div>' +
      '</div>';
    return s;
  }

  // Autoplay беззвучного предпросмотра: браузер не всегда стартует ролик вне
  // вьюпорта — запускаем явно при появлении сцены на экране (и ставим на паузу,
  // когда она уходит с экрана, чтобы не крутить впустую).
  function armPreview(stage) {
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
    armPreview(stage);
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
        current = +tab.getAttribute('data-tab');
        Array.prototype.forEach.call(s.querySelectorAll('.svid__tab'), function (t) {
          t.classList.toggle('is-active', t === tab);
        });
        stage.classList.remove('svid__stage--playing');
        stage.innerHTML = stageHtml(VIDEOS[current]);
        armPreview(stage);
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
