const chatContainer = document.getElementById('chat-context');
if (chatContainer) {
    const channelId = chatContainer.dataset.channelId;
    const username = chatContainer.dataset.username;
    const ownPfp = chatContainer.dataset.ownPfp;
    const textarea = document.getElementById('userprompt');
    const messageArea = document.querySelector('.messageArea');
    const scrollContainer = document.querySelector('.messageAreaPadding');

    function escapeHtml(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    function appendMessage(msg) {
        const pfpSrc = msg.user.ownPfp && msg.user.ownPfp !== 'null'
            ? msg.user.ownPfp
            : '/assets/1759430838.png';
        const div = document.createElement('div');
        div.id = msg.id;
        div.innerHTML =
            '<div class="jCxwsP">' +
                '<div class="csvICB">' +
                    '<svg width="36" height="36" viewBox="0 0 32 32">' +
                        '<foreignObject x="0" y="0" width="32" height="32">' +
                            '<img src="' + escapeHtml(pfpSrc) + '" alt="' + escapeHtml(msg.user.username) + '\'s pfp" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">' +
                        '</foreignObject>' +
                    '</svg>' +
                '</div>' +
                '<div class="jkmmZm">' +
                    '<span>' +
                        '<span class="author">' + escapeHtml(msg.user.username) + '</span>' +
                        '<span class="date-time" style="display: none;"></span>' +
                    '</span>' +
                    '<div id="message-content">' +
                        '<p class="textContent">' + escapeHtml(msg.content) + '</p>' +
                    '</div>' +
                '</div>' +
            '</div>';
        messageArea.appendChild(div);
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }

    textarea.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const content = textarea.value.trim();
            if (!content) return;

            textarea.disabled = true;
            try {
                const res = await fetch('/api/channels/' + channelId + '/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: content })
                });
                if (!res.ok) throw new Error('Send failed');
                const msg = await res.json();
                msg.user = { uid: msg.user_id, username: username, ownPfp: ownPfp };

                textarea.value = '';
                appendMessage(msg);
            } catch (err) {
                console.error(err);
            } finally {
                textarea.disabled = false;
                textarea.focus();
            }
        }
    });

    scrollContainer.scrollTop = scrollContainer.scrollHeight;
}
