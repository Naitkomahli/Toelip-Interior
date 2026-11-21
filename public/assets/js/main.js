/* Toelip Interior: nav, portfolio, lightbox, scroll motion */
(function(){
  'use strict';

  var reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (err) {}

  /* ---------- Navigation ---------- */
  var navToggle = document.getElementById('nav-toggle');
  var navList = document.getElementById('nav-list');
  if (navToggle && navList) {
    navToggle.addEventListener('click', function(){
      var open = navList.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Tutup menu navigasi' : 'Buka menu navigasi');
      if (open) {
        var firstLink = navList.querySelector('a');
        if (firstLink) firstLink.focus();
      }
    });
    navList.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        navList.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Buka menu navigasi');
        navToggle.focus();
      });
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && navList.classList.contains('open')) {
        navList.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Buka menu navigasi');
        navToggle.focus();
      }
    });
  }

  /* ---------- Service ticker ---------- */
  var marqueeToggle = document.getElementById('marquee-toggle');
  var marqueeTrack = document.querySelector('.marquee-track');
  if (marqueeToggle && marqueeTrack) {
    marqueeToggle.addEventListener('click', function(){
      var paused = marqueeTrack.classList.toggle('is-paused');
      marqueeToggle.setAttribute('aria-pressed', paused ? 'true' : 'false');
      marqueeToggle.textContent = paused ? 'Putar' : 'Jeda';
      marqueeToggle.setAttribute('aria-label', paused ? 'Putar gerakan teks layanan' : 'Jeda gerakan teks layanan');
    });
  }

  /* ---------- Portfolio filter + lightbox ---------- */
  var filters = document.querySelectorAll('.filter button');
  var portfolioGrid = document.getElementById('portfolio-grid');
  var portfolioEmpty = document.getElementById('gallery-empty');
  var projectCount = document.getElementById('project-count');
  var activeFilter = 'all';

  function portfolioItems(){
    return Array.prototype.slice.call(document.querySelectorAll('.portfolio-item'));
  }

  function applyFilter(cat, btn){
    activeFilter = cat;
    filters.forEach(function(b){ b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');

    var list = portfolioItems();
    var first = new Map();
    if (!reduced) {
      list.forEach(function(it){
        if (it.style.display !== 'none') first.set(it, it.getBoundingClientRect());
      });
    }

    var visible = 0;
    list.forEach(function(it){
      var show = cat === 'all' || it.dataset.category === cat;
      it.style.display = show ? '' : 'none';
      if (show) {
        visible++;
        it.classList.add('visible');
      }
    });

    if (projectCount) {
      projectCount.textContent = visible;
      if (!reduced && projectCount.animate) {
        projectCount.animate(
          [{ transform: 'scale(1)' }, { transform: 'scale(1.16)' }, { transform: 'scale(1)' }],
          { duration: 340, easing: 'cubic-bezier(.16,1,.3,1)' }
        );
      }
    }

    if (portfolioEmpty) {
      portfolioEmpty.textContent = list.length
        ? 'Belum ada karya di kategori ini.'
        : 'Belum ada karya yang dipublikasikan.';
      portfolioEmpty.hidden = visible > 0;
    }

    if (reduced || !first.size) return;

    list.forEach(function(it){
      if (it.style.display === 'none') return;
      var last = it.getBoundingClientRect();
      var start = first.get(it);
      if (start) {
        var dx = start.left - last.left;
        var dy = start.top - last.top;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          it.animate(
            [{ transform: 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)' }, { transform: 'none' }],
            { duration: 560, easing: 'cubic-bezier(.16,1,.3,1)' }
          );
        }
      } else if (it.animate) {
        it.animate(
          [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }],
          { duration: 500, easing: 'cubic-bezier(.16,1,.3,1)' }
        );
      }
    });
  }

  filters.forEach(function(btn){
    btn.addEventListener('click', function(){
      if (btn.classList.contains('active')) return;
      applyFilter(btn.dataset.filter, btn);
    });
  });

  var lightbox = document.getElementById('lightbox');
  var lbImg = document.getElementById('lb-img');
  var lbCap = document.getElementById('lb-cap');
  var lbClose = document.getElementById('lb-close');
  var lbPrev = document.getElementById('lb-prev');
  var lbNext = document.getElementById('lb-next');
  var lbIndex = document.getElementById('lb-index');
  var lbThumbs = document.getElementById('lb-thumbs');
  var lbStatus = document.getElementById('lb-status');
  var lbItems = [];
  var lbPos = 0;
  var lastFocused = null;
  var zoomed = false;
  var lastSwipeAt = 0;

  function visiblePortfolioItems(){
    return Array.prototype.slice.call(document.querySelectorAll('.portfolio-item')).filter(function(it){
      return it.style.display !== 'none';
    });
  }

  function resetZoom(){
    zoomed = false;
    if (!lbImg) return;
    lbImg.classList.remove('is-zoomed');
    lbImg.style.transformOrigin = '';
  }

  function buildThumbs(){
    if (!lbThumbs) return;
    lbThumbs.innerHTML = '';
    lbItems.forEach(function(item, i){
      var source = item.querySelector('img');
      var thumb = document.createElement('button');
      thumb.type = 'button';
      thumb.className = 'lb-thumb';
      thumb.setAttribute('aria-label', 'Lihat karya ' + (i + 1));
      thumb.setAttribute('aria-current', i === lbPos ? 'true' : 'false');
      var image = document.createElement('img');
      image.src = source ? source.getAttribute('src') : '';
      image.alt = '';
      image.width = 54;
      image.height = 40;
      image.loading = 'lazy';
      thumb.appendChild(image);
      thumb.addEventListener('click', function(){
        lbPos = i;
        renderLightbox();
      });
      lbThumbs.appendChild(thumb);
    });
  }

  function renderLightbox(){
    var item = lbItems[lbPos];
    if (!item) return;
    resetZoom();
    var img = item.querySelector('img');
    var title = item.querySelector('.caption strong');
    if (img && lbImg) {
      lbImg.src = img.getAttribute('src');
      lbImg.alt = img.alt;
    }
    if (lbCap) lbCap.textContent = title ? title.textContent : '';
    if (lbIndex) lbIndex.textContent = (lbPos + 1) + ' / ' + lbItems.length;
    if (lbStatus) {
      lbStatus.textContent = 'Karya ' + (lbPos + 1) + ' dari ' + lbItems.length +
        (title && title.textContent ? ': ' + title.textContent.trim() : '');
    }
    if (lbThumbs) {
      var thumbs = lbThumbs.querySelectorAll('.lb-thumb');
      for (var i = 0; i < thumbs.length; i++) {
        thumbs[i].setAttribute('aria-current', i === lbPos ? 'true' : 'false');
      }
      var activeThumb = thumbs[lbPos];
      if (activeThumb && lbThumbs.scrollTo) {
        var target = activeThumb.offsetLeft - (lbThumbs.clientWidth - activeThumb.offsetWidth) / 2;
        lbThumbs.scrollTo({ left: Math.max(0, target), behavior: reduced ? 'auto' : 'smooth' });
      }
      if (lbThumbs.contains(document.activeElement) && activeThumb && activeThumb !== document.activeElement) {
        activeThumb.focus();
      }
    }
    var single = lbItems.length < 2;
    if (lbPrev) lbPrev.disabled = single;
    if (lbNext) lbNext.disabled = single;
  }

  function openLightbox(item){
    if (!lightbox) return;
    lbItems = visiblePortfolioItems();
    lbPos = lbItems.indexOf(item);
    if (lbPos < 0) lbPos = 0;
    lastFocused = item.querySelector('.p-media') || document.activeElement;
    buildThumbs();
    renderLightbox();
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    document.documentElement.classList.add('lightbox-open');
    if (lbClose) lbClose.focus();
  }

  function closeLightbox(){
    if (!lightbox || !lightbox.classList.contains('open')) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    document.documentElement.classList.remove('lightbox-open');
    resetZoom();
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function stepLightbox(dir){
    if (lbItems.length < 2) return;
    lbPos = (lbPos + dir + lbItems.length) % lbItems.length;
    renderLightbox();
  }

  portfolioItems().forEach(function(item){
    var trigger = item.querySelector('.p-media');
    if (trigger && !trigger.hasAttribute('aria-haspopup')) trigger.setAttribute('aria-haspopup', 'dialog');
  });

  if (portfolioGrid) {
    portfolioGrid.addEventListener('click', function(e){
      var trigger = e.target && e.target.closest ? e.target.closest('.p-media') : null;
      if (!trigger || !portfolioGrid.contains(trigger)) return;
      var item = trigger.closest('.portfolio-item');
      if (item) openLightbox(item);
    });
  }

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbPrev) lbPrev.addEventListener('click', function(){ stepLightbox(-1); });
  if (lbNext) lbNext.addEventListener('click', function(){ stepLightbox(1); });
  if (lbImg) {
    lbImg.addEventListener('click', function(e){
      if (reduced || Date.now() - lastSwipeAt < 320) return;
      var rect = lbImg.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var ox = ((e.clientX - rect.left) / rect.width) * 100;
      var oy = ((e.clientY - rect.top) / rect.height) * 100;
      zoomed = !zoomed;
      lbImg.classList.toggle('is-zoomed', zoomed);
      lbImg.style.transformOrigin = zoomed ? ox.toFixed(1) + '% ' + oy.toFixed(1) + '%' : '';
    });
  }
  if (lightbox) {
    var swipeX = 0;
    var swipeY = 0;
    var swipeOn = false;
    lightbox.addEventListener('pointerdown', function(e){
      if (e.target.closest('button')) return;
      swipeOn = true;
      swipeX = e.clientX;
      swipeY = e.clientY;
    });
    lightbox.addEventListener('pointerup', function(e){
      if (!swipeOn) return;
      swipeOn = false;
      var dx = e.clientX - swipeX;
      var dy = e.clientY - swipeY;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.25) {
        lastSwipeAt = Date.now();
        stepLightbox(dx < 0 ? 1 : -1);
      }
    });
    lightbox.addEventListener('pointercancel', function(){ swipeOn = false; });
    lightbox.addEventListener('click', function(e){ if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', function(e){
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') { closeLightbox(); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); stepLightbox(1); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); stepLightbox(-1); return; }
      if (e.key === 'Tab') {
        var focusables = Array.prototype.filter.call(
          lightbox.querySelectorAll('button:not([disabled]):not([tabindex="-1"])'),
          function(el){ return el.offsetParent !== null; }
        );
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ---------- Live portfolio from the admin database ---------- */
  function revealNewItems(list){
    var els = Array.prototype.slice.call(list);
    if (reduced || !('IntersectionObserver' in window)) {
      els.forEach(function(el){ el.classList.add('visible'); });
      return;
    }
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function(el){ observer.observe(el); });
  }

  function refreshPortfolio(){
    var active = null;
    filters.forEach(function(b){ if (b.dataset.filter === activeFilter) active = b; });
    if (!active && filters.length) active = filters[0];
    if (active) applyFilter(active.dataset.filter, active);
    else if (projectCount) projectCount.textContent = String(portfolioItems().length);
  }

  document.addEventListener('toelip:portfolio', refreshPortfolio);

  if (portfolioGrid && portfolioGrid.getAttribute('data-live-projects')) {
    var layoutPattern = ['wide', 'narrow', 'third', 'third', 'third', 'wide', 'narrow', 'third', 'third', 'third', 'wide', 'narrow'];
    var ratios = [
      { name: '34', value: 3 / 4 },
      { name: '45', value: 4 / 5 },
      { name: '11', value: 1 },
      { name: '43', value: 4 / 3 }
    ];

    /* Keep each crop close to the photo's own shape so uploads are not cut hard. */
    var ratioFor = function(cover){
      var w = Number(cover && cover.width) || 0;
      var h = Number(cover && cover.height) || 0;
      if (!w || !h) return '43';
      var shape = Math.log(w / h);
      var best = ratios[0];
      var bestGap = Infinity;
      ratios.forEach(function(ratio){
        var gap = Math.abs(shape - Math.log(ratio.value));
        if (gap < bestGap) { bestGap = gap; best = ratio; }
      });
      return best.name;
    };

    var renderLiveProjects = function(list){
      if (!list.length) {
        portfolioGrid.innerHTML = '';
        if (portfolioEmpty) portfolioEmpty.hidden = false;
        if (projectCount) projectCount.textContent = '0';
        return;
      }

      var fragment = document.createDocumentFragment();

      list.forEach(function(project, index){
        var article = document.createElement('article');
        article.className = 'portfolio-item ' + layoutPattern[index % layoutPattern.length] + ' reveal';
        article.setAttribute('data-category', project.category);

        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'p-media ratio-' + ratioFor(project.cover);
        button.setAttribute('aria-label', 'Perbesar karya: ' + project.title);
        button.setAttribute('aria-haspopup', 'dialog');

        var image = document.createElement('img');
        image.src = project.cover.src;
        image.alt = project.cover.alt || project.title;
        if (project.cover.width) image.width = project.cover.width;
        if (project.cover.height) image.height = project.cover.height;
        image.loading = index < 2 ? 'eager' : 'lazy';
        image.decoding = 'async';

        var zoom = document.createElement('span');
        zoom.className = 'p-zoom';
        zoom.setAttribute('aria-hidden', 'true');
        zoom.textContent = '+';

        button.appendChild(image);
        button.appendChild(zoom);

        var caption = document.createElement('div');
        caption.className = 'caption';
        var title = document.createElement('strong');
        title.textContent = project.title;
        var category = document.createElement('span');
        category.textContent = project.categoryLabel || project.category;
        caption.appendChild(title);
        caption.appendChild(category);

        article.appendChild(button);
        article.appendChild(caption);
        fragment.appendChild(article);
      });

      portfolioGrid.innerHTML = '';
      portfolioGrid.appendChild(fragment);
      if (portfolioEmpty) portfolioEmpty.hidden = true;
      revealNewItems(portfolioGrid.querySelectorAll('.portfolio-item'));
      document.dispatchEvent(new CustomEvent('toelip:portfolio'));
    };

    fetch(portfolioGrid.getAttribute('data-live-projects'), { headers: { Accept: 'application/json' } })
      .then(function(response){
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function(data){
        if (!data || data.configured !== true || !Array.isArray(data.projects)) return;
        renderLiveProjects(data.projects);
      })
      .catch(function(){ /* keep the static fallback */ });
  }

  /* ---------- Contact brief composer ---------- */
  var briefText = document.getElementById('brief-text');
  var briefSend = document.getElementById('brief-send');
  var briefCount = document.getElementById('brief-count');
  var briefHint = document.querySelector('.brief-hint');
  if (briefText && briefSend) {
    var briefBase = (briefSend.getAttribute('href') || '').split('?')[0] + '?text=';
    var briefIntro = 'Halo Toelip Interior, saya mau konsultasi. ';
    var briefDefaultHint = briefHint ? briefHint.textContent : '';
    var syncBrief = function(){
      var value = briefText.value.trim();
      var message = briefIntro + (value || 'Saya mau tanya tentang desain interior atau furnitur kustom.');
      briefSend.href = briefBase + encodeURIComponent(message);
      if (briefCount) briefCount.textContent = briefText.value.length + ' karakter';
      if (briefHint) briefHint.textContent = value ? 'Pesan siap dibuka di WhatsApp.' : briefDefaultHint;
    };
    briefText.addEventListener('input', syncBrief);
    syncBrief();
  }

  /* ---------- Reveal on enter ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function(el){ revealObserver.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('visible'); });
  }

  /* ---------- Scroll frame: header, progress bar, scrubbers ---------- */
  var header = document.querySelector('[data-header]') || document.querySelector('header');
  var pageProgress = document.querySelector('[data-progress]');
  var hero = document.querySelector('[data-hero]');
  var lastY = window.pageYOffset || 0;
  var scheduled = false;
  var pastHero = false;
  var scrubbers = [];

  var aboutProcessList = document.querySelector('.page-about .process-list');
  var aboutBar = document.querySelector('[data-about-bar]');
  var aboutSteps = aboutProcessList ? aboutProcessList.querySelectorAll('li') : [];
  var aboutLead = document.querySelector('.page-about .about-lead img');
  var serviceSections = document.querySelectorAll('.page-services .service-feature');
  var serviceLinks = document.querySelectorAll('.service-index a');
  var serviceActive = -1;
  var aboutActive = -1;

  function clamp01(v){ return v < 0 ? 0 : v > 1 ? 1 : v; }

  /* 0 when the element top is at start*vh, 1 when its bottom is at end*vh */
  function rangeProgress(el, start, end){
    var rect = el.getBoundingClientRect();
    var vh = window.innerHeight || 1;
    var span = rect.height + vh * (start - end);
    if (span <= 0) return 0;
    return clamp01((vh * start - rect.top) / span);
  }

  function addScrubber(el, fn){
    if (el) scrubbers.push({ el: el, fn: fn });
  }

  addScrubber(document.querySelector('[data-hero]'), function(el){
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    el.style.setProperty('--hp', clamp01(y / Math.max(1, el.offsetHeight * 0.9)).toFixed(3));
  });

  addScrubber(document.querySelector('[data-feature]'), function(el){
    el.style.setProperty('--p', rangeProgress(el, 0.92, 0.2).toFixed(3));
  });

  var processSection = document.querySelector('[data-process]');
  var processSteps = processSection ? processSection.querySelectorAll('[data-step]') : [];
  addScrubber(processSection, function(el){
    var p = rangeProgress(el, 0.72, 0.28);
    el.style.setProperty('--p', p.toFixed(3));
    var bar = document.querySelector('[data-process-bar]');
    if (bar) bar.style.transform = 'scaleX(' + p.toFixed(3) + ')';
    if (processSteps.length) {
      var active = Math.min(processSteps.length - 1, Math.floor(p * processSteps.length));
      for (var i = 0; i < processSteps.length; i++) {
        processSteps[i].classList.toggle('is-active', i === active);
      }
    }
  });

  addScrubber(document.querySelector('[data-wordmark]'), function(el){
    var vh = window.innerHeight || 1;
    var max = document.documentElement.scrollHeight - vh;
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    el.style.setProperty('--p', clamp01(1 - (max - y) / (vh * 0.6)).toFixed(3));
  });

  addScrubber(aboutProcessList, function(el){
    if (!aboutBar) return;
    var p = rangeProgress(el, 0.84, 0.34);
    aboutBar.style.transform = 'scaleX(' + p.toFixed(3) + ')';
  });

  addScrubber(aboutLead, function(el){
    var p = rangeProgress(el, 1.06, -0.06);
    el.style.setProperty('--pp', (p - 0.5).toFixed(3));
  });

  function onFrame(){
    scheduled = false;
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;

    if (header) {
      header.classList.toggle('is-scrolled', y > 10);
      var menuOpen = navList && navList.classList.contains('open');
      if (menuOpen) {
        header.classList.remove('is-hidden');
      } else if (y > 160 && y > lastY + 4) {
        header.classList.add('is-hidden');
      } else if (y < lastY - 4 || y <= 160) {
        header.classList.remove('is-hidden');
      }
      document.body.classList.toggle('is-nav-hidden', header.classList.contains('is-hidden'));
    }

    if (pageProgress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      pageProgress.style.transform = 'scaleX(' + (max > 0 ? clamp01(y / max) : 0).toFixed(4) + ')';
    }

    var shouldPast = hero ? y > (window.innerHeight || 1) * 0.5 : true;
    if (shouldPast !== pastHero) {
      pastHero = shouldPast;
      document.body.classList.toggle('is-past-hero', shouldPast);
    }

    for (var i = 0; i < scrubbers.length; i++) {
      try { scrubbers[i].fn(scrubbers[i].el); } catch (err) {}
    }

    if (serviceSections.length) {
      var serviceMid = (window.innerHeight || 1) * 0.42;
      var nextService = 0;
      for (var s = 0; s < serviceSections.length; s++) {
        if (serviceSections[s].getBoundingClientRect().top <= serviceMid) nextService = s;
      }
      if (nextService !== serviceActive) {
        serviceActive = nextService;
        for (var sl = 0; sl < serviceLinks.length; sl++) {
          if (sl === nextService) serviceLinks[sl].setAttribute('aria-current', 'true');
          else serviceLinks[sl].removeAttribute('aria-current');
        }
      }
    }

    if (aboutSteps.length) {
      var aboutMid = (window.innerHeight || 1) * 0.56;
      var nextAbout = 0;
      for (var a = 0; a < aboutSteps.length; a++) {
        if (aboutSteps[a].getBoundingClientRect().top <= aboutMid) nextAbout = a;
      }
      if (nextAbout !== aboutActive) {
        aboutActive = nextAbout;
        for (var ab = 0; ab < aboutSteps.length; ab++) {
          aboutSteps[ab].classList.toggle('is-active', ab === nextAbout);
        }
      }
    }

    lastY = y;
  }

  function requestFrame(){
    if (!scheduled) {
      scheduled = true;
      window.requestAnimationFrame(onFrame);
    }
  }
  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', requestFrame);
  requestFrame();

  /* ---------- Draggable project rail ---------- */
  var rail = document.querySelector('[data-rail]');
  if (rail) {
    var railTrack = rail.querySelector('[data-rail-track]');
    var railIndex = document.querySelector('[data-rail-index]');
    var railTotal = document.querySelector('[data-rail-total]');
    var railBar = document.querySelector('[data-rail-progress]');
    var railCards = rail.querySelectorAll('.work-card');
    var railPrev = document.querySelector('[data-rail-prev]');
    var railNext = document.querySelector('[data-rail-next]');
    var isDown = false;
    var startX = 0;
    var startLeft = 0;
    var didMove = false;
    var dragEndedAt = 0;

    function pad(n){ return n < 10 ? '0' + n : String(n); }

    function stepSize(){
      var first = rail.querySelector('.work-card');
      if (!first) return 320;
      var styles = window.getComputedStyle(railTrack || rail);
      var gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
      return first.getBoundingClientRect().width + gap;
    }

    function updateRail(){
      var max = rail.scrollWidth - rail.clientWidth;
      var p = max > 0 ? clamp01(rail.scrollLeft / max) : 0;
      if (railBar) railBar.style.transform = 'scaleX(' + (0.12 + 0.88 * p).toFixed(3) + ')';
      if (railIndex && railCards.length) {
        var step = stepSize();
        var i = step > 0 ? Math.round(rail.scrollLeft / step) : 0;
        i = Math.max(0, Math.min(railCards.length - 1, i));
        railIndex.textContent = pad(i + 1);
      }
    }

    if (railTotal) railTotal.textContent = pad(railCards.length);

    function nudge(dir){
      var amount = stepSize() * dir;
      if (rail.scrollBy) rail.scrollBy({ left: amount, behavior: reduced ? 'auto' : 'smooth' });
      else rail.scrollLeft += amount;
    }

    if (railPrev) railPrev.addEventListener('click', function(){ nudge(-1); });
    if (railNext) railNext.addEventListener('click', function(){ nudge(1); });

    function onPointerMove(e){
      if (!isDown) return;
      var dx = e.clientX - startX;
      if (!didMove && Math.abs(dx) > 5) {
        didMove = true;
        rail.classList.add('is-dragging');
      }
      if (didMove) {
        rail.scrollLeft = startLeft - dx;
        e.preventDefault();
      }
    }

    function endDrag(){
      if (!isDown) return;
      isDown = false;
      rail.classList.remove('is-dragging');
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
      if (didMove) {
        var step = stepSize();
        var target = Math.round(rail.scrollLeft / step) * step;
        dragEndedAt = Date.now();
        if (rail.scrollTo) rail.scrollTo({ left: target, behavior: reduced ? 'auto' : 'smooth' });
        else rail.scrollLeft = target;
      }
    }

    rail.addEventListener('pointerdown', function(e){
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      isDown = true;
      didMove = false;
      startX = e.clientX;
      startLeft = rail.scrollLeft;
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', endDrag);
      window.addEventListener('pointercancel', endDrag);
    });

    rail.addEventListener('click', function(e){
      if (Date.now() - dragEndedAt < 80) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    rail.addEventListener('dragstart', function(e){ e.preventDefault(); });

    rail.addEventListener('keydown', function(e){
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        nudge(e.key === 'ArrowRight' ? 1 : -1);
      }
    });

    rail.addEventListener('scroll', updateRail, { passive: true });
    window.addEventListener('resize', updateRail);
    updateRail();
  }

  /* ---------- Warm dust in the hero ---------- */
  function initMotes(){
    var canvas = document.querySelector('[data-motes]');
    if (!canvas || reduced || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var host = canvas.closest('.hero') || canvas.parentNode;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = 0;
    var height = 0;
    var particles = [];
    var frameId = 0;
    var onScreen = false;

    function resize(){
      var rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = Math.round(Math.min(46, Math.max(18, width / 30)));
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.5 + 0.4,
          vx: (Math.random() - 0.5) * 0.12,
          vy: -(Math.random() * 0.16 + 0.03),
          a: Math.random() * 0.26 + 0.07,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    function draw(){
      if (!onScreen) { frameId = 0; return; }
      ctx.clearRect(0, 0, width, height);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.phase += 0.01;
        if (p.y < -6) { p.y = height + 6; p.x = Math.random() * width; }
        if (p.x < -6) p.x = width + 6;
        else if (p.x > width + 6) p.x = -6;

        var alpha = p.a * (0.6 + 0.4 * Math.sin(p.phase));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,242,220,' + alpha.toFixed(3) + ')';
        ctx.fill();
      }
      frameId = window.requestAnimationFrame(draw);
    }

    function start(){
      if (frameId) return;
      onScreen = true;
      frameId = window.requestAnimationFrame(draw);
    }
    function stop(){
      onScreen = false;
      if (frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
    }

    resize();
    window.addEventListener('resize', resize);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if (entry.isIntersecting) start();
          else stop();
        });
      }, { threshold: 0 }).observe(host);
    } else {
      start();
    }
  }
  initMotes();

  /* ---------- Cursor spotlight on the manifesto ---------- */
  function initSpotlight(){
    var panel = document.querySelector('.manifesto');
    if (!panel || reduced) return;
    var fine = false;
    try { fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches; } catch (err) {}
    if (!fine) return;

    var pending = 0;
    var mx = 50;
    var my = 30;

    function paint(){
      pending = 0;
      panel.style.setProperty('--mx', mx.toFixed(2) + '%');
      panel.style.setProperty('--my', my.toFixed(2) + '%');
    }

    panel.addEventListener('pointerenter', function(){ panel.classList.add('is-spot'); });
    panel.addEventListener('pointerleave', function(){ panel.classList.remove('is-spot'); });
    panel.addEventListener('pointermove', function(e){
      var rect = panel.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      mx = ((e.clientX - rect.left) / rect.width) * 100;
      my = ((e.clientY - rect.top) / rect.height) * 100;
      if (!pending) pending = window.requestAnimationFrame(paint);
    });
  }
  initSpotlight();

  /* ---------- Route sketch draws once it enters view ---------- */
  function initMapDraw(){
    var canvas = document.querySelector('.map-canvas');
    if (!canvas) return;
    if (reduced || !('IntersectionObserver' in window)) {
      canvas.classList.add('is-drawn');
      return;
    }
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) {
          canvas.classList.add('is-drawn');
          observer.disconnect();
        }
      });
    }, { threshold: 0.35 });
    observer.observe(canvas);
  }
  initMapDraw();

  /* ---------- Placeholder for missing images ---------- */
  document.querySelectorAll('img').forEach(function(img){
    img.addEventListener('error', function(){
      this.onerror = null;
      this.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22600%22%3E%3Crect width=%22800%22 height=%22600%22 fill=%22%23e9e5dd%22/%3E%3Ctext x=%22400%22 y=%22310%22 font-family=%22serif%22 font-size=%2224%22 fill=%22%239a9185%22 text-anchor=%22middle%22%3EGambar tidak tersedia%3C/text%3E%3C/svg%3E';
      this.style.objectFit = 'contain';
      this.style.background = '#e9e5dd';
    });
  });
})();
