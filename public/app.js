/**
 * ============================================
 * SPYFALL ONLINE - APP.JS
 * ภาษาไทย | Local + Online Mode
 * ============================================
 */

// ========== STATE ==========
const State = {
    mode: 'local', // 'local' หรือ 'online'
    players: [],
    hostName: '',
    roomCode: '',
    maxPlayers: 6,
    timeLimit: 5,
    spyCount: 1,
    gameMode: 'normal',
    locations: [],
    gameData: null,
    currentPlayerIndex: 0,
    allRevealed: false,
    timerInterval: null,
    timeRemaining: 0,
    selectedVote: null,
    isHost: false,
    playerId: null,
    playerName: '',
    unsubscribeRoom: null
};

const ADMIN_PASSWORD = 'JINLAPAT47';
const AVATARS = ['🦊','🐱','🐶','🐼','🐨','🦁','🐯','🐮','🐷','🐸','🐵','🐔','🦄','🐲','🦋','🐙','🦀','🐧','🦅','🐺'];

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('locations.json');
        State.locations = await res.json();
    } catch (e) {
        State.locations = [];
        showToast('โหลดสถานที่ไม่สำเร็จ', 'error');
    }

    // แสดงสถานะ Firebase
    const indicator = document.getElementById('mode-indicator');
    if (firebaseReady) {
        indicator.innerHTML = '<span style="color:var(--accent-success);">🟢 Online พร้อม</span>';
    } else {
        indicator.innerHTML = '<span style="color:var(--text-muted);">⚪ Local เท่านั้น</span>';
    }

    createParticles();
    bindEvents();
});

// ========== NAVIGATION ==========
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`screen-${id}`);
    if (target) target.classList.add('active');
}

// ========== EVENTS ==========
function bindEvents() {
    // หน้าแรก
    document.getElementById('btn-create').addEventListener('click', () => {
        if (firebaseReady) {
            showScreen('mode');
        } else {
            State.mode = 'local';
            showScreen('create');
        }
    });

    document.getElementById('btn-join').addEventListener('click', () => {
        if (!firebaseReady) {
            showToast('โหมด Online ต้องตั้งค่า Firebase ก่อน — ใช้ "สร้างห้อง" สำหรับเล่น Local', 'info');
            return;
        }
        const code = document.getElementById('input-room-code').value.trim();
        if (code) document.getElementById('input-join-code').value = code;
        showScreen('join');
    });

    document.getElementById('btn-admin').addEventListener('click', () => showScreen('admin-login'));

    // เลือกโหมด
    document.getElementById('btn-mode-local').addEventListener('click', () => {
        State.mode = 'local';
        showScreen('create');
    });
    document.getElementById('btn-mode-online').addEventListener('click', () => {
        if (!firebaseReady) {
            showToast('Firebase ยังไม่พร้อม — แก้ไข firebase-config.js ก่อน', 'error');
            return;
        }
        State.mode = 'online';
        showScreen('create');
    });

    // Online status
    const onlineStatus = document.getElementById('online-status');
    if (onlineStatus) {
        onlineStatus.textContent = firebaseReady ? '✅ Firebase เชื่อมต่อแล้ว' : '⚠️ Firebase ยังไม่ได้ตั้งค่า (เล่นได้เฉพาะ Local)';
    }

    // สร้างห้อง
    document.getElementById('range-players').addEventListener('input', (e) => {
        document.getElementById('val-players').textContent = e.target.value;
    });
    document.querySelectorAll('[data-time]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-time]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    document.querySelectorAll('[data-spy]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-spy]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    document.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    document.getElementById('btn-create-room').addEventListener('click', createRoom);

    // Join (Online)
    document.getElementById('btn-join-room').addEventListener('click', joinRoom);

    // ล็อบบี้
    document.getElementById('btn-add-player').addEventListener('click', addPlayer);
    document.getElementById('input-add-player').addEventListener('keypress', (e) => { if (e.key === 'Enter') addPlayer(); });
    document.getElementById('btn-start-game').addEventListener('click', startGame);
    document.getElementById('btn-copy-code').addEventListener('click', () => {
        navigator.clipboard.writeText(State.roomCode).then(() => showToast('คัดลอกรหัสห้องแล้ว!', 'success'));
    });

    // เกม
    document.getElementById('game-card').addEventListener('click', revealCard);
    document.getElementById('btn-next-player').addEventListener('click', nextPlayer);
    document.getElementById('btn-start-timer').addEventListener('click', startTimerPhase);

    // โหวต
    document.getElementById('btn-submit-vote').addEventListener('click', submitVote);

    // ผลลัพธ์
    document.getElementById('btn-play-again').addEventListener('click', playAgain);
    document.getElementById('btn-back-lobby').addEventListener('click', backToLobby);

    // กลับ
    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.back;
            if (target === 'home' && State.roomCode) {
                if (confirm('ออกจากห้อง?')) { leaveRoom(); showScreen('home'); }
            } else {
                showScreen(target);
            }
        });
    });

    // Admin
    document.getElementById('btn-admin-login').addEventListener('click', adminLogin);
    document.getElementById('input-admin-password').addEventListener('keypress', (e) => { if (e.key === 'Enter') adminLogin(); });
    document.getElementById('btn-add-location').addEventListener('click', () => showLocationModal(-1));
    document.getElementById('btn-save-location').addEventListener('click', saveLocation);
    document.getElementById('btn-cancel-location').addEventListener('click', () => { document.getElementById('modal-location').style.display = 'none'; });
    document.getElementById('btn-import-json').addEventListener('click', () => { document.getElementById('file-import').click(); });
    document.getElementById('file-import').addEventListener('change', importJSON);
    document.getElementById('btn-export-json').addEventListener('click', exportJSON);

    // Room code uppercase
    document.getElementById('input-room-code').addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase(); });
}

// ========== ADMIN ==========
function adminLogin() {
    const pwd = document.getElementById('input-admin-password').value;
    if (pwd === ADMIN_PASSWORD) {
        showScreen('admin');
        document.getElementById('input-admin-password').value = '';
        renderLocations();
        showToast('เข้าสู่ระบบแอดมินสำเร็จ', 'success');
    } else {
        showToast('รหัสผ่านไม่ถูกต้อง', 'error');
    }
}

// ========== CREATE ROOM ==========
function createRoom() {
    const name = document.getElementById('input-host-name').value.trim();
    if (!name) { showToast('กรุณากรอกชื่อของคุณ', 'error'); return; }

    State.hostName = name;
    State.playerName = name;
    State.isHost = true;
    State.maxPlayers = parseInt(document.getElementById('range-players').value);
    State.timeLimit = parseInt(document.querySelector('[data-time].active').dataset.time);
    State.spyCount = document.querySelector('[data-spy].active').dataset.spy;
    State.gameMode = document.querySelector('[data-mode].active').dataset.mode;
    State.roomCode = generateCode();
    State.players = [{ name, avatar: AVATARS[0], id: generateId() }];
    State.playerId = State.players[0].id;

    // UI
    document.getElementById('display-room-code').textContent = State.roomCode;
    document.getElementById('display-settings').textContent =
        `${State.maxPlayers} คน • ${State.timeLimit} นาที • ${State.spyCount === 'random' ? 'สุ่ม' : State.spyCount} สายลับ • ${State.gameMode === 'normal' ? 'ปกติ' : State.gameMode === 'hard' ? 'ยาก' : 'สายลับตาบอด'}`;

    const modeBadge = document.getElementById('display-mode-badge');
    modeBadge.innerHTML = State.mode === 'online'
        ? '<span style="background:rgba(78,205,196,0.2);color:#4ecdc4;padding:4px 10px;border-radius:6px;font-size:0.75rem;">🌐 Online</span>'
        : '<span style="background:rgba(108,99,255,0.2);color:#6c63ff;padding:4px 10px;border-radius:6px;font-size:0.75rem;">📱 Local</span>';

    // Show/hide sections based on mode
    document.getElementById('add-player-section').style.display = State.mode === 'local' ? 'block' : 'none';
    document.getElementById('waiting-players-section').style.display = State.mode === 'online' ? 'block' : 'none';

    updatePlayersUI();
    showScreen('lobby');
    showToast(`สร้างห้อง ${State.roomCode} สำเร็จ!`, 'success');

    // Online: สร้างห้องใน Firebase
    if (State.mode === 'online' && firebaseReady) {
        createOnlineRoom();
    }
}

// ========== ONLINE: CREATE ROOM ==========
async function createOnlineRoom() {
    try {
        await auth.signInAnonymously();
        State.playerId = auth.currentUser.uid;
        State.players[0].id = State.playerId;

        await db.collection('rooms').doc(State.roomCode).set({
            code: State.roomCode,
            hostId: State.playerId,
            maxPlayers: State.maxPlayers,
            timeLimit: State.timeLimit,
            spyCount: State.spyCount,
            gameMode: State.gameMode,
            players: State.players,
            status: 'waiting',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Listen for player joins
        State.unsubscribeRoom = db.collection('rooms').doc(State.roomCode)
            .onSnapshot((doc) => {
                if (!doc.exists) return;
                const data = doc.data();
                State.players = data.players || [];
                updatePlayersUI();
            });
    } catch (e) {
        showToast('สร้างห้อง Online ไม่สำเร็จ: ' + e.message, 'error');
    }
}

// ========== ONLINE: JOIN ROOM ==========
async function joinRoom() {
    const name = document.getElementById('input-join-name').value.trim();
    const code = document.getElementById('input-join-code').value.trim().toUpperCase();

    if (!name) { showToast('กรุณากรอกชื่อของคุณ', 'error'); return; }
    if (!code || code.length !== 6) { showToast('กรุณากรอกรหัสห้อง 6 ตัว', 'error'); return; }

    if (!firebaseReady) {
        showToast('โหมด Online ต้องตั้งค่า Firebase ก่อน', 'error');
        return;
    }

    try {
        await auth.signInAnonymously();
        State.playerId = auth.currentUser.uid;
        State.playerName = name;
        State.roomCode = code;
        State.mode = 'online';
        State.isHost = false;

        const roomRef = db.collection('rooms').doc(code);
        const roomSnap = await roomRef.get();

        if (!roomSnap.exists) { showToast('ไม่พบห้องนี้', 'error'); return; }

        const room = roomSnap.data();
        if (room.status !== 'waiting') { showToast('เกมกำลังดำเนินอยู่', 'error'); return; }
        if (room.players.length >= room.maxPlayers) { showToast('ห้องเต็มแล้ว', 'error'); return; }

        const newPlayer = { name, avatar: AVATARS[room.players.length % AVATARS.length], id: State.playerId };

        await roomRef.update({
            players: firebase.firestore.FieldValue.arrayUnion(newPlayer)
        });

        State.players = [...room.players, newPlayer];

        // Listen for game start
        State.unsubscribeRoom = roomRef.onSnapshot((doc) => {
            if (!doc.exists) { showToast('ห้องถูกลบแล้ว', 'error'); showScreen('home'); return; }
            const data = doc.data();
            State.players = data.players || [];

            if (data.status === 'playing' && data.gameData) {
                // เกมเริ่ม - ดูการ์ดของตัวเอง
                handleOnlineGameStart(data);
            }

            // อัปเดตรายชื่อในหน้ารอ
            const list = document.getElementById('waiting-players-list');
            if (list) {
                list.innerHTML = State.players.map(p => `
                    <div style="display:inline-block;padding:6px 12px;margin:4px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:20px;font-size:0.8rem;">
                        ${p.avatar} ${p.name}
                    </div>
                `).join('');
            }
        });

        showScreen('waiting');
        showToast(`เข้าห้อง ${code} สำเร็จ!`, 'success');
    } catch (e) {
        showToast('เข้าร่วมไม่สำเร็จ: ' + e.message, 'error');
    }
}

// ========== ONLINE: GAME START (ฝั่งผู้เล่น) ==========
function handleOnlineGameStart(roomData) {
    const myAssignment = roomData.gameData.assignments[State.playerId];
    if (!myAssignment) return;

    State.gameData = roomData.gameData;
    showScreen('game');

    // ซ่อน pass-and-play UI
    document.getElementById('current-player-display').style.display = 'none';
    document.getElementById('btn-next-player').style.display = 'none';
    document.getElementById('btn-start-timer').style.display = 'none';

    // ตั้งค่าการ์ด
    const content = document.getElementById('card-role-content');
    if (myAssignment.isSpy) {
        content.className = 'card-role-content spy';
        content.innerHTML = `<span class="role-icon">🕵️♂️</span><div class="role-name">คุณคือสายลับ!</div><p style="color:var(--text-muted);margin-top:8px;">หาให้เจอว่าสถานที่คืออะไร!</p>`;
    } else {
        content.className = 'card-role-content';
        content.innerHTML = `<span class="role-icon">📍</span><div class="role-location">สถานที่</div><div class="role-name">${myAssignment.location}</div><div style="color:var(--text-muted);margin-top:12px;font-size:0.8rem;">บทบาทของคุณ</div><div style="font-size:1.1rem;font-weight:600;margin-top:4px;">${myAssignment.role}</div>`;
    }

    // แสดงผู้เล่นและ Timer
    document.getElementById('game-players-section').style.display = 'block';
    document.getElementById('game-players-list').innerHTML = State.players.map(p => `
        <div class="game-player-chip"><span class="chip-avatar">${p.avatar}</span><span>${p.name}</span></div>
    `).join('');

    // เริ่ม Timer
    State.timeRemaining = roomData.timeLimit * 60;
    updateTimerDisplay();
    State.timerInterval = setInterval(() => {
        State.timeRemaining--;
        updateTimerDisplay();
        if (State.timeRemaining <= 30) document.getElementById('game-timer').classList.add('urgent');
        if (State.timeRemaining <= 0) { clearInterval(State.timerInterval); goToVoting(); }
    }, 1000);
}

// ========== LOCAL: ADD PLAYER ==========
function addPlayer() {
    const input = document.getElementById('input-add-player');
    const name = input.value.trim();
    if (!name) { showToast('กรุณากรอกชื่อผู้เล่น', 'error'); return; }
    if (State.players.length >= State.maxPlayers) { showToast('ห้องเต็มแล้ว', 'error'); return; }
    if (State.players.some(p => p.name === name)) { showToast('ชื่อนี้มีแล้ว', 'error'); return; }

    State.players.push({ name, avatar: AVATARS[State.players.length % AVATARS.length], id: generateId() });
    input.value = '';
    updatePlayersUI();
    showToast(`เพิ่ม "${name}" แล้ว`, 'success');
}

function updatePlayersUI() {
    document.getElementById('player-count').textContent = `${State.players.length}/${State.maxPlayers}`;
    const container = document.getElementById('players-container');
    container.innerHTML = State.players.map((p, i) => `
        <div class="player-card ready">
            <div class="avatar">${p.avatar}</div>
            <div class="player-info">
                <div class="player-name">${p.name}${i === 0 ? ' 👑' : ''}</div>
                <div class="player-status ready">✓ พร้อม</div>
            </div>
            ${State.isHost && i > 0 ? `<button class="btn-kick" onclick="removePlayer(${i})">✕</button>` : ''}
        </div>
    `).join('');
}

function removePlayer(index) {
    State.players.splice(index, 1);
    updatePlayersUI();
    showToast('ลบผู้เล่นแล้ว', 'info');
}

// ========== START GAME ==========
function startGame() {
    if (State.players.length < 3) { showToast('ต้องมีผู้เล่นอย่างน้อย 3 คน', 'error'); return; }

    const location = State.locations[Math.floor(Math.random() * State.locations.length)];
    let spyCount = State.spyCount;
    if (spyCount === 'random') spyCount = Math.random() < 0.3 ? 2 : 1;
    spyCount = Math.min(parseInt(spyCount), Math.floor(State.players.length / 2));

    // สุ่ม Spy
    const indices = [...Array(State.players.length).keys()];
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const spyIndices = indices.slice(0, spyCount);

    // สุ่ม Roles
    const roles = [...location.roles];
    for (let i = roles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    const assignments = {};
    let roleIdx = 0;
    State.players.forEach((player, idx) => {
        const key = State.mode === 'online' ? player.id : player.name;
        if (spyIndices.includes(idx)) {
            assignments[key] = { role: 'สายลับ', isSpy: true, location: null };
        } else {
            assignments[key] = { role: roles[roleIdx % roles.length], isSpy: false, location: location.name };
            roleIdx++;
        }
    });

    State.gameData = { location: location.name, assignments };
    State.currentPlayerIndex = 0;
    State.allRevealed = false;

    // Online: อัปเดต Firebase
    if (State.mode === 'online' && firebaseReady) {
        db.collection('rooms').doc(State.roomCode).update({
            status: 'playing',
            gameData: State.gameData
        });
    }

    showScreen('game');

    if (State.mode === 'local') {
        setupCardForPlayer(0);
    } else {
        // Online host ดูการ์ดตัวเอง
        handleOnlineGameStart({ gameData: State.gameData, timeLimit: State.timeLimit });
    }

    showToast('เกมเริ่มแล้ว!', 'success');
    playSound('flip');
}

// ========== LOCAL: CARD REVEAL (Pass & Play) ==========
function setupCardForPlayer(index) {
    const player = State.players[index];
    const card = document.getElementById('game-card');
    card.setAttribute('data-flipped', 'false');

    document.getElementById('current-player-name').textContent = player.name;
    document.getElementById('current-player-display').style.display = 'block';
    document.getElementById('btn-next-player').style.display = 'none';
    document.getElementById('btn-start-timer').style.display = 'none';
    document.getElementById('game-players-section').style.display = 'none';
    document.getElementById('card-container').style.display = 'block';

    const assignment = State.gameData.assignments[player.name];
    const content = document.getElementById('card-role-content');

    if (assignment.isSpy) {
        content.className = 'card-role-content spy';
        content.innerHTML = `<span class="role-icon">🕵️♂️</span><div class="role-name">คุณคือสายลับ!</div><p style="color:var(--text-muted);margin-top:8px;">หาให้เจอว่าสถานที่คืออะไร!</p>`;
    } else {
        content.className = 'card-role-content';
        const hideRole = State.gameMode === 'hard';
        content.innerHTML = `<span class="role-icon">📍</span><div class="role-location">สถานที่</div><div class="role-name">${assignment.location}</div>${!hideRole ? `<div style="color:var(--text-muted);margin-top:12px;font-size:0.8rem;">บทบาทของคุณ</div><div style="font-size:1.1rem;font-weight:600;margin-top:4px;">${assignment.role}</div>` : '<div style="color:var(--text-muted);margin-top:12px;">โหมดยาก: ซ่อนบทบาท</div>'}`;
    }

    const badge = document.getElementById('game-mode-badge');
    if (State.gameMode !== 'normal') {
        badge.textContent = State.gameMode === 'hard' ? 'ยาก' : 'สายลับตาบอด';
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

function revealCard() {
    const card = document.getElementById('game-card');
    if (card.getAttribute('data-flipped') === 'true') return;
    card.setAttribute('data-flipped', 'true');
    playSound('flip');

    setTimeout(() => {
        if (State.mode === 'local') {
            if (State.currentPlayerIndex < State.players.length - 1) {
                document.getElementById('btn-next-player').style.display = 'block';
            } else {
                document.getElementById('btn-start-timer').style.display = 'block';
            }
        }
    }, 1000);
}

function nextPlayer() {
    State.currentPlayerIndex++;
    setupCardForPlayer(State.currentPlayerIndex);
}

// ========== TIMER ==========
function startTimerPhase() {
    State.allRevealed = true;
    document.getElementById('current-player-display').style.display = 'none';
    document.getElementById('card-container').style.display = 'none';
    document.getElementById('btn-start-timer').style.display = 'none';
    document.getElementById('btn-next-player').style.display = 'none';

    document.getElementById('game-players-section').style.display = 'block';
    document.getElementById('game-players-list').innerHTML = State.players.map(p => `
        <div class="game-player-chip"><span class="chip-avatar">${p.avatar}</span><span>${p.name}</span></div>
    `).join('');

    State.timeRemaining = State.timeLimit * 60;
    updateTimerDisplay();
    State.timerInterval = setInterval(() => {
        State.timeRemaining--;
        updateTimerDisplay();
        if (State.timeRemaining <= 30) {
            document.getElementById('game-timer').classList.add('urgent');
            if (State.timeRemaining <= 10 && State.timeRemaining > 0) playSound('tick');
        }
        if (State.timeRemaining <= 0) { clearInterval(State.timerInterval); goToVoting(); }
    }, 1000);

    showToast('จับเวลาเริ่ม! ถามคำถามกันได้เลย', 'info');
}

function updateTimerDisplay() {
    const m = Math.floor(State.timeRemaining / 60);
    const s = State.timeRemaining % 60;
    document.getElementById('game-timer').textContent = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

// ========== VOTING ==========
function goToVoting() {
    playSound('vote');
    showScreen('vote');
    State.selectedVote = null;
    document.getElementById('btn-submit-vote').disabled = true;

    document.getElementById('vote-players').innerHTML = State.players.map(p => `
        <div class="vote-card" data-name="${p.name}" onclick="selectVote('${p.name}')">
            <div class="vote-avatar">${p.avatar}</div>
            <div class="vote-name">${p.name}</div>
        </div>
    `).join('');
}

function selectVote(name) {
    document.querySelectorAll('.vote-card').forEach(c => c.classList.remove('selected'));
    document.querySelector(`.vote-card[data-name="${name}"]`).classList.add('selected');
    document.getElementById('btn-submit-vote').disabled = false;
    State.selectedVote = name;
}

function submitVote() {
    if (!State.selectedVote) return;
    const key = State.mode === 'online' ? State.players.find(p => p.name === State.selectedVote)?.id : State.selectedVote;
    const assignment = State.gameData.assignments[key] || State.gameData.assignments[State.selectedVote];
    const spyCaught = assignment && assignment.isSpy;
    showResults(spyCaught, State.selectedVote);
}

// ========== RESULTS ==========
function showResults(spyCaught, votedPlayer) {
    showScreen('results');
    playSound('winner');

    document.getElementById('results-animation').textContent = spyCaught ? '🎉' : '🕵️';
    document.getElementById('results-title').textContent = spyCaught ? 'พลเรือนชนะ!' : 'สายลับชนะ!';
    document.getElementById('results-subtitle').textContent = spyCaught ? 'จับสายลับได้สำเร็จ!' : 'สายลับหนีรอด!';

    const spyNames = State.players.filter(p => {
        const key = State.mode === 'online' ? p.id : p.name;
        return State.gameData.assignments[key]?.isSpy;
    }).map(p => p.name);

    document.getElementById('results-details').innerHTML = `
        <div class="detail-item"><span>สถานที่:</span><span>${State.gameData.location}</span></div>
        <div class="detail-item"><span>สายลับ:</span><span style="color:#ff6584;">${spyNames.join(', ')} 🕵️</span></div>
        <div class="detail-item"><span>โหวตให้:</span><span>${votedPlayer}</span></div>
    `;
}

function playAgain() { resetCardState(); startGame(); }
function backToLobby() { resetCardState(); showScreen('lobby'); }

function resetCardState() {
    clearInterval(State.timerInterval);
    document.getElementById('game-timer').classList.remove('urgent');
    document.getElementById('card-container').style.display = 'block';
    State.gameData = null;
    State.currentPlayerIndex = 0;
    State.allRevealed = false;
}

function leaveRoom() {
    if (State.unsubscribeRoom) State.unsubscribeRoom();
    if (State.mode === 'online' && firebaseReady && State.roomCode) {
        db.collection('rooms').doc(State.roomCode).delete().catch(() => {});
    }
    resetCardState();
    State.players = [];
    State.roomCode = '';
}

// ========== ADMIN ==========
let editingLocIndex = -1;

function renderLocations() {
    document.getElementById('loc-count').textContent = `(${State.locations.length})`;
    document.getElementById('locations-list').innerHTML = State.locations.map((loc, i) => `
        <div class="location-item">
            <div><div class="loc-name">${loc.name}</div><div class="loc-roles">${loc.roles.length} บทบาท: ${loc.roles.slice(0,3).join(', ')}...</div></div>
            <div class="loc-actions"><button class="loc-btn-edit" onclick="editLocation(${i})">✏️</button><button class="loc-btn-delete" onclick="deleteLocation(${i})">🗑️</button></div>
        </div>
    `).join('');
}

function showLocationModal(index) {
    editingLocIndex = index;
    document.getElementById('modal-title').textContent = index >= 0 ? 'แก้ไขสถานที่' : 'เพิ่มสถานที่';
    document.getElementById('input-location-name').value = index >= 0 ? State.locations[index].name : '';
    document.getElementById('input-roles').value = index >= 0 ? State.locations[index].roles.join('\n') : '';
    document.getElementById('modal-location').style.display = 'flex';
}
function editLocation(i) { showLocationModal(i); }
function deleteLocation(i) { if (confirm(`ลบ "${State.locations[i].name}"?`)) { State.locations.splice(i, 1); renderLocations(); showToast('ลบสถานที่แล้ว', 'success'); } }

function saveLocation() {
    const name = document.getElementById('input-location-name').value.trim();
    const roles = document.getElementById('input-roles').value.split('\n').map(r => r.trim()).filter(r => r);
    if (!name) { showToast('กรุณากรอกชื่อสถานที่', 'error'); return; }
    if (roles.length < 8) { showToast('ต้องมีบทบาทอย่างน้อย 8', 'error'); return; }
    if (editingLocIndex >= 0) { State.locations[editingLocIndex] = { name, roles }; }
    else { State.locations.push({ name, roles }); }
    document.getElementById('modal-location').style.display = 'none';
    renderLocations();
    showToast('บันทึกสำเร็จ!', 'success');
}

function importJSON(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            if (!Array.isArray(data)) throw new Error('ต้องเป็น Array');
            State.locations = data; renderLocations();
            showToast(`นำเข้า ${data.length} สถานที่สำเร็จ!`, 'success');
        } catch (err) { showToast('ไฟล์ไม่ถูกต้อง', 'error'); }
    };
    reader.readAsText(file); e.target.value = '';
}

function exportJSON() {
    const blob = new Blob([JSON.stringify(State.locations, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'spyfall_locations.json'; a.click();
    showToast('ส่งออกสำเร็จ!', 'success');
}

// ========== UTILITIES ==========
function generateCode() {
    const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = ''; for (let i = 0; i < 6; i++) code += c[Math.floor(Math.random() * c.length)];
    return code;
}
function generateId() { return Math.random().toString(36).substr(2, 9); }

function showToast(msg, type = 'info') {
    const t = document.createElement('div'); t.className = `toast ${type}`; t.textContent = msg;
    document.getElementById('toast-container').appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

function playSound(name) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        switch(name) {
            case 'flip': osc.frequency.setValueAtTime(800,ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(400,ctx.currentTime+0.1); gain.gain.setValueAtTime(0.3,ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+0.2); osc.start(); osc.stop(ctx.currentTime+0.2); break;
            case 'tick': osc.frequency.setValueAtTime(1000,ctx.currentTime); gain.gain.setValueAtTime(0.2,ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+0.05); osc.start(); osc.stop(ctx.currentTime+0.05); break;
            case 'vote': osc.frequency.setValueAtTime(500,ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(800,ctx.currentTime+0.15); gain.gain.setValueAtTime(0.3,ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+0.3); osc.start(); osc.stop(ctx.currentTime+0.3); break;
            case 'winner': osc.type='square'; osc.frequency.setValueAtTime(523,ctx.currentTime); osc.frequency.setValueAtTime(659,ctx.currentTime+0.15); osc.frequency.setValueAtTime(784,ctx.currentTime+0.3); gain.gain.setValueAtTime(0.2,ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+0.6); osc.start(); osc.stop(ctx.currentTime+0.6); break;
        }
    } catch(e) {}
}

function createParticles() {
    const c = document.getElementById('particles');
    for (let i=0;i<20;i++) { const p=document.createElement('div'); p.style.cssText=`position:absolute;width:${Math.random()*4+2}px;height:${Math.random()*4+2}px;background:rgba(108,99,255,${Math.random()*0.3+0.1});border-radius:50%;left:${Math.random()*100}%;top:${Math.random()*100}%;animation:particleFloat ${Math.random()*20+10}s linear infinite;animation-delay:${Math.random()*-20}s;`; c.appendChild(p); }
    const s=document.createElement('style'); s.textContent=`@keyframes particleFloat{0%{transform:translate(0,0);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translate(60px,-100vh);opacity:0}}`; document.head.appendChild(s);
}
