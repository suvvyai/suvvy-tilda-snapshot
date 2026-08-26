/* suvvy-cover.js — замена tilda-cover-1.0.min.js (одна страница: /amoconf).
 *
 * Кавер там простейший: t-cover с картинкой (без видео), высота 80vh задана
 * инлайном, параллакс data-content-cover-parallax="fixed", стрелка вниз.
 * Переносим ровно это:
 *  1) полноразмерный фон из data-content-cover-bg на carrier (в разметке
 *     на самом .t-cover лежит только плейсхолдер resize__20x);
 *  2) «fixed»-параллакс даёт CSS (tilda-cover-1.0.min.css: background-attachment
 *     fixed + откаты для мобильных/печати) — JS его не трогает;
 *  3) клик по стрелке — плавный скролл к следующей секции.
 * Видео-каверы, iframe/youtube-фоны и пересчёт высот не переносим — в выгрузке
 * их нет (высоты инлайновые, мобильный vh правит suvvy-core.js).
 */
(function () {
  'use strict';

  function initCover(cover) {
    if (cover.__suvvyCover) return;
    cover.__suvvyCover = true;

    var carrier = cover.querySelector('.t-cover__carrier');
    if (carrier) {
      var bg = carrier.getAttribute('data-content-cover-bg');
      // Только сама картинка. size/position/attachment уже задаёт
      // tilda-cover-1.0.min.css вместе с откатами (max-device-width,
      // max-width:640 → scroll, print) — инлайн-стиль их перебивал и
      // сдвигал фон на 20px против эталона (проверено пиксельным дифом).
      if (bg) carrier.style.backgroundImage = 'url(\'' + bg + '\')';
    }

    // Клик — по внутренней обёртке (38×23), как в оригинале: сам
    // .t-cover__arrow растянут на всю ширину полосы.
    var arrow = cover.querySelector('.t-cover__arrow-wrapper') ||
      cover.querySelector('.t-cover__arrow');
    if (arrow) {
      arrow.style.cursor = 'pointer';
      arrow.addEventListener('click', function () {
        var rec = cover.closest('.r') || cover;
        var top = rec.getBoundingClientRect().bottom + window.pageYOffset;
        // Не t_scrollTo из suvvy-core: он ждёт элемент, а не число.
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    }
  }

  function initCovers() {
    Array.prototype.forEach.call(document.querySelectorAll('.t-cover'), initCover);
  }
  window.t_cover__initCovers = initCovers;

  t_onReady(function () {
    initCovers();
    // Тильда может пересобрать <body> после нашей инициализации — доводим.
    var tries = 0;
    (function boot() {
      initCovers();
      if (++tries > 20) return;
      setTimeout(boot, 300);
    })();
  });
})();
