/* suvvy-popup.js — наша замена tilda-popup-1.0.min.js (3,4 КБ) по notes_forms.md §2.1, §6.
 *
 * Оригинал — набор хелперов вокруг попапов: доступность триггера, «статичный»
 * контейнер на низком окне, показ с анимацией, ловушка фокуса и возврат фокуса
 * на кнопку-триггер. Своих обработчиков открытия/закрытия у него нет: попапы
 * открывают и закрывают сами блоки (t331_/t390_/t702_ в suvvy-blocks.js),
 * они же вешают Esc, клик по оверлею и шлют popupShowed/popupHidden на body
 * (их слушает компенсатор ширины скроллбара в suvvy-core.js). Поэтому здесь
 * ни событий, ни блокировки скролла — иначе получилась бы двойная работа.
 *
 * Зависимости: только t_onFuncLoad из suvvy-core.js (как в оригинале).
 * jQuery не нужен — его в файле не было и раньше.
 *
 * Портированы 1:1 шесть функций, которые реально зовёт поблочный JS
 * (suvvy-blocks.js и tilda-blocks-page*.min.js — вызовы на строках 226–245,
 * 313, 332, 712–731, 753, 784, 862–880, 930, 978, 1026):
 *   t_popup__addAttributesForAccessibility, t_popup__resizePopup,
 *   t_popup__addClassOnTriggerButton, t_popup__showPopup,
 *   t_popup__trapFocus, t_popup__addFocusOnTriggerButton.
 *
 * НЕ перенесено:
 *  1) t_popup__closePopup — мёртв (notes_forms.md §2.1, §6.5): ни один блок его
 *     не зовёт, у T331/T390/T702 свои t*_closePopup со своей же отправкой
 *     popupHidden; порт дал бы второй, конфликтующий путь закрытия.
 *  2) Полифилы Element.prototype.matches / closest из хвоста оригинала —
 *     нужны были ради IE11, который сайт не поддерживает; остальные наши
 *     замены (suvvy-menu.js, suvvy-blocks.js, suvvy-zero.js) зовут closest()
 *     напрямую и полифилов не ставят.
 */
(function () {
  'use strict';

  /* ---------- ловушка фокуса внутри открытого попапа ---------- */
  /* 1:1 с оригиналом, включая то, что слушатель вешается на document и не
   * снимается: попап за жизнь страницы открывается редко, а условие
   * body.t-body_popupshowed глушит лишние срабатывания. Тот же компромисс
   * оставлен и в suvvy-zoom.js. */
  window.t_popup__trapFocus = function (popup) {
    var focusable = popup.querySelectorAll(
      'a, button, input:not([type="hidden"]):not(.js-form-spec-comments), select, textarea, embed, video, iframe, [tabindex="0"]'
    );
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    document.addEventListener('keydown', function (e) {
      if (!document.body.classList.contains('t-body_popupshowed')) return;
      var isTab = e.key === 'Tab' || e.keyCode === 9;
      if (!isTab) return;
      // Shift+Tab с самого попапа — уводим на последний элемент.
      if (e.shiftKey && document.activeElement.classList.contains('t-popup_show')) last.focus();
      if (e.key === 'Tab' && !e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
      if (e.key === 'Tab' && e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    });
  };

  /* ---------- ссылка-хук #popup:… становится кнопкой для скринридера ---------- */
  window.t_popup__addAttributesForAccessibility = function (hook) {
    var links = document.querySelectorAll('a[href="' + hook + '"]');
    Array.prototype.forEach.call(links, function (a) {
      if (!a) return;
      a.setAttribute('role', 'button');
      a.setAttribute('aria-haspopup', 'dialog');
    });
  };

  /* ---------- контент выше окна → контейнер перестаёт центрироваться ---------- */
  /* Запас снизу зависит от типа блока: 120px по умолчанию, 30 у 364/365,
   * 0 у 868/331/358/1013/746 и у 1093 (в т. ч. когда он лежит внутри 121). */
  window.t_popup__resizePopup = function (recId) {
    var rec = document.getElementById('rec' + recId);
    if (!rec) return;
    var container = rec.querySelector('.t-popup__container');
    if (!container) return;
    var cs = getComputedStyle(container, null);
    var padTop = parseInt(cs.paddingTop, 10) || 0;
    var padBottom = parseInt(cs.paddingBottom, 10) || 0;
    var height = container.clientHeight - (padTop + padBottom);
    var reserve = 120;
    var type = rec.getAttribute('data-parenttplid') || rec.getAttribute('data-record-type');
    var is1093 = type === '1093' || (type === '121' && rec.querySelector('.t1093'));
    if (type === '364' || type === '365') reserve = 30;
    if (type === '868' || type === '331' || type === '358' || type === '1013' || type === '746' || is1093) reserve = 0;
    if (height > window.innerHeight - reserve) {
      container.classList.add('t-popup__container-static');
    } else {
      container.classList.remove('t-popup__container-static');
    }
  };

  /* ---------- показ попапа ---------- */
  /* display:block сразу, а класс .t-popup_show — через 50мс, чтобы браузер
   * успел применить начальное состояние и CSS-переход отработал. */
  window.t_popup__showPopup = function (popup) {
    if (popup) popup.style.display = 'block';
    setTimeout(function () {
      popup.focus();
      var container = popup ? popup.querySelector('.t-popup__container') : null;
      if (container) container.classList.add('t-popup__container-animated');
      if (popup) popup.classList.add('t-popup_show');
      t_onFuncLoad('t_popup__trapFocus', function () {
        t_popup__trapFocus(popup);
      });
    }, 50);
  };

  /* ---------- Enter по триггеру помечает кнопку, чтобы вернуть на неё фокус ---------- */
  window.t_popup__addClassOnTriggerButton = function (root, hook) {
    var marked = document.querySelectorAll('.t-popup__triggered-btn');
    Array.prototype.forEach.call(marked, function (el) {
      el.classList.remove('t-popup__triggered-btn');
    });
    root.addEventListener('keydown', function (e) {
      if (e.keyCode !== 13) return;
      var target = e.target;
      var trigger = !!target.closest('a[href="' + hook + '"]') && target;
      if (!trigger) return;
      // На таче фокус-рамка не нужна: попап открывается пальцем, не Enter'ом.
      if (!window.isMobile) trigger.classList.add('t-popup__triggered-btn');
    });
  };

  /* ---------- после закрытия попапа фокус возвращается на триггер ---------- */
  window.t_popup__addFocusOnTriggerButton = function () {
    var trigger = document.querySelector('.t-popup__triggered-btn');
    if (!trigger || trigger.classList.contains('t724__opener')) return;
    trigger.focus();
    trigger.classList.remove('t-popup__triggered-btn');
  };
})();
