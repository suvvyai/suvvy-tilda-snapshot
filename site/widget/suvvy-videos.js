/* «Савви на конференциях» — блок видео-выступлений на тильда-главной.
 *
 * Наш блок (в Тильде его нет). Дизайн — вариант D мокапа
 * mockups/video-section.html («прожектор с переключателем»): одна крупная
 * витрина с бейджем конференции, заголовком и спикером, вкладки-переключатели
 * снизу. Видео — Рутуб: iframe плеера создаётся только по клику на сцену
 * (до этого страница ничего с видеохостинга не грузит). Поддержан и ВК
 * (oid/id/list), если ролик лежит там.
 *
 * Порядок на главной (решение фаундера): герой → «Нам доверяют» →
 * «Результаты клиентов» → ЭТОТ БЛОК → «Решения». Якорь — перед #shw-solutions.
 *
 * Добавить видео: дописать объект в VIDEOS — rutube: '<id>' из ссылки
 * rutube.ru/video/<id>/, либо oid/id/list из vkvideo.ru/video{oid}_{id},
 * либо прямой mp4. Вкладки появляются автоматически, когда видео больше одного.
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
      rutube: '578205f57cee2c5ac485dd345ea15e6e',
      // Тизер: 4 фрагмента выступления по 4с (ffmpeg из ролика ВК), 335 КБ,
      // без звука — крутится в сцене; клик открывает полный ВК-плеер.
      teaser: 'videos/amoconf-teaser.mp4',
      logo: 'logos/amoconf.svg',
    },
    {
      conf: 'Moscow Startup Summit',
      title: 'Савви — финалист премии',
      meta: 'Премия Moscow Startup Summit · startupsummit.ru/awards',
      // Прямой mp4 — крутится живым предпросмотром (без звука) прямо в сцене.
      mp4: 'https://c80ejklh5b.a.trbcdn.net/common/assets/startupsummit/awards_how_it_was_last_year.mp4',
      preview: true,
      logo: 'logos/startup-summit.png',
    },
    {
      conf: 'Питерский Промпт',
      title: 'Выступление Антона Бесщетникова',
      meta: 'Антон Бесщетников · фаундер Савви',
      logo: 'logos/piterskiy-prompt.svg',
      rutube: 'a063e23609e2f2eb0e4a1c33582bbaa3',
    },
  ];

  var PLAY_SVG = '<svg viewBox="0 0 24 24" fill="#11253E" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  var CHEVRON_L = '<svg viewBox="0 0 24 24" fill="none" stroke="#11253E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>';
  var CHEVRON_R = '<svg viewBox="0 0 24 24" fill="none" stroke="#11253E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 5.5 16 12l-6.5 6.5"/></svg>';

  // Автосмена: свой тизер доигрывает до конца (loop не ставим), длинный
  // mp4-предпросмотр обрезаем по таймеру — и переключаемся на следующее видео.
  var PREVIEW_CAP_S = 18;

  function embedUrl(v) {
    if (v.rutube) return 'https://rutube.ru/play/embed/' + v.rutube + '/?autoplay=1';
    var u = 'https://vkvideo.ru/video_ext.php?oid=' + v.oid + '&id=' + v.id + '&hd=2&autoplay=1';
    if (v.list) u += '&list=' + v.list;
    return u;
  }

  // Запасной ход: если плеер не поднялся (блокировщик, корпоративная сеть),
  // даём прямую ссылку на ролик — она открывается отдельной вкладкой.
  function watchUrl(v) {
    if (v.rutube) return 'https://rutube.ru/video/' + v.rutube + '/';
    if (v.oid && v.id) return 'https://vkvideo.ru/video' + v.oid + '_' + v.id;
    return null;
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

  // Лого мероприятия в плашке. Файла может не быть (лого добавляются по мере
  // получения) — тогда картинку прячем, вёрстка плашки не меняется.
  function logoHtml(v) {
    if (!v.logo) return '';
    return '<img class="svid__tablogo" src="' + BASE + v.logo + '" alt="' + v.conf +
      '" loading="lazy" onerror="this.remove()">';
  }

  // Есть ли что показывать по клику: свой ролик ВК или прямой mp4.
  function hasSource(v) { return !!(v.mp4 || v.rutube || (v.oid && v.id)); }

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
      (hasSource(v) ? '<span class="svid__play">' + PLAY_SVG + '</span>' : '');
  }

  function build() {
    var s = document.createElement('section');
    s.id = 'shw-videos';
    var tabs = VIDEOS.length > 1
      ? '<div class="svid__tabs">' + VIDEOS.map(function (v, i) {
          return '<button type="button" class="svid__tab' + (i === 0 ? ' is-active' : '') + '" data-tab="' + i + '">' +
            '<span class="svid__tabtext">' +
              '<span class="svid__tabconf">' + v.conf + '</span>' +
              '<span class="svid__tabtitle">' + v.title + '</span>' +
            '</span>' + logoHtml(v) +
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
  var stillTimer = null;

  function armPreview(stage, onDone) {
    clearTimeout(stillTimer);
    var v = stage.querySelector('.svid__previewvid');
    if (!v) {
      // Пункт без ролика (запись ещё не выложена): держим статичную сцену
      // столько же, сколько длится обрезанный предпросмотр, и идём дальше —
      // иначе карусель на нём остановится.
      if (typeof onDone === 'function') {
        stillTimer = setTimeout(function () {
          if (document.contains(stage)) onDone();
        }, PREVIEW_CAP_S * 1000 / 2);
      }
      return;
    }
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
      // Плеер могут срезать блокировщик или сеть — тогда через 4с показываем
      // ссылку «смотреть на площадке», чтобы клик не заканчивался ничем.
      var url = watchUrl(v);
      if (url) setTimeout(function () {
        var fr = stage.querySelector('iframe');
        if (!fr || !document.contains(fr)) return;
        try { if (fr.contentWindow && fr.contentWindow.length >= 0) {} } catch (e) {}
        if (fr.clientHeight > 40) return;
        stage.insertAdjacentHTML('beforeend',
          '<a class="svid__fallback" href="' + url + '" target="_blank" rel="noopener">Смотреть на площадке</a>');
      }, 4000);
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
      if (!hasSource(VIDEOS[current])) return;
      if (!stage.classList.contains('svid__stage--playing')) playCurrent(stage);
    });
    stage.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && hasSource(VIDEOS[current]) && !stage.classList.contains('svid__stage--playing')) {
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
