/* Точечные правки низа тильда-главной (решения фаундера, 26.08.2026):
 *
 * 1. Зазор перед баннером «Хотите узнать больше о Савви» (rec839898293):
 *    низ отзыва + верх баннера давали ~197px пустоты — поджимаем блок
 *    отрицательным margin-top на десктопе. Через JS, а не onest.css:
 *    /widget/* без кэша, а /t/css/* закэширован на год и требовал бы ?v=4.
 *    Баннер глубоко под сгибом (~11800px) — сдвиг после загрузки не виден.
 *
 * 2. Юридический блок ООО «САВВИЭЙАЙ» (rec1635107201, T157): виден только
 *    первый абзац, остальное — под кнопкой «Развернуть». Абзацы в разметке
 *    разделены двойным <br>.
 *
 * ⚠️ Разметку фрагментов не трогаем — её перегенерирует build_pages.py.
 */
(function () {
  'use strict';

  var BANNER = 'rec839898293';
  var LEGAL = 'rec1635107201';
  // Отзыв Николая Кудрина: заголовок блока наезжает на карточку цитаты
  // (вёрстка выгрузки). СКРЫТ по решению фаундера 26.08 «пока» — не удалять,
  // вернуть после починки блока.
  var QUOTE_HIDDEN = 'rec853595203';
  var PULL_UP_PX = 130;   // 197px зазора → ~67px
  var MIN_DESKTOP = 960;

  /* 3. Выравнивание секционных заголовков под эталон 38px («Ключевые функции
   * Савви»): «Интеграция с CRM…» была 39px, «Разработка чат-ботов для
   * бизнеса» — 24px (у неё line-height 1.2 и подъём: при 1.55 наезжала бы
   * на цитату в 25px ниже). Только ≥640px — мобильные размеры зеро-блоков
   * не трогаем. «Готовые решения под ваши задачи» (28px) НЕ трогаем:
   * двухколоночный хедер, 38px в две строки давит подзаголовок и колонку.
   */
  function injectHeadingCss() {
    if (document.getElementById('shw-fold-css')) return;
    var s = document.createElement('style');
    s.id = 'shw-fold-css';
    s.textContent =
      // ⚠️ elem-id в выгрузке НЕ уникальны: tn_text_1733849134864 есть и в
      // rec838879993 («Разработка чат-ботов»), и в rec853595203 (отзыв
      // Кудрина) — без якоря на rec правило ломало второй блок.
      '@media (min-width: 640px) {' +
      ' #rec837715983 [field="tn_text_1733753073710"] { font-size: 38px !important; }' +
      ' #rec838879993 [field="tn_text_1733849134864"] { font-size: 38px !important; line-height: 1.2 !important; }' +
      '}' +
      '#' + QUOTE_HIDDEN + ' { display: none !important; }';
    document.head.appendChild(s);
  }
  injectHeadingCss();

  function fixGap() {
    var banner = document.getElementById(BANNER);
    if (!banner) return;
    // Подтяжка компенсировала пустоту ПОД отзывом Кудрина; пока тот скрыт,
    // тянуть не к чему — иначе баннер наедет на блок выше.
    var q = document.getElementById(QUOTE_HIDDEN);
    var quoteVisible = q && q.offsetParent !== null;
    banner.style.marginTop =
      quoteVisible && window.innerWidth >= MIN_DESKTOP ? (-PULL_UP_PX + 'px') : '';
  }

  function foldLegal() {
    var rec = document.getElementById(LEGAL);
    if (!rec || rec.dataset.shwFolded === 'y') return;
    var text = rec.querySelector('.t157__text');
    if (!text) return;
    // Абзацы: двойной (и более) <br> — как в разметке выгрузки.
    var parts = text.innerHTML.split(/(?:\s*<br[^>]*>\s*){2,}/);
    if (parts.length < 2) return;
    rec.dataset.shwFolded = 'y';
    // У рекорда паддинг 75px сверху и снизу; после сворачивания текста нижние
    // 75px + воздух футера давали дыру — поджимаем только низ.
    rec.style.paddingBottom = '20px';

    text.innerHTML =
      parts[0] +
      '<span class="shw-fold__rest" hidden><br><br>' +
        parts.slice(1).join('<br><br>') +
      '</span>';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'shw-fold__toggle';
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = 'Развернуть';
    // Стиль кнопки — сдержанная текстовая ссылка в тонах сайта.
    btn.style.cssText =
      'display:block;margin-top:12px;padding:0;border:0;background:none;' +
      'font:inherit;color:#5E748D;cursor:pointer;text-decoration:underline;' +
      'text-underline-offset:3px;';
    text.appendChild(btn);

    var rest = text.querySelector('.shw-fold__rest');
    btn.addEventListener('click', function () {
      var open = rest.hidden;
      rest.hidden = !open;
      btn.textContent = open ? 'Свернуть' : 'Развернуть';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Тильда пересобирает <body> — следим и применяем заново, пока не устоится.
  var tries = 0;
  (function boot() {
    fixGap();
    foldLegal();
    if (++tries > 100) return;
    setTimeout(boot, 150);
  })();

  window.addEventListener('resize', fixGap, { passive: true });
})();
