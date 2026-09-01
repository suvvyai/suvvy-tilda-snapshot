/* «Решения для автоматизации звонков и чатов» — блок №4 на тильда-главной,
 * сразу после «Результатов клиентов Савви» (тот же порядок, что в астро-варианте:
 * Hero → Benefits → CaseResults → Solutions).
 *
 * Ванильный порт astro/src/components/Solutions.astro + solutions/InteractiveVoice.jsx.
 * Переносим ровно то, что видно на астро-сайте: карточка «Чат-бот» со статичным
 * диалогом из двух реплик и карточка «Голосовой бот» с плашкой записи и плеером.
 *
 * Про голосовую карточку. В астро это React-остров с распознаванием речи, но
 * стартовое состояние у него — 'ended', и вернуться к звонку из него нечем: кнопка
 * «Позвонить» живёт в состоянии 'idle', в которое компонент никогда не попадает.
 * То есть на сайте работает только плеер приветствия. Его и переносим, без мёртвого
 * кода распознавания — поведение то же, читать проще.
 *
 * Подключение: <script src=".../suvvy-solutions.js" defer></script>, CSS подтянется рядом.
 */
(function () {
  'use strict';

  // Версия из подключения скрипта (?v=N) переносится на CSS — /widget/*
  // у старых посетителей мог засесть в годовом кэше.
  function cssVer() {
    var n = document.querySelectorAll('script[src*="suvvy-solutions.js"]');
    var s = document.currentScript || n[n.length - 1];
    var m = s && s.src.match(/\?v=\d+/);
    return m ? m[0] : '';
  }

  // Вставляем после блока кейсов; пока его нет — после зеро-блока героя.
  // Порядок сходится сам: если кейсы вставятся позже, они встанут между героем
  // и этим блоком, что и нужно.
  var AFTER_CASES = 'shw-cases';
  var AFTER_REC = 'rec841335670';

  // Настоящая запись голоса Савви (не синтез браузера): mp3 моно 64 кбит/с.
  // preload='none' — 570 КБ не тянем, пока не нажали «play».
  var VOICE_SRC = '/widget/audio/suvvy-voice.mp3';
  var VOICE_LEN = '00:01:13';

  var CHAT = [
    { who: 'client', text: 'Здравствуйте, подскажите, сколько стоит доставка?' },
    { who: 'bot', text: 'Здравствуйте! Доставка по вашему адресу составит 300 рублей. Хотите оформить заказ?' }
  ];

  var CARDS = {
    chat: {
      icon: '/widget/solutions/sol-chat.svg',
      title: 'Чат-бот',
      desc: 'Общается с клиентами в чатах и на сайте: консультирует, помогает выбрать продукт и доводит до заявки или покупки 24/7'
    },
    voice: {
      icon: '/widget/solutions/sol-voice.svg',
      title: 'Голосовой бот',
      desc: 'Савви обрабатывает звонки без участия оператора: выявляет потребности, отвечает на типовые вопросы и доводит клиента до целевого действия'
    }
  };

  // Фирменный знак Савви — те же пути, что в astro/src/components/hero/SuvvyMark.jsx.
  var MARK = [
    'M 12.147 23.772 C 9.852 23.772 7.773 23.266 5.911 22.253 C 4.071 21.219 2.62 19.799 1.559 17.994 C 0.52 16.189 0 14.153 0 11.886 C 0 9.619 0.53 7.583 1.591 5.778 C 2.652 3.973 4.103 2.564 5.944 1.552 C 7.806 0.517 9.885 0 12.18 0 C 14.042 0 15.742 0.33 17.279 0.991 C 18.816 1.651 20.115 2.608 21.176 3.863 C 19.673 5.3 17.323 5.077 15.4 4.316 C 14.469 3.948 13.46 3.764 12.375 3.764 C 10.816 3.764 9.419 4.116 8.185 4.82 C 6.951 5.503 5.987 6.46 5.294 7.693 C 4.601 8.926 4.255 10.323 4.255 11.886 C 4.255 13.449 4.601 14.847 5.294 16.079 C 5.987 17.312 6.951 18.28 8.185 18.985 C 9.419 19.667 10.816 20.008 12.375 20.008 C 13.19 20.008 13.961 19.903 14.69 19.693 C 16.727 19.104 19.399 19.499 20.24 21.475 L 20.934 23.104 C 21.082 23.452 21.036 23.933 20.668 23.991 C 19.705 24.144 18.565 22.223 17.246 22.782 C 15.709 23.442 14.009 23.772 12.147 23.772 Z',
    'M 12.045 12.829 C 12.045 14.591 10.856 13.799 9.391 13.799 C 7.925 13.799 6.737 14.591 6.737 12.829 C 6.737 11.067 7.925 9.639 9.391 9.639 C 10.856 9.639 12.045 11.067 12.045 12.829 Z',
    'M 19.19 12.886 C 19.19 14.679 18.001 13.881 16.536 13.881 C 15.07 13.881 13.882 14.679 13.882 12.886 C 13.882 11.093 15.07 9.639 16.536 9.639 C 18.001 9.639 19.19 11.093 19.19 12.886 Z'
  ];

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function markSvg(size, color) {
    return '<svg width="' + size + '" height="' + Math.round(size * 24 / 21.176) + '" ' +
      'viewBox="0 0 21.176 24" fill="' + color + '" aria-hidden="true">' +
      MARK.map(function (d) { return '<path d="' + d + '"/>'; }).join('') + '</svg>';
  }

  function chatHtml() {
    return CHAT.map(function (m) {
      if (m.who === 'client') {
        return '<div class="msg msg--client">' +
            '<div class="msg__head">' +
              '<span class="msg__avatar msg__avatar--client">К</span>' +
              '<span class="msg__name">Клиент</span>' +
            '</div>' +
            '<div class="msg__bubble">' + esc(m.text) + '</div>' +
          '</div>';
      }
      return '<div class="msg msg--bot">' +
          '<div class="botblock">' +
            '<div class="botblock__head">' +
              '<span class="botblock__mark">' + markSvg(18, 'var(--suvvy-ink-900)') + '</span>' +
              '<span class="botblock__name">Чат-бот Савви</span>' +
            '</div>' +
            '<div class="botblock__text">' + esc(m.text) + '</div>' +
          '</div>' +
        '</div>';
    }).join('');
  }

  function waveHtml() {
    var bars = '';
    for (var i = 0; i < 32; i++) bars += '<i></i>';
    return bars;
  }

  function build() {
    var s = document.createElement('section');
    s.id = 'shw-solutions';
    s.innerHTML =
      '<div class="solutions container">' +
        '<h2 class="solutions__title">Решения для автоматизации звонков и чатов</h2>' +
        '<div class="solutions__grid">' +
          '<article class="solcard solcard--chat">' +
            '<div class="solcard__bg" aria-hidden="true"></div>' +
            '<div class="solcard__body">' +
              '<img class="solcard__icon" src="' + CARDS.chat.icon + '" alt="" aria-hidden="true">' +
              '<h3 class="solcard__title">' + CARDS.chat.title + '</h3>' +
              '<p class="solcard__desc">' + CARDS.chat.desc + '</p>' +
              '<div class="solcard__preview">' +
                '<div class="ichat ichat--static"><div class="ichat__feed">' + chatHtml() + '</div></div>' +
              '</div>' +
            '</div>' +
          '</article>' +
          '<article class="solcard solcard--voice">' +
            '<div class="solcard__bg" aria-hidden="true"></div>' +
            '<div class="solcard__body">' +
              '<img class="solcard__icon" src="' + CARDS.voice.icon + '" alt="" aria-hidden="true">' +
              '<h3 class="solcard__title">' + CARDS.voice.title + '</h3>' +
              '<p class="solcard__desc">' + CARDS.voice.desc + '</p>' +
              '<div class="solcard__preview">' +
                '<div class="ivoice"><div class="callend">' +
                  '<div class="callend__head">' +
                    '<span class="callend__avatar callend__avatar--brand" aria-hidden="true">' +
                      markSvg(20, '#fff') +
                    '</span>' +
                    '<div>' +
                      '<div class="callend__title">Послушайте голос Савви</div>' +
                      '<div class="callend__sub">Запись приветствия — так Савви общается с вашими клиентами</div>' +
                    '</div>' +
                  '</div>' +
                  '<div class="audioplayer">' +
                    '<button type="button" class="audioplayer__play" data-play aria-label="Прослушать">' +
                      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>' +
                    '</button>' +
                    '<span class="audioplayer__wave" data-wave aria-hidden="true">' + waveHtml() + '</span>' +
                    '<span class="audioplayer__time" data-time>' + VOICE_LEN + '</span>' +
                  '</div>' +
                '</div></div>' +
              '</div>' +
            '</div>' +
          '</article>' +
        '</div>' +
      '</div>';
    return s;
  }

  var ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>';
  var ICON_STOP = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';

  function fmt(sec) {
    sec = Math.max(0, Math.round(sec || 0));
    var m = Math.floor(sec / 60), r = sec % 60;
    return '00:' + (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
  }

  function wire(s) {
    var btn = s.querySelector('[data-play]');
    var wave = s.querySelector('[data-wave]');
    var time = s.querySelector('[data-time]');
    if (!btn) return;
    var audio = null;

    function reset() {
      btn.innerHTML = ICON_PLAY;
      btn.setAttribute('aria-label', 'Прослушать');
      wave.classList.remove('is-playing');
      if (time) time.textContent = audio && audio.duration ? fmt(audio.duration) : VOICE_LEN;
    }

    btn.addEventListener('click', function () {
      if (!audio) {
        audio = new Audio(VOICE_SRC);
        audio.preload = 'none';
        audio.addEventListener('loadedmetadata', function () {
          if (time && audio.paused) time.textContent = fmt(audio.duration);
        });
        audio.addEventListener('timeupdate', function () {
          if (time && !audio.paused) time.textContent = fmt(audio.currentTime);
        });
        audio.addEventListener('ended', reset);
        audio.addEventListener('pause', reset);
        // Файл не доехал (сеть/блокировщик) — возвращаем кнопку в исходное,
        // чтобы нажатие не заканчивалось молчанием без объяснений.
        audio.addEventListener('error', reset);
      }
      if (!audio.paused) { audio.pause(); audio.currentTime = 0; return; }
      var pr = audio.play();
      if (pr && pr.catch) pr.catch(reset);
      btn.innerHTML = ICON_STOP;
      btn.setAttribute('aria-label', 'Остановить');
      wave.classList.add('is-playing');
    });

    // Уходим со страницы (или Тильда пересобирает body) — звук не должен идти дальше.
    window.addEventListener('pagehide', function () { if (audio) { audio.pause(); audio.currentTime = 0; } });
  }

  function injectCss() {
    var self = document.currentScript || (function () {
      var n = document.querySelectorAll('script[src*="suvvy-solutions.js"]');
      return n[n.length - 1];
    })();
    var href = (self ? self.src.replace(/suvvy-solutions\.js.*$/, 'suvvy-solutions.css') : 'suvvy-solutions.css') + cssVer();
    if (document.querySelector('link[href="' + href + '"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    document.head.appendChild(l);
  }
  injectCss();

  // Тильда перерисовывает <body> и сносит вставленную секцию, а при пересборке через
  // innerHTML разметка выживает, но слушатели теряются. Поэтому следим и, если надо,
  // вставляем блок заново или просто перевешиваем обработчики.
  var tries = 0;
  (function boot() {
    var s = document.getElementById('shw-solutions');
    if (!s) {
      var anchor = document.getElementById(AFTER_CASES) || document.getElementById(AFTER_REC);
      if (anchor) {
        s = build();
        anchor.parentNode.insertBefore(s, anchor.nextSibling);
      }
    }
    if (s && !s.__shwWired) {
      s.__shwWired = true;
      wire(s);
    }
    if (++tries > 100) return;
    setTimeout(boot, 150);
  })();
})();
