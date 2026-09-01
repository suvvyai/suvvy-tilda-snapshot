/* «Результаты клиентов Савви» — блок №3 на тильда-главной (после героя с тремя буллитами).
 *
 * Формат карточки v2 (макет cases/case-card-atomy.html, ТЗ cases/ТЗ_карточка_кейса_v2.md):
 * шапка «компания — чем занимается» → человек с цитатой → что сделали →
 * колонки «До Савви / После Савви» → плашка с деньгами и расчётом → теги.
 *
 * Правила содержания (правки фаундера, август 2026):
 *  — у каждой карточки свой тип результата, иначе все читаются как одна история;
 *  — цифра не стоит без сравнения; расчётные суммы помечаются в расчёте;
 *  — ссылок на полные кейсы нет: отдельных страниц кейсов не будет;
 *  — расчёт раскрывается поповером ПОВЕРХ карточки, чтобы соседние в ленте
 *    не растягивались (карточки в треке одной высоты).
 *
 * Слайдер: десктоп — 2,5 карточки + стрелки и счётчик, планшет — 1,6,
 * мобильный — одна карточка и точки-индикаторы.
 *
 * Подключение: <script src=".../suvvy-cases.js" defer></script>, CSS подтягивается рядом.
 * Ассеты (лого, фото) — /widget/cases/.
 */
(function () {
  'use strict';

  // Версия из подключения скрипта (?v=N) переносится на CSS — /widget/*
  // у старых посетителей мог засесть в годовом кэше.
  function cssVer() {
    var n = document.querySelectorAll('script[src*="suvvy-cases.js"]');
    var s = document.currentScript || n[n.length - 1];
    var m = s && s.src.match(/\?v=\d+/);
    return m ? m[0] : '';
  }

  var AFTER_REC = 'rec841335670'; // зеро-блок героя (в нём же три буллита) — вставляем сразу после
  var A = '/widget/cases/';

  var CARDS = [
    {
      id: 'atomy',
      logo: A + 'atomy-logo-white.svg', logoBg: '#0B0F1E', logoPad: '9px',
      what: '<b>Атоми</b> — сетевая компания: товары для дома и здоровья',
      geo: 'Россия и Беларусь<i>·</i>поддержка партнёров сети',
      photo: A + 'atomy-minaev.jpg',
      quote: 'Мы не сокращали поддержку — <em>просто перевели людей на более важные задачи</em>, без потери качества ответов.',
      by: '<b>Михаил Минаев</b><i>·</i>руководитель клиентского сервиса, Атоми Россия',
      did: 'Агент отвечает по базе знаний в HelpDeskEddy, сложное передаёт сотруднику. <b>Настроил сотрудник компании после нашего обучения.</b>',
      was: [
        ['Ответ дольше часа', 'Партнёры писали негатив'],
        ['5 человек в переписке', 'Выплаты, верификация, заказы'],
        ['200 000 ₽ в месяц', 'Пять зарплат на первой линии']
      ],
      now: [
        ['22 секунды, круглосуточно', '93% ответов быстрее 30 секунд'],
        ['Треть потока на людях', 'Две трети закрывает агент'],
        ['75 000 ₽ в месяц', '11 ₽ за одно обращение']
      ],
      cap: 'Высвободили бюджет компании', num: '1 500 000', unit: ' ₽ / год',
      calc: [
        '<b>Было:</b> 5 человек первой линии — 200 000 ₽ в месяц, 29 ₽ за обращение.',
        '<b>Стало:</b> агент в HelpDeskEddy — 75 000 ₽ в месяц, 11 ₽ за обращение.',
        '<b>Разница:</b> 125 000 ₽ в месяц. Никого не уволили. Оценка по средним ставкам.'
      ],
      sum: '<b>6 900 обращений в месяц</b> — без роста штата',
      tags: ['HelpDeskEddy', 'Telegram', 'MAX']
    },
    {
      id: 'taxi',
      logo: A + 'trust-taxi-logo.jpg', logoBg: '#0B0B0B', logoPad: '7px',
      what: '<b>Trust Taxi</b> — аренда авто с выкупом для работы в такси',
      geo: 'Москва<i>·</i>парк 140+ авто',
      photo: A + 'trust-taxi-ilya.jpg',
      quote: 'Агент Савви <em>работает как пулемёт</em> — обрабатывает все обращения и ведёт людей на встречу, снимая рутину с менеджеров.',
      by: '<b>Илья Иванов</b><i>·</i>собственник, Trust Taxi',
      did: 'Агент ведёт переписку с водителями и записывает на встречу, сделка уходит в Битрикс24. <b>Собственник настроил агента сам, без интегратора.</b>',
      was: [
        ['300 обращений в месяц', 'Потолок — 15 диалогов в день'],
        ['2 менеджера по 70 000 ₽', 'Рост требовал новых людей'],
        ['Продажников не найти', 'Найм долгий и дорогой']
      ],
      now: [
        ['1 650 обращений в месяц', 'В 6 раз больше, отдел тот же'],
        ['Один менеджер вместо двух', 'Рутину забрал агент'],
        ['Конверсия та же — 40%', 'Обращение → визит в офис']
      ],
      cap: 'Осталось в бизнесе вместо зарплат', num: '3 500 000', unit: ' ₽ / год',
      calc: [
        '<b>Было:</b> 2 менеджера по 70 000 ₽ и потолок в 300 обращений в месяц.',
        '<b>Стало:</b> 1 650 обращений ведёт агент, в отделе один продавец.',
        '<b>Разница:</b> под такой поток нужно было 5–6 сотрудников — ≈290 000 ₽ в месяц. Оценка по ставке компании.'
      ],
      sum: '<b>Поток вырос в 6 раз</b> — без нового найма',
      tags: ['Битрикс24', 'Avito']
    },
    {
      id: 'defure',
      logo: A + 'defure-logo.svg', logoBg: '#fff', logoPad: '9px',
      what: '<b>Defure Furniture</b> — мебель под заказ',
      geo: 'Дубай, ОАЭ<i>·</i>продажи в переписке',
      photo: A + 'defure-ekaterina.jpg',
      quote: 'Мы держали человека только на то, чтобы он первым отвечал в переписке. Теперь <em>отвечает агент, и клиент не уходит к тому, кто ответил раньше нас</em>.',
      by: '<b>Екатерина Кузнецова</b><i>·</i>основатель, Defure Furniture',
      did: 'Агент первым отвечает клиентам в Instagram*, заявки уходят в Битрикс24. <b>Задача — скорость и качество первых ответов.</b>',
      was: [
        ['Ответ до 2 часов', 'Первый ответ клиенту'],
        ['135 000 ₽ в месяц', 'Сотрудник — 5 000 AED']
      ],
      now: [
        ['15 секунд, круглосуточно', 'Первый ответ клиенту'],
        ['10 000 ₽ в месяц', 'Сотрудника заменил агент']
      ],
      cap: 'Осталось в бизнесе вместо зарплат', num: '1 500 000', unit: ' ₽ / год',
      calc: [
        '<b>Было:</b> сотрудник — 135 000 ₽ в месяц (5 000 AED).',
        '<b>Стало:</b> агент — 10 000 ₽ в месяц.',
        '<b>Разница:</b> +125 000 ₽ в месяц, со слов клиента.'
      ],
      sum: '<b>+125 000 ₽ в месяц</b> — по данным клиента',
      tags: ['Битрикс24', 'Instagram*']
    }
  ];

  var NOTE = '*Instagram принадлежит компании Meta, признанной экстремистской и запрещённой на территории Российской Федерации.';

  var STUB = '<div class="shwc__ph shwc__ph--stub">' +
    '<svg width="30" height="30" viewBox="0 0 24 24" fill="none">' +
    '<circle cx="12" cy="8" r="3.6" stroke="#8695A7" stroke-width="1.5"/>' +
    '<path d="M4.5 20c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6" stroke="#8695A7" stroke-width="1.5" stroke-linecap="round"/>' +
    '</svg><span>фото</span></div>';

  function items(list) {
    return list.map(function (i) {
      return '<div class="shwc__li"><b>' + i[0] + '</b>' + i[1] + '</div>';
    }).join('');
  }

  function cardHtml(c) {
    var photo = c.photo ? '<img class="shwc__ph" src="' + c.photo + '" alt="" loading="lazy">' : STUB;
    return '<article class="shwc">' +
      '<div class="shwc__hero">' +
        '<div class="shwc__pic" style="background:' + c.logoBg + ';padding:' + c.logoPad + '">' +
          '<img src="' + c.logo + '" alt="" loading="lazy">' +
        '</div>' +
        '<div class="shwc__head">' +
          '<div class="shwc__what">' + c.what + '</div>' +
          '<div class="shwc__geo">' + c.geo + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="shwc__quote">' +
        '<div class="shwc__pw">' + photo + '</div>' +
        '<div><div class="shwc__qt">' + c.quote + '</div>' +
        '<div class="shwc__by">' + c.by + '</div></div>' +
      '</div>' +
      '<div class="shwc__did"><span class="shwc__did-cap">Что сделали</span>' +
        '<span class="shwc__did-t">' + c.did + '</span></div>' +
      '<div class="shwc__ba">' +
        '<div class="shwc__col shwc__col--was"><div class="shwc__cap">До Савви</div>' + items(c.was) + '</div>' +
        '<div class="shwc__col shwc__col--now"><div class="shwc__cap">После Савви</div>' + items(c.now) + '</div>' +
      '</div>' +
      '<div class="shwc__money">' +
        '<input type="checkbox" id="shwc-calc-' + c.id + '" class="shwc__tg">' +
        '<div class="shwc__mcap">' + c.cap + '</div>' +
        '<div class="shwc__mrow">' +
          '<div class="shwc__num">' + c.num + '<u>' + c.unit + '</u></div>' +
          '<label class="shwc__btn" for="shwc-calc-' + c.id + '">' +
            '<span class="shwc__btn-open">Подробнее</span><span class="shwc__btn-close">Свернуть</span></label>' +
        '</div>' +
        '<div class="shwc__calc">' + c.calc.map(function (x) { return '<div>' + x + '</div>'; }).join('') + '</div>' +
        '<div class="shwc__sum">' + c.sum + '</div>' +
      '</div>' +
      '<div class="shwc__foot"><div class="shwc__tags">' +
        c.tags.map(function (t) { return '<span class="shwc__tag">' + t + '</span>'; }).join('') +
      '</div></div>' +
    '</article>';
  }

  function build() {
    var s = document.createElement('section');
    s.id = 'shw-cases';
    s.innerHTML =
      '<div class="shwc__inner">' +
        '<div class="shwc__top">' +
          '<h2 class="shwc__title">Результаты клиентов Савви</h2>' +
          '<div class="shwc__nav">' +
            '<span class="shwc__count" data-count>1 / ' + CARDS.length + '</span>' +
            '<button type="button" class="shwc__arrow" aria-label="Назад" data-prev disabled>' +
            '<svg viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
            '<button type="button" class="shwc__arrow" aria-label="Вперёд" data-next>' +
            '<svg viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
          '</div>' +
        '</div>' +
        '<div class="shwc__track" data-track>' + CARDS.map(cardHtml).join('') + '</div>' +
        '<div class="shwc__dots" data-dots>' +
          CARDS.map(function (c, i) { return '<span' + (i === 0 ? ' class="on"' : '') + '></span>'; }).join('') +
        '</div>' +
        '<p class="shwc__note">' + NOTE + '</p>' +
      '</div>';
    return s;
  }

  function wire(s) {
    var track = s.querySelector('[data-track]');
    var prev = s.querySelector('[data-prev]');
    var next = s.querySelector('[data-next]');
    var count = s.querySelector('[data-count]');
    var dots = [].slice.call(s.querySelectorAll('[data-dots] span'));
    var cards = [].slice.call(track.querySelectorAll('.shwc'));

    function step() { return cards[0].offsetWidth + 24; }
    function sync() {
      var i = Math.min(cards.length - 1, Math.max(0, Math.round(track.scrollLeft / step())));
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      if (count) count.textContent = (i + 1) + ' / ' + cards.length;
      dots.forEach(function (d, n) { d.className = n === i ? 'on' : ''; });
    }

    // scrollBy({behavior:'smooth'}) на странице Тильды не срабатывает (её скрипты
    // перехватывают плавный скролл) — крутим ленту сами, как в других виджетах.
    var anim = null;
    function glide(delta) {
      var from = track.scrollLeft;
      var max = track.scrollWidth - track.clientWidth;
      var to = Math.max(0, Math.min(max, from + delta));
      if (anim) clearInterval(anim);
      track.style.scrollSnapType = 'none';
      var t0 = Date.now();
      anim = setInterval(function () {
        var p = Math.min(1, (Date.now() - t0) / 380);
        var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        track.scrollLeft = from + (to - from) * e;
        if (p >= 1) { clearInterval(anim); anim = null; track.style.scrollSnapType = ''; sync(); }
      }, 16);
    }

    prev.addEventListener('click', function () { glide(-step()); });
    next.addEventListener('click', function () { glide(step()); });
    dots.forEach(function (d, n) {
      d.addEventListener('click', function () { glide(n * step() - track.scrollLeft); });
    });
    track.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync, { passive: true });
    if (window.ResizeObserver) new ResizeObserver(sync).observe(track);
    window.addEventListener('load', sync);
    [100, 400, 1200].forEach(function (ms) { setTimeout(sync, ms); });
    sync();
  }

  function injectCss() {
    var self = document.currentScript || (function () {
      var n = document.querySelectorAll('script[src*="suvvy-cases.js"]');
      return n[n.length - 1];
    })();
    var href = (self ? self.src.replace(/suvvy-cases\.js.*$/, 'suvvy-cases.css') : 'suvvy-cases.css') + cssVer();
    if (document.querySelector('link[href="' + href + '"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    document.head.appendChild(l);
  }
  injectCss();

  // Тильда перерисовывает <body> из files/pageNNNbody.html (fallback-загрузчик) и сносит
  // вставленную секцию — поэтому следим и переставляем блок, пока страница не устоится.
  // Разметка после такой перерисовки выживает, а слушатели теряются вместе с флагом
  // __shwWired — тогда просто перевешиваем обработчики.
  var tries = 0;
  (function boot() {
    var s = document.getElementById('shw-cases');
    if (!s) {
      // Порядок по решению фаундера: после героя идёт «Нам доверяют»
      // (#shw-clients), кейсы — следом за ним; пока лого-блока нет — за героем.
      var anchor = document.getElementById('shw-clients') ||
        document.getElementById(AFTER_REC);
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
