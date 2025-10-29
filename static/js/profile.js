/**
 * Profile Page JavaScript
 * Handles form interactions, validation, and user experience enhancements
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize profile page functionality
    initializeProfilePage();
});

function initializeProfilePage() {
    // Set current year in footer
    setCurrentYear();
    
    // Initialize form handlers
    initializeFormHandlers();
    
    // Initialize flash message handlers
    initializeFlashMessages();
    
    // Initialize accessibility features
    initializeAccessibility();
}

function setCurrentYear() {
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

function initializeFormHandlers() {
    // Edit Information Form
    const editInfoBtn = document.getElementById('editInfoBtn');
    const editInfoForm = document.getElementById('editInfoForm');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const cancelUpdateBtn = document.getElementById('cancelUpdateBtn');
    const updateInfoForm = document.getElementById('updateInfoForm');
    
    if (editInfoBtn && editInfoForm) {
        editInfoBtn.addEventListener('click', function() {
            showEditForm(editInfoForm);
        });
    }
    
    if (cancelEditBtn && editInfoForm) {
        cancelEditBtn.addEventListener('click', function() {
            hideEditForm(editInfoForm);
        });
    }
    
    if (cancelUpdateBtn && editInfoForm) {
        cancelUpdateBtn.addEventListener('click', function() {
            hideEditForm(editInfoForm);
        });
    }
    
    if (updateInfoForm) {
        updateInfoForm.addEventListener('submit', function(e) {
            if (!validateInfoForm()) {
                e.preventDefault();
            }
        });
    }
    
    // Change Password Form
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
    const cancelPasswordUpdateBtn = document.getElementById('cancelPasswordUpdateBtn');
    const updatePasswordForm = document.getElementById('updatePasswordForm');
    
    if (changePasswordBtn && changePasswordForm) {
        changePasswordBtn.addEventListener('click', function() {
            showEditForm(changePasswordForm);
        });
    }
    
    if (cancelPasswordBtn && changePasswordForm) {
        cancelPasswordBtn.addEventListener('click', function() {
            hideEditForm(changePasswordForm);
        });
    }
    
    if (cancelPasswordUpdateBtn && changePasswordForm) {
        cancelPasswordUpdateBtn.addEventListener('click', function() {
            hideEditForm(changePasswordForm);
        });
    }
    
    if (updatePasswordForm) {
        updatePasswordForm.addEventListener('submit', function(e) {
            if (!validatePasswordForm()) {
                e.preventDefault();
            }
        });
    }
}

function showEditForm(form) {
    if (form) {
        form.style.display = 'block';
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Focus on first input
        const firstInput = form.querySelector('input[type="text"], input[type="email"], input[type="tel"], input[type="password"]');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
        
        // Add animation class
        form.classList.add('form-show');
    }
}

function hideEditForm(form) {
    if (form) {
        form.style.display = 'none';
        form.classList.remove('form-show');
        
        // Clear form fields
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            if (input.type !== 'hidden') {
                input.value = '';
            }
        });
        
        // Clear any validation errors
        clearValidationErrors(form);
    }
}

function validateInfoForm() {
    const form = document.getElementById('updateInfoForm');
    if (!form) return true;
    
    let isValid = true;
    const emailInput = form.querySelector('input[name="email"]');
    const phoneInput = form.querySelector('input[name="phone"]');
    
    // Clear previous errors
    clearValidationErrors(form);
    
    // Validate email if provided
    if (emailInput && emailInput.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value.trim())) {
            showFieldError(emailInput, 'Please enter a valid email address');
            isValid = false;
        }
    }
    
    // Validate phone if provided
    if (phoneInput && phoneInput.value.trim()) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(phoneInput.value.trim().replace(/[\s\-\(\)]/g, ''))) {
            showFieldError(phoneInput, 'Please enter a valid phone number');
            isValid = false;
        }
    }
    
    return isValid;
}

function validatePasswordForm() {
    const form = document.getElementById('updatePasswordForm');
    if (!form) return true;
    
    let isValid = true;
    const currentPassword = form.querySelector('input[name="current_password"]');
    const newPassword = form.querySelector('input[name="new_password"]');
    const confirmPassword = form.querySelector('input[name="confirm_password"]');
    
    // Clear previous errors
    clearValidationErrors(form);
    
    // Validate current password
    if (!currentPassword || !currentPassword.value.trim()) {
        showFieldError(currentPassword, 'Current password is required');
        isValid = false;
    }
    
    // Validate new password
    if (!newPassword || !newPassword.value.trim()) {
        showFieldError(newPassword, 'New password is required');
        isValid = false;
    } else if (newPassword.value.length < 6) {
        showFieldError(newPassword, 'New password must be at least 6 characters long');
        isValid = false;
    }
    
    // Validate confirm password
    if (!confirmPassword || !confirmPassword.value.trim()) {
        showFieldError(confirmPassword, 'Please confirm your new password');
        isValid = false;
    } else if (newPassword && confirmPassword.value !== newPassword.value) {
        showFieldError(confirmPassword, 'Passwords do not match');
        isValid = false;
    }
    
    return isValid;
}

function showFieldError(input, message) {
    if (!input) return;
    
    // Add error class
    input.classList.add('error');
    
    // Create or update error message
    let errorElement = input.parentNode.querySelector('.field-error');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.style.color = 'var(--error-color)';
        errorElement.style.fontSize = '0.75rem';
        errorElement.style.marginTop = '0.25rem';
        input.parentNode.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
}

function clearValidationErrors(form) {
    if (!form) return;
    
    // Remove error classes
    const errorInputs = form.querySelectorAll('.error');
    errorInputs.forEach(input => input.classList.remove('error'));
    
    // Remove error messages
    const errorMessages = form.querySelectorAll('.field-error');
    errorMessages.forEach(message => message.remove());
}

function initializeFlashMessages() {
    const flashMessages = document.querySelectorAll('.flash');
    
    flashMessages.forEach(flash => {
        // Auto-hide after 5 seconds
        setTimeout(() => {
            hideFlashMessage(flash);
        }, 5000);
        
        // Add close button functionality
        const closeBtn = flash.querySelector('.flash-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                hideFlashMessage(flash);
            });
        }
    });
}

function hideFlashMessage(flash) {
    if (flash) {
        flash.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            if (flash.parentNode) {
                flash.parentNode.removeChild(flash);
            }
        }, 300);
    }
}

function initializeAccessibility() {
    // Add keyboard navigation support
    const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    // Add focus indicators
    focusableElements.forEach(element => {
        element.addEventListener('focus', function() {
            this.style.outline = '2px solid var(--primary-color)';
            this.style.outlineOffset = '2px';
        });
        
        element.addEventListener('blur', function() {
            this.style.outline = '';
            this.style.outlineOffset = '';
        });
    });
    
    // Add ARIA labels for dynamic content
    const editButtons = document.querySelectorAll('[id$="Btn"]');
    editButtons.forEach(button => {
        if (!button.getAttribute('aria-label')) {
            button.setAttribute('aria-label', button.textContent.trim());
        }
    });
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    .form-show {
        animation: slideDown 0.3s ease forwards;
    }
    
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    .error {
        border-color: var(--error-color) !important;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
    }
    
    .field-error {
        color: var(--error-color);
        font-size: 0.75rem;
        margin-top: 0.25rem;
    }
`;
document.head.appendChild(style);

// Handle form submission with loading states
document.addEventListener('submit', function(e) {
    const form = e.target;
    if (form.tagName === 'FORM') {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            // Add loading state
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Processing...';
            submitBtn.disabled = true;
            
            // Reset after a timeout (in case of errors)
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 5000);
        }
    }
});

// Handle window resize for responsive behavior
window.addEventListener('resize', throttle(function() {
    // Close any open forms on mobile when orientation changes
    if (window.innerWidth < 768) {
        const openForms = document.querySelectorAll('.edit-form, .password-form');
        openForms.forEach(form => {
            if (form.style.display === 'block') {
                // Don't auto-close, just ensure proper display
                form.style.display = 'block';
            }
        });
    }
}, 250));

// Handle escape key to close forms
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const visibleForms = document.querySelectorAll('.edit-form[style*="block"], .password-form[style*="block"]');
        visibleForms.forEach(form => {
            hideEditForm(form);
        });
    }
});

// Add smooth scrolling for better UX
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Initialize tooltips for better UX
function initializeTooltips() {
    const elementsWithTitle = document.querySelectorAll('[title]');
    elementsWithTitle.forEach(element => {
        element.addEventListener('mouseenter', function() {
            // Simple tooltip implementation
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = this.getAttribute('title');
            tooltip.style.cssText = `
                position: absolute;
                background: var(--text-primary);
                color: white;
                padding: 0.5rem;
                border-radius: var(--radius-sm);
                font-size: 0.75rem;
                z-index: 1000;
                pointer-events: none;
            `;
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
        });
        
        element.addEventListener('mouseleave', function() {
            const tooltip = document.querySelector('.tooltip');
            if (tooltip) {
                tooltip.remove();
            }
        });
    });
}

// Initialize tooltips when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTooltips);
} else {
    initializeTooltips();
}
