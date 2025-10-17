// login.js
// Minimal client-side behavior: validation, animations, and simple navigation hooks

document.addEventListener('DOMContentLoaded', function(){
	// Footer year
	var yearEl = document.getElementById('year');
	if (yearEl) yearEl.textContent = String(new Date().getFullYear());

	// Elements
	var form = document.getElementById('loginForm');
	var userInput = document.getElementById('username');
	var passInput = document.getElementById('password');
	var userError = document.getElementById('userError');
	var passError = document.getElementById('passError');
	var toggle = document.getElementById('togglePwd');
	var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// Entrance animation for card
	var card = document.querySelector('.card');
	if (card && !reduceMotion){
		card.style.opacity = '0';
		card.style.transform = 'translateY(8px)';
		requestAnimationFrame(function(){
			card.style.transition = 'opacity .5s ease, transform .5s ease';
			card.style.opacity = '1';
			card.style.transform = 'translateY(0)';
			setTimeout(function(){ card.style.willChange = 'auto'; }, 600);
		});
	}

	// Password visibility toggle
	if (toggle && passInput){
		toggle.addEventListener('click', function(){
			var isPassword = passInput.type === 'password';
			passInput.type = isPassword ? 'text' : 'password';
			toggle.setAttribute('aria-pressed', String(isPassword));
			toggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
		});
	}

	// Simple validation and logging
	if (form){
		form.addEventListener('submit', function(e){
			e.preventDefault();

			var hasError = false;
			// Clear errors
			if (userError) userError.textContent = '';
			if (passError) passError.textContent = '';

			// Validate username/email
			if (!userInput || userInput.value.trim() === ''){
				if (userError) userError.textContent = 'Username or Email is required.';
				hasError = true;
			}

			// Validate password
			if (!passInput || passInput.value.trim() === ''){
				if (passError) passError.textContent = 'Password is required.';
				hasError = true;
			}

			if (hasError) return;

			// For now, just log credentials (do not send to backend)
			console.log({
				username: userInput ? userInput.value.trim() : '',
				password: passInput ? passInput.value : ''
			});

			// Hook real auth navigation here
			// window.location.href = '/dashboard';
		});
	}

	// Back to Home link (normal anchor already goes to '/'; this is optional reinforcement)
	var backHome = document.getElementById('backHome');
	if (backHome){
		backHome.addEventListener('click', function(e){
			// Let anchor behave normally; uncomment to force programmatic nav:
			// e.preventDefault();
			// window.location.href = '/';
		});
	}
});


