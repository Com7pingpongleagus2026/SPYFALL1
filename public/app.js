/**
 * ============================================
 * SPYFALL ONLINE - APP.JS (ภาษาไทย + โหมด Local)
 * ทำงานได้เลยไม่ต้อง Firebase
 * ============================================
 */

// ========== STATE ==========
const State = {
    players: [],
    hostName: '',
    roomCode: '',
    maxPlayers: 6,
    timeLimit: 5,
    spyCount: 1,
    gameMode: 'normal',
    locations: [],
    gameData: null, // { location, assignments: { playerName: {role, isSpy, location} } }
    currentPlayerIndex: 0,
    allRevealed: false,
    timerInterval: null,
    timeRemaining: 0,
    votes: {},
    scores: {}
};

// รหัสผ่าน Admin
const ADMIN_PASSWORD = 'JINLAPAT47';

// Avatars
const AVATARS = ['🦊', '🐱', '🐶', '🐼', '🐨', '🦁', '🐯', '🐮', '🐷', '🐸', '🐵', '🐔', '🦄', '🐲', '🦋', '🐙', '🦀', '🐧', '🦅', '🐺'];

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', async () => {
    // โหลดสถานที่
    try {
        const res = await fetch('locations.json');
        State.locations = await res.json();
    } catch (e) {
        State.locations = [];
        showToast('โหลดสถานที่ไม่สำเร็จ', 'error');
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

// ========== EVENT BINDINGS ==========
function bindEvents() {
    // หน้าแรก
    document.getElementById('btn-create').addEventListener('click', () => showScreen('create'));
    document.getElementById('btn-join').addEventListener('click', () => {
        showToast('โหมดออนไลน์ต้องตั้งค่า Firebase ก่อน', 'info');
    });
    document.getElementById('btn-admin').addEventListener('click', () => showScreen('admin-login'));

    // Admin Login
    document.getElementById('btn-admin-login').addEventListener('click', adminLogin);
    document.getElementById('input-admin-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') adminLogin();
    });

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

    // ล็อบบี้
    document.getElementById('btn-add-player').addEventListener('click', addPlayer);
    document.getElementById('input-add-player').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addPlayer();
    });
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

    // ปุ่มกลับ
    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.back;
            if (target === 'home' && State.roomCode) {
                if (confirm('ออกจากห้อง?')) {
                    resetGame();
                    showScreen('home');
                }
            } else {
                showScreen(target);
            }
        });
    });

    // Admin
    bindAdminEvents();
}

// ========== ADMIN LOGIN ==========
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
    if (!name) {
        showToast('กรุณากรอกชื่อของคุณ', 'error');
        return;
    }

    State.hostName = name;
    State.maxPlayers = parseInt(document.getElementById('range-players').value);
    State.timeLimit = parseInt(document.querySelector('[data-time].active').dataset.time);
    State.spyCount = document.querySelector('[data-spy].active').dataset.spy;
    State.gameMode = document.querySelector('[data-mode].active').dataset.mode;
    State.roomCode = generateCode();
    State.players = [{ name, avatar: AVATARS[0] }];

    // แสดง Lobby
    document.getElementById('display-room-code').textContent = State.roomCode;
    document.getElementById('display-settings').textContent =
        `${State.maxPlayers} คน • ${State.timeLimit} นาที • ${State.spyCount === 'random' ? 'สุ่ม' : State.spyCount} สายลับ • ${State.gameMode === 'normal' ? 'ปกติ' : State.gameMode === 'hard' ? 'ยาก' : 'สายลับตาบอด'}`;

    updatePlayersUI();
    showScreen('lobby');
    showToast(`สร้างห้อง ${State.roomCode} สำเร็จ!`, 'success');
}

// ========== ADD PLAYER ==========
function addPlayer() {
    const input = document.getElementById('input-add-player');
    const name = input.value.trim();
    if (!name) {
        showToast('กรุณากรอกชื่อผู้เล่น', 'error');
        return;
    }
    if (State.players.length >= State.maxPlayers) {
        showToast('ห้องเต็มแล้ว', 'error');
        return;
    }
    if (State.players.some(p => p.name === name)) {
        showToast('ชื่อนี้มีแล้ว', 'error');
        return;
    }

    State.players.push({ name, avatar: AVATARS[State.players.length % AVATARS.length] });
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
            ${i > 0 ? `<button class="btn-kick" onclick="removePlayer(${i})">✕</button>` : ''}
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
    if (State.players.length < 3) {
        showToast('ต้องมีผู้เล่นอย่างน้อย 3 คน', 'error');
        return;
    }

    // สุ่มสถานที่
    const location = State.locations[Math.floor(Math.random() * State.locations.length)];

    // กำหนดจำนวนสายลับ
    let spyCount = State.spyCount;
    if (spyCount === 'random') spyCount = Math.random() < 0.3 ? 2 : 1;
    spyCount = Math.min(parseInt(spyCount), Math.floor(State.players.length / 2));

    // สุ่มสายลับ
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

    // กำหนดบทบาท
    const assignments = {};
    let roleIdx = 0;
    State.players.forEach((player, idx) => {
        if (spyIndices.includes(idx)) {
            assignments[player.name] = { role: 'สายลับ', isSpy: true, location: null };
        } else {
            assignments[player.name] = {
                role: roles[roleIdx % roles.length],
                isSpy: false,
                location: location.name
            };
            roleIdx++;
        }
    });

    State.gameData = { location: location.name, assignments };
    State.currentPlayerIndex = 0;
    State.allRevealed = false;

    // แสดงหน้าเกม
    showScreen('game');
    setupCardForPlayer(0);
    showToast('เกมเริ่มแล้ว! ส่งมือถือให้ผู้เล่นแต่ละคนดูการ์ด', 'info');
    playSound('flip');
}

// ========== CARD REVEAL (Pass & Play) ==========
function setupCardForPlayer(index) {
    const player = State.players[index];
    const card = document.getElementById('game-card');
    card.setAttribute('data-flipped', 'false');

    document.getElementById('current-player-name').textContent = player.name;
    document.getElementById('current-player-display').style.display = 'block';
    document.getElementById('btn-next-player').style.display = 'none';
    document.getElementById('btn-start-timer').style.display = 'none';
    document.getElementById('game-players-section').style.display = 'none';

    // ตั้งค่าเนื้อหาการ์ด
    const assignment = State.gameData.assignments[player.name];
    const content = document.getElementById('card-role-content');

    if (assignment.isSpy) {
        content.className = 'card-role-content spy';
        content.innerHTML = `
            <span class="role-icon">🕵️♂️</span>
            <div class="role-name">คุณคือสายลับ!</div>
            <p style="color:var(--text-muted);margin-top:8px;">หาให้เจอว่าสถานที่คืออะไร!</p>
            ${State.gameMode === 'blind' ? '<p style="color:var(--text-muted);font-size:0.8rem;">โหมดสายลับตาบอด: ไม่มีคำใบ้</p>' : ''}
        `;
    } else {
        content.className = 'card-role-content';
        const hideRole = State.gameMode === 'hard';
        content.innerHTML = `
            <span class="role-icon">📍</span>
            <div class="role-location">สถานที่</div>
            <div class="role-name">${assignment.location}</div>
            ${!hideRole ? `<div style="color:var(--text-muted);margin-top:12px;font-size:0.8rem;">บทบาทของคุณ</div><div style="font-size:1.1rem;font-weight:600;margin-top:4px;">${assignment.role}</div>` : '<div style="color:var(--text-muted);margin-top:12px;">โหมดยาก: ซ่อนบทบาท</div>'}
        `;
    }

    // แสดง mode badge
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

    // แสดงปุ่มถัดไป
    setTimeout(() => {
        if (State.currentPlayerIndex < State.players.length - 1) {
            document.getElementById('btn-next-player').style.display = 'block';
        } else {
            document.getElementById('btn-start-timer').style.display = 'block';
        }
    }, 1000);
}

function nextPlayer() {
    State.currentPlayerIndex++;
    setupCardForPlayer(State.currentPlayerIndex);
}

// ========== TIMER PHASE ==========
function startTimerPhase() {
    State.allRevealed = true;
    document.getElementById('current-player-display').style.display = 'none';
    document.getElementById('card-container').style.display = 'none';
    document.getElementById('btn-start-timer').style.display = 'none';
    document.getElementById('btn-next-player').style.display = 'none';

    // แสดงรายชื่อผู้เล่น
    const section = document.getElementById('game-players-section');
    section.style.display = 'block';
    document.getElementById('game-players-list').innerHTML = State.players.map(p => `
        <div class="game-player-chip"><span class="chip-avatar">${p.avatar}</span><span>${p.name}</span></div>
    `).join('');

    // เริ่ม Timer
    State.timeRemaining = State.timeLimit * 60;
    updateTimerDisplay();
    State.timerInterval = setInterval(() => {
        State.timeRemaining--;
        updateTimerDisplay();
        if (State.timeRemaining <= 30) {
            document.getElementById('game-timer').classList.add('urgent');
            if (State.timeRemaining <= 10 && State.timeRemaining > 0) playSound('tick');
        }
        if (State.timeRemaining <= 0) {
            clearInterval(State.timerInterval);
            goToVoting();
        }
    }, 1000);

    showToast('จับเวลาเริ่ม! ถามคำถามกันได้เลย', 'info');
}

function updateTimerDisplay() {
    const mins = Math.floor(State.timeRemaining / 60);
    const secs = State.timeRemaining % 60;
    document.getElementById('game-timer').textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ========== VOTING ==========
function goToVoting() {
    playSound('vote');
    showScreen('vote');
    State.votes = {};

    const container = document.getElementById('vote-players');
    container.innerHTML = State.players.map(p => `
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

    // ในโหมด Local ให้ถือว่าโหวตเสียงข้างมาก = คนที่เลือก
    const votedPlayer = State.selectedVote;
    const assignment = State.gameData.assignments[votedPlayer];
    const spyCaught = assignment && assignment.isSpy;

    showResults(spyCaught, votedPlayer);
}

// ========== RESULTS ==========
function showResults(spyCaught, votedPlayer) {
    showScreen('results');
    playSound('winner');

    const anim = document.getElementById('results-animation');
    const title = document.getElementById('results-title');
    const sub = document.getElementById('results-subtitle');
    const details = document.getElementById('results-details');

    if (spyCaught) {
        anim.textContent = '🎉';
        title.textContent = 'พลเรือนชนะ!';
        sub.textContent = 'จับสายลับได้สำเร็จ!';
    } else {
        anim.textContent = '🕵️';
        title.textContent = 'สายลับชนะ!';
        sub.textContent = 'สายลับหนีรอด!';
    }

    // หาสายลับ
    const spyNames = Object.entries(State.gameData.assignments)
        .filter(([_, v]) => v.isSpy)
        .map(([k, _]) => k);

    details.innerHTML = `
        <div class="detail-item"><span>สถานที่:</span><span>${State.gameData.location}</span></div>
        <div class="detail-item"><span>สายลับ:</span><span style="color:#ff6584;">${spyNames.join(', ')} 🕵️</span></div>
        <div class="detail-item"><span>โหวตให้:</span><span>${votedPlayer}</span></div>
    `;
}

function playAgain() {
    resetCardState();
    startGame();
}

function backToLobby() {
    resetCardState();
    showScreen('lobby');
}

function resetCardState() {
    clearInterval(State.timerInterval);
    document.getElementById('game-timer').classList.remove('urgent');
    document.getElementById('card-container').style.display = 'block';
    State.gameData = null;
    State.currentPlayerIndex = 0;
    State.allRevealed = false;
}

function resetGame() {
    resetCardState();
    State.players = [];
    State.roomCode = '';
}

// ========== ADMIN ==========
function bindAdminEvents() {
    document.getElementById('btn-add-location').addEventListener('click', () => showLocationModal(-1));
    document.getElementById('btn-save-location').addEventListener('click', saveLocation);
    document.getElementById('btn-cancel-location').addEventListener('click', () => {
        document.getElementById('modal-location').style.display = 'none';
    });
    document.getElementById('btn-import-json').addEventListener('click', () => {
        document.getElementById('file-import').click();
    });
    document.getElementById('file-import').addEventListener('change', importJSON);
    document.getElementById('btn-export-json').addEventListener('click', exportJSON);
}

let editingLocIndex = -1;

function renderLocations() {
    const container = document.getElementById('locations-list');
    container.innerHTML = State.locations.map((loc, i) => `
        <div class="location-item">
            <div>
                <div class="loc-name">${loc.name}</div>
                <div class="loc-roles">${loc.roles.length} บทบาท: ${loc.roles.slice(0, 3).join(', ')}...</div>
            </div>
            <div class="loc-actions">
                <button class="loc-btn-edit" onclick="editLocation(${i})">✏️</button>
                <button class="loc-btn-delete" onclick="deleteLocation(${i})">🗑️</button>
            </div>
        </div>
    `).join('');
}

function showLocationModal(index) {
    editingLocIndex = index;
    const modal = document.getElementById('modal-location');
    const title = document.getElementById('modal-title');
    const nameInput = document.getElementById('input-location-name');
    const rolesInput = document.getElementById('input-roles');

    if (index >= 0) {
        title.textContent = 'แก้ไขสถานที่';
        nameInput.value = State.locations[index].name;
        rolesInput.value = State.locations[index].roles.join('\n');
    } else {
        title.textContent = 'เพิ่มสถานที่';
        nameInput.value = '';
        rolesInput.value = '';
    }
    modal.style.display = 'flex';
}

function editLocation(i) { showLocationModal(i); }

function deleteLocation(i) {
    if (confirm(`ลบ "${State.locations[i].name}"?`)) {
        State.locations.splice(i, 1);
        renderLocations();
        showToast('ลบสถานที่แล้ว', 'success');
    }
}

function saveLocation() {
    const name = document.getElementById('input-location-name').value.trim();
    const roles = document.getElementById('input-roles').value.split('\n').map(r => r.trim()).filter(r => r);

    if (!name) { showToast('กรุณากรอกชื่อสถานที่', 'error'); return; }
    if (roles.length < 8) { showToast('ต้องมีบทบาทอย่างน้อย 8 บทบาท', 'error'); return; }

    if (editingLocIndex >= 0) {
        State.locations[editingLocIndex] = { name, roles };
        showToast('แก้ไขสำเร็จ!', 'success');
    } else {
        State.locations.push({ name, roles });
        showToast('เพิ่มสถานที่สำเร็จ!', 'success');
    }

    document.getElementById('modal-location').style.display = 'none';
    renderLocations();
}

function importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            if (!Array.isArray(data)) throw new Error('ต้องเป็น Array');
            State.locations = data;
            renderLocations();
            showToast(`นำเข้า ${data.length} สถานที่สำเร็จ!`, 'success');
        } catch (err) {
            showToast('ไฟล์ไม่ถูกต้อง: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

function exportJSON() {
    const json = JSON.stringify(State.locations, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'spyfall_locations.json';
    a.click();
    showToast('ส่งออกสำเร็จ!', 'success');
}

// ========== UTILITIES ==========
function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function playSound(name) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        switch (name) {
            case 'flip':
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc.start(); osc.stop(ctx.currentTime + 0.2);
                break;
            case 'tick':
                osc.frequency.setValueAtTime(1000, ctx.currentTime);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
                osc.start(); osc.stop(ctx.currentTime + 0.05);
                break;
            case 'vote':
                osc.frequency.setValueAtTime(500, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                osc.start(); osc.stop(ctx.currentTime + 0.3);
                break;
            case 'winner':
                osc.type = 'square';
                osc.frequency.setValueAtTime(523, ctx.currentTime);
                osc.frequency.setValueAtTime(659, ctx.currentTime + 0.15);
                osc.frequency.setValueAtTime(784, ctx.currentTime + 0.3);
                osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.45);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
                osc.start(); osc.stop(ctx.currentTime + 0.6);
                break;
        }
    } catch (e) {}
}

function createParticles() {
    const container = document.getElementById('particles');
    for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.style.cssText = `position:absolute;width:${Math.random()*4+2}px;height:${Math.random()*4+2}px;background:rgba(108,99,255,${Math.random()*0.3+0.1});border-radius:50%;left:${Math.random()*100}%;top:${Math.random()*100}%;animation:particleFloat ${Math.random()*20+10}s linear infinite;animation-delay:${Math.random()*-20}s;`;
        container.appendChild(p);
    }
    const style = document.createElement('style');
    style.textContent = `@keyframes particleFloat{0%{transform:translate(0,0);opacity:0;}10%{opacity:1;}90%{opacity:1;}100%{transform:translate(${Math.random()>0.5?'':'-'}${Math.random()*200}px,-100vh);opacity:0;}}`;
    document.head.appendChild(style);
}
