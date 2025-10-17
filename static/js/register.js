// register.js
// Client-side validation, small UX touches, and gentle entrance animation

document.addEventListener('DOMContentLoaded', function(){
	var yearEl = document.getElementById('year');
	if (yearEl) yearEl.textContent = String(new Date().getFullYear());

	var form = document.getElementById('registerForm');
	var fullName = document.getElementById('fullName');
	var email = document.getElementById('email');
	var phone = document.getElementById('phone');
	var password = document.getElementById('password');
	var confirm = document.getElementById('confirm');
	var terms = document.getElementById('terms');
	var nameError = document.getElementById('nameError');
	var emailError = document.getElementById('emailError');
	var passError = document.getElementById('passError');
	var confirmError = document.getElementById('confirmError');
	var termsError = document.getElementById('termsError');
	var toggle = document.getElementById('togglePwd');

	var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// Entrance animation
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

	// Show/hide password
	if (toggle && password){
		toggle.addEventListener('click', function(){
			var isPassword = password.type === 'password';
			password.type = isPassword ? 'text' : 'password';
			toggle.setAttribute('aria-pressed', String(isPassword));
			toggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
		});
	}

	function validateEmail(value){
		return /^\S+@\S+\.\S+$/.test(value);
	}

	if (form){
		form.addEventListener('submit', function(e){
			e.preventDefault();

			var submitBtn = document.getElementById('createBtn');
			if (submitBtn) submitBtn.disabled = true;

			// Clear errors
			if (nameError) nameError.textContent = '';
			if (emailError) emailError.textContent = '';
			if (passError) passError.textContent = '';
			if (confirmError) confirmError.textContent = '';
			if (termsError) termsError.textContent = '';

			var hasError = false;

			if (!fullName || fullName.value.trim() === ''){
				if (nameError) nameError.textContent = 'Full name is required.';
				hasError = true;
			}

			if (!email || email.value.trim() === '' || !validateEmail(email.value.trim())){
				if (emailError) emailError.textContent = 'Enter a valid email address.';
				hasError = true;
			}

			if (!password || password.value.length < 8){
				if (passError) passError.textContent = 'Password must be at least 8 characters.';
				hasError = true;
			}

			if (!confirm || confirm.value !== (password ? password.value : '')){
				if (confirmError) confirmError.textContent = 'Passwords do not match.';
				hasError = true;
			}

			if (!terms || !terms.checked){
				if (termsError) termsError.textContent = 'You must agree to continue.';
				hasError = true;
			}

			if (hasError){
				if (submitBtn) submitBtn.disabled = false;
				return;
			}

			console.log({
				fullName: fullName ? fullName.value.trim() : '',
				email: email ? email.value.trim() : '',
				phone: phone ? phone.value.trim() : '',
				password: password ? password.value : ''
			});

			// Simulate success UI
			alert('Account details look good! (Client-side validation passed)');
			if (submitBtn) submitBtn.disabled = false;
		});
	}

	// Navigation helpers (anchors already have hrefs; this is optional)
	var backHome = document.getElementById('backHome');
	var toLogin = document.getElementById('toLogin');
	if (backHome){
		backHome.addEventListener('click', function(e){
			// let the anchor work normally
		});
	}
	if (toLogin){
		toLogin.addEventListener('click', function(e){
			// let the anchor work normally
		});
	}
});


