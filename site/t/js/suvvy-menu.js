/* suvvy-menu.js — наша замена tilda-menusub-1.0 (40,6 КБ) и
 * tilda-submenublocks-1.0 (22,2 КБ) под ФАКТЫ шапки suvvy.ai (notes_menu.md).
 *
 * Что реально есть на сайте из 63 КБ этих файлов:
 *  1) подменю «Интеграторам» в мобильной панели t450 (≤980px): клик-toggle
 *     со стрелкой, одноуровневое — это весь живой кусок tilda-menusub;
 *  2) тултип языка RU/EN (t794) от кнопки «RU» в zero-шапке: hover на десктопе
 *     (закрытие с задержкой 300мс), клик на таче, позиционирование у кнопки,
 *     подсветка активного языка — это весь живой кусок tilda-submenublocks.
 * Мега-меню «Интеграторам» на десктопе — сторонний NLM068 (T131), не тройка.
 *
 * Публичные имена сохранены — их зовут инлайны страниц и поблочный JS
 * (t450 → t_menusub_init; t794_init → t_submenublocks__*).
 * CSS остаётся тильдовский (t-menusub__menu_show / t794__tooltip-menu_show).
 *
 * Не эмулируется (мертво на сайте, проверено): многоуровневость, fullscreen-
 * подменю, клонирование блоков, scroll-spy, фиксация шапки — см. notes_menu.md.
 */
(function () {
  'use strict';

  /* ---------- подсветка активного пункта (RU/EN и ссылки подменю) ---------- */
  function normalize(p) {
    if (!p) return p;
    if (p[0] === '/' && p.length > 1) p = p.slice(1);
    if (p[p.length - 1] === '/' && p.length > 1) p = p.slice(0, -1);
    return p === '' ? '/' : p;
  }
  window.t_submenublocks__highlightActiveLinks = function (selector) {
    var href = window.location.href;
    var hash = window.location.hash;
    var path = normalize(window.location.pathname);
    Array.prototype.forEach.call(document.querySelectorAll(selector), function (a) {
      var u = a.getAttribute('href');
      if (!u) return;
      var n = normalize(u);
      if (u === href || u === hash || n === path) a.classList.add('t-active');
    });
  };

  /* ---------- тултип t794 (RU/EN) ---------- */
  function tooltipPlace(hook, submenu, indent) {
    // Абсолютные координаты страницы: тултип позиционируется от кнопки-хука.
    submenu.style.display = 'block';
    var w = submenu.offsetWidth;
    var r = hook.getBoundingClientRect();
    var center = r.left + window.pageXOffset + r.width / 2;
    var left = center - w / 2;
    var max = window.innerWidth - w - 10;
    if (left < 10) left = 10;
    if (left > max) left = max;
    submenu.style.left = Math.round(left) + 'px';
    submenu.style.right = 'auto';
    // Как оригинал: заданный data-tooltip-margin + постоянные 10px.
    submenu.style.top = Math.round(r.bottom + window.pageYOffset + (parseInt(indent, 10) || 0) + 10) + 'px';
  }

  function tooltipShow(hook, submenu, indent, prefix) {
    tooltipPlace(hook, submenu, indent);
    submenu.classList.add(prefix.slice(1) + '__tooltip-menu_show');
    if (hook) hook.classList.add(prefix.slice(1) + '__tm-link_active');
    submenu.__hook = hook;
  }

  window.t_submenublocks__hideSubmenu = function (submenu, prefix) {
    submenu.classList.remove(prefix.slice(1) + '__tooltip-menu_show');
    var hook = submenu.__hook;
    if (hook) hook.classList.remove(prefix.slice(1) + '__tm-link_active');
    setTimeout(function () {
      if (!submenu.classList.contains(prefix.slice(1) + '__tooltip-menu_show')) {
        submenu.style.display = '';
      }
    }, 200);
  };

  window.t_submenublocks__addEventsDesktop = function (submenu, hooksAndSubmenu, indent, prefix) {
    var hooks = hooksAndSubmenu.filter(function (x) { return x !== submenu; });
    var closeTimer;
    var scheduleHide = function () {
      closeTimer = setTimeout(function () {
        t_submenublocks__hideSubmenu(submenu, prefix);
      }, 300);
    };
    submenu.addEventListener('mouseenter', function () {
      if (closeTimer) clearTimeout(closeTimer);
    });
    submenu.addEventListener('mouseleave', scheduleHide);
    hooks.forEach(function (hook) {
      hook.addEventListener('mouseenter', function () {
        if (closeTimer) clearTimeout(closeTimer);
        if (!submenu.classList.contains(prefix.slice(1) + '__tooltip-menu_show')) {
          tooltipShow(hook, submenu, indent, prefix);
        }
      });
      hook.addEventListener('mouseleave', scheduleHide);
    });
  };

  window.t_submenublocks__addEventsMobile = function (submenu, hookLinks, indent, prefix) {
    hookLinks.forEach(function (hook) {
      hook.addEventListener('click', function (e) {
        e.preventDefault();
        if (submenu.classList.contains(prefix.slice(1) + '__tooltip-menu_show')) {
          t_submenublocks__hideSubmenu(submenu, prefix);
        } else {
          tooltipShow(hook, submenu, indent, prefix);
        }
      });
    });
    document.addEventListener('click', function (e) {
      if (!e.isTrusted) return;
      if (e.target.closest(prefix + '__tooltip-menu, ' + prefix + '__tm-link')) return;
      if (submenu.classList.contains(prefix.slice(1) + '__tooltip-menu_show')) {
        t_submenublocks__hideSubmenu(submenu, prefix);
      }
    });
    window.addEventListener('orientationchange', function () {
      setTimeout(function () { t_submenublocks__hideSubmenu(submenu, prefix); }, 600);
    });
  };

  /* ---------- подменю t-menusub в мобильной панели t450 ---------- */
  function accordionShow(hook, menu) {
    // Как оригинал в мобильной панели: меню встаёт сразу после ссылки-хука,
    // раскрывается по высоте; CSS-класс _show даёт opacity.
    hook.insertAdjacentElement('afterend', menu);
    menu.style.position = 'static';
    menu.style.opacity = '1';
    menu.style.display = 'block';
    menu.style.overflow = 'hidden';
    var h = menu.scrollHeight;
    menu.style.height = '0px';
    menu.style.transition = 'height 250ms ease';
    requestAnimationFrame(function () { menu.style.height = h + 'px'; });
    setTimeout(function () {
      menu.style.height = '';
      menu.style.overflow = '';
      menu.style.transition = '';
    }, 280);
    menu.classList.add('t-menusub__menu_show');
    hook.setAttribute('aria-expanded', 'true');
  }

  function accordionHide(menu) {
    var hook = menu.previousElementSibling;
    menu.style.overflow = 'hidden';
    menu.style.transition = 'height 250ms ease';
    menu.style.height = menu.scrollHeight + 'px';
    requestAnimationFrame(function () { menu.style.height = '0px'; });
    setTimeout(function () {
      menu.classList.remove('t-menusub__menu_show');
      menu.style.display = '';
      menu.style.height = '';
      menu.style.overflow = '';
      menu.style.transition = '';
      menu.style.position = '';
      menu.style.opacity = '';
    }, 260);
    if (hook && hook.classList && hook.classList.contains('t-menusub__target-link')) {
      hook.setAttribute('aria-expanded', 'false');
    }
  }

  function closeAllAccordions(except) {
    Array.prototype.forEach.call(
      document.querySelectorAll('.t-menusub__menu.t-menusub__menu_show'),
      function (m) { if (m !== except) accordionHide(m); }
    );
  }

  window.t_menusub_init = function (recid) {
    var rec = document.getElementById('rec' + recid);
    if (!rec) return;
    rec.setAttribute('data-multilevel-menu', 'n'); // многоуровневых на сайте нет
    Array.prototype.forEach.call(rec.querySelectorAll('.t-menusub'), function (sub) {
      var hookName = sub.getAttribute('data-submenu-hook');
      if (!hookName) return;
      var menu = sub.querySelector('.t-menusub__menu');
      if (!menu) return;
      var hooks = document.querySelectorAll(
        'a[data-menu-submenu-hook="' + hookName + '"], a[href="' + hookName + '"]');
      Array.prototype.forEach.call(hooks, function (hook) {
        hook.classList.add('t-menusub__target-link');
        // Стрелка у пункта с подменю (CSS тильдовский .t-menusub__arrow).
        if (sub.getAttribute('data-add-submenu-arrow') && !hook.querySelector('.t-menusub__arrow')) {
          var arrow = document.createElement('div');
          arrow.classList.add('t-menusub__arrow');
          hook.appendChild(arrow);
        }
        hook.addEventListener('click', function (e) {
          var href = hook.getAttribute('href');
          if (href && href !== '' && href !== '#') return; // обычная ссылка
          e.preventDefault();
          if (menu.classList.contains('t-menusub__menu_show')) accordionHide(menu);
          else {
            closeAllAccordions(menu);
            accordionShow(hook, menu);
          }
        });
      });
      // Подсветка активного пункта подменю по текущему адресу.
      t_submenublocks__highlightActiveLinks(
        '.t-menusub[data-submenu-hook="' + hookName + '"] a.t-menusub__link-item');
    });
    // Клик мимо панели закрывает открытые подменю.
    document.addEventListener('click', function (e) {
      if (!e.isTrusted) return;
      if (e.target.closest('.t-menusub, .t-menusub__target-link')) return;
      closeAllAccordions(null);
    });
  };
})();
