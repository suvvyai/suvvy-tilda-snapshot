/* «Результаты клиентов Савви» — блок №3 на тильда-главной (после героя с тремя буллитами).
 * Ванильный порт astro/src/components/CaseResults.astro: карточки + горизонтальный слайдер.
 * Цифры 1:1 с астро-вариантом. Шрифт — тильдовский Onest.
 *
 * Подключение: <script src=".../suvvy-cases.js" defer></script>, CSS подтягивается рядом.
 */
(function () {
  'use strict';

  var AFTER_REC = 'rec841335670'; // зеро-блок героя (в нём же три буллита) — вставляем сразу после

  // Только кейсы, где деньги показаны честно (без выдуманного чека/объёма).
  // slug === null — на Тильде такой страницы нет (кейс появился уже в астро-варианте),
  // тогда кнопку «Читать кейс» не рисуем, чтобы не вести в 404.
  var RESULTS = [
    {
      eyebrow: 'Туризм · 5 каналов',
      title: 'Турагентство экономит ~10,2 млн ₽ в год на обработке заявок',
      heroLabel: 'Экономия на обработке за год',
      heroNum: '~10,2', heroUnit: ' млн ₽',
      baWas: '~10,6 млн ₽ вручную', baNow: '~480 000 ₽ с ИИ',
      facts: ['<b>10 000 заявок/мес</b> квалифицирует ИИ', '<b>5 каналов и 4 языка</b> — один ассистент', 'Стоимость диалога <b>$0,04</b>'],
      tags: ['u-on.travel', '4 языка'],
      slug: 'tourist-agency-case'
    },
    {
      eyebrow: 'Крюинг · рекрутинг',
      title: 'Крюинговая компания экономит ~4,8 млн ₽ в год на обработке потока',
      heroLabel: 'Экономия на обработке за год',
      heroNum: '~4,8', heroUnit: ' млн ₽',
      baWas: '≈12 человек вручную', baNow: 'команда из 2 + ИИ',
      facts: ['<b>150–200 заявок/день</b> обрабатывает ИИ', 'Конверсия из лида в сделку <b>×2</b>', 'Закрытых сделок <b>+40%</b>'],
      tags: ['Avito', 'Telegram'],
      slug: 'case-morskoy-port'
    },
    {
      eyebrow: 'Окна · производство · Уфа',
      title: 'Завод окон получает в 1,7 раза больше готовых клиентов с той же рекламы',
      heroLabel: 'Экономия на обработке за год',
      heroNum: '~2', heroUnit: ' млн ₽',
      baWas: '≈4 менеджера вручную', baNow: 'делает ИИ 24/7',
      facts: ['Качественных лидов <b>39% → 66%</b>', 'Потерянных заявок <b>28% → 4%</b>', 'Первый ответ за <b>18 секунд</b>, 24/7'],
      tags: ['Bitrix24', 'Avito'],
      slug: null
    },
    {
      eyebrow: 'Квадроциклы · производство · Уфа',
      title: 'Производитель квадроциклов сократил цикл сделки почти вдвое',
      heroLabel: 'Экономия на обработке за год',
      heroNum: '~1,4', heroUnit: ' млн ₽',
      baWas: '≈3 менеджера вручную', baNow: '2 ИИ-агента 24/7',
      facts: ['Цикл сделки <b>49 → 25 дней</b>', 'Выход на квалификацию <b>16 → 4 дня</b>', 'Недозвоны <b>42% → 24%</b>'],
      tags: ['amoCRM', 'Wazzup'],
      slug: null
    },
    {
      eyebrow: 'Лазерная эпиляция · бьюти',
      title: 'Студия лазерной эпиляции подняла выручку на 20% без роста бюджета',
      heroLabel: 'Рост выручки без рекламы',
      heroNum: '+20', heroUnit: '%',
      baWas: 'трафик −30%', baNow: 'выручка +20%',
      facts: ['ROI бота <b>362,8%</b> — 1 ₽ дал 3,6 ₽', '<b>~60% переписок</b> без администратора', '<b>1 админ на 2 филиала</b>'],
      tags: ['Yclients', 'СПб'],
      slug: 'case-lazernaya-epilyatsiya'
    }
  ];

  var MARK15 = '<svg width="15" height="17" viewBox="0 0 21.176 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M 12.147 23.772 C 9.852 23.772 7.773 23.266 5.911 22.253 C 4.071 21.219 2.62 19.799 1.559 17.994 C 0.52 16.189 0 14.153 0 11.886 C 0 9.619 0.53 7.583 1.591 5.778 C 2.652 3.973 4.103 2.564 5.944 1.552 C 7.806 0.517 9.885 0 12.18 0 C 14.042 0 15.742 0.33 17.279 0.991 C 18.816 1.651 20.115 2.608 21.176 3.863 C 19.673 5.3 17.323 5.077 15.4 4.316 C 14.469 3.948 13.46 3.764 12.375 3.764 C 10.816 3.764 9.419 4.116 8.185 4.82 C 6.951 5.503 5.987 6.46 5.294 7.693 C 4.601 8.926 4.255 10.323 4.255 11.886 C 4.255 13.449 4.601 14.847 5.294 16.079 C 5.987 17.312 6.951 18.28 8.185 18.985 C 9.419 19.667 10.816 20.008 12.375 20.008 C 13.19 20.008 13.961 19.903 14.69 19.693 C 16.727 19.104 19.399 19.499 20.24 21.475 L 20.934 23.104 C 21.082 23.452 21.036 23.933 20.668 23.991 C 19.705 24.144 18.565 22.223 17.246 22.782 C 15.709 23.442 14.009 23.772 12.147 23.772 Z"/>' +
    '<path d="M 12.045 12.829 C 12.045 14.591 10.856 13.799 9.391 13.799 C 7.925 13.799 6.737 14.591 6.737 12.829 C 6.737 11.067 7.925 9.639 9.391 9.639 C 10.856 9.639 12.045 11.067 12.045 12.829 Z"/>' +
    '<path d="M 19.19 12.886 C 19.19 14.679 18.001 13.881 16.536 13.881 C 15.07 13.881 13.882 14.679 13.882 12.886 C 13.882 11.093 15.07 9.639 16.536 9.639 C 18.001 9.639 19.19 11.093 19.19 12.886 Z"/></svg>';

  var CHECK = '<svg viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M1.5 5.2 4 7.5 8.5 2.5" stroke="#3520FC" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function cardHtml(r) {
    var facts = r.facts.map(function (f) {
      return '<li class="cres__fact"><span class="cres__ic">' + CHECK + '</span><span>' + f + '</span></li>';
    }).join('');
    var tags = r.tags.map(function (t) {
      return '<span class="cres__tag">' + esc(t) + '</span>';
    }).join('');
    var read = r.slug
      ? '<a class="cres__read" href="/' + r.slug + '"><span class="cres__read-mark">' + MARK15 + '</span>Читать кейс</a>'
      : '<span></span>';

    return '<article class="cres">' +
      '<span class="cres__eyebrow">' + esc(r.eyebrow) + '</span>' +
      '<h3 class="cres__title">' + esc(r.title) + '</h3>' +
      '<div class="cres__hero">' +
        '<div class="cres__hero-label">' + esc(r.heroLabel) + '</div>' +
        '<div class="cres__hero-num">' + esc(r.heroNum) + '<span class="u">' + esc(r.heroUnit) + '</span></div>' +
        '<div class="cres__hero-ba"><span>' + esc(r.baWas) + '</span><span class="arw">→</span><b>' + esc(r.baNow) + '</b></div>' +
      '</div>' +
      '<ul class="cres__facts">' + facts + '</ul>' +
      '<div class="cres__foot">' + read + '<div class="cres__tags">' + tags + '</div></div>' +
    '</article>';
  }

  function build() {
    var s = document.createElement('section');
    s.id = 'shw-cases';
    s.innerHTML =
      '<div class="cresults__inner">' +
        '<div class="cresults__head">' +
          '<h2 class="cresults__title">Результаты клиентов Савви</h2>' +
          '<div class="cresults__nav">' +
            '<button type="button" class="cresults__arrow" aria-label="Назад" data-prev disabled>' +
            '<svg viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
            '<button type="button" class="cresults__arrow" aria-label="Вперёд" data-next>' +
            '<svg viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
          '</div>' +
        '</div>' +
        '<div class="cresults__track" data-track>' + RESULTS.map(cardHtml).join('') + '</div>' +
      '</div>';
    return s;
  }

  function wire(s) {
    var track = s.querySelector('[data-track]');
    var nav = s.querySelector('.cresults__nav');
    var prev = s.querySelector('[data-prev]');
    var next = s.querySelector('[data-next]');

    function update() {
      var overflow = track.scrollWidth > track.clientWidth + 4;
      nav.style.display = overflow ? 'flex' : 'none';
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    }
    function step() {
      var c = track.querySelector('.cres');
      return c ? c.offsetWidth + 20 : 360;
    }
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    // scrollBy({behavior:'smooth'}) на странице Тильды не срабатывает (её скрипты
    // перехватывают плавный скролл) — крутим ленту сами.
    var anim = null;
    function glide(delta) {
      var from = track.scrollLeft;
      var max = track.scrollWidth - track.clientWidth;
      var to = Math.max(0, Math.min(max, from + delta));
      if (anim) clearInterval(anim);
      // scroll-snap возвращает ленту к ближайшей точке на каждом кадре и съедает
      // пошаговую анимацию — на время прокрутки снап выключаем.
      track.style.scrollSnapType = 'none';
      // Тик таймером, а не requestAnimationFrame: rAF не идёт, когда страница
      // не считается видимой (панель превью, фоновая вкладка) — лента не двигалась.
      var t0 = Date.now();
      anim = setInterval(function () {
        var p = Math.min(1, (Date.now() - t0) / 380);
        var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // ease-in-out
        track.scrollLeft = from + (to - from) * e;
        if (p >= 1) {
          clearInterval(anim);
          anim = null;
          track.style.scrollSnapType = '';
          update();
        }
      }, 16);
    }
    prev.addEventListener('click', function () { glide(-step()); });
    next.addEventListener('click', function () { glide(step()); });
    update();
    // Первый расчёт попадает на момент, когда CSS ещё не применился (карточки нулевой
    // ширины) — стрелки прятались навсегда. Пересчитываем, когда вёрстка устоится.
    if (window.ResizeObserver) new ResizeObserver(update).observe(track);
    window.addEventListener('load', update);
    [100, 400, 1200].forEach(function (ms) { setTimeout(update, ms); });
  }

  function injectCss() {
    var self = document.currentScript || (function () {
      var n = document.querySelectorAll('script[src*="suvvy-cases.js"]');
      return n[n.length - 1];
    })();
    var href = self ? self.src.replace(/suvvy-cases\.js.*$/, 'suvvy-cases.css') : 'suvvy-cases.css';
    if (document.querySelector('link[href="' + href + '"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    document.head.appendChild(l);
  }
  injectCss();

  // Тильда перерисовывает <body> из files/pageNNNbody.html (fallback-загрузчик) и сносит
  // вставленную секцию — поэтому не выходим после первой удачной вставки, а следим и
  // переставляем блок, пока страница не устоится.
  var tries = 0;
  (function boot() {
    var s = document.getElementById('shw-cases');
    if (!s) {
      var anchor = document.getElementById(AFTER_REC);
      if (anchor) {
        s = build();
        anchor.parentNode.insertBefore(s, anchor.nextSibling);
      }
    }
    // Тильда пересобирает <body> через innerHTML: разметка блока выживает, а слушатели
    // теряются (свойство __shwWired — тоже). Тогда просто перевешиваем обработчики.
    if (s && !s.__shwWired) {
      s.__shwWired = true;
      wire(s);
    }
    if (++tries > 100) return;
    setTimeout(boot, 150);
  })();
})();
