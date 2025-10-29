// chatbot.js
document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.getElementById('chatWindow');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');

    function appendMessage(role, text) {
        const wrap = document.createElement('div');
        wrap.style.display = 'flex';
        wrap.style.flexDirection = 'column';
        wrap.style.gap = '.25rem';

        const bubble = document.createElement('div');
        bubble.style.padding = '.75rem 1rem';
        bubble.style.borderRadius = '12px';
        bubble.style.maxWidth = '80%';
        bubble.style.whiteSpace = 'pre-wrap';
        bubble.style.wordBreak = 'break-word';
        if (role === 'user') {
            bubble.style.alignSelf = 'flex-end';
            bubble.style.background = 'rgba(31,122,165,0.1)';
        } else {
            bubble.style.alignSelf = 'flex-start';
            bubble.style.background = 'rgba(46,158,123,0.12)';
        }
        bubble.textContent = text;

        wrap.appendChild(bubble);
        chatWindow.appendChild(wrap);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    async function sendMessage() {
        const text = (chatInput.value || '').trim();
        if (!text) return;
        appendMessage('user', text);
        chatInput.value = '';
        sendBtn.disabled = true;

        try {
            const resp = await fetch('/api/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await resp.json();
            if (data.reply) {
                appendMessage('assistant', data.reply);
            } else if (data.error) {
                appendMessage('assistant', 'Error: ' + data.error);
            } else {
                appendMessage('assistant', 'No reply received.');
            }
        } catch (e) {
            appendMessage('assistant', 'Network error: ' + e.message);
        } finally {
            sendBtn.disabled = false;
            chatInput.focus();
        }
    }

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        sendMessage();
    });
});


