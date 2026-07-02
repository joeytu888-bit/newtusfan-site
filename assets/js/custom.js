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

	window.addEventListener('scroll', updateHeader, { passive: true });
	updateHeader();
})();
