// transaction_history.js
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

    // Filter elements
    const dateFromInput = document.getElementById('dateFrom');
    const dateToInput = document.getElementById('dateTo');
    const transactionTypeSelect = document.getElementById('transactionType');
    const searchTermInput = document.getElementById('searchTerm');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    const refreshBtn = document.getElementById('refreshBtn');

    // View controls
    const listViewBtn = document.getElementById('listViewBtn');
    const cardViewBtn = document.getElementById('cardViewBtn');
    const transactionsList = document.getElementById('transactionsList');

    // Summary elements
    const totalTransactionsEl = document.getElementById('totalTransactions');
    const totalSentEl = document.getElementById('totalSent');
    const totalReceivedEl = document.getElementById('totalReceived');
    const thisMonthEl = document.getElementById('thisMonth');

    // Transaction data (would normally come from server)
    let allTransactions = Array.from(document.querySelectorAll('.transaction-item')).map(item => ({
        id: item.dataset.id || Math.random().toString(36).substr(2, 9),
        type: item.dataset.type || 'transfer',
        date: item.dataset.date || new Date().toISOString(),
        amount: parseFloat(item.querySelector('.transaction-amount')?.textContent?.replace(/[^0-9.-]/g, '') || '0'),
        title: item.querySelector('.transaction-title')?.textContent || '',
        description: item.querySelector('.transaction-description')?.textContent || '',
        isSent: item.querySelector('.transaction-amount')?.classList.contains('sent') || false
    }));

    // Initialize filters
    function initializeFilters() {
        // Set default date range (last 30 days)
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        
        dateFromInput.value = thirtyDaysAgo.toISOString().split('T')[0];
        dateToInput.value = today.toISOString().split('T')[0];
        
        // Apply initial filters
        applyFilters();
    }

    // Apply filters
    function applyFilters() {
        const dateFrom = dateFromInput.value ? new Date(dateFromInput.value) : null;
        const dateTo = dateToInput.value ? new Date(dateToInput.value) : null;
        const type = transactionTypeSelect.value;
        const searchTerm = searchTermInput.value.toLowerCase();

        const filteredTransactions = allTransactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            
            // Date filter
            if (dateFrom && transactionDate < dateFrom) return false;
            if (dateTo && transactionDate > dateTo) return false;
            
            // Type filter
            if (type && transaction.type !== type) return false;
            
            // Search filter
            if (searchTerm) {
                const searchableText = `${transaction.title} ${transaction.description}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) return false;
            }
            
            return true;
        });

        displayTransactions(filteredTransactions);
        updateSummary(filteredTransactions);
    }

    // Display transactions
    function displayTransactions(transactions) {
        if (transactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <polyline points="14,2 14,8 20,8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <line x1="16" y1="13" x2="8" y2="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <line x1="16" y1="17" x2="8" y2="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <h3>No Transactions Found</h3>
                    <p>No transactions match your current filters. Try adjusting your search criteria.</p>
                </div>
            `;
            return;
        }

        // Sort by date (newest first)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        transactionsList.innerHTML = transactions.map(transaction => {
            const date = new Date(transaction.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="transaction-item" data-type="${transaction.type}" data-date="${transaction.date}">
                    <div class="transaction-icon">
                        ${getTransactionIcon(transaction.type)}
                    </div>
                    <div class="transaction-content">
                        <div class="transaction-header">
                            <div class="transaction-title">${transaction.title}</div>
                            <div class="transaction-amount ${transaction.isSent ? 'sent' : 'received'}">
                                ${transaction.isSent ? '-' : '+'}$${transaction.amount.toFixed(2)}
                            </div>
                        </div>
                        <div class="transaction-details">
                            <div class="transaction-description">${transaction.description}</div>
                            <div class="transaction-meta">
                                <span class="transaction-date">${formattedDate}</span>
                                <span class="transaction-id">ID: ${transaction.id}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Get transaction icon based on type
    function getTransactionIcon(type) {
        const icons = {
            transfer: `<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2m2 4h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm7-5a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
            deposit: `<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2v20m0-20l4 4m-4-4l-4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
            withdrawal: `<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 22V2m0 20l4-4m-4 4l-4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
            loan: `<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 1v6m0 0l-3-3m3 3l3-3m-3 3v6m0 0l-3 3m3-3l3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`
        };
        return icons[type] || icons.transfer;
    }

    // Update summary
    function updateSummary(transactions) {
        const totalTransactions = transactions.length;
        const totalSent = transactions.filter(t => t.isSent).reduce((sum, t) => sum + t.amount, 0);
        const totalReceived = transactions.filter(t => !t.isSent).reduce((sum, t) => sum + t.amount, 0);
        
        // This month's transactions
        const thisMonth = new Date();
        const thisMonthTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === thisMonth.getMonth() && 
                   transactionDate.getFullYear() === thisMonth.getFullYear();
        }).length;

        totalTransactionsEl.textContent = totalTransactions;
        totalSentEl.textContent = `$${totalSent.toFixed(2)}`;
        totalReceivedEl.textContent = `$${totalReceived.toFixed(2)}`;
        thisMonthEl.textContent = thisMonthTransactions;
    }

    // Clear filters
    function clearFilters() {
        dateFromInput.value = '';
        dateToInput.value = '';
        transactionTypeSelect.value = '';
        searchTermInput.value = '';
        applyFilters();
    }

    // Refresh data
    function refreshData() {
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
            showNotification('Transaction history refreshed!', 'success');
            spinStyle.remove();
            
            // Re-apply current filters
            applyFilters();
        }, 1500);
    }

    // View toggle
    function toggleView(view) {
        listViewBtn.classList.toggle('active', view === 'list');
        cardViewBtn.classList.toggle('active', view === 'card');
        
        transactionsList.classList.toggle('card-view', view === 'card');
        transactionsList.classList.toggle('list-view', view === 'list');
    }

    // Event listeners
    applyFiltersBtn.addEventListener('click', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);
    refreshBtn.addEventListener('click', refreshData);
    
    listViewBtn.addEventListener('click', () => toggleView('list'));
    cardViewBtn.addEventListener('click', () => toggleView('card'));

    // Real-time search
    searchTermInput.addEventListener('input', debounce(applyFilters, 300));

    // Debounce function
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

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + F to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            searchTermInput.focus();
        }
        
        // Escape to clear filters
        if (e.key === 'Escape') {
            clearFilters();
        }
    });

    // Show notification
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

    // Initialize
    initializeFilters();

    console.log('Transaction History page initialized successfully!');
});
