/* «Результаты клиентов Савви» — блок №3 на тильда-главной (после героя с тремя буллитами).
 * Формат карточки v2 (макет cases/case-card-template-v2.html, ТЗ cases/ТЗ_карточка_кейса_v2.md):
 * живой человек → цитата → что сделали → до/после Савви текстом → деньги с расчётом.
 *
 * Правила: у каждой карточки свой тип результата (иначе все читаются как одна история);
 * цифра не стоит без сравнения; ссылок на полные кейсы нет — страниц кейсов не будет.
 *
 * Подключение: <script src=".../suvvy-cases.js" defer></script>, CSS подтягивается рядом.
 */
(function () {
  'use strict';

  var AFTER_REC = 'rec841335670'; // зеро-блок героя (в нём же три буллита) — вставляем сразу после

  var RESULTS = [
    {
      logo: '/assets/cases/trust-taxi.jpg',
      logoFit: 'cover',
      logoBg: '#0B0B0B',
      company: 'Trust Taxi',
      niche: 'Аренда авто с выкупом · Москва · парк 140+ авто',
      headline: 'Заявок стало <em>в 6 раз больше</em> — а продавцов на одного меньше',
      person: 'Илья Иванов',
      role: 'собственник',
      quote: 'Агент Савви <em>работает как пулемёт</em> — обрабатывает все обращения и ведёт людей на встречу, снимая рутину с менеджеров.',
      quoteBy: 'Илья Иванов, собственник Trust Taxi',
      did: 'Агент ведёт переписку с водителями, квалифицирует и записывает на встречу в офисе, сделку заводит в Битрикс24. Сложное — на менеджера. <b>Собственник настроил агента сам, без интегратора.</b>',
      was: [
        ['~300 обращений в месяц', 'Больше отдел физически не тянул: потолок менеджера — 10–15 диалогов в день'],
        ['2 менеджера по 70 000 ₽', 'Рост упирался не в спрос, а в людей: чтобы расти, надо было нанимать'],
        ['Продажников в нише не найти', 'Найм в таксопарки долгий и дорогой — масштабирование зависело от кадров']
      ],
      now: [
        ['~1 650 обращений в месяц', 'В 6 раз больше, чем было — тот же отдел, никого не нанимали'],
        ['Один менеджер вместо двух', 'Второго высвободили: входящую рутину забрал агент'],
        ['Конверсия та же — 40%', 'Из обращения в запись на визит, плановый показатель клиента; качество сделок не просело']
      ],
      moneyCap: 'Осталось в бизнесе вместо зарплат',
      moneyNum: '≈ 3 500 000', moneyUnit: ' ₽ / год',
      moneyText: 'Под новый объём заявок пришлось бы нанять ещё <b>5–6 сотрудников</b>. Вместо этого остался <b>один менеджер с зарплатой 70 000 ₽</b>.',
      tags: ['Битрикс24', 'Avito']
    },
    {
      logo: '/assets/cases/defure.svg',
      logoFit: 'contain',
      logoBg: '#fff',
      company: 'Defure Furniture',
      niche: 'Мебель под заказ · ОАЭ, Дубай',
      headline: 'Агент отвечает по заявкам <em>за 15 секунд вместо 2 часов</em>',
      person: 'Имя Фамилия',
      role: 'руководитель отдела продаж',
      quote: 'Мы держали человека только на то, чтобы он первым отвечал в переписке. Теперь <em>отвечает агент, и клиент не уходит к тому, кто ответил раньше нас</em>.',
      quoteBy: 'Черновик цитаты — подтвердить у клиента',
      did: 'Агент отвечает первым в Instagram*, уточняет запрос по мебели и передаёт заявку в Битрикс24. Сложные вопросы по цене — на менеджера.',
      was: [
        ['Ответ до 2 часов', 'Клиент писал и ждал — часть уходила к тем, кто ответил быстрее'],
        ['135 000 ₽ в месяц', 'Отдельный сотрудник (5 000 AED) сидел только на первых ответах'],
        ['Вечер и выходные — тишина', 'По базе Савви так приходит 53,8% всех обращений']
      ],
      now: [
        ['15 секунд, круглосуточно', 'Ответ приходит, пока клиент ещё выбирает'],
        ['10 000 ₽ в месяц', 'Столько стоит агент — сотрудника первой линии в штате больше нет'],
        ['Ночных потерь нет', 'Ночь, выходные и праздники закрывает агент']
      ],
      moneyCap: 'Осталось в бизнесе вместо зарплат',
      moneyNum: '1 500 000', moneyUnit: ' ₽ / год',
      moneyText: 'Первая линия стоила <b>135 000 ₽ в месяц</b>, агент — <b>10 000 ₽</b>. Разница <b>125 000 ₽ каждый месяц</b>, при этом отвечают быстрее.',
      tags: ['Битрикс24', 'Instagram*']
    }
  ];

  var NOTE = '*Instagram принадлежит компании Meta, признанной экстремистской и запрещённой на территории Российской Федерации.';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function items(list) {
    return list.map(function (i) {
      return '<div class="cres__li"><b>' + esc(i[0]) + '</b>' + esc(i[1]) + '</div>';
    }).join('');
  }

  function cardHtml(r) {
    var tags = r.tags.map(function (t) {
      return '<span class="cres__tag">' + esc(t) + '</span>';
    }).join('');
    var logoStyle = 'background:' + r.logoBg + (r.logoFit === 'contain' ? ';padding:11px' : '');

    return '<article class="cres">' +
      '<div class="cres__hero">' +
        '<div class="cres__logo" style="' + logoStyle + '">' +
          '<img src="' + r.logo + '" alt="' + esc(r.company) + '" loading="lazy" style="object-fit:' + r.logoFit + '">' +
        '</div>' +
        '<div class="cres__hero-txt">' +
          '<div class="cres__niche">' + esc(r.niche) + '</div>' +
          '<h3 class="cres__headline">' + r.headline + '</h3>' +
          '<div class="cres__person"><b>' + esc(r.person) + '</b><i>·</i>' + esc(r.role) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="cres__quote"><span class="cres__quote-mark">“</span>' +
        '<div><p class="cres__quote-t">' + r.quote + '</p>' +
        '<div class="cres__quote-by">' + esc(r.quoteBy) + '</div></div>' +
      '</div>' +
      '<div class="cres__did"><span class="cres__did-cap">Что сделали</span>' +
        '<span class="cres__did-t">' + r.did + '</span></div>' +
      '<div class="cres__ba">' +
        '<div class="cres__col cres__col--was"><div class="cres__cap">До Савви</div>' + items(r.was) + '</div>' +
        '<div class="cres__col cres__col--now"><div class="cres__cap">После Савви</div>' + items(r.now) + '</div>' +
      '</div>' +
      '<div class="cres__money">' +
        '<div class="cres__money-cap">' + esc(r.moneyCap) + '</div>' +
        '<div class="cres__money-num">' + esc(r.moneyNum) + '<span class="u">' + esc(r.moneyUnit) + '</span></div>' +
        '<p class="cres__money-t">' + r.moneyText + '</p>' +
      '</div>' +
      '<div class="cres__foot"><div class="cres__tags">' + tags + '</div></div>' +
    '</article>';
  }

  function build() {
    var s = document.createElement('section');
    s.id = 'shw-cases';
    s.innerHTML =
      '<div class="cresults__inner">' +
        '<h2 class="cresults__title">Результаты клиентов Савви</h2>' +
        '<div class="cresults__grid">' + RESULTS.map(cardHtml).join('') + '</div>' +
        '<p class="cresults__note">' + esc(NOTE) + '</p>' +
      '</div>';
    return s;
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
    if (!document.getElementById('shw-cases')) {
      var anchor = document.getElementById(AFTER_REC);
      if (anchor) anchor.parentNode.insertBefore(build(), anchor.nextSibling);
    }
    if (++tries > 100) return;
    setTimeout(boot, 150);
  })();
})();
