(function () {
	'use strict';

	var header = document.querySelector('.site-header');
	var year = document.getElementById('year');

	function updateHeader() {
		if (!header) return;
		header.classList.toggle('scrolled', window.scrollY > 16);
	}

	if (year) year.textContent = new Date().getFullYear();
	window.addEventListener('scroll', updateHeader, { passive: true });
	updateHeader();
})();
