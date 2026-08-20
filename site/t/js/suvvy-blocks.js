/* ============================================================================
 * suvvy-blocks.js — единая замена 64 поблочных tilda-blocks-pageNNN.min.js
 * (шаг D чистки кода Тильды).
 *
 * Порт 1:1, НЕ редизайн. Источники:
 *   - tilda-blocks-page59660037.min.js (главная, 7 блоков: t654, t390, t450,
 *     t794, t331, t702, t270);
 *   - tilda-blocks-page118070116.min.js (t1211).
 * Проверено (2026-08-20): наборы функций/стейтментов всех 64 файлов целиком
 * покрываются этими двумя (кроме t945 — живёт только в нероутнутом
 * page139266396, НЕ переносим; и 6 заглушек window.nojscode).
 *
 * Преамбула оригинала (isMobile/isiOS/isSafari/t_throttle) НЕ скопирована —
 * эти глобалы уже даёт suvvy-core.js (window.isMobile, window.isiOSVersion,
 * window.t_throttle с той же семантикой).
 *
 * Это «библиотека функций»: сама ничего не инициализирует. Вызовы приходят
 * из инлайн-скриптов блоков (src/tilda/<slug>/recNNN.html) через
 * t_onFuncLoad('t794_init', ...) и т.п. — поэтому ВСЕ публичные имена
 * сохранены дословно. Лишние функции на странице безвредны: инлайн зовёт
 * только то, что есть в разметке.
 *
 * Внешние зависимости (остаются в других файлах Тильды/заменах):
 *   t_onFuncLoad, t_triggerEvent, t_loadJsFile, t_loadCSSFile,
 *   t_lazyload_update — suvvy-core.js;
 *   t_popup__* — tilda-popup;
 *   t_submenublocks__* — tilda-submenublocks;
 *   t_forms__*, t_form__conditionals_* — tilda-forms (только на страницах
 *   с формами);
 *   t_video_lazyload__* — только для t331 (видео-попап).
 * ==========================================================================*/

/* ============================================================================
 * t654 — фиксированная панель/плашка (вверху или внизу экрана).
 * Умеет: «не показывать N дней» через localStorage, появление по скроллу
 * (data-appearoffset), смена фона/тени после скролла, плавный въезд.
 * Инлайн зовёт: t654_showPanel, t654_setBg (+ t654_appearMenu и
 * t654_changebgopacitymenu вешаются на scroll в оригинальной разметке).
 * ==========================================================================*/

function t654_showPanel(recId) {
  var rec = document.getElementById('rec' + recId);
  if (!rec) return;
  var container = rec.querySelector('.t654');
  if (!container) return;
  var buttonClose = rec.querySelector('.t654__icon-close');
  var storageItem = container.getAttribute('data-storage-item');
  var delta = container.getAttribute('data-storage-delta') * 86400;
  var today = Math.floor(Date.now() / 1000);
  var lastOpen = null;
  var currentDelta;
  try {
    lastOpen = localStorage.getItem(storageItem);
    currentDelta = today - lastOpen;
  } catch (e) {
    console.log('Your web browser does not support localStorage.');
  }
  // Показать плашку, если её ещё не закрывали или срок «не показывать» вышел.
  if (lastOpen === null || currentDelta >= delta) {
    container.classList.remove('t654_closed');
  }
  buttonClose.addEventListener('click', function (event) {
    container.classList.add('t654_closed');
    if (delta) {
      try {
        localStorage.setItem(storageItem, Math.floor(Date.now() / 1000));
      } catch (e) {
        console.log('Your web browser does not support localStorage.');
      }
    }
    event.preventDefault();
  });
  // На десктопе: прятать нижнюю плашку у самого подвала (чтобы не легла на копирайт).
  if (window.innerWidth > 980) {
    window.addEventListener('scroll', t_throttle(function () {
      if (container.classList.contains('t654_bottom') &&
          document.getElementById('tildacopy') &&
          window.innerHeight + window.scrollY >= document.body.offsetHeight - 70) {
        container.style.visibility = 'hidden';
      } else {
        var appearOffset = container.getAttribute('data-appearoffset');
        if (!appearOffset) {
          container.style.visibility = 'visible';
        }
      }
    }));
  }
}

function t654_setBg(recId) {
  var rec = document.getElementById('rec' + recId);
  if (!rec) return;
  var container = rec.querySelector('.t654');
  if (!container) return;
  if (window.innerWidth > 980) {
    if (container.getAttribute('data-bgcolor-setbyscript') === 'yes') {
      container.style.backgroundColor = container.getAttribute('data-bgcolor-rgba');
    }
  } else {
    container.style.backgroundColor = container.getAttribute('data-bgcolor-hex');
    container.setAttribute('data-bgcolor-setbyscript', 'yes');
  }
}

function t654_appearMenu(recId) {
  var rec = document.getElementById('rec' + recId);
  if (!rec) return;
  var container = rec.querySelector('.t654');
  if (!container) return;
  if (window.innerWidth > 980) {
    var appearOffset = container.getAttribute('data-appearoffset');
    if (appearOffset) {
      if (appearOffset.indexOf('vh') > -1) {
        appearOffset = Math.floor(window.innerHeight * (parseInt(appearOffset) / 100));
      }
      appearOffset = parseInt(appearOffset, 10);
      if (window.pageYOffset >= appearOffset) {
        if (getComputedStyle(container, null).visibility === 'hidden') {
          if (container.classList.contains('t654_top')) {
            container.style.top = '-50px';
            container.style.visibility = 'visible';
            t654__fadeIn(container);
            t654__animate(container, 'top');
          } else {
            container.style.bottom = '-50px';
            container.style.visibility = 'visible';
            t654__fadeIn(container);
            t654__animate(container, 'bottom');
          }
        }
      } else {
        container.style.visibility = 'hidden';
      }
    }
  }
}

function t654_changebgopacitymenu(recId) {
  var rec = document.getElementById('rec' + recId);
  if (!rec) return;
  var container = rec.querySelector('.t654');
  if (!container) return;
  if (window.innerWidth > 980) {
    var bgColor = container.getAttribute('data-bgcolor-rgba');
    var bgColorAfterScroll = container.getAttribute('data-bgcolor-rgba-afterscroll');
    var bgOpacity = container.getAttribute('data-bgopacity');
    var bgOpacityTwo = container.getAttribute('data-bgopacity-two');
    var menuShadowOpacity = parseInt(container.getAttribute('data-menushadow'), 10) || 0;
    menuShadowOpacity /= 100;
    var menuShadowCSS = container.getAttribute('data-menushadow-css');
    container.style.backgroundColor = window.pageYOffset > 20 ? bgColorAfterScroll : bgColor;
    if ((window.pageYOffset > 20 && bgOpacityTwo === '0') ||
        (window.pageYOffset <= 20 && (bgOpacity === '0.0' || bgOpacity === '0')) ||
        (!menuShadowOpacity && !menuShadowCSS)) {
      container.style.boxShadow = 'none';
    } else if (menuShadowCSS) {
      container.style.boxShadow = menuShadowCSS;
    } else if (menuShadowOpacity) {
      container.style.boxShadow = '0px 1px 3px rgba(0,0,0,' + menuShadowOpacity + ')';
    }
  }
}

function t654__fadeIn(el) {
  if (el.style.display === 'block') return;
  var opacity = 0;
  el.style.opacity = opacity;
  el.style.display = 'block';
  var timer = setInterval(function () {
    el.style.opacity = opacity;
    opacity += 0.1;
    if (opacity >= 1.0) {
      clearInterval(timer);
      el.style.display = '';
    }
  }, 20);
}

function t654__animate(element, animate) {
  var duration = 200;
  var start = parseInt(getComputedStyle(element, null)[animate]);
  var change = 0 - start;
  var currentTime = 0;
  var increment = 16;
  function t654__easeInOutCubic(currentTime, start, change) {
    if ((currentTime /= duration / 2) < 1) {
      return (change / 2) * currentTime * currentTime * currentTime + start;
    } else {
      return (change / 2) * ((currentTime -= 2) * currentTime * currentTime + 2) + start;
    }
  }
  function t654__animateScroll() {
    currentTime += increment;
    element.style[animate] = t654__easeInOutCubic(currentTime, start, change) + 'px';
    if (currentTime < duration) {
      setTimeout(t654__animateScroll, increment);
    } else {
      element.style[animate] = '0px';
    }
  }
  t654__animateScroll();
}

/* ============================================================================
 * t390 — попап, открываемый по ссылке (#popup:имя).
 * Умеет: показ/закрытие (крестик, клик по оверлею, ESC), lazyLoad картинок
 * внутри, ограничение по ширине экрана (data-screen-min/max), событие
 * в статистику, костыль для Android-якорей.
 * Инлайн зовёт: t390_initPopup.
 * ==========================================================================*/

function t390_initPopup(recId) {
  var rec = document.getElementById('rec' + recId);
  if (!rec) return;
  var container = rec.querySelector('.t390');
  if (!container) return;
  rec.setAttribute('data-animationappear', 'off');
  rec.style.opacity = 1;
  var popup = rec.querySelector('.t-popup');
  var popupTooltipHook = popup.getAttribute('data-tooltip-hook');
  var analitics = popup.getAttribute('data-track-popup');
  var popupCloseBtn = popup.querySelector('.t-popup__close');
  var hrefs = rec.querySelectorAll('a[href*="#"]');
  var escapeEvent = t390_escClosePopup.bind(this, recId);
  if (popupTooltipHook) {
    t_onFuncLoad('t_popup__addAttributesForAccessibility', function () {
      t_popup__addAttributesForAccessibility(popupTooltipHook);
    });
    // Открытие по клику на любую ссылку с этим хуком.
    document.addEventListener('click', function (event) {
      var target = event.target;
      var href = target.closest('a[href="' + popupTooltipHook + '"]') ? target : false;
      if (!href) return;
      event.preventDefault();
      t390_showPopup(recId, escapeEvent);
      t_onFuncLoad('t_popup__resizePopup', function () {
        t_popup__resizePopup(recId);
      });
      t390__lazyLoad();
      if (analitics && window.Tilda) {
        Tilda.sendEventToStatistics(analitics, popupTooltipHook);
      }
    });
    t_onFuncLoad('t_popup__addClassOnTriggerButton', function () {
      t_popup__addClassOnTriggerButton(document, popupTooltipHook);
    });
  }
  popup.addEventListener('scroll', t_throttle(function () {
    t390__lazyLoad();
  }));
  // Клик по подложке (самому .t-popup) закрывает попап.
  popup.addEventListener('click', function (event) {
    if (event.target === this) t390_closePopup(recId, escapeEvent);
  });
  popupCloseBtn.addEventListener('click', function () {
    t390_closePopup(recId, escapeEvent);
  });
  // Клик по любой якорной ссылке внутри попапа закрывает его
  // (кроме #price:); переход в другой попап — с задержкой на анимацию.
  for (var i = 0; i < hrefs.length; i++) {
    hrefs[i].addEventListener('click', function () {
      var url = this.getAttribute('href');
      if (!url || url.substring(0, 7) != '#price:') {
        t390_closePopup(recId, escapeEvent);
        if (!url || url.substring(0, 7) == '#popup:') {
          setTimeout(function () {
            if (typeof t_triggerEvent === 'function') t_triggerEvent(document.body, 'popupShowed');
            document.body.classList.add('t-body_popupshowed');
          }, 300);
        }
      }
    });
  }
  // Костыль для Android: якорные переходы при уже открытом hash.
  var curPath = window.location.pathname;
  var curFullPath = window.location.origin + curPath;
  var isAndroid = /(android)/i.test(navigator.userAgent);
  if (isAndroid) {
    var selects =
      'a[href^="#"]:not([href="#"]):not([href^="#price"]):not([href^="#popup"]):not([href^="#prodpopup"]):not([href^="#order"]):not([href^="#!"]),' +
      'a[href^="' + curPath + '#"]:not([href*="#!/tproduct/"]):not([href*="#!/tab/"]):not([href*="#popup"]),' +
      'a[href^="' + curFullPath + '#"]:not([href*="#!/tproduct/"]):not([href*="#!/tab/"]):not([href*="#popup"])';
    var selectors = rec.querySelectorAll(selects);
    for (var i = 0; i < selectors.length; i++) {
      selectors[i].addEventListener('click', function (event) {
        var hash = this.hash.trim();
        if (window.location.hash) {
          setTimeout(function () {
            window.location.href = hash;
          }, 50);
        }
      });
    }
  }
  // Вложенная: закрытие по ESC (биндится выше через .bind(this, recId)).
  function t390_escClosePopup(recId) {
    if (arguments[1].key === 'Escape') t390_closePopup(recId, escapeEvent);
  }
}

function t390_showPopup(recId, escapeEvent) {
  var rec = document.getElementById('rec' + recId);
  if (!rec) return;
  var container = rec.querySelector('.t390');
  if (!container) return;
  var windowWidth = window.innerWidth;
  var screenMin = rec.getAttribute('data-screen-min');
  var screenMax = rec.getAttribute('data-screen-max');
  if (screenMin && windowWidth < parseInt(screenMin, 10)) return;
  if (screenMax && windowWidth > parseInt(screenMax, 10)) return;
  var popup = rec.querySelector('.t-popup');
  var documentBody = document.body;
  t_onFuncLoad('t_popup__showPopup', function () {
    t_popup__showPopup(popup);
  });
  if (typeof t_triggerEvent === 'function') t_triggerEvent(document.body, 'popupShowed');
  documentBody.classList.add('t-body_popupshowed');
  documentBody.classList.add('t390__body_popupshowed');
  document.addEventListener('keydown', escapeEvent);
}

function t390_closePopup(recId, escapeEvent) {
  var rec = document.getElementById('rec' + recId);
  var popup = rec.querySelector('.t-popup');
  var popupActive = document.querySelector('.t-popup.t-popup_show');
  if (popup === popupActive) {
    if (typeof t_triggerEvent === 'function') t_triggerEvent(document.body, 'popupHidden');
    document.body.classList.remove('t-body_popupshowed');
    document.body.classList.remove('t390__body_popupshowed');
  }
  popup.classList.remove('t-popup_show');
  t_onFuncLoad('t_popup__addFocusOnTriggerButton', function () {
    t_popup__addFocusOnTriggerButton();
  });
  setTimeout(function () {
    var popupHide = document.querySelectorAll('.t-popup:not(.t-popup_show)');
    for (var i = 0; i < popupHide.length; i++) {
      popupHide[i].style.display = 'none';
    }
  }, 300);
  document.removeEventListener('keydown', escapeEvent);
}

function t390_sendPopupEventToStatistics(popupName) {
  var virtPage = '/tilda/popup/';
  var virtTitle = 'Popup: ';
  if (popupName.substring(0, 7) == '#popup:') {
    popupName = popupName.substring(7);
  }
  virtPage += popupName;
  virtTitle += popupName;
  if (window.Tilda && typeof Tilda.sendEventToStatistics == 'function') {
    Tilda.sendEventToStatistics(virtPage, virtTitle, '', 0);
  } else {
    if (ga) {
      if (window.mainTracker != 'tilda') {
        ga('send', { hitType: 'pageview', page: virtPage, title: virtTitle });
      }
    }
    if (window.mainMetrika && window[window.mainMetrika]) {
      window[window.mainMetrika].hit(virtPage, { title: virtTitle, referer: window.location.href });
    }
  }
}

function t390__lazyLoad() {
  var allRecords = document.getElementById('allrecords');
  if (window.lazy === 'y' || (allRecords && allRecords.getAttribute('data-tilda-lazy') === 'yes')) {
    t_onFuncLoad('t_lazyload_update', function () {
      t_lazyload_update();
    });
  }
}

/* ============================================================================
 * t450 — выезжающее (бургер-) меню.
 * Умеет: показ/закрытие (бургер, оверлей, крестик, якорные ссылки, ESC для
 * связанных t390-попапов), контроль переполнения по высоте (t450__overflowed),
 * появление/скрытие бургера по скроллу (data-appearoffset/data-hideoffset),
 * подсветка активного пункта по URL.
 * Инлайн зовёт: t450_initMenu (+ t450_appearMenu вешается на scroll в разметке).
 * ==========================================================================*/

function t450_showMenu(recid) {
  var rec = document.getElementById('rec' + recid);
  if (!rec) return;
  var menu = rec.querySelector('.t450');
  var overlay = rec.querySelector('.t450__overlay');
  var menuElements = rec.querySelectorAll('.t450__overlay, .t450__close, a[href*="#"]');
  if (typeof t_triggerEvent === 'function') t_triggerEvent(document.body, 'popupShowed');
  document.body.classList.add('t450__body_menushowed');
  if (menu) menu.classList.add('t450__menu_show');
  if (overlay) overlay.classList.add('t450__menu_show');
  if (menu) {
    // Клик по якорю внутри tooltip-подменю (t794) тоже закрывает меню.
    menu.addEventListener('clickedAnchorInTooltipMenu', function () {
      t450_closeMenu(menu, overlay);
    });
  }
  Array.prototype.forEach.call(menuElements, function (element) {
    element.addEventListener('click', function () {
      // Ссылки-хуки подменю не закрывают меню.
      if (element.closest('.tooltipstered, .t-menusub__target-link, .t794__tm-link, .t966__tm-link, .t978__tm-link'))
        return;
      if (element.href && (element.href.substring(0, 7) === '#price:' || element.href.substring(0, 9) === '#submenu:'))
        return;
      t450_closeMenu(menu, overlay);
    });
  });
  // ESC закрывает открытые t390-попапы (общий обработчик, селекторы — не зависимость от кода t390).
  document.addEventListener('keydown', function (e) {
    if (e.keyCode === 27) {
      document.body.classList.remove('t390__body_popupshowed');
      var popups = document.querySelectorAll('.t390');
      Array.prototype.forEach.call(popups, function (popup) {
        popup.classList.remove('t390__popup_show');
      });
    }
  });
  // Раскрытие вложенных подменю меняет высоту — пересчитать переполнение.
  rec.addEventListener('click', function (e) {
    if (e.target.closest('.t966__tm-link, .t978__tm-link, .t-menusub__target-link')) {
      t450_checkSize(recid);
      if (e.target.closest('.t978__tm-link')) {
        setTimeout(function () {
          var hookLink = e.target.closest('.t978__tm-link');
          var menuBlock = hookLink.nextElementSibling;
          var submenuLinks = menuBlock ? menuBlock.querySelectorAll('.t978__menu-link') : [];
          Array.prototype.forEach.call(submenuLinks, function (link) {
            link.addEventListener('click', function () {
              t450_checkSize(recid);
            });
          });
        }, 300);
      }
    }
  });
  menu.addEventListener('menuOverflow', function () {
    t450_checkSize(recid);
  });
  t450_highlight(recid);
}

function t450_closeMenu(menu, overlay) {
  if (typeof t_triggerEvent === 'function') t_triggerEvent(document.body, 'popupHidden');
  document.body.classList.remove('t450__body_menushowed');
  if (menu) menu.classList.remove('t450__menu_show');
  if (overlay) overlay.classList.remove('t450__menu_show');
}

function t450_checkSize(recid) {
  var rec = document.getElementById('rec' + recid);
  var menu = rec ? rec.querySelector('.t450') : null;
  if (!menu) return;
  var container = menu.querySelector('.t450__container');
  var topContainer = menu.querySelector('.t450__top');
  var rightContainer = menu.querySelector('.t450__rightside');
  setTimeout(function () {
    var topContainerHeight = topContainer ? topContainer.offsetHeight : 0;
    var rightContainerHeight = rightContainer ? rightContainer.offsetHeight : 0;
    var containerPaddingTop = container ? window.getComputedStyle(container).paddingTop : '0';
    var containerPaddingBottom = container ? window.getComputedStyle(container).paddingBottom : '0';
    containerPaddingTop = parseInt(containerPaddingTop, 10);
    containerPaddingBottom = parseInt(containerPaddingBottom, 10);
    if (topContainerHeight + rightContainerHeight + containerPaddingTop + containerPaddingBottom > document.documentElement.clientHeight) {
      menu.classList.add('t450__overflowed');
    } else {
      menu.classList.remove('t450__overflowed');
    }
  }, 300);
}

function t450_appearMenu(recid) {
  var rec = document.getElementById('rec' + recid);
  var burger = rec ? rec.querySelector('.t450__menu__content') : null;
  if (!burger) return;
  var burgerAppearOffset = burger ? burger.getAttribute('data-appearoffset') : '';
  var burgerHideOffset = burger ? burger.getAttribute('data-hideoffset') : '';
  if (burgerAppearOffset) {
    burgerAppearOffset = t450_appearMenuParseNumber(burgerAppearOffset);
    if (window.pageYOffset >= burgerAppearOffset) {
      if (burger.classList.contains('t450__beforeready')) {
        burger.classList.remove('t450__beforeready');
      }
    } else {
      burger.classList.add('t450__beforeready');
    }
  }
  if (burgerHideOffset) {
    burgerHideOffset = t450_appearMenuParseNumber(burgerHideOffset);
    var scrollHeight = Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight,
      document.body.clientHeight, document.documentElement.clientHeight);
    if (window.pageYOffset + window.innerHeight >= scrollHeight - burgerHideOffset) {
      if (!burger.classList.contains('t450__beforeready')) {
        burger.classList.add('t450__beforeready');
      }
    } else if (burgerAppearOffset) {
      if (window.pageYOffset >= burgerAppearOffset) {
        burger.classList.remove('t450__beforeready');
      }
    } else {
      burger.classList.remove('t450__beforeready');
    }
  }
}

function t450_appearMenuParseNumber(string) {
  if (string.indexOf('vh') > -1) {
    string = Math.floor(window.innerHeight * (parseInt(string) / 100));
  }
  return parseInt(string, 10);
}

function t450_initMenu(recid) {
  var rec = document.getElementById('rec' + recid);
  var menu = rec ? rec.querySelector('.t450') : null;
  var overlay = rec ? rec.querySelector('.t450__overlay') : null;
  var burger = rec ? rec.querySelector('.t450__burger_container') : null;
  var menuLinks = rec ? rec.querySelectorAll('.t-menu__link-item.t450__link-item_submenu') : [];
  var hook = menu ? menu.getAttribute('data-tooltip-hook') : '';
  if (hook) {
    // Открытие меню по ссылке с хуком (#submenu:имя) в любом месте страницы.
    document.addEventListener('click', function (e) {
      if (e.target.closest('a[href="' + hook + '"]')) {
        e.preventDefault();
        t450_closeMenu(menu, overlay);
        t450_showMenu(recid);
        t450_checkSize(recid);
      }
    });
  }
  if (burger) {
    burger.addEventListener('click', function () {
      t450_closeMenu(menu, overlay);
      t450_showMenu(recid);
      t450_checkSize(recid);
    });
  }
  window.addEventListener('resize', function () {
    t450_checkSize(recid);
  });
  if (!window.isMobile) return;
  Array.prototype.forEach.call(menuLinks, function (link) {
    link.addEventListener('click', function () {
      t450_checkSize(recid);
    });
  });
}

function t450_highlight(recid) {
  var url = window.location.href;
  var pathname = window.location.pathname;
  var hash = window.location.hash;
  if (url.substr(url.length - 1) === '/') {
    url = url.slice(0, -1);
  }
  if (pathname.substr(pathname.length - 1) === '/') {
    pathname = pathname.slice(0, -1);
  }
  if (pathname.charAt(0) === '/') {
    pathname = pathname.slice(1);
  }
  if (pathname === '') {
    pathname = '/';
  }
  var shouldBeActiveElements = document.querySelectorAll(
    ".t450__menu a[href='" + url + "'], " +
    ".t450__menu a[href='" + url + "/'], " +
    ".t450__menu a[href='" + pathname + "'], " +
    ".t450__menu a[href='/" + pathname + "'], " +
    ".t450__menu a[href='" + pathname + "/'], " +
    ".t450__menu a[href='/" + pathname + "/']" +
    (hash ? ", .t450__menu a[href='" + hash + "']" : '') +
    (hash && pathname === '/' ? ", .t450__menu a[href='/" + hash + "']" : '') +
    (hash && pathname !== '/' ? ", .t450__menu a[href='/" + pathname + hash + "'], .t450__menu a[href='" + pathname + hash + "']" : ''));
  var rec = document.getElementById('rec' + recid);
  var menuLinks = rec ? rec.querySelectorAll('.t450__menu a') : [];
  Array.prototype.forEach.call(menuLinks, function (link) {
    if (link.getAttribute('data-highlighted-by-user') !== 'y') link.classList.remove('t-active');
  });
  Array.prototype.forEach.call(shouldBeActiveElements, function (link) {
    link.classList.add('t-active');
  });
}

/* ============================================================================
 * t794 — tooltip-подменю в шапке (выпадашка по наведению/тапу).
 * Умеет: пометка ссылок-хуков, стрелка (data-add-arrow), позиционирование и
 * события через t_submenublocks__* (десктоп/мобайл), подсветка активных
 * ссылок, полноэкранное подменю на мобиле, закрытие по клику на якорь.
 * Инлайн зовёт: t794_init.
 * ==========================================================================*/

function t794_init(recid) {
  var rec = document.getElementById('rec' + recid);
  var menu = rec ? rec.querySelector('.t794') : null;
  var hook = menu ? menu.getAttribute('data-tooltip-hook') : '';
  if (!hook) return;
  var hookLinks = document.querySelectorAll('a[href="' + hook + '"]');
  hookLinks = Array.prototype.filter.call(hookLinks, function (hookLink) {
    var isSubmenuAllowed = hookLink.getAttribute('data-submenu-disallowed') !== 'yes';
    if (isSubmenuAllowed) {
      hookLink.classList.add('t794__tm-link');
      hookLink.setAttribute('data-tooltip-menu-id', recid);
      return true;
    }
    return false;
  });
  var parentMenu = hookLinks.length ? hookLinks[0].closest('[data-menu]') : null;
  var tooltipMenu = rec.querySelector('.t794__tooltip-menu');
  var isParentFixed = parentMenu && window.getComputedStyle(parentMenu).position === 'fixed';
  if (tooltipMenu) tooltipMenu.setAttribute('data-pos-fixed', isParentFixed ? 'yes' : 'no');
  t794_addArrow(recid, hookLinks);
  t794_setUpMenu(recid, hookLinks);
  t_onFuncLoad('t_submenublocks__highlightActiveLinks', function () {
    t_submenublocks__highlightActiveLinks('.t794__list_item a');
  });
  if (menu.hasAttribute('data-full-submenu-mob') && (window.isMobile || 'ontouchend' in document)) {
    t_onFuncLoad('t_submenublocks__setFullScreenMenu', function () {
      t_submenublocks__setFullScreenMenu(menu);
    });
  }
}

function t794_addArrow(recid, hookLinks) {
  var rec = document.getElementById('rec' + recid);
  var submenuBlock = rec ? rec.querySelector('.t794') : null;
  var isArrowAppend = submenuBlock.getAttribute('data-add-arrow');
  if (!isArrowAppend) return;
  hookLinks = Array.prototype.slice.call(hookLinks);
  hookLinks.forEach(function (hookLink) {
    var arrow = document.createElement('div');
    arrow.classList.add('t794__arrow');
    hookLink.appendChild(arrow);
    var isInsideZero = hookLink.closest('.tn-atom');
    var hasCustomBorderColor = window.getComputedStyle(hookLink).borderColor !== 'rgba(0, 0, 0, 0)';
    if (isInsideZero && !hasCustomBorderColor) {
      hookLink.style.borderColor = 'initial';
      hookLink.style.border = 'none';
    }
  });
}

function t794_setUpMenu(recid, hookLinks) {
  var rec = document.getElementById('rec' + recid);
  var submenu = rec ? rec.querySelector('.t794__tooltip-menu') : null;
  if (!submenu) return;
  var menuBlock = rec ? rec.querySelector('.t794') : null;
  var verticalIndent = menuBlock.getAttribute('data-tooltip-margin');
  var content = submenu.querySelector('.t794__content');
  var hooksAndSubmenu = hookLinks.concat(submenu);
  if (window.innerWidth > 980 && !('ontouchend' in document)) {
    t_onFuncLoad('t_submenublocks__addEventsDesktop', function () {
      t_submenublocks__addEventsDesktop(submenu, hooksAndSubmenu, verticalIndent, '.t794');
    });
  } else {
    t_onFuncLoad('t_submenublocks__addEventsMobile', function () {
      t_submenublocks__addEventsMobile(submenu, hookLinks, verticalIndent, '.t794');
    });
  }
  window.addEventListener('scroll', t_throttle(function () {
    if (content) {
      content.addEventListener('mouseleave', function () {
        if (submenu.classList.contains('t794__tooltip-menu_show')) {
          t_onFuncLoad('t_submenublocks__hideSubmenu', function () {
            t_submenublocks__hideSubmenu(submenu, '.t794');
          });
        }
      });
    }
  }, 300));
  // Клик по якорной ссылке в подменю: скрыть подменю, оповестить меню-блоки,
  // перенести подсветку активного пункта.
  var tooltipLinks = document.querySelectorAll('.t794__tooltip-menu a[href*="#"]');
  Array.prototype.forEach.call(tooltipLinks, function (tooltipLink) {
    tooltipLink.addEventListener('click', function () {
      t_onFuncLoad('t_submenublocks__hideSubmenu', function () {
        t_submenublocks__hideSubmenu(submenu, '.t794');
      });
      var menuList = document.querySelectorAll('.t450, .t199__mmenu, .t280, .t282, .t204__burger, .t451, .t466');
      Array.prototype.forEach.call(menuList, function (menu) {
        var event = document.createEvent('Event');
        event.initEvent('clickedAnchorInTooltipMenu', true, true);
        menu.dispatchEvent(event);
      });
      Array.prototype.forEach.call(tooltipLinks, function (link) {
        link.classList.remove('t-active');
      });
      tooltipLink.classList.add('t-active');
    });
  });
}

/* ============================================================================
 * t331 — попап с видео (открытие по кнопке/ссылке #popup:имя).
 * Умеет: ленивую вставку iframe видео, расчёт высоты по data-video-width/height,
 * показ/закрытие (оверлей, крестик, ESC), trap-фокус, событие в статистику.
 * Инлайн зовёт: t331_initPopup.
 * ==========================================================================*/

function t331_initPopup(recId) {
  var rec = document.getElementById('rec' + recId);
  if (!rec) return false;
  rec.setAttribute('data-animationappear', 'off');
  rec.style.opacity = '1';
  var currentBlock = rec.querySelector('.t-popup');
  var currentHook = currentBlock ? currentBlock.getAttribute('data-tooltip-hook') : '';
  var currentAnalitics = currentBlock ? currentBlock.getAttribute('data-track-popup') : '';
  if (!currentHook) return false;
  t_onFuncLoad('t_popup__addAttributesForAccessibility', function () {
    t_popup__addAttributesForAccessibility(currentHook);
  });
  document.addEventListener('click', function (e) {
    var href = e.target.closest('a[href$="' + currentHook + '"]');
    if (href) {
      e.preventDefault();
      t331_showPopup(recId);
      t_onFuncLoad('t_popup__resizePopup', function () {
        t_popup__resizePopup(recId);
      });
      if (currentAnalitics) {
        var virtTitle = currentHook;
        if (virtTitle.substring(0, 7) === '#popup:') virtTitle = virtTitle.substring(7);
        Tilda.sendEventToStatistics(currentAnalitics, virtTitle);
      }
    }
  });
  t_onFuncLoad('t_popup__addClassOnTriggerButton', function () {
    t_popup__addClassOnTriggerButton(document, currentHook);
  });
}

function t331_showPopup(recid) {
  var rec = document.getElementById('rec' + recid);
  if (!rec) return false;
  var popup = rec.querySelector('.t-popup');
  var video = rec.querySelector('.t-video-lazyload');
  var videoIframe = video.querySelector('iframe');
  if (!videoIframe) {
    t_onFuncLoad('t_video_lazyload__addVideo', function () {
      t_video_lazyload__addVideo(video);
    });
  }
  if (popup) popup.style.display = 'block';
  t331_setHeight(recid);
  setTimeout(function () {
    var popupContainer = popup ? popup.querySelector('.t-popup__container') : null;
    if (popupContainer) popupContainer.classList.add('t-popup__container-animated');
    if (popup) popup.classList.add('t-popup_show');
    popup.focus();
    t_onFuncLoad('t_popup__trapFocus', function () {
      t_popup__trapFocus(popup);
    });
  }, 50);
  if (typeof t_triggerEvent === 'function') t_triggerEvent(document.body, 'popupShowed');
  document.body.classList.add('t-body_popupshowed');
  document.body.classList.add('t331__body_popupshowed');
  if (popup) {
    popup.addEventListener('click', function (e) {
      if (e.target === popup) t331_popup_close(recid);
    });
  }
  var popupClose = popup ? popup.querySelector('.t-popup__close') : null;
  if (popupClose) {
    popupClose.addEventListener('click', function () {
      t331_popup_close(recid);
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.keyCode === 27) t331_popup_close(recid);
  });
}

function t331_popup_close(recid) {
  if (typeof t_triggerEvent === 'function') t_triggerEvent(document.body, 'popupHidden');
  document.body.classList.remove('t-body_popupshowed');
  document.body.classList.remove('t331__body_popupshowed');
  var rec = document.getElementById('rec' + recid);
  if (!rec) return false;
  var popup = rec.querySelector('.t-popup');
  if (popup) popup.classList.remove('t-popup_show');
  t_onFuncLoad('t_popup__addFocusOnTriggerButton', function () {
    t_popup__addFocusOnTriggerButton();
  });
  setTimeout(function () {
    // Убрать iframe видео, чтобы остановить воспроизведение.
    var video = rec.querySelector('.t-video-lazyload');
    if (video) {
      t_onFuncLoad('t_video_lazyload__removeVideo', function () {
        t_video_lazyload__removeVideo(video);
      });
    }
    if (popup && !popup.classList.contains('t-popup_show')) {
      popup.style.display = 'none';
    }
  }, 300);
}

function t331_setHeight(recid) {
  var rec = document.getElementById('rec' + recid);
  if (!rec) return false;
  var videoWrap = rec.querySelector('.t331__wrap-video');
  var videoLazy = rec.querySelector('.t-video-lazyload');
  var dataVideoWidth = videoWrap.getAttribute('data-video-width');
  var dataVideoHeight = videoWrap.getAttribute('data-video-height');
  var calculatedHeight = videoLazy.offsetWidth * 0.5625; // 16:9 по умолчанию
  if (dataVideoHeight) {
    if (dataVideoHeight.indexOf('vh') !== -1) {
      calculatedHeight = (parseInt(dataVideoHeight, 10) * window.innerHeight) / 100;
    } else {
      calculatedHeight = parseInt(dataVideoHeight, 10);
    }
  }
  videoWrap.style.height = calculatedHeight + 'px';
  videoLazy.style.height = calculatedHeight + 'px';
}

function t331_sendPopupEventToStatistics(popupname) {
  var virtPage = '/tilda/popup/';
  var virtTitle = 'Popup: ';
  if (popupname.substring(0, 7) === '#popup:') {
    popupname = popupname.substring(7);
  }
  virtPage += popupname;
  virtTitle += popupname;
  if (ga) {
    if (window.mainTracker !== 'tilda') {
      ga('send', { hitType: 'pageview', page: virtPage, title: virtTitle });
    }
  }
  if (window.mainMetrika > '' && window[window.mainMetrika]) {
    window[window.mainMetrika].hit(virtPage, { title: virtTitle, referer: window.location.href });
  }
}

/* ============================================================================
 * t702 — попап с формой (подписка/заявка), открытие по ссылке #popup:имя.
 * Умеет: показ/закрытие, lock/unlock скролла на iOS 11, lazyLoad, события
 * tildamodal:show/close (для ESC-обработчика), условные поля формы,
 * пересчёт ширины инпутов, событие в статистику.
 * Инлайн зовёт: t702_initPopup.
 * ==========================================================================*/

function t702_initPopup(recId) {
  var rec = document.getElementById('rec' + recId);
  if (!rec) return;
  var container = rec.querySelector('.t702');
  if (!container) return;
  rec.setAttribute('data-animationappear', 'off');
  rec.setAttribute('data-popup-subscribe-inited', 'y');
  rec.style.opacity = 1;
  var documentBody = document.body;
  var popup = rec.querySelector('.t-popup');
  var popupTooltipHook = popup.getAttribute('data-tooltip-hook');
  var analitics = popup.getAttribute('data-track-popup');
  var popupCloseBtn = popup.querySelector('.t-popup__close');
  var hrefs = rec.querySelectorAll('a[href*="#"]');
  var submitHref = rec.querySelector('.t-submit[href*="#"]');
  if (popupTooltipHook) {
    t_onFuncLoad('t_popup__addAttributesForAccessibility', function () {
      t_popup__addAttributesForAccessibility(popupTooltipHook);
    });
    document.addEventListener('click', function (event) {
      var target = event.target;
      var href = target.closest('a[href$="' + popupTooltipHook + '"]') ? target : false;
      if (!href) return;
      event.preventDefault();
      t702_showPopup(recId);
      t_onFuncLoad('t_popup__resizePopup', function () {
        t_popup__resizePopup(recId);
      });
      t702__lazyLoad();
      if (analitics && window.Tilda) {
        Tilda.sendEventToStatistics(analitics, popupTooltipHook);
      }
    });
    t_onFuncLoad('t_popup__addClassOnTriggerButton', function () {
      t_popup__addClassOnTriggerButton(document, popupTooltipHook);
    });
  }
  popup.addEventListener('scroll', t_throttle(function () {
    t702__lazyLoad();
  }));
  // Клик по подложке закрывает попап; полоса прокрутки (17px) не считается.
  popup.addEventListener('click', function (event) {
    var windowWithoutScrollBar = window.innerWidth - 17;
    if (event.clientX > windowWithoutScrollBar) return;
    if (event.target === this) t702_closePopup(recId);
  });
  popupCloseBtn.addEventListener('click', function () {
    t702_closePopup(recId);
  });
  if (submitHref) {
    submitHref.addEventListener('click', function () {
      if (documentBody.classList.contains('t-body_scroll-locked')) {
        documentBody.classList.remove('t-body_scroll-locked');
      }
    });
  }
  for (var i = 0; i < hrefs.length; i++) {
    hrefs[i].addEventListener('click', function () {
      var url = this.getAttribute('href');
      if (!url || url.substring(0, 7) != '#price:') {
        t702_closePopup(recId);
        if (!url || url.substring(0, 7) == '#popup:') {
          setTimeout(function () {
            if (typeof t_triggerEvent === 'function') t_triggerEvent(document.body, 'popupShowed');
            documentBody.classList.add('t-body_popupshowed');
          }, 300);
        }
      }
    });
  }
  // Вложенная: ESC-обработчик живёт только пока попап открыт
  // (вешается/снимается по событиям tildamodal:show/close).
  function t702_escClosePopup(event) {
    if (event.key === 'Escape') t702_closePopup(recId);
  }
  popup.addEventListener('tildamodal:show' + popupTooltipHook, function () {
    document.addEventListener('keydown', t702_escClosePopup);
  });
  popup.addEventListener('tildamodal:close' + popupTooltipHook, function () {
    document.removeEventListener('keydown', t702_escClosePopup);
  });
  rec.addEventListener('conditional-form-init', function () {
    t_onFuncLoad('t_form__conditionals_addFieldsListeners', function () {
      t_form__conditionals_addFieldsListeners(recId, function () {
        t_popup__resizePopup(recId);
      });
    });
  }, { once: true });
}

function t702_lockScroll() {
  var documentBody = document.body;
  if (!documentBody.classList.contains('t-body_scroll-locked')) {
    var bodyScrollTop = typeof window.pageYOffset !== 'undefined'
      ? window.pageYOffset
      : (document.documentElement || documentBody.parentNode || documentBody).scrollTop;
    documentBody.classList.add('t-body_scroll-locked');
    documentBody.style.top = '-' + bodyScrollTop + 'px';
    documentBody.setAttribute('data-popup-scrolltop', bodyScrollTop);
  }
}

function t702_unlockScroll() {
  var documentBody = document.body;
  if (documentBody.classList.contains('t-body_scroll-locked')) {
    var bodyScrollTop = documentBody.getAttribute('data-popup-scrolltop');
    documentBody.classList.remove('t-body_scroll-locked');
    documentBody.style.top = null;
    documentBody.removeAttribute('data-popup-scrolltop');
    document.documentElement.scrollTop = parseInt(bodyScrollTop);
  }
}

function t702_showPopup(recId) {
  var rec = document.getElementById('rec' + recId);
  if (!rec) return;
  var container = rec.querySelector('.t702');
  if (!container) return;
  var windowWidth = window.innerWidth;
  var screenMin = rec.getAttribute('data-screen-min');
  var screenMax = rec.getAttribute('data-screen-max');
  if (screenMin && windowWidth < parseInt(screenMin, 10)) return;
  if (screenMax && windowWidth > parseInt(screenMax, 10)) return;
  var popup = rec.querySelector('.t-popup');
  var popupTooltipHook = popup.getAttribute('data-tooltip-hook');
  var ranges = rec.querySelectorAll('.t-range');
  var documentBody = document.body;
  if (ranges.length) {
    Array.prototype.forEach.call(ranges, function (range) {
      t702__triggerEvent(range, 'popupOpened');
    });
  }
  t_onFuncLoad('t_popup__showPopup', function () {
    t_popup__showPopup(popup);
  });
  if (typeof t_triggerEvent === 'function') t_triggerEvent(document.body, 'popupShowed');
  documentBody.classList.add('t-body_popupshowed');
  documentBody.classList.add('t702__body_popupshowed');
  // Костыль лока скролла только для iOS 11.
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.MSStream &&
      window.isiOSVersion && window.isiOSVersion[0] === 11) {
    setTimeout(function () {
      t702_lockScroll();
    }, 500);
  }
  t702__lazyLoad();
  t702__triggerEvent(popup, 'tildamodal:show' + popupTooltipHook);
  t_onFuncLoad('t_forms__calculateInputsWidth', function () {
    t_forms__calculateInputsWidth(recId);
  });
}

function t702_closePopup(recId) {
  var rec = document.getElementById('rec' + recId);
  var popup = rec.querySelector('.t-popup');
  var popupTooltipHook = popup.getAttribute('data-tooltip-hook');
  var popupAll = document.querySelectorAll('.t-popup_show:not(.t-feed__post-popup):not(.t945__popup)');
  if (popupAll.length == 1) {
    if (typeof t_triggerEvent === 'function') t_triggerEvent(document.body, 'popupHidden');
    document.body.classList.remove('t-body_popupshowed');
  } else {
    var newPopup = [];
    for (var i = 0; i < popupAll.length; i++) {
      if (popupAll[i].getAttribute('data-tooltip-hook') === popupTooltipHook) {
        popupAll[i].classList.remove('t-popup_show');
        newPopup.push(popupAll[i]);
      }
    }
    if (newPopup.length === popupAll.length) {
      if (typeof t_triggerEvent === 'function') t_triggerEvent(document.body, 'popupHidden');
      document.body.classList.remove('t-body_popupshowed');
    }
  }
  if (typeof t_triggerEvent === 'function') t_triggerEvent(document.body, 'popupHidden');
  popup.classList.remove('t-popup_show');
  document.body.classList.remove('t702__body_popupshowed');
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.MSStream &&
      window.isiOSVersion && window.isiOSVersion[0] === 11) {
    t702_unlockScroll();
  }
  t_onFuncLoad('t_popup__addFocusOnTriggerButton', function () {
    t_popup__addFocusOnTriggerButton();
  });
  setTimeout(function () {
    var popupHide = document.querySelectorAll('.t-popup:not(.t-popup_show)');
    for (var i = 0; i < popupHide.length; i++) {
      popupHide[i].style.display = 'none';
    }
  }, 300);
  t702__triggerEvent(popup, 'tildamodal:close' + popupTooltipHook);
}

function t702_sendPopupEventToStatistics(popupName) {
  var virtPage = '/tilda/popup/';
  var virtTitle = 'Popup: ';
  if (popupName.substring(0, 7) == '#popup:') {
    popupName = popupName.substring(7);
  }
  virtPage += popupName;
  virtTitle += popupName;
  if (window.Tilda && typeof Tilda.sendEventToStatistics == 'function') {
    Tilda.sendEventToStatistics(virtPage, virtTitle, '', 0);
  } else {
    if (ga) {
      if (window.mainTracker != 'tilda') {
        ga('send', { hitType: 'pageview', page: virtPage, title: virtTitle });
      }
    }
    if (window.mainMetrika && window[window.mainMetrika]) {
      window[window.mainMetrika].hit(virtPage, { title: virtTitle, referer: window.location.href });
    }
  }
}

function t702_onSuccess(form) {
  t_onFuncLoad('t_forms__onSuccess', function () {
    t_forms__onSuccess(form);
  });
}

function t702__lazyLoad() {
  if (window.lazy === 'y' || document.getElementById('allrecords').getAttribute('data-tilda-lazy') === 'yes') {
    t_onFuncLoad('t_lazyload_update', function () {
      t_lazyload_update();
    });
  }
}

function t702__triggerEvent(el, eventName) {
  var event;
  if (typeof window.CustomEvent === 'function') {
    event = new CustomEvent(eventName);
  } else if (document.createEvent) {
    event = document.createEvent('HTMLEvents');
    event.initEvent(eventName, true, false);
  } else if (document.createEventObject) {
    event = document.createEventObject();
    event.eventType = eventName;
  }
  event.eventName = eventName;
  if (el.dispatchEvent) {
    el.dispatchEvent(event);
  } else if (el.fireEvent) {
    el.fireEvent('on' + event.eventType, event);
  } else if (el[eventName]) {
    el[eventName]();
  } else if (el['on' + eventName]) {
    el['on' + eventName]();
  }
}

/* ============================================================================
 * t270 — плавный скролл к якорю.
 * Умеет: ожидание догрузки слайдеров (иначе цель «уезжает»), исключения для
 * служебных хэшей (#!/tproduct/ и т.п.), запись хэша в history, нативный
 * smooth-scroll на мобиле (кроме Android) или JS-анимация 500 мс.
 * Инлайн зовёт: t270_scroll.
 * ==========================================================================*/

// Полифил requestAnimationFrame — оставлен 1:1 с оригиналом.
window.requestAnimationFrame = (function () {
  return (window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 60);
    });
})();

function t270_scroll(hash, offset) {
  if (!hash) return;
  t270_checkLoad(hash, offset);
  var excludeHashes = ['#!/tproduct/', '#!/tab/', '#opencart'];
  if (excludeHashes.includes(hash)) {
    return true;
  }
  var isHistoryChangeAllowed = window.location.hash !== hash;
  var wrapperBlock = document.querySelector('.t270');
  var dontChangeHistory = wrapperBlock ? Boolean(wrapperBlock.getAttribute('data-history-disabled')) : false;
  t270_scrollToEl(hash, offset);
  if (!dontChangeHistory && isHistoryChangeAllowed) {
    if (history.pushState) {
      history.pushState(null, null, hash);
    } else {
      window.location.hash = hash;
    }
    isHistoryChangeAllowed = false;
  }
  return true;
}

function t270_checkLoad(hash, offset) {
  // Один раз: доскроллить повторно после загрузки последней картинки слайдера.
  if (window.t270_loadChecked) return;
  var sliderWrappers = document.body.querySelectorAll('.t-slds__items-wrapper');
  if (!sliderWrappers.length) return;
  var lastWrapper = sliderWrappers[sliderWrappers.length - 1];
  var sliderImgs = lastWrapper ? lastWrapper.querySelectorAll('.t-slds__bgimg') : [];
  var lastImg = sliderImgs[sliderImgs.length - 1];
  var imageUrl = lastImg ? window.getComputedStyle(lastImg).backgroundImage : '';
  imageUrl = imageUrl.substring(5, imageUrl.length - 2);
  var preloaderImg = document.createElement('img');
  preloaderImg.src = imageUrl ? imageUrl : '';
  preloaderImg.addEventListener('load', function () {
    t270_scroll(hash, offset);
    window.t270_loadChecked = true;
  });
}

function t270_scrollToEl(hash, offset) {
  var SCROLL_DURATION_MS = 500;
  var body = document.body;
  if (body.getAttribute('data-scroll')) return;
  var scrollTargetY = t270_getTarget(hash, offset);
  if (isNaN(scrollTargetY)) return;
  var canSmoothScroll = window.CSS && window.CSS.supports('scroll-behavior', 'smooth') &&
    'scrollBehavior' in document.documentElement.style;
  var userAgent = navigator.userAgent.toLowerCase();
  var isAndroid = userAgent.indexOf('android') !== -1;
  if (window.isMobile && !isAndroid && canSmoothScroll) {
    body.setAttribute('data-scroll', 'true');
    window.scrollTo({ left: 0, top: scrollTargetY, behavior: 'smooth' });
    setTimeout(function () {
      body.removeAttribute('data-scroll');
    }, SCROLL_DURATION_MS);
  } else {
    t270_smoothScrollTo(scrollTargetY, SCROLL_DURATION_MS);
  }
}

function t270_smoothScrollTo(targetY, duration = 500) {
  var body = document.body;
  var startY = window.scrollY || window.pageYOffset;
  var deltaY = targetY - startY;
  var startTime = performance.now();
  // Имя как в оригинале, но по факту это квадратичный ease-in.
  function easeInOutQuad(t) {
    return Math.pow(t, 2);
  }
  function scroll() {
    var currentTime = performance.now();
    var elapsedTime = Math.min((currentTime - startTime) / duration, 1);
    var ease = easeInOutQuad(elapsedTime);
    window.scrollTo(0, startY + deltaY * ease);
    if (elapsedTime < 1) {
      requestAnimationFrame(scroll);
    } else {
      body.removeAttribute('data-scroll');
      body.removeAttribute('data-scrollable');
      window.scrollTo(0, targetY);
    }
  }
  body.setAttribute('data-scroll', 'true');
  body.setAttribute('data-scrollable', 'true');
  requestAnimationFrame(scroll);
}

function t270_getTarget(hash, offset) {
  var target;
  try {
    if (hash.substring(0, 1) === '#') {
      target = document.getElementById(hash.substring(1));
    } else {
      target = document.querySelector(hash);
    }
  } catch (event) {
    console.log('Exception t270: ' + event.message);
    return;
  }
  if (!target) {
    target = document.querySelector('a[name="' + hash.substr(1) + '"], div[id="' + hash.substr(1) + '"]');
    if (!target) return;
  }
  target = parseInt(target.getBoundingClientRect().top + window.pageYOffset - offset, 10);
  target = Math.max(target, 0);
  return target;
}

/* ============================================================================
 * t1211 — подсветка кодовых блоков в статьях (.t-redactor__highlightcode code).
 * Догружает highlight.js + его CSS + шрифт Source Code Pro с CDN Тильды/Google
 * и красит все code-блоки. Источник: tilda-blocks-page118070116.min.js.
 * Инлайн зовёт: t1211_init.
 * ==========================================================================*/

function t1211_init(recId) {
  var rec = document.getElementById('rec' + recId);
  if (!rec) return;
  t1211_handleCodeBlocks(rec);
}

function t1211_handleCodeBlocks(rec) {
  var codeBlocks = rec.querySelectorAll('.t-redactor__highlightcode code');
  if (!codeBlocks.length) return;
  t_onFuncLoad('t_loadJsFile', function () {
    t_loadJsFile('https://static.tildacdn.com/js/highlight.min.js',
      t1211_addHighlightCodeBlocks.bind(this, codeBlocks));
  });
  t_onFuncLoad('t_loadCSSFile', function () {
    t_loadCSSFile('https://static.tildacdn.com/css/highlight.min.css');
    t_loadCSSFile('https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;700&display=swap',
      t1211_addFontFamily.bind(this, codeBlocks));
  });
}

function t1211_addHighlightCodeBlocks(codeBlocks) {
  t_onFuncLoad('hljs', function () {
    if (!window.hljs.highlightBlock) return;
    for (var i = 0; i < codeBlocks.length; i++) {
      window.hljs.highlightBlock(codeBlocks[i]);
    }
  });
}

function t1211_addFontFamily(codeBlocks) {
  for (var i = 0; i < codeBlocks.length; i++) {
    codeBlocks[i].style.fontFamily = '"Source Code Pro", monospace';
  }
}
