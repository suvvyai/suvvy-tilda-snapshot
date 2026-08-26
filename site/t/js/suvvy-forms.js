/* suvvy-forms.js — замена tilda-forms-1.0.min.js (волна форм чистки Тильды).
 *
 * ЧТО ЭТО. Оригинал — 101 КБ и ~80 глобальных функций на все случаи Тильды
 * (корзина, оплата, квизы, капча, условные формы, переменные, datepicker,
 * uploadcare, кэш-страницы). На suvvy.ai живут 9 классических форм в блоках
 * T702 + пререндеренные zero-формы внутри .t396 — им нужно ~15 % оригинала:
 * валидация, errorbox, отправка, успех, редирект.
 *
 * ГЛАВНОЕ ОТЛИЧИЕ ОТ ОРИГИНАЛА — ОТПРАВКА. Ничего не уходит в
 * forms.tildacdn.com, formskey не читается: заявка постится в наш приёмник
 * (см. ENDPOINT), тот кладёт её в PG и шлёт уведомление в Telegram.
 * `formservices[]` (Brevo/CRM-хуки Тильды) больше не работают — рассылку
 * разруливает приёмник по form_name. Поля отправляем как JSON, но с
 * Content-Type: text/plain — так запрос остаётся «простым» по CORS и уходит
 * без preflight (иначе браузер сначала шлёт OPTIONS, а приёмник его отдаёт
 * только для origin из cors_allowed_origins). Чтобы читать ОТВЕТ (и честно
 * показывать errorbox), origin сайта всё равно должен быть в
 * cors_allowed_origins приёмника — иначе fetch отвалится по CORS уже после
 * того, как лид сохранён, и человек увидит ошибку на успешной заявке.
 *
 * Публичные имена, которые зовут снаружи (сохранены дословно):
 *   t_forms__calculateInputsWidth(recId) — из t702_showPopup (suvvy-blocks.js
 *                                          и tilda-blocks-page*.min.js);
 *   t_forms__onSuccess(form)             — из t702_onSuccess (пара
 *                                          data-success-callback у всех 9 форм).
 * Плюс окно window.tildaForm.{validate,showErrors,hideErrors,send,successEnd,
 * showSuccessPopupNew,closeSuccessPopup,handleClosePopup} и события
 * tildaform:aftersuccess / tildaform:aftererror — на них может висеть
 * аналитика в head-коде проекта.
 *
 * Выброшено (в выгрузке 0 совпадений, проверено грепом): капча, корзина/оплата
 * (t706), квизы, условные формы, переменные {{form.*}}, кастомные маски,
 * datepicker/uploadcare/range/img-select, члены (window.mauser), кэш-страницы,
 * ретраи на forms2.tildacdn.com, старый попап #tildaformsuccesspopup.
 *
 * Зависимости — только глобалы suvvy-core.js (t_onReady, t_onFuncLoad,
 * t_throttle, t_addClass/t_removeClass, t_scrollTo, t_triggerEvent).
 * jQuery не нужен.
 */
(function () {
  'use strict';

  var ENDPOINT = window.SUVVY_FORMS_ENDPOINT ||
    'https://dev-dashboard-production-35b4.up.railway.app/marketing/savviconf/webhook?event=site';

  /* Служебные поля Тильды: в приёмник не идут. tildaspec-phone-part[] — это
   * видимая часть маски, настоящий телефон лежит в скрытом .js-phonemask-result
   * под родным именем поля (Phone). */
  var SERVICE_NAME = /^(formservices\[\]|tildaspec-|form-spec-comments$)/;

  /* Ключи, которые приёмник разбирает по колонкам (name/phone/email/message).
   * Всё остальное он кладёт в raw — поэтому «Компания», «Ник в Telegram» и
   * прочие поля мы дополнительно склеиваем в message, иначе их не видно
   * в Telegram-уведомлении. */
  var LEAD_NAME = ['name', 'firstname', 'first_name', 'имя'];
  var LEAD_PHONE = ['phone', 'tel', 'telephone', 'телефон'];
  var LEAD_MESSAGE = ['message', 'comment', 'text', 'textarea', 'сообщение', 'комментарий'];

  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  /* ---------- 1. Словарь сообщений (из оригинала, только живые ключи) ---------- */

  var MSG = {
    RU: {
      success_title: 'Спасибо!',
      success_text: 'Данные успешно отправлены.',
      success_btn: 'Хорошо',
      success_btn_redirect: 'Продолжить',
      success_info: 'Автоматический переход через:',
      success_info_redirect_error: 'Перенаправление...',
      success: 'Спасибо! Данные успешно отправлены.',
      email: 'Укажите, пожалуйста, корректный email',
      phone: 'Укажите, пожалуйста, корректный номер телефона',
      name: 'Укажите, пожалуйста, имя',
      string: 'Вы написали некорректные символы. Разрешены только буквы, числа и знаки пунктуации',
      req: 'Пожалуйста, заполните все обязательные поля',
      reqfield: 'Обязательное поле',
      minlength: 'Слишком короткое значение',
      emptyfill: 'Ни одно поле не заполнено',
      senderror: 'Не удалось отправить форму. Попробуйте ещё раз или напишите нам в Telegram.'
    },
    EN: {
      success_title: 'Thank you!',
      success_text: 'Data submitted successfully',
      success_btn: 'Done',
      success_btn_redirect: 'Continue',
      success_info: "You'll be automatically redirected in:",
      success_info_redirect_error: 'Redirecting...',
      success: 'Thank you! Your data has been submitted.',
      email: 'Please enter a valid email address',
      phone: 'Please put a correct phone number',
      name: 'Please put a name',
      string: 'You put incorrect symbols. Only letters, numbers and punctuation symbols are allowed',
      req: 'Please fill out all required fields',
      reqfield: 'Required field',
      minlength: 'Value is too short',
      emptyfill: 'None of the fields are filled in',
      senderror: 'Failed to submit the form. Please try again.'
    }
  };

  window.t_forms__lang = window.t_forms__lang || 'RU';

  function t_forms__getMsg(key) {
    var dict = MSG[window.t_forms__lang] || MSG.EN;
    return dict[key] || MSG.EN[key] || '';
  }

  /* ---------- 2. Мелкие утилиты ---------- */

  /* Оригинал принимал и jQuery-обёртку, и элемент. jQuery мы выкинули, но
   * форма всё ещё может прилететь как список (t702_onSuccess отдаёт что дали). */
  function getEl(x) {
    return x instanceof Element ? x : (x && x[0]);
  }

  function fadeIn(el) {
    if (!el || el.style.display === 'block') return;
    var op = 0;
    el.style.opacity = op;
    el.style.display = 'block';
    var t = setInterval(function () {
      el.style.opacity = op;
      op += 0.1;
      if (op >= 1) { el.style.opacity = ''; clearInterval(t); }
    }, 30);
  }

  function fadeOut(el) {
    if (!el) return;
    el.style.display = 'none';
    el.style.opacity = '';
  }

  function triggerEvent(el, name) {
    if (typeof window.t_triggerEvent === 'function') { window.t_triggerEvent(el, name); return; }
    el.dispatchEvent(new CustomEvent(name, { bubbles: true }));
  }

  function isIOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.MSStream;
  }

  /* Развилка «новый попап успеха» / «старый inline-successbox»: как в оригинале —
   * новый попап у всего, что не лежит внутри зеро-блока и прочих контейнеров
   * со своей вёрсткой формы. У нас: T702 → новый попап, .t396 → старый. */
  function t_forms__isNewSuccessBox(form) {
    if (!form) return false;
    if (form.closest('.t-quiz')) return false;
    return !['t396', 't447', 't651', 't653', 't706', 't708', 't945', 't1122'].some(function (cls) {
      return form.closest('.' + cls);
    });
  }

  /* ---------- 3. Инициализация ---------- */

  function initForms() {
    var forms = document.querySelectorAll('form.js-form-proccess');
    Array.prototype.forEach.call(forms, function (form) {
      if (form.suvvyFormsInited) return;
      form.suvvyFormsInited = true;

      /* data-formactiontype="2" = «форма шлётся аяксом»: гасим нативный сабмит. */
      if (form.getAttribute('data-formactiontype') === '2') form.setAttribute('action', '#');

      addHoneypot(form);
      initPlaceholderEvents(form);
      initFocusOnTab(form);

      form.addEventListener('submit', onSubmit);
      form.addEventListener('click', onClick);

      /* Новый попап успеха: оригинал помечает форму заранее, чтобы successbox
       * не рисовался инлайном (CSS .t-form-success-popup уже в tilda-forms CSS). */
      if (t_forms__isNewSuccessBox(form)) {
        form.setAttribute('data-success-popup', 'y');
        var box = form.querySelector('.t-form__successbox');
        if (box) box.classList.add('t-form-success-popup');
      }

      var rec = form.closest('.t-rec');
      if (rec) {
        t_forms__calculateInputsWidth(rec.id);
        t_onFuncLoad('t_throttle', function () {
          window.addEventListener('resize', window.t_throttle(function () {
            t_forms__calculateInputsWidth(rec.id);
          }));
        });
      }
    });
  }

  /* Honeypot приёмника: в разметке Тильды его нет (.js-form-spec-comments у нас
   * не встречается), поэтому поле hp добавляем сами. Человек его не видит и не
   * заполняет — заполненное hp приёмник считает ботом и молча отвечает ok. */
  function addHoneypot(form) {
    if (form.querySelector('input[name="hp"]')) return;
    var wrap = document.createElement('div');
    wrap.style.cssText = 'position:absolute;left:-5000px;bottom:0;display:none;';
    wrap.innerHTML = '<input type="text" name="hp" value="" tabindex="-1" autocomplete="off">';
    form.appendChild(wrap);
  }

  /* Плейсхолдер прячется на фокусе и возвращается на blur — как в оригинале.
   * У большинства полей placeholder уже снят инлайновым t_animateInputs
   * (он рисует .t-input__vis-ph), так что живьём это работает только на
   * поле телефона, где маску-подсказку ставит suvvy-phonemask.js. */
  function initPlaceholderEvents(form) {
    form.addEventListener('focus', function (e) {
      var input = e.target;
      if (!input || input.tagName !== 'INPUT') return;
      var ph = input.getAttribute('placeholder');
      if (ph) { input.suvvyPlaceholder = ph; input.setAttribute('placeholder', ''); }
    }, true);
    form.addEventListener('blur', function (e) {
      var input = e.target;
      if (!input || input.tagName !== 'INPUT') return;
      if (input.suvvyPlaceholder) input.setAttribute('placeholder', input.suvvyPlaceholder);
    }, true);
  }

  /* Обводка фокуса только при навигации с клавиатуры (класс .t-focusable в CSS). */
  function initFocusOnTab(form) {
    if (window.isMobile) return;
    var source = null;
    document.addEventListener('keydown', function () { source = 'keyboard'; });
    document.addEventListener('mousedown', function () { source = 'mouse'; });
    Array.prototype.forEach.call(form.querySelectorAll('.t-input, .t-select'), function (input) {
      input.addEventListener('focus', function () {
        if (source !== 'keyboard') return;
        var target = input;
        if (target.classList.contains('t-input_pvis') || target.classList.contains('t-input-phonemask')) {
          target = target.parentElement;
        }
        if (target) target.classList.add('t-focusable');
        source = null;
      });
      input.addEventListener('blur', function () {
        input.classList.remove('t-focusable');
        if (input.parentElement) input.parentElement.classList.remove('t-focusable');
      });
    });
  }

  function onSubmit(e) {
    e.preventDefault();
    var btn = e.currentTarget.querySelector('[type="submit"]');
    if (btn && !btn.classList.contains('t706__submit_disable')) btn.click();
  }

  function onClick(e) {
    var btn = e.target.closest && e.target.closest('[type="submit"]');
    if (!btn) return;
    var form = btn.closest('.js-form-proccess');
    if (!form) return;
    e.preventDefault();

    /* tildaSendingStatus: 1 — запрос в полёте, второй клик игнорируем. */
    if (btn.tildaSendingStatus && btn.tildaSendingStatus >= 1) return;
    btn.classList.add('t-btn_sending');
    btn.tildaSendingStatus = '1';

    window.tildaForm.hideErrors(form);
    var errors = window.tildaForm.validate(form);
    if (window.tildaForm.showErrors(form, errors)) {
      btn.classList.remove('t-btn_sending');
      btn.tildaSendingStatus = '0';
      return;
    }
    window.tildaForm.send(form, btn);
  }

  /* ---------- 4. Валидация ---------- */

  /* Правила, которые реально стоят в разметке (грепом по src/tilda):
   * data-tilda-req="1" ×22, rule="name" ×9, rule="email" ×2, rule="phone" ×1,
   * плюс rule="phone" + data-tilda-rule-minlength на скрытом поле от маски. */
  var RULE_EMAIL = /^[^\s@,;]+@[^\s@,;.]+(\.[^\s@,;.]+)+$/;
  /* Имя: оригинал сверял с километровой таблицей юникод-диапазонов. Смысл её —
   * «буквы, пробелы, дефис, апостроф, точка», цифр и служебных символов быть
   * не должно. Пишем это правило напрямую. */
  var RULE_NAME = /^[^\d!@#$%^*_=+<>{}[\]\\/|~`()]+$/;

  function isValidPhone(value) {
    var digits = value.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) return false;
    if (/^(\d)\1+$/.test(digits)) return false; /* 0000000000 и прочие «номера» */
    return true;
  }

  window.tildaForm = window.tildaForm || {};

  window.tildaForm.validate = function (formEl) {
    var form = getEl(formEl);
    var fields = form.querySelectorAll('.js-tilda-rule');
    var errors = [];
    var checkedGroups = {};
    var somethingFilled = false;

    Array.prototype.forEach.call(fields, function (input) {
      if (input.disabled) return;

      var name = input.getAttribute('name') || '';
      var type = (input.getAttribute('type') || '').toLowerCase();
      var required = parseInt(input.getAttribute('data-tilda-req') || 0, 10) === 1;
      var rule = input.getAttribute('data-tilda-rule') || 'none';
      var minlength = parseInt(input.getAttribute('data-tilda-rule-minlength') || 0, 10);
      var err = { obj: input, type: [] };

      /* Радио/чекбокс валидируем один раз на группу имён. */
      if (type === 'radio' || type === 'checkbox') {
        if (checkedGroups[name]) return;
        checkedGroups[name] = true;
        var checked = form.querySelectorAll('[name="' + name + '"]:checked').length;
        if (checked) somethingFilled = true;
        else if (required) { err.type.push('req'); errors.push(err); }
        return;
      }

      var value = (input.value || '').trim();
      if (value) somethingFilled = true;

      if (required && !value) {
        err.type.push('req');
      } else if (value) {
        if (rule === 'email' && !RULE_EMAIL.test(value)) err.type.push('email');
        if (rule === 'name' && !RULE_NAME.test(value)) err.type.push('name');
        if (rule === 'phone' && !isValidPhone(value)) err.type.push('phone');
        if (rule === 'string' && /[<>]/.test(value)) err.type.push('string');
        /* minlength ставит маска телефона: недобитый номер длиной меньше маски. */
        if (minlength && value.length < minlength && err.type.indexOf('phone') === -1) {
          err.type.push('minlength');
        }
      }

      if (err.type.length) errors.push(err);
    });

    /* Форма без обязательных полей, в которой вообще ничего не заполнено. */
    if (!errors.length && !somethingFilled && fields.length) {
      errors.push({ obj: 'none', type: [] });
    }
    return errors;
  };

  /* ---------- 5. Показ и скрытие ошибок (разметка 1:1 с оригиналом) ---------- */

  window.tildaForm.showErrors = function (formEl, errors) {
    var form = getEl(formEl);
    if (!errors || !errors.length) return false;

    var inputBoxSelector = form.getAttribute('data-inputbox') || '.t-input-group';

    errors.forEach(function (err, i) {
      if (err.obj === 'none') {
        if (i === 0) showEmptyFormError(form);
        return;
      }
      var group = err.obj.closest(inputBoxSelector);
      showInputErrors(form, group, err);
      showFormErrors(form, err);
    });

    /* Ошибки живут 10 секунд или до правки поля — как в оригинале. */
    scheduleErrorsAutoHide(form);
    scrollToInputWithError(errors[0]);
    Array.prototype.forEach.call(form.querySelectorAll('.js-errorbox-all'), function (box) {
      box.style.display = 'block';
    });
    form.classList.add('js-send-form-error');
    triggerEvent(form, 'tildaform:aftererror');
    return true;
  };

  /* Подпись под конкретным полем: .t-input-error#error_<lid> + красная рамка
   * через класс .js-error-control-box на группе (правило уже в CSS Тильды). */
  function showInputErrors(form, group, err) {
    if (!group) return;
    group.classList.add('js-error-control-box');
    var boxes = group.querySelectorAll('.t-input-error');
    err.type.forEach(function (rule) {
      var text = t_forms__getMsg(rule + 'field') || t_forms__getMsg(rule);
      if (!text) return;
      Array.prototype.forEach.call(boxes, function (box) { box.innerHTML = text; });
    });
  }

  /* Общий список ошибок формы: li.js-rule-error-<rule> в .js-errorbox-all. */
  function showFormErrors(form, err) {
    err.type.forEach(function (rule) {
      var items = form.querySelectorAll('.js-rule-error-' + rule);
      if (!items.length) items = form.querySelectorAll('.js-rule-error-all');
      Array.prototype.forEach.call(items, function (item) {
        setFormErrorMsg(item, t_forms__getMsg(rule));
        addMoveToInputHandler(err.obj, item);
      });
    });
  }

  function showEmptyFormError(form) {
    var items = form.querySelectorAll('.js-rule-error-all');
    Array.prototype.forEach.call(items, function (item) {
      setFormErrorMsg(item, t_forms__getMsg('emptyfill'));
    });
    addMoveToInputHandler(form.querySelector('.t-input-group'), items[0]);
  }

  /* Текст в списке — ссылкой: клик по ней ставит фокус в проблемное поле. */
  function setFormErrorMsg(item, text) {
    if (!text) return;
    item.innerHTML = '<a href="#" class="t-form__errorbox-link">' + text + '</a>';
    item.style.display = 'block';
  }

  function addMoveToInputHandler(target, item) {
    if (!item || !target || !(target instanceof Element)) return;
    item.TElementToFocus = target;
    item.removeEventListener('click', handleClickOnError);
    item.addEventListener('click', handleClickOnError);
  }

  function handleClickOnError(e) {
    e.preventDefault();
    var item = e.target.closest('.t-form__errorbox-item');
    if (item && item.TElementToFocus) focusInput(item.TElementToFocus);
  }

  function focusInput(target) {
    var input = target.querySelector ? (target.querySelector('input, textarea, select') || target) : target;
    if (input && input.focus) input.focus();
  }

  function scrollToInputWithError(err) {
    if (!err || !(err.obj instanceof Element)) return;
    if (window.isMobile) {
      t_onFuncLoad('t_scrollTo', function () { window.t_scrollTo(err.obj); });
    }
    focusInput(err.obj.closest('.t-input-group') || err.obj);
  }

  function scheduleErrorsAutoHide(form) {
    if (window.t_forms__errorTimerID) window.clearTimeout(window.t_forms__errorTimerID);
    window.t_forms__errorTimerID = window.setTimeout(function () {
      clearErrors(form);
      window.t_forms__errorTimerID = 0;
    }, 10000);
    if (form.suvvyErrorResetBound) return;
    form.suvvyErrorResetBound = true;
    /* Правка любого поля гасит ошибки — но не successbox: он мог только что
     * показаться после удачной отправки zero-формы. */
    form.addEventListener('focus', function (e) {
      if (e.target && e.target.tagName === 'INPUT') clearErrors(form);
    }, true);
    form.addEventListener('change', function () { clearErrors(form); }, true);
  }

  function clearErrors(form) {
    Array.prototype.forEach.call(form.querySelectorAll('.js-errorbox-all'), fadeOut);
    Array.prototype.forEach.call(form.querySelectorAll('.js-rule-error'), function (item) {
      item.style.display = 'none';
      item.innerHTML = '';
    });
    Array.prototype.forEach.call(form.querySelectorAll('.js-error-control-box .t-input-error'), function (box) {
      box.innerHTML = '';
    });
    Array.prototype.forEach.call(form.querySelectorAll('.js-error-control-box'), function (group) {
      group.classList.remove('js-error-control-box');
    });
    form.classList.remove('js-send-form-error');
  }

  window.tildaForm.hideErrors = function (formEl) {
    var form = getEl(formEl);
    if (!form) return;
    clearErrors(form);
    Array.prototype.forEach.call(form.querySelectorAll('.js-successbox'), fadeOut);
  };

  /* ---------- 6. Сбор данных и отправка в наш приёмник ---------- */

  /* Человеческая подпись поля: сначала заголовок группы (радио), потом
   * плейсхолдер (у Тильды он же и есть подпись), потом data-field-name. */
  function fieldLabel(input) {
    var group = input.closest('.t-input-group');
    if (group) {
      var title = group.querySelector('.t-input-title');
      if (title && title.textContent.trim()) return title.textContent.trim();
    }
    var visible = input.parentElement && input.parentElement.querySelector('.t-input__vis-ph');
    if (visible && visible.textContent.trim()) return visible.textContent.trim();
    var ph = input.getAttribute('placeholder') || input.suvvyPlaceholder;
    if (ph && !/^\+?[\d()\-\s]+$/.test(ph)) return ph;
    if (group && group.getAttribute('data-field-name')) return group.getAttribute('data-field-name');
    return input.getAttribute('name') || '';
  }

  function isLeadKey(name) {
    var key = name.toLowerCase();
    return LEAD_NAME.indexOf(key) !== -1 ||
      LEAD_PHONE.indexOf(key) !== -1 ||
      LEAD_MESSAGE.indexOf(key) !== -1 ||
      key.indexOf('email') !== -1;
  }

  function collectPayload(form) {
    var fields = {};   /* name -> значение, в приёмник как есть */
    var extras = [];   /* «подпись: значение» для склейки в message */

    Array.prototype.forEach.call(form.elements, function (input) {
      var name = input.getAttribute && input.getAttribute('name');
      if (!name || input.disabled) return;
      if (SERVICE_NAME.test(name)) return;
      if (name === 'hp') return; /* honeypot добавим отдельно, всегда пустым */
      var type = (input.type || '').toLowerCase();
      if (type === 'submit' || type === 'button') return;
      if ((type === 'checkbox' || type === 'radio') && !input.checked) return;

      var value = (input.value || '').trim();
      if (!value) return;

      fields[name] = fields[name] ? fields[name] + ', ' + value : value;
      if (!isLeadKey(name)) extras.push(fieldLabel(input) + ': ' + value);
    });

    var payload = {};
    payload.form_name = formName(form);
    payload.page = location.pathname;
    /* message приёмник ищет по первому подходящему ключу в порядке словаря,
     * поэтому кладём его до полей формы. */
    if (!Object.keys(fields).some(function (k) { return LEAD_MESSAGE.indexOf(k.toLowerCase()) !== -1; })) {
      if (extras.length) payload.message = extras.join('\n');
    }
    Object.keys(fields).forEach(function (k) { payload[k] = fields[k]; });

    var utm = readUtm();
    UTM_KEYS.forEach(function (k) { if (utm[k]) payload[k] = utm[k]; });

    payload.page_url = location.href;
    if (document.referrer) payload.referrer = document.referrer;
    var rec = form.closest('.t-rec');
    if (rec) payload.rec_id = rec.id;
    if (form.id) payload.tilda_form_id = form.id;
    payload.hp = (form.querySelector('input[name="hp"]') || {}).value || '';
    return payload;
  }

  /* Имя формы: скрытое поле tildaspec-formname (у 6 форм), у пререндеренных
   * zero-форм — data-field-formname-value, иначе id формы. */
  function formName(form) {
    var spec = form.querySelector('input[name="tildaspec-formname"]');
    if (spec && spec.value) return spec.value;
    var attr = form.getAttribute('data-formname') ||
      form.getAttribute('data-field-formname-value');
    if (attr) return attr;
    var zero = form.closest('[data-field-formname-value]');
    if (zero) return zero.getAttribute('data-field-formname-value');
    return form.id || '';
  }

  /* UTM: из текущего URL, иначе из куки/localStorage, куда их мог положить
   * счётчик. Своих кук не ставим. */
  function readUtm() {
    var out = {};
    var params = new URLSearchParams(location.search);
    UTM_KEYS.forEach(function (key) {
      var value = params.get(key);
      if (!value) value = readCookie(key);
      if (!value) { try { value = localStorage.getItem(key); } catch (e) { value = null; } }
      if (value) out[key] = value;
    });
    return out;
  }

  function readCookie(name) {
    var m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return m ? decodeURIComponent(m[2]) : '';
  }

  window.tildaForm.send = function (formEl, btn) {
    var form = getEl(formEl);
    var payload = collectPayload(form);

    fetch(ENDPOINT, {
      method: 'POST',
      /* text/plain вместо application/json — «простой» запрос без preflight;
       * приёмник читает тело как JSON независимо от заголовка. */
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify(payload),
      keepalive: true
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json().catch(function () { return {}; });
    }).then(function (data) {
      if (data && data.error) throw new Error(data.error);
      if (btn) { btn.classList.remove('t-btn_sending'); btn.tildaSendingStatus = '0'; }
      triggerEvent(form, 'tildaform:aftersuccess');
      window.tildaForm.successEnd(
        form,
        form.getAttribute('data-success-url'),
        form.getAttribute('data-success-callback')
      );
    }).catch(function (e) {
      showSendError(form, btn, e);
    });
  };

  /* Ошибка сети/сервера — в тот же errorbox, что и ошибки валидации. */
  function showSendError(form, btn, e) {
    if (window.t_jserrors && window.t_jserrors.push) {
      window.t_jserrors.push({ message: 'suvvy-forms send: ' + (e && e.message), filename: 'suvvy-forms.js', lineno: 0, colno: 0 });
    }
    var items = form.querySelectorAll('.js-errorbox-all .js-rule-error-all');
    Array.prototype.forEach.call(items, function (item) {
      item.innerHTML = t_forms__getMsg('senderror');
      item.style.display = 'block';
    });
    Array.prototype.forEach.call(form.querySelectorAll('.js-errorbox-all'), function (box) {
      box.style.display = 'block';
    });
    form.classList.add('js-send-form-error');
    if (btn) { btn.classList.remove('t-btn_sending'); btn.tildaSendingStatus = '0'; }
    triggerEvent(form, 'tildaform:aftererror');
  }

  /* ---------- 7. Успех: новый попап (T702) и старый inline-successbox (.t396) ---------- */

  window.tildaForm.successEnd = function (formEl, successUrl, successCallback) {
    var form = getEl(formEl);
    form.classList.add('js-send-form-success');

    var popup = form.closest('.t-popup');
    var useNewPopup = t_forms__isNewSuccessBox(form) && popup;

    function finish() {
      showSuccessbox(form);
      handleSuccess(form, successUrl, successCallback);
      clearFormInputs(form);
    }

    if (useNewPopup) {
      /* Сначала закрывается сам T702 (иначе попап успеха рисуется поверх
       * формы), и только через 320 мс — попап успеха. */
      processFormsInPopup(popup, form);
      setTimeout(finish, 320);
      return;
    }
    finish();
  };

  function handleSuccess(form, successUrl, successCallback) {
    var callback = (successCallback || '').replace('window.', '');
    if (callback && typeof window[callback] === 'function') {
      window[callback](form);           /* t702_onSuccess → t_forms__onSuccess */
    } else if (successUrl) {
      t_forms__handleRedirect(form, successUrl, form.querySelector('.t-form__successbox'));
    }
  }

  /* Копируем фон попапа формы в попап успеха и закрываем сам блок-попап
   * его же функцией (t702_closePopup из suvvy-blocks.js). */
  function processFormsInPopup(popup, form) {
    if (popup.style.backgroundColor) {
      var style = document.createElement('style');
      style.className = 't-success-popup';
      style.textContent = '#tildaformsuccesspopup-new { background-color: ' + popup.style.backgroundColor + '; }';
      document.head.appendChild(style);
    }
    var rec = form.closest('.t-rec');
    if (!rec) return;
    var type = rec.getAttribute('data-parenttplid') || rec.getAttribute('data-record-type');
    if (type === '121') {
      var container = popup.querySelector('.t-popup__container');
      type = (container && container.getAttribute('data-popup-type')) || '121';
    }
    var close = window['t' + type + '_closePopup'];
    if (typeof close === 'function') close(rec.id.replace('rec', ''));
  }

  /* .js-successbox: у zero-форм показывается инлайном, у T702 служит источником
   * текстов для попапа (в разметке он пустой → берутся тексты из словаря). */
  function showSuccessbox(form) {
    var box = form.querySelector('.js-successbox');
    if (!box) return;
    var isNew = t_forms__isNewSuccessBox(form);
    var content = getSuccessBoxContent(box, isNew);

    box.innerHTML = isNew
      ? '<div class="t-form__successbox-title">' + content.title + '</div>' +
        '<div class="t-form__successbox-text">' + content.text + '</div>' +
        '<div class="t-form__successbox-btn">' + content.button + '</div>'
      : content.text;

    if (form.getAttribute('data-success-popup') !== 'y') {
      box.style.display = 'block';
      return;
    }
    window.tildaForm.showSuccessPopupNew(form, content.text, content.title, content.button);
  }

  function getSuccessBoxContent(box, isNew) {
    var custom = box.getAttribute('data-success-message');
    var out = { text: '', title: '', button: '' };
    if (custom) out.text = custom;
    else if (box.textContent && box.textContent.trim()) out.text = box.innerHTML;
    else out.text = t_forms__getMsg('success');
    if (isNew) {
      if (!custom) out.text = '';
      out.title = box.getAttribute('data-success-title') || '';
      out.button = box.getAttribute('data-success-btn') || '';
    }
    return out;
  }

  /* Разметка попапа успеха — дословно из t_forms__drawNewSuccessPopup оригинала:
   * на неё завязаны стили .t-form-success-popup* в tilda-forms-1.0.min.css. */
  function drawNewSuccessPopup() {
    return '' +
      '<div class="t-form-success-popup t-form-success-popup_new" style="display:none;" id="tildaformsuccesspopup-new"' +
      ' role="dialog" aria-modal="true" tabindex="-1" aria-label="Success">' +
      '<div class="t-form-success-popup__wrapper">' +
      '<button type="button" class="t-form-success-popup__close-icon" id="tildaformsuccesspopupclose-new" aria-label="Закрыть диалоговое окно">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">' +
      '<path fill="#000" fill-rule="evenodd" d="M7 5.863 1.138 0 0 1.138 5.862 7 0 12.862 1.137 14 7 8.137 12.863 14 14 12.862 8.138 7 14 1.138 12.863 0 7.001 5.863Z" clip-rule="evenodd" opacity=".4"/>' +
      '</svg></button>' +
      '<svg class="t-form-success-popup__content-icon" xmlns="http://www.w3.org/2000/svg" width="41" height="41" fill="none" viewBox="0 0 210 210">' +
      '<path class="t-form-success-popup__content-icon-background" fill="#30C546" d="M 86.0696 10.2777 C 97.7443 -0.973851 116.104 -0.973851 127.779 10.2777 L 127.779 10.2777 C 133.881 16.1585 142.136 19.1954 150.551 18.6547 L 150.551 18.6547 C 166.65 17.6203 180.714 29.5482 182.502 45.7521 L 182.502 45.7521 C 183.436 54.2214 187.829 61.9111 194.619 66.9636 L 194.619 66.9636 C 207.609 76.6302 210.798 94.9049 201.862 108.479 L 201.862 108.479 C 197.191 115.574 195.665 124.318 197.653 132.6 L 197.653 132.6 C 201.457 148.445 192.277 164.515 176.799 169.108 L 176.799 169.108 C 168.709 171.509 161.979 177.216 158.235 184.852 L 158.235 184.852 C 151.072 199.461 133.819 205.807 119.041 199.27 L 119.041 199.27 C 111.317 195.853 102.532 195.853 94.8075 199.27 L 94.8075 199.27 C 80.0294 205.807 62.7766 199.461 55.6135 184.852 L 55.6135 184.852 C 51.8695 177.216 45.1396 171.509 37.0495 169.108 L 37.0495 169.108 C 21.5714 164.515 12.3913 148.445 16.1948 132.6 L 16.1948 132.6 C 18.1828 124.318 16.6573 115.574 11.9867 108.479 L 11.9867 108.479 C 3.05084 94.9049 6.23902 76.6302 19.2295 66.9636 L 19.2295 66.9636 C 26.0194 61.9111 30.4119 54.2214 31.3462 45.7521 L 31.3462 45.7521 C 33.1339 29.5482 47.1984 17.6203 63.2976 18.6547 L 63.2976 18.6547 C 71.7122 19.1954 79.9676 16.1585 86.0696 10.2777 L 86.0696 10.2777 Z"></path>' +
      '<path class="t-form-success-popup__content-icon-check" d="M 66.7645 107.258 L 90.6617 129.843 L 143.235 80.157" stroke="white" stroke-width="14.7059" stroke-linecap="round" stroke-linejoin="round" fill="none" pathLength="1"></path>' +
      '</svg>' +
      '<div class="t-form-success-popup__title t-title" id="tildaformsuccesspopuptitle-new"></div>' +
      '<div class="t-form-success-popup__text t-text" id="tildaformsuccesspopuptext-new"></div>' +
      '<a href="" class="t-form-success-popup__button t-btn t-form-success-popup_hidden" id="tildaformsuccesspopuplink-new"></a>' +
      '<button type="button" class="t-form-success-popup__button t-btn t-form-success-popup_hidden" id="tildaformsuccesspopupbtn-new"></button>' +
      '<div class="t-form-success-popup__info t-form-success-popup_hidden" id="tildaformsuccesspopupinfo-new">' +
      '<span class="t-form-success-popup__info-text t-text" id="tildaformsuccesspopupinfotext-new"></span>' +
      '<span class="t-form-success-popup__info-timer t-text">' +
      '<span class="t-form-success-popup__info-digit" id="tildaformsuccesspopupinfodigit-new"></span>' +
      '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M9 0.6C7.33864 0.6 5.71458 1.09265 4.33321 2.01566C2.95184 2.93866 1.87519 4.25056 1.23941 5.78546C0.603636 7.32036 0.437288 9.00932 0.761404 10.6388C1.08552 12.2682 1.88554 13.7649 3.0603 14.9397C4.23506 16.1145 5.7318 16.9145 7.36124 17.2386C8.99068 17.5627 10.6796 17.3964 12.2145 16.7606C13.7494 16.1248 15.0613 15.0482 15.9843 13.6668C16.9073 12.2854 17.4 10.6614 17.4 9" stroke="black" stroke-width="1.2"/>' +
      '</svg></span></div>' +
      '</div></div>';
  }

  window.tildaForm.showSuccessPopupNew = function (form, text, title, btnText) {
    var hasRedirect = !!form.getAttribute('data-success-url');
    /* Если редирект без своих текстов — попап не показываем: сразу уходим
     * по data-success-url (обратный отсчёт рисует t_forms__handleRedirect). */
    if (!window.isRedirectError && hasRedirect && !text && !title) return;

    var popup = document.getElementById('tildaformsuccesspopup-new');
    if (!popup) {
      document.body.insertAdjacentHTML('beforeend', drawNewSuccessPopup());
      popup = document.getElementById('tildaformsuccesspopup-new');
    }

    var noCustomText = !title && !text;
    var redirectError = window.isRedirectError && hasRedirect && noCustomText;

    fillSuccessPopup({
      title: { id: 'tildaformsuccesspopuptitle-new', content: noCustomText ? t_forms__getMsg('success_title') : title, show: noCustomText || !!title },
      text: { id: 'tildaformsuccesspopuptext-new', content: noCustomText ? t_forms__getMsg('success_text') : text, show: noCustomText || !!text },
      linkButton: { id: 'tildaformsuccesspopuplink-new', content: btnText || t_forms__getMsg(hasRedirect ? 'success_btn_redirect' : 'success_btn'), show: hasRedirect, href: form.getAttribute('data-success-url') },
      closeButton: { id: 'tildaformsuccesspopupbtn-new', content: btnText || t_forms__getMsg(hasRedirect ? 'success_btn_redirect' : 'success_btn'), show: !hasRedirect },
      info: { id: 'tildaformsuccesspopupinfo-new', content: null, show: hasRedirect },
      infoText: { id: 'tildaformsuccesspopupinfotext-new', content: t_forms__getMsg(redirectError ? 'success_info_redirect_error' : 'success_info'), show: hasRedirect },
      infoDigit: { id: 'tildaformsuccesspopupinfodigit-new', content: redirectError ? '' : '3', show: hasRedirect },
      closeIcon: { id: 'tildaformsuccesspopupclose-new', content: null, show: !hasRedirect }
    });
    restartCheckAnimation();
    setupCloseHandlers(popup, hasRedirect);

    fadeIn(popup);
    t_addClass(document.body, 't-body_success-popup-showed');
    popup.classList.add('t-popup_show');
    resizeSuccessPopup(popup);

    setTimeout(function () { popup.focus(); trapFocus(popup); }, 50);
  };

  function fillSuccessPopup(parts) {
    Object.keys(parts).forEach(function (key) {
      var part = parts[key];
      var el = document.getElementById(part.id);
      if (!el) return;
      el.classList.toggle('t-form-success-popup_hidden', !part.show);
      if (part.show && part.content) el.innerHTML = part.content;
      if (part.href) el.setAttribute('href', part.href);
    });
  }

  /* Галочка анимируется через CSS при появлении узла — переклонируем SVG,
   * чтобы анимация проигралась и на втором показе попапа. */
  function restartCheckAnimation() {
    var icon = document.querySelector('.t-form-success-popup__content-icon');
    if (!icon) return;
    icon.parentNode.replaceChild(icon.cloneNode(true), icon);
  }

  /* Если контент выше окна — попап перестаёт центрироваться (запас 120px). */
  function resizeSuccessPopup(popup) {
    var wrapper = popup.querySelector('.t-form-success-popup__wrapper');
    if (!wrapper) return;
    var styles = getComputedStyle(wrapper, null);
    var padding = (parseInt(styles.paddingTop, 10) || 0) + (parseInt(styles.paddingBottom, 10) || 0);
    var fits = wrapper.clientHeight - padding <= window.innerHeight - 120;
    wrapper.classList.toggle('t-popup__container-static', !fits);
  }

  function setupCloseHandlers(popup, hasRedirect) {
    var closeIcon = popup.querySelector('.t-form-success-popup__close-icon');
    var closeBtn = document.getElementById('tildaformsuccesspopupbtn-new');

    function onEsc(e) {
      if (e.key === 'Escape' || e.keyCode === 27) window.tildaForm.handleClosePopup();
    }
    function onOverlay(e) {
      if (e.target === popup) window.tildaForm.handleClosePopup();
    }
    window.tildaForm.currentRemoveCloseHandlers = function () {
      if (closeIcon) closeIcon.removeEventListener('click', window.tildaForm.handleClosePopup);
      if (closeBtn) closeBtn.removeEventListener('click', window.tildaForm.handleClosePopup);
      document.body.removeEventListener('keydown', onEsc);
      popup.removeEventListener('click', onOverlay);
    };
    if (closeIcon) closeIcon.addEventListener('click', window.tildaForm.handleClosePopup);
    if (closeBtn) closeBtn.addEventListener('click', window.tildaForm.handleClosePopup);
    /* При редиректе закрывать нечего — человек уходит на страницу «спасибо». */
    if (hasRedirect) return;
    document.body.addEventListener('keydown', onEsc);
    popup.addEventListener('click', onOverlay);
  }

  /* Цикл Tab внутри открытого попапа. */
  function trapFocus(popup) {
    var focusable = popup.querySelectorAll('a, button, input:not([type="hidden"]), select, textarea, [tabindex="0"]');
    var visible = Array.prototype.filter.call(focusable, function (el) {
      return !el.classList.contains('t-form-success-popup_hidden');
    });
    if (!visible.length) return;
    var first = visible[0];
    var last = visible[visible.length - 1];
    popup.suvvyTrap && document.removeEventListener('keydown', popup.suvvyTrap);
    popup.suvvyTrap = function (e) {
      if (e.key !== 'Tab') return;
      if (!document.body.classList.contains('t-body_success-popup-showed')) return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', popup.suvvyTrap);
  }

  window.tildaForm.closeSuccessPopup = function () {
    var popup = document.getElementById('tildaformsuccesspopup-new');
    if (!popup) return;
    t_removeClass(document.body, 't-body_success-popup-showed');
    fadeOut(popup);
    popup.classList.remove('t-popup_show');
    if (popup.suvvyTrap) document.removeEventListener('keydown', popup.suvvyTrap);
    var style = document.querySelector('style.t-success-popup');
    if (style && style.parentNode) style.parentNode.removeChild(style);
  };

  window.tildaForm.handleClosePopup = function () {
    window.tildaForm.closeSuccessPopup();
    if (typeof window.tildaForm.currentRemoveCloseHandlers === 'function') {
      window.tildaForm.currentRemoveCloseHandlers();
    }
  };

  /* ---------- 8. Чистка формы после успеха ---------- */

  function clearFormInputs(form) {
    Array.prototype.forEach.call(
      form.querySelectorAll('input[type="text"], input[type="number"], input[type="email"], input[type="tel"], input[type="hidden"][data-tilda-rule="phone"], textarea'),
      function (input) {
        input.value = '';
        /* .t-input_has-content вешает инлайновый t_animateInputs — без снятия
         * подпись поля (.t-input__vis-ph) остаётся поднятой над пустым полем. */
        input.classList.remove('t-input_has-content');
      }
    );
    Array.prototype.forEach.call(form.querySelectorAll('input[type="checkbox"], input[type="radio"]'), function (input) {
      input.checked = false;
    });
    /* reset слушает маска телефона — сбрасывает свою внутреннюю пару полей. */
    Array.prototype.forEach.call(form.querySelectorAll('.t-input-group_ph'), function (group) {
      triggerEvent(group, 'reset');
    });
  }

  window.t_forms__clearForm = function (formEl) {
    var form = getEl(formEl);
    if (form) clearFormInputs(form);
  };

  /* ---------- 9. Публичные t_forms__* (их зовёт поблочный JS) ---------- */

  /* Зовётся из t702_onSuccess (data-success-callback всех 9 форм).
   * Прячет поля формы (у zero-форм — классом t<тип>__inputsbox_hidden),
   * подскроллит к successbox и запускает редирект, если он задан. */
  window.t_forms__onSuccess = function (formEl) {
    window.isRedirectError = false;
    var form = getEl(formEl);
    if (!form) return;
    var rec = form.closest('.r');
    var type = rec && (rec.getAttribute('data-parenttplid') || rec.getAttribute('data-record-type'));

    /* T121 (попап-обёртка) сообщает свой настоящий тип через имя коллбэка. */
    if (type === '121') {
      var cb = form.getAttribute('data-success-callback');
      if (cb) type = cb.split('_onSuccess')[0].replace('t', '');
    }

    var inputsbox = form.querySelector('.t-form__inputsbox');
    var isNew = t_forms__isNewSuccessBox(form);
    if (inputsbox && !isNew) inputsbox.classList.add('t' + type + '__inputsbox_hidden');

    if (!isNew) {
      var successbox = form.querySelector('.t-form__successbox');
      var top = successbox ? successbox.getBoundingClientRect().top + window.pageYOffset : 0;
      if (top && top < window.scrollY) {
        t_onFuncLoad('t_scrollTo', function () { window.t_scrollTo(successbox); });
      }
    }

    var successUrl = form.getAttribute('data-success-url');
    if (successUrl) t_forms__handleRedirect(form, successUrl, form.querySelector('.t-form__successbox'));
  };

  /* Редирект по data-success-url: у 3 форм (thanks / web-hr-thanks / suvvyacademy).
   * В новом попапе — обратный отсчёт и кнопка-ссылка, в старом — просто переход. */
  function t_forms__handleRedirect(form, url, successBox) {
    var delay = 500;

    if (!t_forms__isNewSuccessBox(form)) {
      setTimeout(function () { window.location.href = url; }, delay);
      return;
    }

    var hasCustomText = !!((successBox && successBox.getAttribute('data-success-title')) ||
      (successBox && successBox.getAttribute('data-success-message')));
    var digit = document.getElementById('tildaformsuccesspopupinfodigit-new');
    var timer = null;
    var checkTimer = null;

    function go(href) {
      window.tildaForm.handleClosePopup();
      window.location.href = href;
    }
    function onLinkClick(e) {
      e.preventDefault();
      clearTimeout(timer);
      go(e.currentTarget.getAttribute('href'));
    }
    function countdown(ms) {
      if (!digit) return;
      var left = ms / 1000;
      digit.textContent = left;
      var iv = setInterval(function () {
        left--;
        digit.textContent = left;
        if (left <= 0) clearInterval(iv);
      }, 1000);
    }
    /* Переход не случился за 2 с (например, блокировщик) — показываем попап
     * с надписью «Перенаправление…» и живой ссылкой. */
    function showRedirectError() {
      window.isRedirectError = true;
      if (digit) digit.textContent = '';
      showSuccessbox(form);
      var link = document.getElementById('tildaformsuccesspopuplink-new');
      if (link) {
        link.removeEventListener('click', onLinkClick);
        link.addEventListener('click', onLinkClick);
      }
    }

    if (hasCustomText) { delay = 5000; countdown(delay); }

    var link = document.getElementById('tildaformsuccesspopuplink-new');
    if (link) {
      link.removeEventListener('click', onLinkClick);
      link.addEventListener('click', onLinkClick);
    }

    timer = setTimeout(function () {
      var before = window.location.href;
      go(url);
      if (!hasCustomText) {
        checkTimer = setTimeout(function () {
          if (window.location.href === before) showRedirectError();
        }, 2000);
      }
    }, delay);

    window.addEventListener('pageshow', function () {
      clearTimeout(timer);
      clearTimeout(checkTimer);
    });
  }

  /* Ширины полей в строку: зовётся из t702_showPopup, когда попап уже виден
   * (внутри display:none замеры дают 0). Классы t-input-group_* и
   * t-input-block_width* — из разметки Тильды, порядок правил 1:1. */
  window.t_forms__calculateInputsWidth = function (recId) {
    var id = (recId || '').toString().replace('rec', '');
    var rec = document.querySelector('#rec' + id);
    if (!rec) return;
    var inputsbox = rec.querySelector('.t-form__inputsbox');
    if (!inputsbox) return;

    var inRow = inputsbox.classList.contains('t-form__inputsbox_inrow');
    var groups = inRow
      ? rec.querySelectorAll('.t-input-group_widthdef, .t-input-group_inrow')
      : rec.querySelectorAll('.t-input-block_width');
    if (!groups.length) return;

    if (inputsbox.classList.contains('t-form__inputsbox_vertical-form')) {
      inputsbox.classList.add('t-form__inputsbox_flex');
    }
    var boxWidth = inputsbox.offsetWidth;

    Array.prototype.forEach.call(groups, function (item) {
      var group = inRow ? item : item.closest('.t-input-group');
      if (!group) return;
      if (group.classList.contains('t-input-group_inrow-withsibling')) {
        var next = group.nextElementSibling;
        if (next) next.classList.add('t-input-group_inonerow');
      } else {
        group.classList.add('t-input-group_inrow-last');
      }
      if (!inRow) calculateFieldWidth(item, boxWidth);
    });
  };

  /* Ширина поля в пикселях по классу t-input-block_width{100,50,33,25}
   * с зазором 15px между полями; ниже 480px всё в одну колонку. */
  function calculateFieldWidth(block, boxWidth) {
    var GAP = 15;
    var map = { 1: 't-input-block_width100', 2: 't-input-block_width50', 3: 't-input-block_width33', 4: 't-input-block_width25' };
    Object.keys(map).forEach(function (cols) {
      if (!block.classList.contains(map[cols])) return;
      var n = parseInt(cols, 10);
      var width = (boxWidth - GAP * (n - 1)) / n + 'px';
      var title = block.previousElementSibling;
      var isNarrow = window.innerWidth < 480;
      block.style.width = isNarrow ? '100%' : width;
      if (title && title.classList.contains('t-input-title')) {
        title.style.width = isNarrow ? '100%' : width;
      }
    });
  }

  /* ---------- 10. Старт ---------- */

  t_onReady(function () {
    var allrecords = document.getElementById('allrecords');
    if (allrecords) {
      var lang = allrecords.getAttribute('data-tilda-project-lang');
      if (lang && MSG[lang]) window.t_forms__lang = lang;
    }
    initForms();
    /* Пререндеренные zero-формы могут появиться позже (перерисовка .t396) —
     * ловим их тем же обработчиком по событию render. */
    Array.prototype.forEach.call(document.querySelectorAll('.t396__elem[data-elem-type="form"]'), function (elem) {
      elem.addEventListener('render', initForms);
    });
  });
})();
