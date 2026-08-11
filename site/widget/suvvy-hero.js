/* Suvvy hero widget — живой чат в герое, ванильный порт astro/src/components/hero/HeroDemo.jsx.
 *
 * Что переносим с астро-варианта: ТОЛЬКО интерактив —
 *   • чат-карточка с живой перепиской (печатает → отвечает, цикл);
 *   • переключатель Текст/Голос;
 *   • голосовой режим: плашка звонка с эквалайзером и таймером, «Говорю» с волной,
 *     экран «Звонок окончен» + плеер записи (озвучка через Web Speech API).
 * Что остаётся тильдовским: фон-панель, вертикальный разделитель, сетка каналов,
 * список сценариев (мы лишь навешиваем на него клики) и шрифты (Onest).
 *
 * Подключение: <script src=".../suvvy-hero.js" defer></script> — виджет монтируется сам.
 * CSS suvvy-hero.css подтягивается рядом со скриптом автоматически.
 */
(function () {
  'use strict';

  /* ─────────── настройки ─────────── */
  var CFG = {
    // Сдвиг диалогового окна влево от места тильдовской заглушки.
    // 0 = ровно там, где его поставила Тильда (позиция на панели сохраняется 1:1).
    chatShiftLeft: 0,
    heroRec: 'rec841335670',      // зеро-блок героя
    listRec: 'rec841044514',      // зеро-блок со списком сценариев
    segClass: 'tn-elem__8413356701734360127562',   // картинка «Текст/Голос»
    chatClass: 'tn-elem__8413356701734360127566',  // белая карточка-заглушка чата
    // Содержимое заглушки чата — прячем целиком (реплики-картинки, «Печатаю», линии).
    mockClasses: [
      '8413356701734360127566', '8413356701734360127570', '8413356701734360127574',
      '8413356701734360127575', '8413356701734360127583', '8413356701734360127587',
      '8413356701734360127591', '8413356701734360127593', '8413356701734360127594',
      '8413356701734360127603', '8413356701734360127606', '8413356701734360127608',
      '8413356701734360127612', '8413356701734360127614'
    ]
  };

  /* ─────────── данные (1:1 с astro/src/components/hero/scenarios.js) ─────────── */
  var SCENARIOS = [
    {
      label: 'ИИ-продажник', title: 'Бот-продажник',
      script: [
        { who: 'client', text: 'Здравствуйте, подскажите, сколько стоит доставка?' },
        { who: 'bot', text: 'Здравствуйте! Доставка по вашему адресу составит 300 рублей. Хотите оформить заказ?' },
        { who: 'client', text: 'Да, оформите, пожалуйста.' },
        { who: 'bot', text: 'Отлично! Я оформил ваш заказ. Вы получите его 20 ноября. Оплата будет при получении, верно? Если нужно что-то уточнить, дайте знать!' }
      ]
    },
    {
      label: 'ИИ-сотрудник поддержки', title: 'ИИ-сотрудник поддержки',
      script: [
        { who: 'client', text: 'У меня возникла проблема, не могу войти в личный кабинет.' },
        { who: 'bot', text: 'Здравствуйте! Попробуйте восстановить пароль через ссылку «Забыли пароль?» на странице входа.' },
        { who: 'client', text: 'Спасибо! Все получилось.' },
        { who: 'bot', text: 'Супер! Если возникнет какая-то проблема, обращайтесь. Мы на связи 24/7. Хорошего дня!' }
      ]
    },
    {
      label: 'ИИ-ответы на маркетплейсах', title: 'ИИ-ответы на маркетплейсах',
      script: [
        { who: 'client', text: 'Сложно ли менять шины на самокате в модели E212?' },
        { who: 'bot', text: 'Нет, замена шин на самокате обычно несложна. Процесс включает снятие колеса, замену покрышки или камеры и установку колеса обратно.\n\nДля наглядного примера вы можете ознакомиться с видеоинструкцией: https://youtu.be/lmtHIY7W' }
      ]
    },
    {
      label: 'ИИ-администратор YCLIENTS', title: 'ИИ-администратор YCLIENTS',
      script: [
        { who: 'client', text: 'Добрый день. Хочу записаться на прием к Иванову Ивану.' },
        { who: 'bot', text: 'Добрый день! Отлично, необходимо проверить его график. На какую дату и время вы бы хотели записаться?' },
        { who: 'client', text: 'Можно на завтра, с 10 до 12?' },
        { who: 'bot', text: 'Отлично! Я записал вас на завтра с 10:00 до 12:00. Если что-то нужно изменить или уточнить, дайте знать!' }
      ]
    },
    {
      label: 'ИИ-HR', title: 'ИИ-HR',
      script: [
        { who: 'client', text: 'Привет! Вы на данный момент еще ищете сотрудников?' },
        { who: 'bot', text: 'Привет! Ищем. Я могу за пару минут провести первичный скрининг — хотите начать сейчас?' },
        { who: 'client', text: 'Да, конечно.' },
        { who: 'bot', text: 'Супер! Первый вопрос — в каких индустриях вы уже работали, и есть ли опыт в B2B-продаж?' }
      ]
    }
  ];

  /* ─────────── DOM-хелперы ─────────── */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var MARK = '<svg width="S" height="H" viewBox="0 0 21.176 24" fill="C" aria-hidden="true">' +
    '<path d="M 12.147 23.772 C 9.852 23.772 7.773 23.266 5.911 22.253 C 4.071 21.219 2.62 19.799 1.559 17.994 C 0.52 16.189 0 14.153 0 11.886 C 0 9.619 0.53 7.583 1.591 5.778 C 2.652 3.973 4.103 2.564 5.944 1.552 C 7.806 0.517 9.885 0 12.18 0 C 14.042 0 15.742 0.33 17.279 0.991 C 18.816 1.651 20.115 2.608 21.176 3.863 C 19.673 5.3 17.323 5.077 15.4 4.316 C 14.469 3.948 13.46 3.764 12.375 3.764 C 10.816 3.764 9.419 4.116 8.185 4.82 C 6.951 5.503 5.987 6.46 5.294 7.693 C 4.601 8.926 4.255 10.323 4.255 11.886 C 4.255 13.449 4.601 14.847 5.294 16.079 C 5.987 17.312 6.951 18.28 8.185 18.985 C 9.419 19.667 10.816 20.008 12.375 20.008 C 13.19 20.008 13.961 19.903 14.69 19.693 C 16.727 19.104 19.399 19.499 20.24 21.475 L 20.934 23.104 C 21.082 23.452 21.036 23.933 20.668 23.991 C 19.705 24.144 18.565 22.223 17.246 22.782 C 15.709 23.442 14.009 23.772 12.147 23.772 Z"/>' +
    '<path d="M 12.045 12.829 C 12.045 14.591 10.856 13.799 9.391 13.799 C 7.925 13.799 6.737 14.591 6.737 12.829 C 6.737 11.067 7.925 9.639 9.391 9.639 C 10.856 9.639 12.045 11.067 12.045 12.829 Z"/>' +
    '<path d="M 19.19 12.886 C 19.19 14.679 18.001 13.881 16.536 13.881 C 15.07 13.881 13.882 14.679 13.882 12.886 C 13.882 11.093 15.07 9.639 16.536 9.639 C 18.001 9.639 19.19 11.093 19.19 12.886 Z"/></svg>';
  function mark(size, color) {
    return MARK.replace('S', size).replace('H', (size * 24 / 21.176).toFixed(1)).replace('C', color || 'var(--suvvy-ink-900)');
  }

  var PHONE_PATH = 'M12 9c-1.6 0-3.15.25-4.6.7v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.99.99 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-1.78 1.36c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28a11.27 11.27 0 0 0-2.66-1.85.998.998 0 0 1-.56-.9V9.7C15.15 9.25 13.6 9 12 9z';

  function clientMsg(text) {
    var n = el('div', 'msg msg--client');
    n.innerHTML =
      '<div class="msg__head"><span class="msg__avatar msg__avatar--client">К</span>' +
      '<span class="msg__name">Клиент</span></div>' +
      '<div class="msg__bubble">' + esc(text) + '</div>';
    return n;
  }
  function botMsg(text) {
    var n = el('div', 'msg msg--bot');
    n.innerHTML =
      '<div class="botblock"><div class="botblock__head">' +
      '<span class="botblock__mark">' + mark(18) + '</span>' +
      '<span class="botblock__name">Чат-бот Савви</span></div>' +
      '<div class="botblock__text">' + esc(text) + '</div></div>';
    return n;
  }
  function typing(label, variant) {
    var inner = variant === 'wave'
      ? '<span class="typing__wave" aria-hidden="true"><i></i><i></i><i></i><i></i></span>'
      : '<span class="typing__dots" aria-hidden="true"><i></i><i></i><i></i></span>';
    return el('div', 'typing', inner + '<span class="typing__label">' + esc(label || 'Печатаю') + '</span>');
  }

  /* ─────────── состояние ─────────── */
  var state = { active: 0, mode: 'text' };
  var timers = [];
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }

  function stopSpeak() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  /* ─────────── чат-карточка ─────────── */
  var refs = {};

  function buildCard(host) {
    host.innerHTML = '';
    var card = el('div', 'chatcard');
    var sc = SCENARIOS[state.active];

    var head = el('div', 'chatcard__head');
    head.innerHTML =
      '<div class="chatcard__avatar">' + mark(22) + '<span class="chatcard__avatar-dot"></span></div>' +
      '<div><div class="chatcard__title"></div><div class="chatcard__sub"></div></div>';
    head.querySelector('.chatcard__title').textContent = sc.title;
    head.querySelector('.chatcard__sub').textContent = state.mode === 'voice' ? 'Голосовой бот' : 'Онлайн 24/7';
    card.appendChild(head);

    var body;
    if (state.mode === 'voice') {
      body = el('div', 'voicecall');
      body.appendChild(el('div', 'voicebar',
        '<span class="voicebar__eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' +
        '<span class="voicebar__status">Говорите, Савви на линии…</span>' +
        '<span class="voicebar__dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
        '<span class="voicebar__timer">00:00:00</span>' +
        '<button type="button" class="voicebar__hangup" aria-label="Завершить звонок">' +
        '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="' + PHONE_PATH + '"/></svg></button>'));
      body.appendChild(el('div', 'chatcard__feed voicecall__feed'));
    } else {
      body = el('div', 'chatcard__feed');
    }
    card.appendChild(body);
    host.appendChild(card);

    refs.card = card;
    refs.body = body;
    refs.feed = state.mode === 'voice' ? body.querySelector('.voicecall__feed') : body;
    refs.scroller = state.mode === 'voice' ? body : body;
    refs.bar = body.querySelector('.voicebar');
  }

  function stick() {
    var s = refs.scroller;
    if (s) s.scrollTop = s.scrollHeight;
  }

  /* Текстовый режим: реплики появляются по кругу, бот «печатает» перед ответом. */
  function runText() {
    var script = SCENARIOS[state.active].script;
    function cycle() {
      refs.feed.innerHTML = '';
      var t = 1000;
      script.forEach(function (m, i) {
        if (m.who === 'bot') {
          at(t, function () { refs.feed.appendChild(typing('Печатаю')); stick(); });
          t += 2400;
          at(t, function () {
            var ind = refs.feed.querySelector('.typing');
            if (ind) ind.remove();
            refs.feed.appendChild(botMsg(m.text)); stick();
          });
          t += 1600;
        } else {
          at(t, function () { refs.feed.appendChild(clientMsg(m.text)); stick(); });
          t += 2200;
        }
      });
      at(t + 4000, cycle);
    }
    cycle();
  }

  /* Голосовой режим: живой звонок → «Говорю» с волной → звонок окончен + плеер. */
  function fmtTime(total) {
    function p(n) { return String(n).padStart(2, '0'); }
    return p(Math.floor(total / 3600)) + ':' + p(Math.floor((total % 3600) / 60)) + ':' + p(total % 60);
  }

  function runVoice() {
    var script = SCENARIOS[state.active].script;
    var seconds = 0;
    var tick = setInterval(function () {
      seconds += 1;
      var t = refs.bar && refs.bar.querySelector('.voicebar__timer');
      if (t) t.textContent = fmtTime(seconds);
    }, 1000);
    var stopTick = function () { clearInterval(tick); };

    var t = 1000;
    script.forEach(function (m, i) {
      if (m.who === 'bot') {
        at(t, function () { refs.feed.appendChild(typing('Говорю', 'wave')); stick(); });
        t += 2400;
        at(t, function () {
          var ind = refs.feed.querySelector('.typing');
          if (ind) ind.remove();
          refs.feed.appendChild(botMsg(m.text)); stick();
        });
        t += 1600;
      } else {
        at(t, function () { refs.feed.appendChild(clientMsg(m.text)); stick(); });
        t += 2200;
      }
    });

    at(t + 600, function () {
      stopTick();
      if (refs.bar) refs.bar.remove();
      refs.body.appendChild(buildCallEnd(script));
      stick();
    });

    voiceCleanup = stopTick;
  }
  var voiceCleanup = null;

  function buildCallEnd(script) {
    var box = el('div', 'callend');
    box.innerHTML =
      '<div class="callend__head"><span class="callend__avatar" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="' + PHONE_PATH + '"/></svg></span>' +
      '<div><div class="callend__title">Звонок окончен</div>' +
      '<div class="callend__sub">Запись разговора и текстовая расшифровка успешно сохранены</div></div></div>';

    var bars = '';
    for (var i = 0; i < 32; i++) bars += '<i></i>';
    var player = el('div', 'audioplayer',
      '<button type="button" class="audioplayer__play" aria-label="Прослушать запись">' +
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg></button>' +
      '<span class="audioplayer__wave" aria-hidden="true">' + bars + '</span>' +
      '<span class="audioplayer__time">00:05:55</span>' +
      '<button type="button" class="audioplayer__dl" aria-label="Скачать запись">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12 4v10m0 0 4-4m-4 4-4-4M5 19h14"/></svg></button>');
    box.appendChild(player);

    // Озвучка расшифровки через Web Speech API (как в астро-варианте).
    var playing = false;
    var btn = player.querySelector('.audioplayer__play');
    var wave = player.querySelector('.audioplayer__wave');
    btn.addEventListener('click', function () {
      var synth = window.speechSynthesis;
      if (!synth) return;
      if (playing) {
        synth.cancel(); playing = false;
        wave.classList.remove('is-playing');
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>';
        return;
      }
      synth.cancel();
      var lines = script.map(function (m) { return (m.who === 'bot' ? 'Савви: ' : 'Клиент: ') + m.text; });
      var ru = (synth.getVoices() || []).filter(function (v) { return /ru/i.test(v.lang); })[0];
      var idx = 0;
      playing = true;
      wave.classList.add('is-playing');
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
      (function next() {
        if (idx >= lines.length || !playing) {
          playing = false;
          wave.classList.remove('is-playing');
          btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>';
          return;
        }
        var u = new SpeechSynthesisUtterance(lines[idx]);
        u.lang = 'ru-RU';
        if (ru) u.voice = ru;
        u.onend = function () { idx += 1; next(); };
        synth.speak(u);
      })();
    });
    return box;
  }

  /* ─────────── перерисовка ─────────── */
  function render() {
    clearTimers();
    if (voiceCleanup) { voiceCleanup(); voiceCleanup = null; }
    stopSpeak();
    buildCard(refs.host);
    if (state.mode === 'voice') runVoice(); else runText();
    syncTabs();
    syncSeg();
  }

  /* ─────────── тильдовский список сценариев → клики ─────────── */
  var tabEls = [];
  function syncTabs() {
    tabEls.forEach(function (t, i) {
      if (!t) return;
      var a = t.querySelector('.active'), d = t.querySelector('.default');
      if (a) a.style.opacity = i === state.active ? '1' : '0';
      if (d) d.style.opacity = i === state.active ? '0' : '1';
    });
  }
  function syncSeg() {
    if (!refs.seg) return;
    [].forEach.call(refs.seg.querySelectorAll('.seg__btn'), function (b) {
      b.classList.toggle('is-active', b.dataset.mode === state.mode);
    });
  }

  /* ─────────── монтирование ─────────── */
  // Виджет монтируется ВНУТРЬ тильдовских элементов-заглушек, а не рядом по координатам:
  // Тильда доразмещает зеро-блоки асинхронно и на каждом брейкпоинте, поэтому любые
  // замеры устаревают (окно уезжало вниз). Как ребёнок заглушки виджет всегда на месте.
  function hostInside(node) {
    if (getComputedStyle(node).position === 'static') node.style.position = 'relative';
    [].forEach.call(node.children, function (c) { c.style.visibility = 'hidden'; });
    var h = el('div', 'shw-root');
    h.style.cssText = 'position:absolute;left:0;top:0;right:0;bottom:0;';
    node.appendChild(h);
    return h;
  }

  function mount() {
    var hero = document.getElementById(CFG.heroRec);
    var list = document.getElementById(CFG.listRec);
    var mockChat = document.querySelector('.' + CFG.chatClass);
    var mockSeg = document.querySelector('.' + CFG.segClass);
    if (!hero || !mockChat || !mockSeg) return false;
    // Мокапные реплики/линии/«Печатаю» прячем целиком (сама карточка — ниже, hostInside).
    CFG.mockClasses.forEach(function (c) {
      if (c === '8413356701734360127566') return;
      var n = document.querySelector('.tn-elem__' + c);
      if (n) n.style.visibility = 'hidden';
    });

    // Чат-карточка — внутрь белой заглушки чата
    var chatHost = hostInside(mockChat);
    chatHost.id = 'shw-chat';
    chatHost.style.marginLeft = (-CFG.chatShiftLeft) + 'px';
    refs.host = chatHost;

    // Текст / Голос — внутрь картинки-переключателя
    var segHost = hostInside(mockSeg);
    segHost.id = 'shw-seg';
    segHost.innerHTML =
      '<div class="seg" role="tablist">' +
      '<button type="button" class="seg__btn is-active" data-mode="text">' +
      '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2.5 4.5h11M2.5 8h8M2.5 11.5h5"/></svg>Текст</button>' +
      '<button type="button" class="seg__btn" data-mode="voice">' +
      '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 6.5v3M6 4v8M9 5.5v5M12.5 7v2"/></svg>Голос</button></div>';
    refs.seg = segHost;
    [].forEach.call(segHost.querySelectorAll('.seg__btn'), function (b) {
      b.addEventListener('click', function () {
        if (state.mode === b.dataset.mode) return;
        state.mode = b.dataset.mode;
        render();
      });
    });

    // Список сценариев Тильды делаем кликабельным (визуал и шрифт — тильдовские).
    if (list) {
      // Сопоставляем по тексту, а не по порядку: в блоке есть лишние элементы,
      // и клик по ним при индексной привязке уводил бы за пределы списка сценариев.
      var norm = function (s) { return (s || '').replace(/\s+/g, ' ').trim().toLowerCase(); };
      tabEls = [];
      [].forEach.call(list.querySelectorAll('.tn-elem'), function (n) {
        var t = norm(n.innerText);
        var i = SCENARIOS.map(function (s) { return norm(s.label); }).indexOf(t);
        if (i < 0) return;
        tabEls[i] = n;
        n.classList.add('shw-tab-hit');
        n.addEventListener('click', function () {
          if (state.active === i) return;
          state.active = i;
          render();
        });
      });
    }

    render();
    return true;
  }

  /* CSS рядом со скриптом */
  function injectCss() {
    var self = document.currentScript || (function () {
      var s = document.querySelectorAll('script[src*="suvvy-hero.js"]');
      return s[s.length - 1];
    })();
    var href = self ? self.src.replace(/suvvy-hero\.js.*$/, 'suvvy-hero.css') : 'suvvy-hero.css';
    if (document.querySelector('link[href="' + href + '"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    document.head.appendChild(l);
  }
  injectCss();

  // Тильда достраивает зеро-блоки асинхронно — ждём появления якорей.
  var tries = 0;
  (function boot() {
    if (mount()) return;
    if (++tries > 100) return;
    setTimeout(boot, 150);
  })();
})();
