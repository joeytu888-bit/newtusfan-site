(function () {
	'use strict';

	var header = document.querySelector('.site-header');
	var year = document.getElementById('year');

	function updateHeader() {
		if (!header) return;
		header.classList.toggle('scrolled', window.scrollY > 16);
	}

	if (year) year.textContent = new Date().getFullYear();

	if (window.jQuery && jQuery.fn.scrolly) {
		jQuery('.smooth-scroll').scrolly({
			easing: 'linear',
			speed: 800
		});

		jQuery('.smooth-scroll-middle').scrolly({
			anchor: 'middle',
			easing: 'linear',
			speed: 800
		});
	}


	var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var progress = document.createElement('div');
	var backToTop = document.createElement('button');
	progress.className = 'scroll-progress';
	progress.setAttribute('aria-hidden', 'true');
	backToTop.className = 'back-to-top';
	backToTop.type = 'button';
	backToTop.setAttribute('aria-label', document.body.classList.contains('zh-page') ? '返回顶部' : 'Back to top');
	backToTop.innerHTML = '&#8593;';
	document.body.appendChild(progress);
	document.body.appendChild(backToTop);

	function updateScrollUI() {
		var scrollable = document.documentElement.scrollHeight - window.innerHeight;
		var ratio = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
		progress.style.width = (ratio * 100) + '%';
		backToTop.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.75);
	}

	backToTop.addEventListener('click', function () {
		if (window.jQuery && !reduceMotion) {
			jQuery('html, body').stop().animate({ scrollTop: 0 }, 650, 'linear');
		} else {
			window.scrollTo(0, 0);
		}
	});

	var counters = Array.prototype.slice.call(document.querySelectorAll('.stat-value'));
	function renderCounter(counter, value) {
		counter.textContent = (counter.getAttribute('data-prefix') || '') + Math.round(value).toLocaleString() + (counter.getAttribute('data-suffix') || '');
	}

	function animateCounter(counter) {
		if (counter.getAttribute('data-counted') === 'true') return;
		counter.setAttribute('data-counted', 'true');
		var target = Number(counter.getAttribute('data-target')) || 0;
		if (reduceMotion) {
			renderCounter(counter, target);
			return;
		}
		var startedAt = null;
		function tick(timestamp) {
			if (!startedAt) startedAt = timestamp;
			var progressValue = Math.min((timestamp - startedAt) / 1200, 1);
			var eased = 1 - Math.pow(1 - progressValue, 3);
			renderCounter(counter, target * eased);
			if (progressValue < 1) {
				counter._animationFrame = window.requestAnimationFrame(tick);
			} else {
				counter._animationFrame = null;
			}
		}
		counter._animationFrame = window.requestAnimationFrame(tick);
	}

	function resetCounter(counter) {
		if (counter._animationFrame) window.cancelAnimationFrame(counter._animationFrame);
		counter._animationFrame = null;
		counter.setAttribute('data-counted', 'false');
		renderCounter(counter, 0);
	}

	if (counters.length) {
		if (reduceMotion || !('IntersectionObserver' in window)) {
			counters.forEach(animateCounter);
		} else {
			counters.forEach(function (counter) { renderCounter(counter, 0); });
			var counterObserver = new IntersectionObserver(function (entries) {
				entries.forEach(function (entry) {
					if (entry.intersectionRatio >= 0.45) {
						animateCounter(entry.target);
					} else {
						resetCounter(entry.target);
					}
				});
			}, { threshold: [0, 0.45] });
			counters.forEach(function (counter) { counterObserver.observe(counter); });
		}
	}
	var galleryImages = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));
	if (galleryImages.length) {
		var isChinese = document.body.classList.contains('zh-page');
		var lightbox = document.createElement('div');
		lightbox.className = 'lightbox';
		lightbox.setAttribute('role', 'dialog');
		lightbox.setAttribute('aria-modal', 'true');
		lightbox.setAttribute('aria-hidden', 'true');
		lightbox.setAttribute('aria-label', isChinese ? '图片预览' : 'Image preview');
		lightbox.innerHTML = '<button class="lightbox-close" type="button" aria-label="' + (isChinese ? '关闭' : 'Close') + '">&times;</button>' +
			'<button class="lightbox-nav lightbox-prev" type="button" aria-label="' + (isChinese ? '上一张' : 'Previous image') + '">&#8249;</button>' +
			'<figure class="lightbox-stage"><img class="lightbox-image" alt="" /><figcaption class="lightbox-caption"></figcaption></figure>' +
			'<button class="lightbox-nav lightbox-next" type="button" aria-label="' + (isChinese ? '下一张' : 'Next image') + '">&#8250;</button>';
		document.body.appendChild(lightbox);

		var lightboxImage = lightbox.querySelector('.lightbox-image');
		var lightboxCaption = lightbox.querySelector('.lightbox-caption');
		var closeButton = lightbox.querySelector('.lightbox-close');
		var previousButton = lightbox.querySelector('.lightbox-prev');
		var nextButton = lightbox.querySelector('.lightbox-next');
		var activeIndex = 0;
		var lastTrigger = null;
		var touchStartX = 0;

		function renderLightbox(index) {
			activeIndex = (index + galleryImages.length) % galleryImages.length;
			var source = galleryImages[activeIndex];
			lightboxImage.src = source.currentSrc || source.src;
			lightboxImage.alt = source.alt || '';
			lightboxCaption.innerHTML = (source.getAttribute('data-caption') || source.alt || '') + '<span class="lightbox-counter">' + (activeIndex + 1) + ' / ' + galleryImages.length + '</span>';
			var preload = new Image();
			var nextSource = galleryImages[(activeIndex + 1) % galleryImages.length];
			preload.src = nextSource.currentSrc || nextSource.src;
		}

		function openLightbox(index, trigger) {
			lastTrigger = trigger;
			renderLightbox(index);
			lightbox.classList.add('is-open');
			lightbox.setAttribute('aria-hidden', 'false');
			document.body.classList.add('lightbox-open');
			closeButton.focus();
		}

		function closeLightbox() {
			lightbox.classList.remove('is-open');
			lightbox.setAttribute('aria-hidden', 'true');
			document.body.classList.remove('lightbox-open');
			if (lastTrigger) lastTrigger.focus();
		}

		galleryImages.forEach(function (image, index) {
			var trigger = image.closest('.collection-card, .zh-photo-card') || image;
			trigger.setAttribute('role', 'button');
			trigger.setAttribute('tabindex', '0');
			trigger.setAttribute('aria-label', (isChinese ? '放大查看：' : 'View larger: ') + (image.getAttribute('data-caption') || image.alt || ''));
			trigger.addEventListener('click', function () { openLightbox(index, trigger); });
			trigger.addEventListener('keydown', function (event) {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					openLightbox(index, trigger);
				}
			});
		});

		closeButton.addEventListener('click', closeLightbox);
		previousButton.addEventListener('click', function () { renderLightbox(activeIndex - 1); });
		nextButton.addEventListener('click', function () { renderLightbox(activeIndex + 1); });
		lightbox.addEventListener('click', function (event) { if (event.target === lightbox) closeLightbox(); });
		lightbox.addEventListener('touchstart', function (event) { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
		lightbox.addEventListener('touchend', function (event) {
			var distance = event.changedTouches[0].clientX - touchStartX;
			if (Math.abs(distance) > 50) renderLightbox(activeIndex + (distance < 0 ? 1 : -1));
		}, { passive: true });
		document.addEventListener('keydown', function (event) {
			if (!lightbox.classList.contains('is-open')) return;
			if (event.key === 'Escape') closeLightbox();
			if (event.key === 'ArrowLeft') renderLightbox(activeIndex - 1);
			if (event.key === 'ArrowRight') renderLightbox(activeIndex + 1);
		});
	}

	window.addEventListener('scroll', updateHeader, { passive: true });
	window.addEventListener('scroll', updateScrollUI, { passive: true });
	updateHeader();
	updateScrollUI();
})();
