/**
 * ============================================
 * SPYFALL ONLINE - APP.JS (v2)
 * Main Application Controller
 * UI Event Bindings & Screen Navigation
 * เพิ่ม QR Code จริง, Confetti, ปุ่ม Score
 * ============================================
 */

// ==========================================
// INITIALIZATION
// ==========================================

/**
 * เริ่มต้นแอปพลิเคชันเมื่อ DOM โหลดเสร็จ
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🕵️ Spyfall Online v2 initializing...');

    // เริ่มต้น game manager (โหลด locations)
    await GameManager.init();

    // สร้างอนุภาคพื้นหลัง
    createParticles();

    // ผูก event ทั้งหมด
    bindHomeEvents();
    bindCreateEvents();
    bindJoinEvents();
    bindLobbyEvents();
    bindGameEvents();
    bindVoteEvents();
    bindResultsEvents();
    bindBackButtons();

    console.log('✅ Spyfall Online v2 ready!');
});

// ==========================================
// SCREEN NAVIGATION
// ==========================================

/**
 * แสดงหน้าจอที่ระบุ ซ่อนหน้าอื่นทั้งหมด
 * @param {string} screenId - ชื่อหน้า (home, create, join, lobby, game, vote, results, score, admin)
 */
function showScreen(screenId) {
    // ซ่อนทุกหน้า
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // แสดงหน้าเป้าหมาย
    const target = document.getElementById(`screen-${screenId}`);
    if (target) {
        target.classList.add('active');

        // เริ่มต้นเฉพาะบางหน้า
        if (screenId === 'admin') {
            AdminManager.init();
        }
    }
}

// ==========================================
// EVENT BINDINGS
// ==========================================

/**
 * ผูก event หน้า Home
 */
function bindHomeEvents() {
    // ปุ่ม Create Room
    document.getElementById('btn-create').addEventListener('click', () => {
        showScreen('create');
    });

    // ปุ่ม Join Room
    document.getElementById('btn-join').addEventListener('click', () => {
        const code = document.getElementById('input-room-code').value.trim();
        if (code) {
            document.getElementById('input-join-code').value = code;
        }
        showScreen('join');
    });

    // ปุ่ม Admin
    document.getElementById('btn-admin').addEventListener('click', () => {
        showScreen('admin');
    });

    // Room code input - auto uppercase
    document.getElementById('input-room-code').addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });
}

/**
 * ผูก event หน้า Create Room
 */
function bindCreateEvents() {
    // Range slider จำนวนผู้เล่น
    const rangeEl = document.getElementById('range-players');
    const valEl = document.getElementById('val-players');
    rangeEl.addEventListener('input', () => {
        valEl.textContent = rangeEl.value;
    });

    // ปุ่มเลือกเวลา
    document.querySelectorAll('[data-time]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-time]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // ปุ่มเลือกจำนวน Spy
    document.querySelectorAll('[data-spy]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-spy]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // ปุ่มเลือก Game Mode
    document.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // ปุ่ม Create Room
    document.getElementById('btn-create-room').addEventListener('click', async () => {
        const playerName = document.getElementById('input-host-name').value.trim();
        if (!playerName) {
            showToast('Please enter your name', 'error');
            return;
        }

        const maxPlayers = parseInt(document.getElementById('range-players').value);
        const timeLimit = parseInt(document.querySelector('[data-time].active').dataset.time);
        const spyCount = document.querySelector('[data-spy].active').dataset.spy;
        const gameMode = document.querySelector('[data-mode].active').dataset.mode;

        try {
            showToast('Creating room...', 'info');
            const roomCode = await GameManager.createGameRoom({
                playerName,
                maxPlayers,
                timeLimit,
                spyCount,
                gameMode
            });

            // แสดง Lobby
            document.getElementById('display-room-code').textContent = roomCode;
            document.getElementById('display-settings').textContent =
                `${maxPlayers} players • ${timeLimit} min • ${spyCount} spy • ${gameMode} mode`;

            // สร้าง QR Code จริงด้วย qrcode.js (ใหม่ v2)
            generateQRCode(roomCode);

            showScreen('lobby');
            showToast(`Room ${roomCode} created!`, 'success');
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
}

/**
 * ผูก event หน้า Join Room
 */
function bindJoinEvents() {
    // Auto uppercase
    document.getElementById('input-join-code').addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });

    // ปุ่ม Join
    document.getElementById('btn-join-room').addEventListener('click', async () => {
        const playerName = document.getElementById('input-player-name').value.trim();
        const roomCode = document.getElementById('input-join-code').value.trim();

        if (!playerName) {
            showToast('Please enter your name', 'error');
            return;
        }
        if (!roomCode || roomCode.length !== 6) {
            showToast('Please enter a valid 6-digit room code', 'error');
            return;
        }

        try {
            showToast('Joining room...', 'info');
            await GameManager.joinGameRoom(roomCode, playerName);

            // แสดง Lobby
            document.getElementById('display-room-code').textContent = roomCode;

            showScreen('lobby');
            showToast('Joined successfully!', 'success');
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
}

/**
 * ผูก event หน้า Lobby
 */
function bindLobbyEvents() {
    // ปุ่ม Ready
    document.getElementById('btn-ready').addEventListener('click', () => {
        GameManager.toggleReady();
    });

    // ปุ่ม Start Game (host เท่านั้น)
    document.getElementById('btn-start-game').addEventListener('click', () => {
        GameManager.startGame();
    });

    // ปุ่ม Copy Code
    document.getElementById('btn-copy-code').addEventListener('click', () => {
        const code = document.getElementById('display-room-code').textContent;
        navigator.clipboard.writeText(code).then(() => {
            showToast('Room code copied!', 'success');
        }).catch(() => {
            showToast('Failed to copy', 'error');
        });
    });

    // ปุ่ม Score (ใหม่ v2)
    document.getElementById('btn-score').addEventListener('click', () => {
        GameManager.showScoreBoard();
    });

    // Chat
    const chatInput = document.getElementById('input-chat');
    const sendBtn = document.getElementById('btn-send-chat');

    sendBtn.addEventListener('click', () => {
        GameManager.sendMessage(chatInput.value);
        chatInput.value = '';
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            GameManager.sendMessage(chatInput.value);
            chatInput.value = '';
        }
    });
}

/**
 * ผูก event หน้า Game
 */
function bindGameEvents() {
    // กดการ์ดเพื่อเปิด
    document.getElementById('game-card').addEventListener('click', () => {
        GameManager.revealCard();
    });

    // ปุ่มสลับแสดง/ซ่อน locations list (ใหม่ v2)
    const toggleBtn = document.getElementById('btn-toggle-locations');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const panel = document.getElementById('locations-panel');
            if (panel) {
                panel.classList.toggle('collapsed');
                toggleBtn.textContent = panel.classList.contains('collapsed') ? '📍 Show Locations' : '📍 Hide Locations';
            }
        });
    }
}

/**
 * ผูก event หน้า Vote
 */
function bindVoteEvents() {
    document.getElementById('btn-submit-vote').addEventListener('click', () => {
        GameManager.submitVoteAction();
    });
}

/**
 * ผูก event หน้า Results
 */
function bindResultsEvents() {
    document.getElementById('btn-play-again').addEventListener('click', () => {
        GameManager.playAgain();
    });

    document.getElementById('btn-back-lobby').addEventListener('click', () => {
        GameManager.playAgain();
    });
}

/**
 * ผูก event ปุ่ม Back ทั้งหมด
 */
function bindBackButtons() {
    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.back;
            if (target === 'home' && GameManager.state.roomCode) {
                // กำลังออกจากห้อง
                if (confirm('Leave the room?')) {
                    GameManager.leaveRoom();
                }
            } else {
                showScreen(target);
            }
        });
    });
}

// ==========================================
// UTILITIES
// ==========================================

/**
 * แสดง Toast notification
 * @param {string} message - ข้อความ
 * @param {string} type - ประเภท (success, error, info)
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    // ลบหลัง animation จบ
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

/**
 * เล่น sound effect
 * @param {string} name - ชื่อเสียง (flip, tick, vote, winner)
 */
function playSound(name) {
    // Sound effects ด้วย Web Audio API (ไม่ต้องใช้ไฟล์เสียง)
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        switch (name) {
            case 'flip':
                oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.2);
                break;

            case 'tick':
                oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);
                gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.05);
                break;

            case 'vote':
                oscillator.frequency.setValueAtTime(500, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.15);
                gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.3);
                break;

            case 'winner':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(523, audioCtx.currentTime);
                oscillator.frequency.setValueAtTime(659, audioCtx.currentTime + 0.15);
                oscillator.frequency.setValueAtTime(784, audioCtx.currentTime + 0.3);
                oscillator.frequency.setValueAtTime(1047, audioCtx.currentTime + 0.45);
                gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.6);
                break;
        }
    } catch (e) {
        // Audio ไม่รองรับหรือถูกบล็อค
        console.log('Audio not available');
    }
}

/**
 * สร้างอนุภาคพื้นหลังแบบ animated
 */
function createParticles() {
    const container = document.getElementById('particles');
    const particleCount = 25;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 2}px;
            height: ${Math.random() * 4 + 2}px;
            background: rgba(108, 99, 255, ${Math.random() * 0.3 + 0.1});
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: particleFloat ${Math.random() * 20 + 10}s linear infinite;
            animation-delay: ${Math.random() * -20}s;
        `;
        container.appendChild(particle);
    }

    // เพิ่ม keyframes สำหรับ animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes particleFloat {
            0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translate(${Math.random() > 0.5 ? '' : '-'}${Math.random() * 200}px, -100vh) rotate(360deg); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

/**
 * สร้าง QR Code จริงด้วย qrcode.js library (ใหม่ v2)
 * @param {string} code - รหัสห้อง
 */
function generateQRCode(code) {
    const container = document.getElementById('qr-container');
    if (!container) return;

    const url = `${window.location.origin}${window.location.pathname}?room=${code}`;

    // ล้าง container เดิม
    container.innerHTML = '';

    // สร้าง wrapper สำหรับ QR Code
    const qrWrapper = document.createElement('div');
    qrWrapper.className = 'qr-wrapper';

    // ใช้ qrcode.js library สร้าง QR Code จริง
    try {
        new QRCode(qrWrapper, {
            text: url,
            width: 140,
            height: 140,
            colorDark: '#6c63ff',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });

        // เพิ่ม URL แสดงด้านล่าง
        const urlText = document.createElement('div');
        urlText.className = 'qr-url-text';
        urlText.textContent = url;

        container.appendChild(qrWrapper);
        container.appendChild(urlText);
    } catch (e) {
        // Fallback ถ้า library โหลดไม่ได้
        console.warn('QRCode library not loaded, using fallback');
        container.innerHTML = `
            <div class="qr-fallback">
                <div class="qr-code-display">${code}</div>
                <div class="qr-url-text">${url}</div>
            </div>
        `;
    }
}

/**
 * ยิง Confetti animation ตอนชนะ (ใหม่ v2)
 * สร้าง confetti particles ตกลงมาจากด้านบน
 */
function launchConfetti() {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    confettiContainer.id = 'confetti';
    document.body.appendChild(confettiContainer);

    const colors = ['#6c63ff', '#ff6584', '#4ecdc4', '#ffd93d', '#a855f7', '#ff8a5c', '#00d2ff'];
    const shapes = ['circle', 'square', 'triangle'];
    const confettiCount = 100;

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const size = Math.random() * 10 + 5;
        const left = Math.random() * 100;
        const delay = Math.random() * 3;
        const duration = Math.random() * 3 + 2;
        const rotation = Math.random() * 360;

        confetti.className = `confetti-piece confetti-${shape}`;
        confetti.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            left: ${left}%;
            top: -20px;
            opacity: ${Math.random() * 0.5 + 0.5};
            transform: rotate(${rotation}deg);
            animation: confettiFall ${duration}s ease-in ${delay}s forwards;
            ${shape === 'circle' ? 'border-radius: 50%;' : ''}
            ${shape === 'triangle' ? `
                width: 0; height: 0;
                background: none;
                border-left: ${size/2}px solid transparent;
                border-right: ${size/2}px solid transparent;
                border-bottom: ${size}px solid ${color};
            ` : ''}
        `;

        confettiContainer.appendChild(confetti);
    }

    // ลบ confetti หลัง animation จบ
    setTimeout(() => {
        if (confettiContainer.parentNode) {
            confettiContainer.parentNode.removeChild(confettiContainer);
        }
    }, 6000);
}

// ==========================================
// URL PARAMETER HANDLING
// ==========================================

/**
 * เช็ค URL สำหรับ room code ตอนโหลด
 */
(function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('room');
    if (roomCode) {
        // ใส่ room code ให้อัตโนมัติ
        const input = document.getElementById('input-room-code');
        if (input) input.value = roomCode.toUpperCase();
    }
})();
