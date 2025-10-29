// dashboard.js
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

    // Action card interactions
    const actionCards = document.querySelectorAll('.action-card');
    actionCards.forEach(card => {
        card.addEventListener('click', handleActionClick);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleActionClick(e);
            }
        });
    });

    function handleActionClick(event) {
        const card = event.currentTarget;
        const cardId = card.id;
        
        // Add click animation
        card.style.transform = 'translateY(-2px) scale(0.98)';
        setTimeout(() => {
            card.style.transform = '';
        }, 150);

        switch(cardId) {
            case 'policiesCard':
                window.location.href = '/policies';
                break;
            case 'sendMoneyCard':
                window.location.href = '/send_money';
                break;
            case 'transactionHistoryCard':
                window.location.href = '/transaction_history';
                break;
            case 'profileCard':
                showProfileSettings();
                break;
            case 'chatbotCard':
                window.location.href = '/chatbot';
                break;
            default:
                console.log('Action not implemented yet:', cardId);
        }
    }

    // Refresh balance button
    const refreshBtn = document.getElementById('refreshBalance');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshBalance);
    }

    function refreshBalance() {
        const btn = refreshBtn;
        const originalText = btn.innerHTML;
        
        // Show loading state
        btn.innerHTML = `
            <svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style="animation: spin 1s linear infinite;">
                <path d="M21 12a9 9 0 11-6.219-8.56" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Refreshing...</span>
        `;
        btn.disabled = true;

        // Add spin animation
        const spinStyle = document.createElement('style');
        spinStyle.textContent = `
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(spinStyle);

        // Simulate API call
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
            showNotification('Balance refreshed successfully!', 'success');
            spinStyle.remove();
        }, 1500);
    }

    function showRequestLoanForm() {
        window.location.href = '/policies';
    }

    function showProfileSettings() {
        window.location.href = '/profile';
    }

    function showNotification(message, type = 'info') {
        const flashContainer = document.querySelector('.flash-messages') || createFlashContainer();
        
        const flash = document.createElement('div');
        flash.className = `flash flash-${type}`;
        flash.setAttribute('role', 'alert');
        flash.innerHTML = `
            <span>${message}</span>
            <button class="flash-close" aria-label="Close message">&times;</button>
        `;

        // Add close functionality
        const closeBtn = flash.querySelector('.flash-close');
        closeBtn.addEventListener('click', () => {
            flash.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => flash.remove(), 300);
        });

        flashContainer.appendChild(flash);

        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (flash.parentNode) {
                flash.style.animation = 'slideOut 0.3s ease-in forwards';
                setTimeout(() => flash.remove(), 300);
            }
        }, 3000);
    }

    function createFlashContainer() {
        const container = document.createElement('div');
        container.className = 'flash-messages';
        document.body.appendChild(container);
        return container;
    }

    // Add entrance animation to cards
    const cards = document.querySelectorAll('.card, .action-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });

    // Keyboard navigation for action cards
    actionCards.forEach(card => {
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        
        card.addEventListener('focus', () => {
            card.style.outline = '3px solid color-mix(in oklab, var(--primary) 60%, white)';
            card.style.outlineOffset = '2px';
        });
        
        card.addEventListener('blur', () => {
            card.style.outline = '';
            card.style.outlineOffset = '';
        });
    });

    // Add hover effects for better UX
    actionCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-4px)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });

    console.log('Dashboard initialized successfully!');
});
