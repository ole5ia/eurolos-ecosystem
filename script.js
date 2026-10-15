(function () {
  'use strict';

  document.documentElement.classList.add('js');

  /* ===== Аналитика =====
     Укажите номер счётчика Яндекс Метрики — и события начнут уходить в неё.
     Без номера события пишутся только в window.dataLayer (ничего не отправляется). */
  var YM_ID = 0;
  window.dataLayer = window.dataLayer || [];
  if (YM_ID) {
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(YM_ID, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
  }
  function track(name, params) {
    params = params || {};
    window.dataLayer.push({ event: name, params: params });
    if (YM_ID && window.ym) window.ym(YM_ID, 'reachGoal', name, params);
  }
  function sectionOf(el) {
    var sec = el.closest('section[id], header, footer, .sticky-cta, .modal');
    if (!sec) return 'page';
    return sec.id || (sec.classList.contains('sticky-cta') ? 'sticky' : sec.tagName.toLowerCase());
  }
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ===== Header shadow on scroll ===== */
  var header = document.querySelector('.site-header');
  function onHeaderScroll() { header.classList.toggle('is-scrolled', window.pageYOffset > 8); }
  if (header) {
    window.addEventListener('scroll', onHeaderScroll, { passive: true });
    onHeaderScroll();
  }

  var MARGIN_PER_STATION = 47880;

  function money(n) {
    var rounded = Math.round(n);
    var formatted = rounded.toLocaleString('ru-RU').replace(/[  ]/g, ' ');
    return formatted + ' ₽';
  }

  function plural(n, one, few, many) {
    var a = n % 10;
    var b = n % 100;
    if (a === 1 && b !== 11) return one;
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
    return many;
  }

  function stationsPhrase(n) {
    return n + ' ' + plural(n, 'станция', 'станции', 'станций');
  }

  /* ===== Calculator ===== */
  var DEPOSIT = 300000;
  var stationsInput = document.querySelector('[data-stations-input]');
  var monthsInput = document.querySelector('[data-months-input]');
  var calcSliders = document.querySelectorAll('[data-stations-input], [data-months-input]');
  var THUMB_SIZE = 26;
  var calcUsed = false;

  function fill(sel, text) { document.querySelectorAll(sel).forEach(function (el) { el.textContent = text; }); }

  function updateSliderVisual(input) {
    var min = Number(input.min);
    var max = Number(input.max);
    var percent = (Number(input.value) - min) / (max - min);
    input.style.background =
      'linear-gradient(to right, #FFDD00 0%, #FFDD00 ' + (percent * 100) + '%, #33373C ' + (percent * 100) + '%, #33373C 100%)';
    var bubble = input.parentElement.querySelector('[data-bubble]');
    if (bubble) bubble.style.left = (percent * (input.offsetWidth - THUMB_SIZE) + THUMB_SIZE / 2) + 'px';
  }

  var tweens = {};
  function tweenText(key, selector, target) {
    var els = document.querySelectorAll(selector);
    if (!els.length) return;
    var t = tweens[key] || (tweens[key] = { shown: target, raf: 0 });
    cancelAnimationFrame(t.raf);
    if (reduced) {
      t.shown = target;
      els.forEach(function (el) { el.textContent = money(target); });
      return;
    }
    var from = t.shown;
    var start = performance.now();
    function tick(now) {
      var p = Math.min((now - start) / 320, 1);
      t.shown = from + (target - from) * (1 - Math.pow(1 - p, 3));
      els.forEach(function (el) { el.textContent = money(t.shown); });
      if (p < 1) t.raf = requestAnimationFrame(tick);
    }
    t.raf = requestAnimationFrame(tick);
  }

  function paybackText(monthly) {
    var months = DEPOSIT / monthly;
    if (months <= 1) return 'меньше месяца';
    return '≈ ' + (Math.round(months * 10) / 10).toString().replace('.', ',') + ' мес.';
  }

  function renderCalculator(animate) {
    var stations = Number(stationsInput.value);
    var months = Number(monthsInput.value);
    var monthly = stations * MARGIN_PER_STATION;
    fill('[data-stations-value]', stations);
    fill('[data-months-value]', months);
    fill('[data-stations-phrase]', stationsPhrase(stations));
    fill('[data-months-phrase]', months + ' ' + plural(months, 'месяц', 'месяца', 'месяцев'));
    if (animate) {
      tweenText('monthly', '[data-monthly-text]', monthly);
      tweenText('season', '[data-season-text]', monthly * months);
    } else {
      fill('[data-monthly-text]', money(monthly));
      fill('[data-season-text]', money(monthly * months));
      tweens.monthly = { shown: monthly, raf: 0 };
      tweens.season = { shown: monthly * months, raf: 0 };
    }
    fill('[data-payback-text]', paybackText(monthly));
    fill('[data-payback-sub]', '≈ ' + Math.ceil(DEPOSIT / MARGIN_PER_STATION) + ' ' +
      plural(Math.ceil(DEPOSIT / MARGIN_PER_STATION), 'проданная станция', 'проданные станции', 'проданных станций') + ' при марже от ' + money(MARGIN_PER_STATION));
    calcSliders.forEach(updateSliderVisual);
    document.querySelectorAll('.calc-result__value').forEach(function (el) {
      el.classList.remove('is-bump'); void el.offsetWidth; if (animate && !reduced) el.classList.add('is-bump');
    });
  }

  fill('[data-margin-text]', money(MARGIN_PER_STATION));
  var calcPeek = document.querySelector('[data-calc-peek]');
  var calcResult = document.querySelector('.calc-result');
  if (calcPeek && calcResult) {
    calcPeek.addEventListener('click', function () {
      calcResult.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    });
  }
  if (stationsInput && monthsInput) {
    renderCalculator(false);
    calcSliders.forEach(function (el) {
      el.addEventListener('input', function () {
        renderCalculator(true);
        if (!calcUsed) { calcUsed = true; track('calculator_used'); }
      });
    });
    window.addEventListener('resize', function () { calcSliders.forEach(updateSliderVisual); });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { calcSliders.forEach(updateSliderVisual); });
    }
  }

  /* ===== Phone mask: +7 (000) 000-00-00 ===== */
  function formatPhone(raw) {
    var digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    if (digits[0] === '8' || digits[0] === '7') digits = digits.slice(1);
    digits = digits.slice(0, 10);
    var out = '+7';
    if (digits.length > 0) out += ' (' + digits.slice(0, 3);
    if (digits.length >= 3) out += ')';
    if (digits.length > 3) out += ' ' + digits.slice(3, 6);
    if (digits.length > 6) out += '-' + digits.slice(6, 8);
    if (digits.length > 8) out += '-' + digits.slice(8, 10);
    return out;
  }

  document.querySelectorAll('[data-phone-input]').forEach(function (input) {
    input.addEventListener('input', function (e) {
      if (e.inputType === 'deleteContentBackward' && /[^\d]$/.test(input.value)) {
        input.value = input.value.replace(/[^\d]+$/, '');
      }
      input.value = formatPhone(input.value);
    });
    input.addEventListener('focus', function () {
      if (!input.value) input.value = '+7 (';
    });
    input.addEventListener('blur', function () {
      if (input.value.replace(/\D/g, '').length <= 1) input.value = '';
    });
  });

  /* ===== Consent (shared state across page form + modal) ===== */
  var consentInputs = document.querySelectorAll('[data-consent-input]');
  var consentErrors = document.querySelectorAll('[data-consent-error]');
  var consentChecked = false;

  function setConsentError(show) {
    consentErrors.forEach(function (el) { el.hidden = !show; });
  }

  consentInputs.forEach(function (input) {
    input.addEventListener('change', function () {
      consentChecked = input.checked;
      consentInputs.forEach(function (other) { other.checked = consentChecked; });
      setConsentError(false);
    });
  });

  /* ===== Submit / success state ===== */
  function showSuccess(scope, isSuccess) {
    scope.querySelectorAll('[data-form-state]').forEach(function (el) { el.hidden = isSuccess; });
    scope.querySelectorAll('[data-form-success]').forEach(function (el) { el.hidden = !isSuccess; });
  }

  function formScope(el) {
    return el.closest('.form-card') || el.closest('.modal__scroll');
  }

  var FIELD_RULES = [
    { suffix: 'name', empty: 'Укажите имя', check: function (v) { return v.length >= 2; }, invalid: 'Укажите имя' },
    { suffix: 'phone', empty: 'Укажите телефон', check: function (v) { return v.replace(/\D/g, '').length >= 11; }, invalid: 'Проверьте номер телефона' },
    { suffix: 'city', empty: 'Укажите город или регион', check: function (v) { return v.length >= 2; }, invalid: 'Укажите город или регион' }
  ];

  function setFieldError(input, message) {
    var wrap = input.closest('.field');
    var err = wrap.querySelector('.field__error');
    if (message) {
      if (!err) {
        err = document.createElement('span');
        err.className = 'field__error';
        err.id = input.id + '-error';
        err.setAttribute('role', 'alert');
        wrap.appendChild(err);
      }
      err.textContent = message;
      err.hidden = false;
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', err.id);
    } else {
      if (err) err.hidden = true;
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    }
  }

  document.querySelectorAll('.field input[required]').forEach(function (input) {
    input.addEventListener('input', function () { setFieldError(input, ''); });
  });

  function validateForm(form) {
    var prefix = form.querySelector('[data-consent-input]').id.replace('-consent', '');
    var firstInvalid = null;
    FIELD_RULES.forEach(function (rule) {
      var input = document.getElementById(prefix + '-' + rule.suffix);
      var value = input.value.trim();
      var message = !value ? rule.empty : (rule.check(value) ? '' : rule.invalid);
      setFieldError(input, message);
      if (message && !firstInvalid) firstInvalid = input;
    });
    if (!consentChecked) {
      setConsentError(true);
      if (!firstInvalid) firstInvalid = form.querySelector('[data-consent-input]');
    }
    if (firstInvalid) {
      firstInvalid.focus();
      form.querySelectorAll('.field input[aria-invalid="true"]').forEach(function (el) {
        el.classList.remove('is-shake');
        void el.offsetWidth;
        el.classList.add('is-shake');
      });
    }
    return !firstInvalid;
  }

  document.querySelectorAll('[data-submit]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (validateForm(btn.closest('.lead-form'))) {
        track('form_submit', { source: sectionOf(btn) });
        showSuccess(formScope(btn), true);
      }
    });
  });

  document.querySelectorAll('[data-reset]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showSuccess(formScope(btn), false);
    });
  });

  /* ===== Modal ===== */
  var modal = document.querySelector('[data-modal]');
  var lastFocusedEl = null;
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

  function syncBodyLock() {
    document.body.classList.toggle('modal-open', !!document.querySelector('.modal:not([hidden])'));
  }

  function onKeydown(e) {
    if (!modal || modal.hidden) return;
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key !== 'Tab') return;
    var items = Array.prototype.filter.call(modal.querySelectorAll(FOCUSABLE), function (el) { return el.offsetParent !== null; });
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function openModal(source) {
    if (!modal) return;
    lastFocusedEl = document.activeElement;
    showSuccess(modal, false);
    modal.classList.remove('is-closing');
    modal.hidden = false;
    syncBodyLock();
    var closeBtn = modal.querySelector('.modal__close');
    if (closeBtn) closeBtn.focus();
    document.addEventListener('keydown', onKeydown);
    track('open_modal', { source: source || 'unknown' });
  }

  function hideAnimated(el, done) {
    if (reduced) { el.hidden = true; done(); return; }
    el.classList.add('is-closing');
    setTimeout(function () {
      if (!el.classList.contains('is-closing')) return;
      el.classList.remove('is-closing');
      el.hidden = true;
      done();
    }, 180);
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    hideAnimated(modal, function () {
      syncBodyLock();
      document.removeEventListener('keydown', onKeydown);
      if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') lastFocusedEl.focus();
    });
  }

  document.querySelectorAll('[data-open-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () { openModal(sectionOf(btn)); });
  });
  document.querySelectorAll('[data-close-modal]').forEach(function (btn) {
    btn.addEventListener('click', closeModal);
  });

  /* ===== Swipe hint under horizontal rows (mobile) ===== */
  document.querySelectorAll('.cards-row').forEach(function (row) {
    var hint = document.createElement('div');
    hint.className = 'swipe-hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.innerHTML =
      '<span class="swipe-hint__bar"><span class="swipe-hint__thumb"></span></span>' +
      '<span class="swipe-hint__label">Листайте <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m13 6 6 6-6 6"></path></svg></span>';
    row.insertAdjacentElement('afterend', hint);
    var thumb = hint.querySelector('.swipe-hint__thumb');

    function updateHint() {
      var max = row.scrollWidth - row.clientWidth;
      if (max <= 0) { hint.hidden = true; return; }
      hint.hidden = false;
      var ratio = row.clientWidth / row.scrollWidth;
      thumb.style.width = (ratio * 100) + '%';
      thumb.style.left = (row.scrollLeft / max * (1 - ratio) * 100) + '%';
      if (row.scrollLeft > 8) hint.classList.add('is-used');
    }

    row.addEventListener('scroll', updateHint, { passive: true });
    window.addEventListener('resize', updateHint);
    updateHint();
  });

  /* ===== Reveal on scroll (slide in from the left) ===== */
  var AUTO_RISE = [
    '.section__head', '.trust__visual', '.trust__head', '.trust-fact', '.logos li',
    '.step-card', '.market-tile', '.footnote', '.calc-card', '.calc-result', '.price-why',
    '.fee-card', '.deposit-card__head', '.deposit-steps li', '.deposit-card__highlight',
    '.stories .story', '.stats__foot', '.stats__cta', '.form-grid__intro > *', '.form-card'
  ].join(',');
  document.querySelectorAll(AUTO_RISE).forEach(function (el) {
    if (el.closest('.hslider') || el.closest('.hero') || el.hasAttribute('data-rise')) return;
    if (el.parentElement.scrollWidth > el.parentElement.clientWidth + 1) return; /* horizontal carousels: nothing hidden off-screen */
    var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.matches(AUTO_RISE); });
    var idx = Math.min(siblings.indexOf(el), 5);
    el.style.setProperty('--d', (idx * 0.08) + 's');
    el.setAttribute('data-rise', '');
    el.setAttribute('data-auto', '');
  });
  var revealEls = document.querySelectorAll('[data-reveal], [data-rise], .stats-highlight');
  function showAll() { revealEls.forEach(function (el) { el.classList.add('is-in'); }); }
  document.addEventListener('transitionend', function (e) {
    var el = e.target;
    if (e.propertyName === 'opacity' && el.hasAttribute && el.hasAttribute('data-auto') && el.classList.contains('is-in')) {
      el.removeAttribute('data-rise');
      el.removeAttribute('data-auto');
      el.classList.remove('is-in');
      el.style.removeProperty('--d');
    }
  });
  if (!('IntersectionObserver' in window) || reduced) {
    showAll();
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
    setTimeout(function () {
      revealEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) el.classList.add('is-in');
      });
    }, 1500);
  }

  /* ===== Stats: count-up + bar ===== */
  var statsBlock = document.querySelector('[data-stats]');
  if (statsBlock) {
    var COUNT_DURATION = 1300;
    function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
    function animateCount(el) {
      var target = Number(el.getAttribute('data-count-to'));
      var decimals = Number(el.getAttribute('data-decimals') || 0);
      var suffix = el.getAttribute('data-suffix') || '';
      var finalText = el.getAttribute('data-final');
      var start = performance.now();
      function tick(now) {
        var progress = Math.min((now - start) / COUNT_DURATION, 1);
        var value = target * easeOutExpo(progress);
        el.textContent = (decimals ? value.toFixed(decimals).replace('.', ',') : Math.round(value)) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
        else if (finalText) el.textContent = finalText;
      }
      requestAnimationFrame(tick);
    }
    function runStats() {
      statsBlock.querySelectorAll('[data-count-to]').forEach(animateCount);
      statsBlock.querySelectorAll('[data-bar]').forEach(function (el) { el.style.width = el.getAttribute('data-bar') + '%'; });
    }
    if ('IntersectionObserver' in window && !reduced) {
      var statsObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { runStats(); statsObserver.disconnect(); }
        });
      }, { threshold: 0.3 });
      statsObserver.observe(statsBlock);
    } else {
      statsBlock.querySelectorAll('[data-bar]').forEach(function (el) { el.style.width = el.getAttribute('data-bar') + '%'; });
    }
  }

  /* ===== Слайдер «Что внутри франшизы»: одно поведение везде ===== */
  var hs = document.querySelector('[data-hslider]');
  if (hs) {
    var track_ = hs.querySelector('[data-track]');
    var slides = Array.prototype.slice.call(track_.children);
    var tabs = hs.querySelectorAll('[data-slide-to]');
    var counter = hs.querySelector('[data-slide-current]');
    var progressEl = hs.querySelector('[data-progress]');
    var prevBtns = hs.querySelectorAll('[data-slide-prev]');
    var nextBtns = hs.querySelectorAll('[data-slide-next]');
    var ctaBtn = hs.querySelector('[data-slide-cta]');
    var ctaLabel = hs.querySelector('[data-slide-cta-label]');
    var names = Array.prototype.map.call(tabs, function (t) { return t.lastChild.textContent.trim(); });
    var n = slides.length;
    var current = -1;
    var lockUntil = 0;

    function slideStep() { return slides[0].offsetWidth + (parseFloat(getComputedStyle(track_).columnGap) || 0); }

    // Высота ленты = высота активного слайда, чтобы под коротким не оставалось пустоты
    function fitHeight() {
      if (current < 0) return;
      track_.style.height = (slides[current].offsetHeight + (parseFloat(getComputedStyle(track_).paddingBottom) || 0)) + 'px';
    }
    if (window.ResizeObserver) new ResizeObserver(fitHeight).observe(track_);
    if (window.ResizeObserver) slides.forEach(function (sl) { new ResizeObserver(fitHeight).observe(sl); });

    function setCurrent(i, fromUser) {
      i = Math.max(0, Math.min(n - 1, i));
      if (i === current) return;
      current = i;
      fitHeight();
      tabs.forEach(function (t, k) {
        t.classList.toggle('is-active', k === i);
        if (k === i) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
      });
      slides.forEach(function (sl, k) { sl.classList.toggle('is-active', k === i); });
      if (counter) {
        counter.textContent = i + 1;
        counter.classList.remove('is-tick');
        void counter.offsetWidth;
        counter.classList.add('is-tick');
      }
      if (progressEl) progressEl.style.transform = 'translateX(' + (i * 100) + '%)';
      if (ctaBtn) {
        var last = i === n - 1;
        ctaLabel.textContent = last ? 'Вернуться к началу' : 'Дальше: ' + names[i + 1];
        ctaBtn.classList.toggle('is-restart', last);
      }
      prevBtns.forEach(function (b) { b.disabled = i === 0; });
      nextBtns.forEach(function (b) { b.disabled = i === n - 1; });
      if (fromUser !== false) track('slider_slide', { slide: i + 1 });
    }

    function goTo(i) {
      i = Math.max(0, Math.min(n - 1, i));
      lockUntil = Date.now() + 800;
      track_.scrollTo({ left: i * slideStep(), behavior: reduced ? 'auto' : 'smooth' });
      setCurrent(i);
    }

    tabs.forEach(function (t) { t.addEventListener('click', function () { goTo(Number(t.getAttribute('data-slide-to'))); }); });
    prevBtns.forEach(function (b) { b.addEventListener('click', function () { goTo(current - 1); }); });
    if (ctaBtn) ctaBtn.addEventListener('click', function () { goTo(current === n - 1 ? 0 : current + 1); });
    nextBtns.forEach(function (b) { b.addEventListener('click', function () { goTo(current + 1); }); });
    var settleTimer = 0;
    track_.addEventListener('scroll', function () {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(function () { lockUntil = 0; setCurrent(Math.round(track_.scrollLeft / slideStep())); }, 120);
      if (Date.now() < lockUntil) return;
      setCurrent(Math.round(track_.scrollLeft / slideStep()));
    }, { passive: true });
    track_.setAttribute('tabindex', '0');
    track_.setAttribute('role', 'region');
    track_.setAttribute('aria-label', 'Что внутри франшизы');
    track_.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1); }
    });
    window.addEventListener('resize', function () { track_.scrollLeft = current * slideStep(); });
    setCurrent(0, false);
  }

  /* ===== Навигация: меню, подсветка раздела, липкая кнопка ===== */
  var menu = document.querySelector('[data-menu]');
  var menuToggle = document.querySelector('[data-menu-toggle]');
  function setMenu(open) {
    if (!menu) return;
    menu.hidden = !open;
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (menuToggle) {
    menuToggle.addEventListener('click', function () { setMenu(menu.hidden); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuToggle.focus(); } });
    document.addEventListener('click', function (e) {
      if (!menu.hidden && !e.target.closest('.site-header')) setMenu(false);
    });
  }

  var navLinks = document.querySelectorAll('[data-nav]');
  var spyTargets = [];
  navLinks.forEach(function (a) {
    var target = document.querySelector(a.getAttribute('href'));
    if (target && spyTargets.indexOf(target) === -1) spyTargets.push(target);
    a.addEventListener('click', function () {
      track('nav_click', { to: a.getAttribute('href').slice(1) });
      setMenu(false);
    });
  });

  var heroEl = document.querySelector('.hero');
  var formSection = document.getElementById('form');
  var stickyCta = document.querySelector('[data-sticky-cta]');
  var ticking = false;

  function onScrollUi() {
    ticking = false;
    var line = window.innerHeight * 0.35;
    var activeId = '';
    spyTargets.forEach(function (sec) {
      var r = sec.getBoundingClientRect();
      if (r.top <= line && r.bottom > line) activeId = sec.id;
    });
    navLinks.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + activeId;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
    if (stickyCta) {
      var pastHero = heroEl ? heroEl.getBoundingClientRect().bottom < 0 : true;
      var onForm = formSection ? formSection.getBoundingClientRect().top < window.innerHeight * 0.6 : false;
      stickyCta.classList.toggle('is-visible', pastHero && !onForm);
    }
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScrollUi); }
  }, { passive: true });
  window.addEventListener('resize', onScrollUi);
  onScrollUi();

  /* ===== События: звонки, мессенджеры, глубина прокрутки ===== */
  document.querySelectorAll('[data-track]').forEach(function (el) {
    el.addEventListener('click', function () { track(el.getAttribute('data-track'), { source: sectionOf(el) }); });
  });
  var depthMarks = [25, 50, 75, 100];
  var depthSent = {};
  window.addEventListener('scroll', function () {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    var pct = (window.pageYOffset / max) * 100;
    depthMarks.forEach(function (m) {
      if (pct >= m - 1 && !depthSent[m]) { depthSent[m] = true; track('scroll_depth', { percent: m }); }
    });
  }, { passive: true });
})();
