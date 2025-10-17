/* landing.js */
// Minimal scripting: wire buttons and small entrance effect (respects reduced motion)

// Set current year in footer
document.addEventListener('DOMContentLoaded', function(){
	var yearEl = document.getElementById('year');
	if (yearEl) yearEl.textContent = String(new Date().getFullYear());

	// Wire primary action buttons
	var loginBtn = document.getElementById('loginBtn');
	var createBtn = document.getElementById('createBtn');

	if (loginBtn){
		loginBtn.addEventListener('click', function(){
			// Navigate to the Flask login route
			window.location.href = '/login';
		});
	}

	if (createBtn){
		createBtn.addEventListener('click', function(){
			// Navigate to the Flask register route
			window.location.href = '/register';
		});
	}

	// Gentle entrance animation for card if motion allowed
	var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var card = document.querySelector('.card');
	if (card && !reduce){
		card.style.opacity = '0';
		card.style.transform = 'translateY(8px)';
		requestAnimationFrame(function(){
			card.style.transition = 'opacity .5s ease, transform .5s ease';
			card.style.willChange = 'opacity, transform';
			card.style.opacity = '1';
			card.style.transform = 'translateY(0)';
			// Remove will-change after animation for performance hygiene
			setTimeout(function(){ card.style.willChange = 'auto'; }, 600);
		});
	}
});


