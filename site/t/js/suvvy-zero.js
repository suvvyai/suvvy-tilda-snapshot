/* suvvy-zero.js — наш движок zero-блоков (T396) вместо tilda-zero-1.1 (шаг B).
 *
 * Геометрия элементов живёт в CSS выгрузки; этот движок раскладывает элементы
 * артборда в инлайн left/top/width/height по data-атрибутам на пяти брейкпоинтах
 * (320/480/640/960/1200) и пересчитывает их на ресайзе.
 *
 * Порт написан по исходнику под ФАКТЫ нашей выгрузки (все проверены грепами):
 *  - upscale="grid" на всех 788 артбордах → scale-контур мёртв (scaleFactor=1,
 *    t396_scaleBlock не зовётся никогда), tilda-zero-scale снят;
 *  - нет: hug-артбордов, physical-групп, форм/галерей/тултипов/векторов в zero,
 *    fixed/absolute-артбордов, data-scale-off, sticky-колонок, backdrop-filter,
 *    ql-undercut, tildaMembers/t830/t235/t263/t635/t431, режима редактора;
 *  - есть: height_vh, valign, ovrflw visible|auto, элементы text/image/shape/
 *    button/video/html, zero-блоки в попапах, TN_SCALE_INITIAL_VER="1.0".
 *
 * Сохранены все публичные имена, которые зовут инлайны страниц и другие файлы:
 * t396_init, t396_doResize, t396_allelems__renderView, t396_allgroups__renderView,
 * t396_*__getFieldValue, t396_elem__renderView*, флаги t396__is*, window.tn,
 * события artBoardRendered / artBoardResized / zero:window-width-changed.
 */
(function () {
  'use strict';

  /* ---------- флаги браузера (их читают и другие скрипты) ---------- */
  var ua = navigator.userAgent;
  window.t396__isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || ua.indexOf('Instagram') > -1;
  window.t396__isIPad = 'ontouchend' in document && ua.indexOf('AppleWebKit') !== -1;
  window.t396__isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  window.t396__isTouchDevice = 'ontouchend' in document;
  window.t396__isInAppBrowser = /WebView|(iPhone|iPod|iPad)(?!.*Safari)/gi.test(ua);
  window.t396__isFacebookMessengerInApp = /FBAN|FBAV/gi.test(ua) && window.t396__isInAppBrowser;
  window.t396__isInstagramInApp = /\bInstagram/gi.test(ua) && window.t396__isInAppBrowser;

  /* ---------- реестр window.tn ---------- */
  function createDefaultTN() {
    window.tn = {};
    // Список полей артборда оставлен для совместимости; сами поля на
    // опубликованной странице не рендерятся (фон/фильтры сидят в CSS выгрузки).
    window.tn.ab_fields = ['height', 'width', 'bgcolor', 'bgimg', 'bgattachment',
      'bgposition', 'filteropacity', 'filtercolor', 'filteropacity2', 'filtercolor2',
      'height_vh', 'valign'];
  }
  window.t396_initTNobj__createDefault = createDefaultTN;

  window.t396_initTNobj = function (recid, artboard) {
    if (!artboard) return;
    if (!window.tn) createDefaultTN();
    var key = 'ab' + recid;
    window.tn[key] = { screens: [] };
    var screens = artboard.getAttribute('data-artboard-screens');
    if (screens) {
      screens.split(',').forEach(function (s) {
        window.tn[key].screens.push(parseInt(s, 10));
      });
    } else {
      window.tn[key].screens = [320, 480, 640, 960, 1200];
    }
  };

  /* ---------- размеры окна (правила браузеров — как в оригинале) ---------- */
  function tnWindowWidth() {
    return document.documentElement.clientWidth;
  }
  function tnWindowHeight() {
    return (window.t396__isMobile || window.t396__isIPad)
      ? document.documentElement.clientHeight
      : window.innerHeight;
  }
  function cssWindowWidth() {
    return (window.t396__isMobile || window.t396__isIPad || window.t396__isSafari)
      ? document.documentElement.clientWidth
      : window.innerWidth;
  }
  function updateWindowDimensions() {
    window.tn.window_width = tnWindowWidth();
    window.tn.window_height = tnWindowHeight();
    window.tn.window_width_css = cssWindowWidth();
  }
  function getWindowDimensions() {
    if (!window.tn.window_width || !window.tn.window_height || !window.tn.window_width_css) {
      updateWindowDimensions();
    }
    return {
      width: window.tn.window_width,
      height: window.tn.window_height,
      cssWidth: window.tn.window_width_css,
    };
  }
  function revalidateDimensions() {
    var prev = getWindowDimensions().width;
    updateWindowDimensions();
    return prev !== getWindowDimensions().width;
  }

  function shouldUseVisualViewportHeight() {
    return 'visualViewport' in window && window.t396__isMobile && window.t396__isSafari;
  }
  function isInPopup(artboard) {
    if (!artboard) return false;
    var rec = document.getElementById('rec' + artboard.getAttribute('data-artboard-recid'));
    return !!(rec && rec.parentNode.classList.contains('t-popup__container'));
  }
  function abWindowHeight(artboard) {
    return shouldUseVisualViewportHeight() && isInPopup(artboard)
      ? window.visualViewport.height
      : getWindowDimensions().height;
  }

  /* ---------- брейкпоинты ---------- */
  window.t396_detectResolution = function (recid) {
    if (!recid) return null;
    var cssWidth = getWindowDimensions().cssWidth;
    var res;
    window.tn['ab' + recid].screens.forEach(function (s) {
      if (cssWidth >= s) res = s;
    });
    if (res === undefined) res = window.tn['ab' + recid].screens[0];
    return res;
  };

  window.t396_switchResolution = function (recid, res) {
    var key = 'ab' + recid;
    var max = window.tn[key].screens[window.tn[key].screens.length - 1];
    window.tn[key].curResolution = res;
    window.tn[key].curResolution_max = max;
    window.tn.curResolution = res;
    window.tn.curResolution_max = max;
  };

  window.t396_updateTNobj = function (recid) {
    var winW = getWindowDimensions().width;
    var key = 'ab' + recid;
    var desc = window.tn[key].screens.slice().reverse();
    for (var i = 0; i < desc.length; i++) {
      if (window.tn[key].curResolution === desc[i]) {
        window.tn[key].canvas_min_width = desc[i];
        window.tn[key].canvas_max_width = i === 0 ? winW : desc[i - 1];
      }
    }
    window.tn[key].grid_width = window.tn[key].canvas_min_width;
    window.tn[key].grid_offset_left = (winW - window.tn[key].grid_width) / 2;
  };

  /* ---------- чтение полей: каскад res-N → вверх → базовый атрибут ---------- */
  // var(--uc-…, fallback) — глобальные стили Тильды (кнопки на 2 страницах):
  // берём значение переменной с body, иначе fallback из самой записи.
  function parseGlobalStyleVar(str) {
    var m = /var\((--uc-[^,]+),\s?(.*)\)/.exec(str || '');
    if (!m) return null;
    return window.getComputedStyle(document.body).getPropertyValue(m[1]) || m[2];
  }

  window.t396_ab__getFieldValue = function (artboard, field) {
    if (!artboard) return null;
    var recid = artboard.getAttribute('data-artboard-recid');
    var key = 'ab' + recid;
    if (window.tn[key] === undefined) {
      t396_initTNobj(recid, artboard);
      t396_switchResolution(recid, t396_detectResolution(recid));
    }
    var res = window.tn[key].curResolution;
    var max = window.tn[key].curResolution_max;
    var screens = window.tn[key].screens;
    var v = res === max
      ? artboard.getAttribute('data-artboard-' + field)
      : artboard.getAttribute('data-artboard-' + field + '-res-' + res);
    if (v === null) {
      for (var i = 0; i < screens.length; i++) {
        var s = screens[i];
        if (s <= res) continue;
        v = s === max
          ? artboard.getAttribute('data-artboard-' + field)
          : artboard.getAttribute('data-artboard-' + field + '-res-' + s);
        if (v !== null) break;
      }
    }
    var parsed = parseGlobalStyleVar(v);
    return parsed !== null ? parsed : v;
  };

  window.t396_elem__getFieldValue = function (elem, field) {
    if (!elem) return null;
    if (elem.classList.contains('tn-group')) return t396_group__getFieldValue(elem, field);
    var artboard = elem.closest('.t396__artboard');
    var recid = artboard.getAttribute('data-artboard-recid');
    var key = 'ab' + recid;
    if (window.tn[key] === undefined) {
      t396_initTNobj(recid, artboard);
      t396_switchResolution(recid, t396_detectResolution(recid));
    }
    var res = window.tn[key].curResolution;
    var max = window.tn[key].curResolution_max;
    var screens = window.tn[key].screens;
    var v = res === max
      ? elem.getAttribute('data-field-' + field + '-value')
      : elem.getAttribute('data-field-' + field + '-res-' + res + '-value');
    // Пустая строка — валидное значение (в оригинале каскад идёт только при null).
    if (!v && v !== '') {
      for (var i = 0; i < screens.length; i++) {
        var s = screens[i];
        if (s <= res) continue;
        v = s === max
          ? elem.getAttribute('data-field-' + field + '-value')
          : elem.getAttribute('data-field-' + field + '-res-' + s + '-value');
        if (v) break;
      }
    }
    var parsed = parseGlobalStyleVar(v);
    return parsed !== null ? parsed : v;
  };

  window.t396_group__getFieldValue = function (group, field) {
    if (!group) return null;
    var key = 'ab' + group.closest('.t396__artboard').getAttribute('data-artboard-recid');
    var res = window.tn[key].curResolution;
    var max = window.tn[key].curResolution_max;
    var screens = window.tn[key].screens;
    var suffix = ['widthmode', 'heightmode', 'flex'].includes(field) ? '' : '-value';
    var v = res === max
      ? group.getAttribute('data-group-' + field + suffix)
      : group.getAttribute('data-group-' + field + '-res-' + res + suffix);
    if (v === null) {
      for (var i = 0; i < screens.length; i++) {
        var s = screens[i];
        if (s <= res) continue;
        v = s === max
          ? group.getAttribute('data-group-' + field + suffix)
          : group.getAttribute('data-group-' + field + '-res-' + s + suffix);
        if (v !== null) break;
      }
    }
    var parsed = parseGlobalStyleVar(v);
    return parsed !== null ? parsed : v;
  };

  window.t396_core__getFieldValue = function (el, field) {
    return el.classList.contains('t396__elem')
      ? t396_elem__getFieldValue(el, field)
      : t396_group__getFieldValue(el, field);
  };

  /* ---------- размеры артборда и элементов ---------- */
  window.t396_ab__getHeight = function (artboard, given) {
    var h = given || t396_ab__getFieldValue(artboard, 'height');
    h = parseFloat(h);
    var vh = t396_ab__getFieldValue(artboard, 'height_vh');
    if (vh) {
      vh = parseFloat(vh);
      if (!isNaN(vh)) {
        var winH = abWindowHeight(artboard) * vh / 100;
        if (h < winH) h = winH;
      }
    }
    return h;
  };

  window.t396_elem__getWidth = function (elem, given) {
    var w = given || t396_elem__getFieldValue(elem, 'width');
    w = parseFloat(w);
    if (t396_elem__getFieldValue(elem, 'widthunits') === '%') {
      var key = 'ab' + elem.closest('.t396__artboard').getAttribute('data-artboard-recid');
      w = t396_elem__getFieldValue(elem, 'container') === 'window'
        ? getWindowDimensions().width * w / 100
        : window.tn[key].grid_width * w / 100;
    }
    return w;
  };

  window.t396_elem__getHeight = function (elem, given) {
    var h = given || t396_elem__getFieldValue(elem, 'height');
    h = parseFloat(h);
    var type = elem.getAttribute('data-elem-type');
    var textfit = t396_elem__getFieldValue(elem, 'textfit');
    if (!textfit) {
      if (type === 'button') textfit = 'fixedsize';
      else if (type === 'text') textfit = 'autoheight';
    }
    if (type === 'shape' || type === 'video' || type === 'html' || type === 'gallery' ||
        ((type === 'text' || type === 'button') && textfit === 'fixedsize')) {
      if (t396_elem__getFieldValue(elem, 'heightunits') === '%') {
        var artboard = elem.closest('.t396__artboard');
        var minH = parseFloat(artboard ? artboard.getAttribute('data-artboard-proxy-min-height') : '0');
        var maxH = parseFloat(artboard ? artboard.getAttribute('data-artboard-proxy-max-height') : '0');
        h = t396_elem__getFieldValue(elem, 'container') === 'window'
          ? maxH * (h / 100)
          : minH * (h / 100);
      }
      return h;
    }
    if (type === 'text') {
      var atom = elem.querySelector('.tn-atom');
      if (atom) atom.style.lineHeight = '';
    }
    return elem.clientHeight;
  };

  function roundFloat(v) { return Math.round(100 * v) / 100; }

  /* ---------- позиционирование ---------- */
  // Локальная координата поля → абсолютный px. Scale-поправки оригинала
  // (ветки f/g/k) выброшены — upscale="window" на страницах нет. Группы
  // (data-group-type-value="physical", 440 шт.) поддержаны: сама группа
  // позиционируется как элемент грида, элемент ВНУТРИ группы получает
  // локальную координату (группа — его positioning context).
  window.t396_elem__convertPosition__Local__toAbsolute = function (elem, axis, value) {
    if (!elem) return null;
    var artboard = elem.closest('.t396__artboard');
    var key = 'ab' + artboard.getAttribute('data-artboard-recid');
    var container = t396_elem__getFieldValue(elem, 'container');
    var isGroup = elem.classList.contains('tn-group') &&
      t396_group__getFieldValue(elem, 'type') === 'physical';
    var parentGroup = elem.parentNode.closest('.tn-group');
    var inGroup = t396_group__getFieldValue(parentGroup, 'type') === 'physical';
    if (isGroup) container = container || 'grid';
    var y = parseInt(value);

    if (axis === 'left') {
      var winW = getWindowDimensions().width;
      var base = container === 'grid' ? window.tn[key].grid_offset_left : 0;
      var V = container === 'grid' ? window.tn[key].grid_width : winW;
      if (t396_elem__getFieldValue(elem, 'leftunits') === '%') {
        y = roundFloat(V * y / 100);
      }
      if (inGroup) {
        var gLeft = parseInt(t396_group__getFieldValue(parentGroup, 'left'), 10);
        if (t396_group__getFieldValue(parentGroup, 'leftunits') === '%') {
          gLeft = roundFloat(V * gLeft / 100);
        }
        return y - gLeft;
      }
      y = base + y;
      var axisx = t396_elem__getFieldValue(elem, 'axisx');
      if (axisx === 'center') y = V / 2 - t396_elem__getWidth(elem) / 2 + y;
      if (axisx === 'right') y = V - t396_elem__getWidth(elem) + y;
      return y;
    }

    // top
    var offsetTop = parseFloat(artboard.getAttribute('data-artboard-proxy-min-offset-top') || '0');
    var minH = parseFloat(artboard.getAttribute('data-artboard-proxy-min-height') || '0');
    var maxH = parseFloat(artboard.getAttribute('data-artboard-proxy-max-height') || '0');
    var base2 = container === 'grid' ? offsetTop : 0;
    var H = container === 'grid' ? minH : maxH;
    if (t396_elem__getFieldValue(elem, 'topunits') === '%') {
      y = H * (y / 100);
    }
    if (inGroup) {
      var gTop = parseInt(t396_group__getFieldValue(parentGroup, 'top'), 10);
      if (t396_group__getFieldValue(parentGroup, 'topunits') === '%') {
        gTop = roundFloat(H * gTop / 100);
      }
      return y - gTop;
    }
    y = base2 + y;
    var axisy = t396_elem__getFieldValue(elem, 'axisy');
    if (axisy === 'center' || axisy === 'bottom') {
      // Для картинок высота считается по аспекту filewidth/fileheight,
      // а не по clientHeight — иначе до догрузки картинки центр плывёт.
      var h = t396_elem__getHeight(elem);
      if (elem.getAttribute('data-elem-type') === 'image') {
        var fw = t396_elem__getFieldValue(elem, 'filewidth');
        var fh = t396_elem__getFieldValue(elem, 'fileheight');
        if (fw && fh) h = t396_elem__getWidth(elem) / (parseInt(fw) / parseInt(fh));
      }
      y = axisy === 'center' ? H / 2 - h / 2 + y : H - h + y;
    }
    return y;
  };

  /* ---------- рендер артборда (прокси-атрибуты, height_vh) ---------- */
  window.t396_ab__renderView = function (artboard) {
    if (!artboard) return;
    var height = t396_ab__getFieldValue(artboard, 'height');
    var fullHeight = t396_ab__getHeight(artboard);
    var offset;
    if (Number(height) === fullHeight) {
      offset = 0;
    } else {
      switch (t396_ab__getFieldValue(artboard, 'valign')) {
        case 'center': offset = parseFloat(((fullHeight - height) / 2).toFixed(1)); break;
        case 'bottom': offset = parseFloat((fullHeight - height).toFixed(1)); break;
        case 'stretch': offset = 0; height = fullHeight; break;
        default: offset = 0;
      }
    }
    artboard.setAttribute('data-artboard-proxy-min-offset-top', offset);
    artboard.setAttribute('data-artboard-proxy-min-height', height);
    artboard.setAttribute('data-artboard-proxy-max-height', fullHeight);

    // Мобильные браузеры меняют 100vh при скрытии панелей — высота пишется в px.
    var vh = parseFloat(t396_ab__getFieldValue(artboard, 'height_vh'));
    if ((window.t396__isMobile || window.t396__isIPad) && vh) {
      var px = abWindowHeight(artboard) * vh / 100 + 'px';
      artboard.style.height = px;
      var filter = artboard.querySelector('.t396__filter');
      var carrier = artboard.querySelector('.t396__carrier');
      if (filter) filter.style.height = px;
      if (carrier) carrier.style.height = px;
    }
  };

  /* ---------- рендер элементов ---------- */
  window.t396_elem__renderViewOneField = function (elem, field) {
    if (!elem) return;
    var v = t396_elem__getFieldValue(elem, field);
    var type, textfit;
    switch (field) {
      case 'left':
        v = t396_elem__convertPosition__Local__toAbsolute(elem, 'left', v);
        elem.style.left = parseFloat(v).toFixed(1) + 'px';
        break;
      case 'top':
        v = t396_elem__convertPosition__Local__toAbsolute(elem, 'top', v);
        elem.style.top = parseFloat(v).toFixed(1) + 'px';
        break;
      case 'width':
        type = elem.getAttribute('data-elem-type');
        var widthmode = t396_elem__getFieldValue(elem, 'widthmode');
        textfit = t396_elem__getFieldValue(elem, 'textfit');
        if (!textfit) {
          if (type === 'button') textfit = 'fixedsize';
          else if (type === 'text') textfit = 'autoheight';
        }
        if ((type === 'text' || type === 'button') && textfit === 'autowidth') {
          elem.style.width = 'auto';
          return;
        }
        if (widthmode === 'fill' || widthmode === 'hug') {
          elem.style.width = '';
          return;
        }
        v = t396_elem__getWidth(elem, v);
        elem.style.width = parseFloat(v).toFixed(1) + 'px';
        break;
      case 'height':
        type = elem.getAttribute('data-elem-type');
        var heightmode = t396_elem__getFieldValue(elem, 'heightmode');
        textfit = t396_elem__getFieldValue(elem, 'textfit');
        if (!textfit) {
          if (type === 'button') textfit = 'fixedsize';
          else if (type === 'text') textfit = 'autoheight';
        }
        if ((type === 'text' || type === 'button') &&
            ['autowidth', 'autoheight', 'singleline'].includes(textfit)) {
          elem.style.height = 'auto';
          return;
        }
        if (heightmode === 'fill' || heightmode === 'hug') {
          elem.style.height = '';
          return;
        }
        v = t396_elem__getHeight(elem, v);
        elem.style.height = parseFloat(v).toFixed(1) + 'px';
        break;
      case 'container':
        t396_elem__renderViewOneField(elem, 'left');
        t396_elem__renderViewOneField(elem, 'top');
        return;
      case 'inputs':
        try {
          window.t_zeroForms__renderForm(elem, t396_elem__getFormInputsValue(elem));
        } catch (e) {}
        break;
    }
    // Центровка зависит от размеров — после полей размера left/top пересчитываются.
    if (['width', 'height', 'fontsize', 'fontfamily', 'letterspacing', 'fontweight', 'img'].includes(field)) {
      t396_elem__renderViewOneField(elem, 'left');
      t396_elem__renderViewOneField(elem, 'top');
    }
  };

  window.t396_elem__renderView = function (elem) {
    var fields = elem ? elem.getAttribute('data-fields') : '';
    if (!fields) return;
    fields.split(',').forEach(function (f) {
      t396_elem__renderViewOneField(elem, f);
    });
  };

  window.t396_allelems__renderView = function (artboard) {
    if (!artboard) return;
    Array.prototype.forEach.call(artboard.querySelectorAll('.tn-elem'), function (el) {
      t396_elem__renderView(el);
    });
  };

  // Группа позиционируется по своим data-fields ("top,left,container" в разметке).
  window.t396_group__renderView = function (group) {
    var fields = group ? group.getAttribute('data-fields') : '';
    if (!fields) return;
    fields.split(',').forEach(function (f) {
      var v;
      switch (f) {
        case 'left':
          v = t396_elem__convertPosition__Local__toAbsolute(group, 'left',
            t396_group__getFieldValue(group, 'left'));
          group.style.left = parseFloat(v).toFixed(1) + 'px';
          break;
        case 'top':
          v = t396_elem__convertPosition__Local__toAbsolute(group, 'top',
            t396_group__getFieldValue(group, 'top'));
          group.style.top = parseFloat(v).toFixed(1) + 'px';
          break;
        case 'container':
          t396_elem__renderViewOneField(group, 'left');
          t396_elem__renderViewOneField(group, 'top');
          break;
      }
    });
  };

  // Autolayout флекс-групп: fill растягивается, hug сжимается по содержимому.
  function renderGroupAutolayout(group) {
    if (!group || !group.classList.contains('t396__group-flex')) return;
    var wm = t396_group__getFieldValue(group, 'widthmode');
    var hm = t396_group__getFieldValue(group, 'heightmode');
    if (wm === 'fill') {
      group.style.width = '100%';
      group.style.flexShrink = '1';
    } else {
      group.style.width = wm === 'hug' ? 'min-content' : '';
      group.style.height = hm === 'hug' ? 'initial' : '';
      group.style.flexShrink = '';
    }
  }

  window.t396_allgroups__renderView = function (artboard) {
    if (!artboard) return;
    Array.prototype.forEach.call(artboard.querySelectorAll('.tn-group'), function (g) {
      if (t396_group__getFieldValue(g, 'type') === 'physical') {
        t396_group__renderView(g);
        renderGroupAutolayout(g);
      }
    });
  };

  /* ---------- типы элементов ---------- */
  var FIELDS = {
    text: 'top,left,width,height,container,axisx,axisy,widthunits,leftunits,topunits',
    image: 'img,width,filewidth,fileheight,top,left,container,axisx,axisy,widthunits,leftunits,topunits',
    shape: 'width,height,top,left,container,axisx,axisy,widthunits,heightunits,leftunits,topunits',
    button: 'top,left,width,height,container,axisx,axisy,caption,leftunits,topunits',
    video: 'width,height,top,left,container,axisx,axisy,widthunits,heightunits,leftunits,topunits',
    html: 'width,height,top,left,container,axisx,axisy,widthunits,heightunits,leftunits,topunits',
    vector: 'width,filewidth,fileheight,top,left,container,axisx,axisy,widthunits,leftunits,topunits',
    // У форм высота не рендерится: их HTML строит t_zeroForms из JSON-конфига.
    form: 'width,top,left,inputs,container,axisx,axisy,widthunits,leftunits,topunits',
  };

  // JSON-конфиг формы из .tn-atom__inputs-textarea / .tn-atom__inputs-data.
  window.t396_elem__getFormInputsValue = function (elem) {
    var ta = elem.querySelector('.tn-atom__inputs-textarea');
    if (ta && ta.value) {
      try { return JSON.parse(ta.value); } catch (e) {
        console.error('Error parsing form inputs textarea value:', e, ta.value);
        return [];
      }
    }
    var data = elem.querySelector('.tn-atom__inputs-data');
    var v = data && data.getAttribute('data-value');
    if (v) {
      try { return JSON.parse(v); } catch (e) {
        console.error('Error parsing form inputs data:', e, v);
        return [];
      }
    }
    return [];
  };

  function addElem(artboard, elem, recid) {
    var type = elem.getAttribute('data-elem-type');
    var fields = FIELDS[type];
    if (!fields) return; // галерей и тултипов в выгрузке нет
    // Пререндер (build_pages.py: prerender_zero_forms) — разметка формы уже в
    // HTML, движка tilda-zero-forms на странице нет. Ждать его через
    // t_onFuncLoad нельзя: колбэк не выполнится никогда, и элемент останется
    // без width/top/left. Поле inputs такому элементу тоже не нужно.
    if (type === 'form' && elem.hasAttribute('data-suvvy-form')) {
      elem.setAttribute('data-fields', fields.replace(',inputs', ''));
      t396_elem__renderView(elem);
      return;
    }
    elem.setAttribute('data-fields', fields);
    if (type === 'form') {
      var inputs = t396_elem__getFormInputsValue(elem);
      var elemId = elem.getAttribute('data-fe-elem-id') || elem.getAttribute('data-elem-id');
      t_onFuncLoad('t_zeroForms__init', function () {
        t396_elem__renderView(elem);
        t_zeroForms__init(recid, elemId, inputs);
        t396_elem__renderView(elem);
      });
      return;
    }
    t396_elem__renderView(elem);
    if (type === 'image') {
      var img = elem.querySelector('img');
      if (img) {
        var refreshTop = function () {
          if (!document.contains(img)) return;
          t396_elem__renderViewOneField(elem, 'top');
          if (img.src) {
            setTimeout(function () {
              if (document.contains(img)) t396_elem__renderViewOneField(elem, 'top');
            }, 2000);
          }
        };
        img.addEventListener('load', refreshTop);
        if (img.complete) refreshTop();
      }
    }
    if (type === 'video') {
      // Как в оригинале: t396_initVideo не определён нигде даже в выгрузке —
      // поллинг с поздней ошибкой идентичен эталону.
      t_onFuncLoad('t396_initVideo', function () { t396_initVideo(elem); });
    }
  }

  window.t396_artboard_build = function (_, recid) {
    var rec = document.getElementById('rec' + recid);
    var artboard = rec ? rec.querySelector('.t396__artboard') : null;
    if (!artboard) return;
    t396_ab__renderView(artboard);
    t396_allgroups__renderView(artboard);
    Array.prototype.forEach.call(artboard.querySelectorAll('.tn-elem'), function (el) {
      addElem(artboard, el, recid);
    });
    artboard.classList.remove('rendering');
    artboard.classList.add('rendered');
    artboard.dispatchEvent(new Event('artBoardRendered', { bubbles: true, cancelable: true }));

    var ovrflw = artboard.getAttribute('data-artboard-ovrflw');
    if (ovrflw === 'visible' || ovrflw === 'visibleX') setOverflowToAllRecords();
    if (ovrflw === 'auto') {
      var diff = Math.abs(artboard.offsetHeight - artboard.clientHeight);
      if (diff !== 0) artboard.style.paddingBottom = diff + 'px';
    }
    if (window.t396__isMobile || window.t396__isIPad) {
      var st = document.createElement('style');
      st.textContent = '@media only screen and (min-width:1366px) and (orientation:landscape) and (-webkit-min-device-pixel-ratio:2) {.t396__carrier {background-attachment:scroll!important;}}';
      rec.insertAdjacentElement('beforeend', st);
    }
  };

  /* ---------- overflow у #allrecords ---------- */
  // Sticky-колонок чужих блоков (t951/t754/…) в выгрузке нет — всегда hidden.
  function setOverflowToAllRecords() {
    var all = document.getElementById('allrecords');
    if (!all) return;
    if (!document.getElementById('t396__overflow-styles')) {
      var st = document.createElement('style');
      st.id = 't396__overflow-styles';
      st.innerHTML = '.t-records__overflow-clip { overflow: clip; }\n.t-records__overflow-hidden { overflow: hidden; }';
      document.head.appendChild(st);
    }
    all.classList.remove('t-records__overflow-clip', 't-records__overflow-hidden');
    all.classList.add('t-records__overflow-hidden');
  }

  function initializeArtboardOverflow(allrecords, artboard) {
    if (!artboard || !allrecords) return;
    var overflow = window.getComputedStyle(artboard).getPropertyValue('overflow');
    if (overflow === 'auto') {
      var lazy = allrecords.getAttribute('data-tilda-lazy');
      if (window.lazy === 'y' || lazy === 'yes') {
        t_onFuncLoad('t_lazyload_update', function () {
          artboard.addEventListener('scroll', t_throttle(window.t_lazyload_update, 500));
        });
      }
    }
    // Прыжок к якорю при загрузке: мгновенный toggle гасит скачок раскладки.
    if (window.location.hash !== '' && overflow === 'visible') {
      artboard.style.overflow = 'hidden';
      setTimeout(function () { artboard.style.overflow = 'visible'; }, 1);
    }
  }

  function initializeAnchorLinkOverflowFix() {
    var arts = document.querySelectorAll('[data-artboard-ovrflw="visible"]');
    if (!arts.length) return;
    document.addEventListener('click', function (e) {
      if (!e.target.closest('a[href^="#"]')) return;
      arts.forEach(function (a) { a.style.overflow = 'hidden'; });
      setTimeout(function () {
        arts.forEach(function (a) { a.style.overflow = 'visible'; });
      });
    });
  }

  /* ---------- scale-переменные (у нас всегда 1 — upscale="grid") ---------- */
  window.t396__setGlobalScaleVariables = function (recid) {
    var key = 'ab' + recid;
    window.tn[key].scaleFactor = 1;
    window.tn_scale_factor = 1;
    var rec = document.getElementById('rec' + recid);
    if (rec) rec.style.setProperty('--zoom', '1');
    return 1;
  };
  window.t396__getCurrentScaleFactor = function (recid) {
    var key = 'ab' + recid;
    return (window.tn && window.tn[key] && window.tn[key].scaleFactor) || window.tn_scale_factor;
  };
  // .scaleFactor на элементах читает tilda-submenublocks.
  function setScaleFactorForElements(recid, factor) {
    var rec = document.getElementById('rec' + recid);
    var artboard = rec ? rec.querySelector('.t396__artboard') : null;
    if (!artboard) return;
    Array.prototype.forEach.call(artboard.querySelectorAll('.t396__elem, .tn-group'), function (el) {
      el.scaleFactor = factor;
    });
  }

  // Выгрузка сделана с TN_SCALE_INITIAL_VER="1.0": серверный скейл оставил
  // height:var(--initial-scale-height) — снимаем после рендера, как оригинал.
  function clearInitialScaleStyles() {
    if (window.TN_SCALE_INITIAL_VER !== '1.0') return;
    var clean = function (el) {
      if (el && el.style.getPropertyValue('height') === 'var(--initial-scale-height)') {
        el.style.removeProperty('height');
      }
    };
    getZeroBlocks().forEach(function (b) {
      var a = b.artboard;
      if (!a) return;
      a.style.removeProperty('--initial-scale-height');
      clean(a);
      clean(a.querySelector('.t396__carrier'));
      clean(a.querySelector('.t396__filter'));
    });
  }

  /* ---------- поиск блоков ---------- */
  function getArtboards(type) {
    var sel = '.r[data-record-type="' + type + '"]:not(.t397__off, .t395__off, .t400__off) .t396__artboard, ' +
      '.r[data-parenttplid="' + type + '"]:not(.t397__off, .t395__off, .t400__off) .t396__artboard';
    return Array.from(document.querySelectorAll(sel));
  }
  function getZeroBlocks() {
    var arts = [].concat(getArtboards('396'), getArtboards('121'));
    if (!arts.length) return [];
    return arts.map(function (a) {
      return { record: a.closest('.r:not(.t397__off):not(.t395__off):not(.t400__off)'), artboard: a };
    }).filter(function (b) { return b.record; });
  }
  window.t396__getZeroBlocks = getZeroBlocks;

  window.t396_isBlockVisible = function (record) {
    var w = window.innerWidth;
    var min = record.getAttribute('data-screen-min');
    var max = record.getAttribute('data-screen-max');
    if (min && w < parseInt(min, 10)) return false;
    if (max && w > parseInt(max, 10)) return false;
    return true;
  };

  /* ---------- фикс line-height текстов ---------- */
  // Замер computed line-height и запись его в px (плюс --lh-px). Safari-ветка
  // с zoom выброшена: zoom на элементы у нас никто не ставит (upscale="grid").
  function fixElementsLineHeights(elems) {
    var items = [];
    Array.prototype.forEach.call(elems, function (el) {
      if (el.getAttribute('data-elem-type') !== 'text') return;
      var atom = el.querySelector('.tn-atom');
      if (!atom) return;
      var units = el.getAttribute('data-field-lineheightunits-value') || '';
      items.push({ atom: atom, isRelative: units === '%' });
    });
    items.forEach(function (it) { it.atom.style.removeProperty('line-height'); });
    items.forEach(function (it) {
      it.computed = parseFloat(window.getComputedStyle(it.atom).lineHeight);
    });
    items.forEach(function (it) {
      if (!it.computed || isNaN(it.computed)) return;
      it.atom.style.setProperty('--lh-px', Math.round(it.computed) + 'px');
      if (!it.isRelative) it.atom.style.lineHeight = Math.round(it.computed) + 'px';
    });
  }

  function applyFixesForAllElements() {
    var elems = document.querySelectorAll('.t396__elem');
    var late = window.t396__isSafari || window.t396__isFacebookMessengerInApp || window.t396__isInstagramInApp;
    if (document.fonts && late) {
      document.fonts.ready.then(function () { fixElementsLineHeights(elems); });
    } else {
      fixElementsLineHeights(elems);
    }
  }

  /* ---------- ожидание рендера всех блоков ---------- */
  function isAllZeroBlocksRendered(cb) {
    var arts = getZeroBlocks().map(function (b) { return b.artboard; });
    if (!arts.length) return;
    var done = arts.filter(function (a) { return a.classList.contains('rendered'); });
    if (done.length === arts.length) { cb(); return; }
    var fired = false;
    arts.forEach(function (a) {
      if (a.classList.contains('rendered')) return;
      a.addEventListener('artBoardRendered', function () {
        done.push(a);
        if (done.length === arts.length && !fired) cb();
      });
    });
    setTimeout(function () {
      fired = true;
      if (done.length !== arts.length) cb();
    }, 3000);
  }

  /* ---------- попапы ---------- */
  function waitForPopup() {
    return new Promise(function (resolve) {
      var tries = 0;
      (function check() {
        var popup = document.querySelector('.t-popup_show');
        if (popup) resolve(popup);
        else if (tries >= 5) resolve(null);
        else { tries++; setTimeout(check, 100 * tries); }
      })();
    });
  }
  function handleResizeOpenedPopup() {
    waitForPopup().then(function (popup) {
      if (!popup) return;
      var artboard = popup.querySelector('.t396__artboard');
      if (artboard) t396_doResize(artboard.getAttribute('data-artboard-recid'));
    });
  }
  function initPopupResize() {
    document.body.removeEventListener('popupShowed', handleResizeOpenedPopup);
    document.body.addEventListener('popupShowed', handleResizeOpenedPopup);
  }

  /* ---------- ресайз ---------- */
  var finalEventTimers = {};
  function waitForFinalEvent(cb, ms, id) {
    if (finalEventTimers[id]) clearTimeout(finalEventTimers[id]);
    finalEventTimers[id] = setTimeout(cb, ms);
  }

  window.t396_doResize = function (recid, forceUpdateDims) {
    if (forceUpdateDims) updateWindowDimensions();
    var rec = document.getElementById('rec' + recid);
    var res = t396_detectResolution(recid);
    var artboard = rec ? rec.querySelector('.t396__artboard') : null;
    t396_switchResolution(recid, res);
    t396__setGlobalScaleVariables(recid);
    setScaleFactorForElements(recid, 1);
    t396_updateTNobj(recid);
    t396_ab__renderView(artboard);
    t396_allelems__renderView(artboard);
    t396_allgroups__renderView(artboard);
    applyFixesForAllElements();
    if (artboard) artboard.dispatchEvent(new CustomEvent('artBoardResized'));
  };

  function onResize() {
    waitForFinalEvent(function () {
      if (!revalidateDimensions()) return; // мобильный URL-бар меняет высоту — не ширину
      getZeroBlocks().forEach(function (b) {
        if (b.record && t396_isBlockVisible(b.record)) {
          try {
            t396_doResize(b.record.id.replace('rec', ''));
          } catch (e) {
            console.error('Error trying to resize ' + b.record.id, e);
          }
        }
      });
      document.dispatchEvent(new CustomEvent('zero:window-width-changed'));
    }, 500, 'global_resize_zero_unique_id');
  }

  function onOrientationChange() {
    waitForFinalEvent(function () {
      updateWindowDimensions();
      getZeroBlocks().forEach(function (b) {
        if (b.record && t396_isBlockVisible(b.record)) {
          t396_doResize(b.record.id.replace('rec', ''));
        }
      });
    }, 600, 'global_orientationchange_zero_unique_id');
  }

  /* ---------- инициализация ---------- */
  window.t396_init = function (recid) {
    var rec = document.getElementById('rec' + recid);
    var t396El = rec ? rec.querySelector('.t396') : null;
    var artboard = rec ? rec.querySelector('.t396__artboard') : null;
    if (!artboard) return;
    t396_initTNobj(recid, artboard);
    var res = t396_detectResolution(recid);
    t396_switchResolution(recid, res);
    t396__setGlobalScaleVariables(recid);
    setScaleFactorForElements(recid, 1);
    t396_updateTNobj(recid);
    t396_artboard_build('', recid);
    var allrecords = document.getElementById('allrecords');
    window.addEventListener('load', function () {
      t396_allelems__renderView(artboard);
      t396_allgroups__renderView(artboard);
      initializeArtboardOverflow(allrecords, artboard);
    });
    if (window.t396__isSafari && t396El) t396El.classList.add('t396_safari');
  };

  function globalInit() {
    if (!window.tn) createDefaultTN();
    isAllZeroBlocksRendered(function () {
      applyFixesForAllElements();
      initializeAnchorLinkOverflowFix();
      initPopupResize();
      clearInitialScaleStyles();
      window.addEventListener('resize', onResize);
      window.addEventListener('orientationchange', onOrientationChange);
    });
  }
  t_onReady(globalInit);
})();
