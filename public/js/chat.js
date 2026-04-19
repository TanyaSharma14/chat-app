document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const currentUser = localStorage.getItem('username');
    if (!token || !currentUser) return window.location.href = '/index.html';

    document.getElementById('current-user').innerText = currentUser;
    const myProfilePic = localStorage.getItem('profilePic') || 'https://via.placeholder.com/32?text=%F0%9F%91%A4';
    document.getElementById('my-profile-pic').src = myProfilePic;

    const socket = io({ auth: { token } });
    let activeRoomId = null;
    let currentGroupName = '';
    let typingTimeout;

    const userList = document.getElementById('user-list');
    const msgContainer = document.getElementById('message-container');
    const msgInput = document.getElementById('msg-input');
    const fileInput = document.getElementById('file-input');
    const overlay = document.getElementById('no-chat-overlay');
    const typingInd = document.getElementById('typing-indicator');
    const renameBtn = document.getElementById('rename-group-btn');

    const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // Initial Fetch logic
    async function loadUsersAndGroups() {
        // Fetch users
        const resUsers = await fetch('/api/chat/users', { headers: authHeaders });
        const users = await resUsers.json();
        userList.innerHTML = '<div style="padding: 0.5rem 1.5rem; font-size: 0.75rem; color: var(--text-muted); font-weight: 600; letter-spacing: 1px;">USERS</div>';
        users.forEach(u => {
            const div = document.createElement('div');
            div.className = 'user-item';
            const avatarHtml = u.profilePic ? `<img src="${u.profilePic}" class="avatar">` : `<div style="font-size: 1.2rem; margin-right:0.5rem">👤</div>`;
            div.innerHTML = `<div class="status-dot ${u.isOnline ? 'online' : 'offline'}" id="status-${u.username}"></div> ${avatarHtml} <span>${u.username}</span>`;
            div.onclick = () => startPrivateChat(u.username);
            userList.appendChild(div);
        });

        // Fetch groups
        const resGroups = await fetch('/api/chat/rooms/groups', { headers: authHeaders });
        const groups = await resGroups.json();
        const groupList = document.getElementById('group-list');
        groupList.innerHTML = '<div style="padding: 0.5rem 1.5rem; font-size: 0.75rem; color: var(--text-muted); font-weight: 600; letter-spacing: 1px;">MY GROUPS</div>';
        groups.forEach(g => {
            const div = document.createElement('div'); div.className = 'user-item';
            div.innerHTML = `<span style="font-size:1.2rem; margin-right:0.5rem;">👥</span> <span>${g.name}</span>`;
            div.onclick = () => startGroupChat(g._id, g.name);
            groupList.appendChild(div);
        });
    }
    await loadUsersAndGroups();

    // Profile Pic Upload Setup
    document.getElementById('my-profile-pic').onclick = () => document.getElementById('profile-upload').click();
    document.getElementById('profile-upload').onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData(); formData.append('image', file);
        const res = await fetch('/api/chat/upload/profile', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
        const data = await res.json();
        if(data.imageUrl) {
            localStorage.setItem('profilePic', data.imageUrl);
            document.getElementById('my-profile-pic').src = data.imageUrl;
        }
    };

    async function startPrivateChat(targetUsername) {
        if(activeRoomId) socket.emit('leaveRoom', { roomId: activeRoomId });
        const res = await fetch('/api/chat/rooms/private', { method: 'POST', headers: authHeaders, body: JSON.stringify({ targetUsername }) });
        const room = await res.json();
        activeRoomId = room._id;
        document.querySelector('#chatting-with span').innerText = 'Chatting with: ' + targetUsername;
        renameBtn.classList.add('hidden'); // Hide rename in private chats
        overlay.classList.add('hidden');
        msgContainer.innerHTML = ''; typingInd.innerText = '';
        socket.emit('joinRoom', { roomId: activeRoomId });
    }

    async function startGroupChat(roomId, name) {
        if(activeRoomId) socket.emit('leaveRoom', { roomId: activeRoomId });
        activeRoomId = roomId;
        currentGroupName = name;
        document.querySelector('#chatting-with span').innerText = name + ' (Group)';
        renameBtn.classList.remove('hidden'); // Show rename button
        overlay.classList.add('hidden');
        msgContainer.innerHTML = ''; typingInd.innerText = '';
        socket.emit('joinRoom', { roomId: activeRoomId });
    }

    // Group logic handling
    document.getElementById('new-group-btn').onclick = async () => {
        const name = prompt("Enter Group Name:"); if (!name) return;
        const usersString = prompt("Enter usernames separated by comma:"); if (!usersString) return;
        await fetch('/api/chat/rooms/group', { method: 'POST', headers: authHeaders, body: JSON.stringify({ name, participantUsernames: usersString.split(',').map(s=>s.trim()) }) });
        await loadUsersAndGroups();
    };

    // Rename logic
    renameBtn.onclick = async () => {
        const newName = prompt("Enter new group name:", currentGroupName);
        if(!newName || newName === currentGroupName) return;
        await fetch(`/api/chat/rooms/${activeRoomId}/rename`, { method: 'PATCH', headers: authHeaders, body: JSON.stringify({ name: newName }) });
        socket.emit('groupRenamed', { roomId: activeRoomId, newName });
        document.querySelector('#chatting-with span').innerText = newName + ' (Group)';
        currentGroupName = newName;
        loadUsersAndGroups();
    };

    document.getElementById('logout-btn').onclick = () => { localStorage.clear(); window.location.href = '/index.html'; };
    
    document.getElementById('clear-chat-btn').onclick = async () => {
        if (!activeRoomId) return;
        if(confirm("Are you sure you want to permanently delete this chat?")) {
            await fetch(`/api/chat/rooms/${activeRoomId}/clear`, { method: 'DELETE', headers: authHeaders });
            msgContainer.innerHTML = '';
        }
    };

    // Socket Interactions
    socket.on('history', (messages) => { msgContainer.innerHTML = ''; messages.forEach(msg => appendMessage(msg)); scrollToBottom(); });
    socket.on('groupRenamed', ({ roomId, newName }) => {
        if(activeRoomId === roomId) { document.querySelector('#chatting-with span').innerText = newName + ' (Group)'; currentGroupName = newName; }
        loadUsersAndGroups();
    });
    socket.on('message', (msg) => {
        if (msg.roomId === activeRoomId) { appendMessage(msg); scrollToBottom();
            if (msg.sender !== currentUser) { socket.emit('markAsRead', { messageId: msg._id, roomId: activeRoomId }); }
        }
    });
    socket.on('messageRead', ({ messageId }) => { const tick = document.getElementById(`tick-${messageId}`); if (tick) { tick.className = 'read-receipt read'; tick.innerText = '✓✓'; } });
    socket.on('typing', ({ username, isTyping }) => { typingInd.innerText = isTyping ? `${username} is typing...` : ''; });
    socket.on('userStatusChanged', ({ username, isOnline }) => { const dot = document.getElementById(`status-${username}`); if (dot) dot.className = `status-dot ${isOnline ? 'online' : 'offline'}`; });
    
    // Unsend logic mapped to window so inline onclick works
    window.unsendMessage = (id) => { socket.emit('unsendMessage', { messageId: id, roomId: activeRoomId }); };
    socket.on('messageDeleted', ({ messageId }) => { const msgDiv = document.getElementById(`msg-${messageId}`); if(msgDiv) msgDiv.remove(); });

    socket.on('connect_error', () => { window.location.href = '/index.html'; });

    msgInput.addEventListener('input', () => {
        if (!activeRoomId) return; socket.emit('typing', { roomId: activeRoomId, isTyping: true });
        clearTimeout(typingTimeout); typingTimeout = setTimeout(() => socket.emit('typing', { roomId: activeRoomId, isTyping: false }), 2000);
    });

    document.getElementById('chat-form').onsubmit = (e) => {
        e.preventDefault(); const text = msgInput.value.trim();
        if (text && activeRoomId) { socket.emit('chatMessage', { roomId: activeRoomId, content: text, messageType: 'text' }); msgInput.value = ''; socket.emit('typing', { roomId: activeRoomId, isTyping: false }); }
    };

    document.getElementById('trigger-file-btn').onclick = () => fileInput.click();
    fileInput.onchange = async (e) => {
        const file = e.target.files[0]; if (!file || !activeRoomId) return;
        const formData = new FormData(); formData.append('image', file);
        const res = await fetch('/api/chat/upload', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
        const data = await res.json();
        if (data.imageUrl) { socket.emit('chatMessage', { roomId: activeRoomId, content: data.imageUrl, messageType: 'image' }); }
    };

    function appendMessage(msg) {
        const div = document.createElement('div');
        const isMe = msg.sender === currentUser;
        div.className = `message ${isMe ? 'sent' : 'received'}`;
        div.id = `msg-${msg._id}`;
        
        let contentHtml = msg.messageType === 'image' 
            ? `<img src="${msg.content}" class="msg-image" />` 
            : msg.content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            
        const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        let actions = '';
        if (isMe) {
            actions = `<span id="tick-${msg._id}" class="read-receipt ${msg.status === 'read' ? 'read' : ''}">${msg.status === 'read' ? '✓✓' : '✓'}</span>`;
            actions += `<button class="unsend-btn" title="Unsend Message" onclick="unsendMessage('${msg._id}')">🗑️</button>`;
        }

        div.innerHTML = `${contentHtml} <span class="message-time">${!isMe ? '<b>'+msg.sender+'</b> ' : ''}${time} ${actions}</span>`;
        msgContainer.appendChild(div);
    }
    const scrollToBottom = () => msgContainer.scrollTop = msgContainer.scrollHeight;

    // Search Filtering feature
    document.getElementById('global-search').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const items = document.querySelectorAll('.user-item'); 
        items.forEach(item => {
            if (item.innerText.toLowerCase().includes(query)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });
});
