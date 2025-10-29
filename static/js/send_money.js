// send_money.js
document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // Flash message handling
    const flashMessages = document.querySelectorAll('.flash');
    flashMessages.forEach(flash => {
        const closeBtn = flash.querySelector('.flash-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                flash.style.animation = 'slideOut 0.3s ease-in forwards';
                setTimeout(() => flash.remove(), 300);
            });
        }
        
        // Auto-hide flash messages after 5 seconds
        setTimeout(() => {
            if (flash.parentNode) {
                flash.style.animation = 'slideOut 0.3s ease-in forwards';
                setTimeout(() => flash.remove(), 300);
            }
        }, 5000);
    });

    // Add slideOut animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // Form elements
    const form = document.getElementById('sendMoneyForm');
    const recipientInput = document.getElementById('recipientAccount');
    const amountInput = document.getElementById('amount');
    const descriptionInput = document.getElementById('description');
    const sendBtn = document.getElementById('sendBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    // Form validation
    function validateForm() {
        let isValid = true;
        
        // Clear previous errors
        clearErrors();
        
        // Validate recipient account
        const recipientValue = recipientInput.value.trim();
        if (!recipientValue) {
            showError('recipientError', 'Recipient account number is required');
            isValid = false;
        } else if (!/^AC\d{6}$/.test(recipientValue)) {
            showError('recipientError', 'Account number must be in format AC######');
            isValid = false;
        }
        
        // Validate amount
        const amountValue = parseFloat(amountInput.value);
        const maxAmount = parseFloat(amountInput.getAttribute('max'));
        
        if (!amountValue || amountValue <= 0) {
            showError('amountError', 'Please enter a valid amount');
            isValid = false;
        } else if (amountValue > maxAmount) {
            showError('amountError', `Amount cannot exceed your available balance of $${maxAmount.toFixed(2)}`);
            isValid = false;
        } else if (amountValue < 0.01) {
            showError('amountError', 'Minimum transfer amount is $0.01');
            isValid = false;
        }
        
        return isValid;
    }

    function showError(errorId, message) {
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    function clearErrors() {
        const errorElements = document.querySelectorAll('.form-error');
        errorElements.forEach(error => {
            error.classList.remove('show');
            error.textContent = '';
        });
    }

    // Real-time validation
    recipientInput.addEventListener('input', function() {
        const value = this.value.trim();
        if (value && !/^AC\d{6}$/.test(value)) {
            showError('recipientError', 'Account number must be in format AC######');
        } else {
            clearErrors();
        }
    });

    amountInput.addEventListener('input', function() {
        const value = parseFloat(this.value);
        const maxAmount = parseFloat(this.getAttribute('max'));
        
        if (value && value > maxAmount) {
            showError('amountError', `Amount cannot exceed your available balance of $${maxAmount.toFixed(2)}`);
        } else {
            clearErrors();
        }
    });

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        // Show loading state
        const originalText = sendBtn.innerHTML;
        sendBtn.innerHTML = `
            <svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style="animation: spin 1s linear infinite;">
                <path d="M21 12a9 9 0 11-6.219-8.56" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Sending...</span>
        `;
        sendBtn.disabled = true;
        
        // Add spin animation
        const spinStyle = document.createElement('style');
        spinStyle.textContent = `
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(spinStyle);
        
        // Submit form
        setTimeout(() => {
            form.submit();
        }, 1000);
    });

    // Cancel button
    cancelBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to cancel? Any entered information will be lost.')) {
            window.location.href = '/dashboard';
        }
    });

    // Format amount input
    amountInput.addEventListener('blur', function() {
        const value = parseFloat(this.value);
        if (value && !isNaN(value)) {
            this.value = value.toFixed(2);
        }
    });

    // Account number formatting
    recipientInput.addEventListener('input', function() {
        let value = this.value.toUpperCase().replace(/[^AC0-9]/g, '');
        
        // Auto-add AC prefix if user starts typing numbers
        if (/^\d/.test(value)) {
            value = 'AC' + value;
        }
        
        // Limit to AC + 6 digits
        if (value.startsWith('AC')) {
            value = 'AC' + value.substring(2).replace(/\D/g, '').substring(0, 6);
        }
        
        this.value = value;
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to submit
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
        
        // Escape to cancel
        if (e.key === 'Escape') {
            cancelBtn.click();
        }
    });

    // Auto-focus first input
    recipientInput.focus();

    // Add entrance animation to cards
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });

    // Add hover effects for better UX
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            if (!this.disabled) {
                this.style.transform = 'translateY(-1px)';
            }
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    console.log('Send Money page initialized successfully!');
});
