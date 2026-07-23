/**
 * ============================================
 * SPYFALL ONLINE - GAME.JS (v2)
 * Core Game Logic & State Management
 * แก้ไข syntax error และปรับปรุงโค้ด
 * ============================================
 */

/**
 * Game State Manager
 * จัดการข้อมูลและ logic ทั้งหมดของเกม
 */
const GameManager = {
    // สถานะเกมปัจจุบัน
    state: {
        roomCode: null,
        playerId: null,
        playerName: null,
        isHost: false,
        players: [],
        status: 'waiting', // waiting, playing, voting, finished
        location: null,
        role: null,
        isSpy: false,
        timeLimit: 5,
        spyCount: 1,
        gameMode: 'normal',
        votes: {},
        scores: {},
        cardRevealed: false,
        timerInterval: null,
        timeRemaining: 0,
        unsubscribeRoom: null,
        unsubscribeChat: null,
        locations: [],
        randomEvent: null
    },

    // Avatar emoji pool
    avatars: ['🦊', '🐱', '🐶', '🐼', '🐨', '🦁', '🐯', '🐮', '🐷', '🐸',
              '🐵', '🐔', '🦄', '🐲', '🦋', '🐙', '🦀', '🐧', '🦅', '🐺'],

    // Random events สำหรับเพิ่มความสนุก
    randomEvents: [
        { text: "Double Agent! One civilian secretly knows the spy's identity.", type: 'info' },
        { text: "Silence Round! No talking for 30 seconds.", type: 'warning' },
        { text: "Swap! Two players must exchange seats.", type: 'action' },
        { text: "Hint! The spy gets a one-word clue about the location.", type: 'spy' },
        { text: "Interrogation! The host picks someone to answer 3 rapid questions.", type: 'action' },
        { text: "Blind Vote! Everyone closes their eyes during the next question.", type: 'warning' },
        { text: "Overtime! 60 bonus seconds added.", type: 'bonus' },
        { text: "Suspicion! Everyone must point at who they suspect.", type: 'action' }
    ],

    /**
     * เริ่มต้น game manager
     * โหลดรายชื่อสถานที่จากไฟล์ JSON
     */
    async init() {
        try {
            const response = await fetch('locations.json');
            this.state.locations = await response.json();
            console.log(`✅ โหลดสถานที่แล้ว ${this.state.locations.length} แห่ง`);
        } catch (error) {
            console.error('❌ โหลดสถานที่ไม่ได้:', error);
            this.state.locations = [];
        }
    },

    /**
     * สร้างรหัสห้อง 6 ตัวอักษร
     * @returns {string} Room code
     */
    generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    },

    /**
     * ดึง avatar ตาม index
     * @param {number} index - ลำดับผู้เล่น
     * @returns {string} Avatar emoji
     */
    getAvatar(index) {
        return this.avatars[index % this.avatars.length];
    },

    /**
     * สร้างห้องเกมใหม่
     * @param {Object} config - การตั้งค่าห้อง
     */
    async createGameRoom(config) {
        const { playerName, maxPlayers, timeLimit, spyCount, gameMode } = config;

        await signInAnonymously();
        const userId = getCurrentUserId();
        const roomCode = this.generateRoomCode();

        // แก้ไข: ลบ syntax error "id visitorId:" ออก
        const playerData = {
            id: userId,
            name: playerName,
            avatar: this.getAvatar(0),
            ready: true,
            isHost: true
        };

        const roomData = {
            code: roomCode,
            hostId: userId,
            maxPlayers,
            timeLimit,
            spyCount,
            gameMode,
            players: [playerData],
            status: 'waiting',
            votes: {},
            scores: {},
            gameData: null
        };

        await createRoom(roomData);

        // อัพเดท local state
        this.state.roomCode = roomCode;
        this.state.playerId = userId;
        this.state.playerName = playerName;
        this.state.isHost = true;
        this.state.timeLimit = timeLimit;
        this.state.spyCount = spyCount;
        this.state.gameMode = gameMode;

        // เริ่มฟังการเปลี่ยนแปลงของห้อง
        this.startRoomListener();

        return roomCode;
    },

    /**
     * เข้าร่วมห้องเกมที่มีอยู่
     * @param {string} roomCode - รหัสห้อง
     * @param {string} playerName - ชื่อผู้เล่น
     */
    async joinGameRoom(roomCode, playerName) {
        await signInAnonymously();
        const userId = getCurrentUserId();

        const roomRef = db.collection('rooms').doc(roomCode.toUpperCase());
        const roomSnap = await roomRef.get();

        if (!roomSnap.exists) {
            throw new Error('Room not found! Check the code.');
        }

        const room = roomSnap.data();

        if (room.status !== 'waiting') {
            throw new Error('Game is already in progress!');
        }

        if (room.players.length >= room.maxPlayers) {
            throw new Error('Room is full!');
        }

        // เช็คว่าผู้เล่นอยู่ในห้องแล้วหรือยัง
        const existingPlayer = room.players.find(p => p.id === userId);
        if (existingPlayer) {
            // กลับเข้ามาใหม่
            this.state.roomCode = roomCode.toUpperCase();
            this.state.playerId = userId;
            this.state.playerName = existingPlayer.name;
            this.state.isHost = existingPlayer.isHost;
            this.startRoomListener();
            return;
        }

        // แก้ไข: ลบ syntax error "id: visitorId = userId," ออก
        const playerData = {
            id: userId,
            name: playerName,
            avatar: this.getAvatar(room.players.length),
            ready: false,
            isHost: false
        };

        await roomRef.update({
            players: firebase.firestore.FieldValue.arrayUnion(playerData)
        });

        // อัพเดท local state
        this.state.roomCode = roomCode.toUpperCase();
        this.state.playerId = userId;
        this.state.playerName = playerName;
        this.state.isHost = false;
        this.state.timeLimit = room.timeLimit;
        this.state.spyCount = room.spyCount;
        this.state.gameMode = room.gameMode;

        // เริ่มฟังการเปลี่ยนแปลง
        this.startRoomListener();
    },

    /**
     * เริ่ม real-time listener สำหรับอัพเดทห้อง
     */
    startRoomListener() {
        if (this.state.unsubscribeRoom) {
            this.state.unsubscribeRoom();
        }

        this.state.unsubscribeRoom = listenToRoom(this.state.roomCode, (room) => {
            if (!room) {
                showToast('Room has been deleted', 'error');
                this.leaveRoom();
                return;
            }

            this.state.players = room.players || [];
            this.state.status = room.status;
            this.state.scores = room.scores || {};
            this.state.votes = room.votes || {};

            // อัพเดท UI ตามสถานะ
            switch (room.status) {
                case 'waiting':
                    this.updateLobbyUI(room);
                    break;
                case 'playing':
                    if (!this.state.cardRevealed) {
                        this.handleGameStart(room);
                    }
                    break;
                case 'voting':
                    this.handleVotingPhase(room);
                    break;
                case 'finished':
                    this.handleGameEnd(room);
                    break;
            }
        });

        // ฟัง chat
        this.state.unsubscribeChat = listenToChat(this.state.roomCode, (messages) => {
            this.updateChatUI(messages);
        });
    },

    /**
     * อัพเดท UI ของ Lobby
     * @param {Object} room - ข้อมูลห้อง
     */
    updateLobbyUI(room) {
        const playerCount = document.getElementById('player-count');
        const playersContainer = document.getElementById('players-container');
        const startBtn = document.getElementById('btn-start-game');
        const readyBtn = document.getElementById('btn-ready');

        if (playerCount) {
            playerCount.textContent = `${room.players.length}/${room.maxPlayers}`;
        }

        if (playersContainer) {
            playersContainer.innerHTML = room.players.map((p, i) => `
                <div class="player-card ${p.ready ? 'ready' : ''}">
                    <div class="avatar">${p.avatar || this.getAvatar(i)}</div>
                    <div class="player-info">
                        <div class="player-name">${p.name}${p.isHost ? ' 👑' : ''}</div>
                        <div class="player-status ${p.ready ? 'ready' : ''}">${p.ready ? '✓ Ready' : 'Not Ready'}</div>
                    </div>
                    ${this.state.isHost && !p.isHost ? `<button class="btn-kick" onclick="GameManager.kickPlayer('${p.id}')">✕</button>` : ''}
                </div>
            `).join('');
        }

        // แสดงปุ่ม start เมื่อทุกคนพร้อม (host เท่านั้น)
        if (this.state.isHost) {
            const allReady = room.players.length >= 3 && room.players.every(p => p.ready);
            if (startBtn) startBtn.style.display = allReady ? 'block' : 'none';
            if (readyBtn) readyBtn.style.display = 'none';
        } else {
            if (startBtn) startBtn.style.display = 'none';
            const me = room.players.find(p => p.id === this.state.playerId);
            if (readyBtn && me) {
                readyBtn.textContent = me.ready ? '✓ Ready!' : 'Ready ✓';
                readyBtn.classList.toggle('btn-primary', me.ready);
                readyBtn.classList.toggle('btn-secondary', !me.ready);
            }
        }
    },

    /**
     * อัพเดท UI ของ Chat
     * @param {Array} messages - ข้อความแชท
     */
    updateChatUI(messages) {
        const chatContainer = document.getElementById('chat-messages');
        if (!chatContainer) return;

        chatContainer.innerHTML = messages.map(msg => `
            <div class="chat-msg">
                <span class="chat-name">${msg.name}:</span>
                <span class="chat-text">${this.escapeHtml(msg.text)}</span>
            </div>
        `).join('');

        chatContainer.scrollTop = chatContainer.scrollHeight;
    },

    /**
     * สลับสถานะ Ready
     */
    async toggleReady() {
        const roomRef = db.collection('rooms').doc(this.state.roomCode);
        const roomSnap = await roomRef.get();
        const room = roomSnap.data();

        const updatedPlayers = room.players.map(p => {
            if (p.id === this.state.playerId) {
                return { ...p, ready: !p.ready };
            }
            return p;
        });

        await roomRef.update({ players: updatedPlayers });
    },

    /**
     * เตะผู้เล่นออก (host เท่านั้น)
     * @param {string} playerId - ID ผู้เล่นที่จะเตะ
     */
    async kickPlayer(playerId) {
        if (!this.state.isHost) return;

        const roomRef = db.collection('rooms').doc(this.state.roomCode);
        const roomSnap = await roomRef.get();
        const room = roomSnap.data();

        const updatedPlayers = room.players.filter(p => p.id !== playerId);
        await roomRef.update({ players: updatedPlayers });

        showToast('Player kicked', 'info');
    },

    /**
     * เริ่มเกม (host เท่านั้น)
     * สุ่มสถานที่และแจก role
     */
    async startGame() {
        if (!this.state.isHost) return;

        const roomRef = db.collection('rooms').doc(this.state.roomCode);
        const roomSnap = await roomRef.get();
        const room = roomSnap.data();
        const players = room.players;

        if (players.length < 3) {
            showToast('Need at least 3 players!', 'error');
            return;
        }

        // สุ่มเลือกสถานที่
        const location = this.state.locations[Math.floor(Math.random() * this.state.locations.length)];

        // กำหนดจำนวน spy
        let spyCount = room.spyCount;
        if (spyCount === 'random') {
            spyCount = Math.random() < 0.3 ? 2 : 1;
        }
        spyCount = Math.min(parseInt(spyCount), Math.floor(players.length / 2));

        // สุ่มลำดับผู้เล่นเพื่อกำหนด spy
        const shuffled = [...Array(players.length).keys()];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        // กำหนด roles
        const spyIndices = shuffled.slice(0, spyCount);
        const availableRoles = [...location.roles];

        // สุ่ม roles
        for (let i = availableRoles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableRoles[i], availableRoles[j]] = [availableRoles[j], availableRoles[i]];
        }

        const gameData = {
            location: location.name,
            assignments: {}
        };

        let roleIndex = 0;
        players.forEach((player, index) => {
            if (spyIndices.includes(index)) {
                gameData.assignments[player.id] = {
                    role: 'SPY',
                    isSpy: true,
                    location: null
                };
            } else {
                gameData.assignments[player.id] = {
                    role: availableRoles[roleIndex % availableRoles.length],
                    isSpy: false,
                    location: location.name
                };
                roleIndex++;
            }
        });

        // จัดการ game modes
        if (room.gameMode === 'hard') {
            // Hard mode: ผู้เล่นทั่วไปจะไม่เห็น role ของตัวเอง
            Object.keys(gameData.assignments).forEach(key => {
                if (!gameData.assignments[key].isSpy) {
                    gameData.assignments[key].hideRole = true;
                }
            });
        }

        // สุ่ม random event (30% โอกาส)
        let randomEvent = null;
        if (Math.random() < 0.3) {
            randomEvent = this.randomEvents[Math.floor(Math.random() * this.randomEvents.length)];
        }

        // อัพเดทห้อง
        await roomRef.update({
            status: 'playing',
            gameData,
            randomEvent,
            startTime: firebase.firestore.FieldValue.serverTimestamp(),
            votes: {}
        });
    },

    /**
     * จัดการเมื่อเกมเริ่ม - แสดงการ์ด
     * @param {Object} room - ข้อมูลห้อง
     */
    handleGameStart(room) {
        if (this.state.status !== 'playing') return;

        const assignment = room.gameData.assignments[this.state.playerId];
        if (!assignment) return;

        this.state.location = assignment.location;
        this.state.role = assignment.role;
        this.state.isSpy = assignment.isSpy;
        this.state.randomEvent = room.randomEvent;

        // แสดงหน้า game
        showScreen('game');

        // ตั้งค่าเนื้อหาการ์ด
        const cardContent = document.getElementById('card-role-content');
        if (assignment.isSpy) {
            cardContent.className = 'card-role-content spy';
            cardContent.innerHTML = `
                <span class="role-icon">🕵️</span>
                <div class="role-name">YOU ARE THE SPY</div>
                <p class="text-muted">Figure out the location!</p>
                ${room.gameMode === 'blind' ? '<p class="text-muted">Blind Spy: No hints allowed</p>' : ''}
            `;
        } else {
            const hideRole = assignment.hideRole;
            cardContent.className = 'card-role-content';
            cardContent.innerHTML = `
                <span class="role-icon">📍</span>
                <div class="role-location">LOCATION</div>
                <div class="role-name">${assignment.location}</div>
                ${!hideRole ? `<div class="text-muted mt-8">Your Role</div><div style="font-size:1.1rem;font-weight:600;margin-top:4px;">${assignment.role}</div>` : '<div class="text-muted mt-8">Hard Mode: Role Hidden</div>'}
            `;
        }

        // แสดง game mode badge
        const modeBadge = document.getElementById('game-mode-badge');
        if (room.gameMode !== 'normal' && modeBadge) {
            modeBadge.textContent = room.gameMode.toUpperCase();
            modeBadge.style.display = 'block';
        } else if (modeBadge) {
            modeBadge.style.display = 'none';
        }

        // แสดง random event
        if (room.randomEvent) {
            const eventEl = document.getElementById('random-event');
            const eventText = document.getElementById('event-text');
            if (eventEl && eventText) {
                eventText.textContent = room.randomEvent.text;
                eventEl.style.display = 'flex';
            }
        }

        // แสดงรายชื่อผู้เล่น
        this.updateGamePlayersList(room.players);

        // แสดงรายชื่อสถานที่ทั้งหมด (ใหม่ v2)
        this.updateLocationsList();

        // เริ่ม timer
        this.startTimer(room.timeLimit * 60);

        // เล่นเสียง
        playSound('flip');
    },

    /**
     * อัพเดทรายชื่อผู้เล่นในเกม
     * @param {Array} players - ผู้เล่นทั้งหมด
     */
    updateGamePlayersList(players) {
        const container = document.getElementById('game-players-list');
        if (!container) return;

        container.innerHTML = players.map(p => `
            <div class="game-player-chip">
                <span class="chip-avatar">${p.avatar}</span>
                <span>${p.name}</span>
            </div>
        `).join('');
    },

    /**
     * อัพเดทรายชื่อสถานที่ทั้งหมดในหน้า Game (ใหม่ v2)
     * ให้ผู้เล่นดูได้ว่ามีสถานที่อะไรบ้าง
     */
    updateLocationsList() {
        const container = document.getElementById('locations-display');
        if (!container) return;

        const locationNames = this.state.locations.map(loc => loc.name).sort();
        container.innerHTML = locationNames.map(name => `
            <span class="location-chip">${name}</span>
        `).join('');
    },

    /**
     * เปิดการ์ด (ทำได้ครั้งเดียว)
     */
    revealCard() {
        if (this.state.cardRevealed) return;

        const card = document.getElementById('game-card');
        if (card) {
            card.setAttribute('data-flipped', 'true');
            this.state.cardRevealed = true;
            playSound('flip');

            // ซ่อนหลัง 10 วินาทีเพื่อความปลอดภัย
            setTimeout(() => {
                showToast('Card hidden for security', 'info');
            }, 10000);
        }
    },

    /**
     * เริ่มจับเวลาถอยหลัง
     * @param {number} seconds - จำนวนวินาทีทั้งหมด
     */
    startTimer(seconds) {
        this.state.timeRemaining = seconds;
        const timerEl = document.getElementById('game-timer');

        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
        }

        this.updateTimerDisplay(timerEl);

        this.state.timerInterval = setInterval(() => {
            this.state.timeRemaining--;

            if (this.state.timeRemaining <= 30) {
                timerEl.classList.add('urgent');
                if (this.state.timeRemaining <= 10 && this.state.timeRemaining > 0) {
                    playSound('tick');
                }
            }

            this.updateTimerDisplay(timerEl);

            if (this.state.timeRemaining <= 0) {
                clearInterval(this.state.timerInterval);
                this.timeUp();
            }
        }, 1000);
    },

    /**
     * อัพเดทการแสดงเวลา
     * @param {HTMLElement} el - Timer element
     */
    updateTimerDisplay(el) {
        if (!el) return;
        const mins = Math.floor(this.state.timeRemaining / 60);
        const secs = this.state.timeRemaining % 60;
        el.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * หมดเวลา - เข้าสู่ช่วงโหวต
     */
    async timeUp() {
        if (this.state.isHost) {
            await updateRoom(this.state.roomCode, { status: 'voting' });
        }
        playSound('vote');
    },

    /**
     * จัดการช่วงโหวต
     * @param {Object} room - ข้อมูลห้อง
     */
    handleVotingPhase(room) {
        if (document.querySelector('#screen-vote.active')) return;

        showScreen('vote');

        const voteContainer = document.getElementById('vote-players');
        if (!voteContainer) return;

        // ไม่สามารถโหวตตัวเองได้
        const otherPlayers = room.players.filter(p => p.id !== this.state.playerId);

        voteContainer.innerHTML = otherPlayers.map(p => `
            <div class="vote-card" data-player-id="${p.id}" onclick="GameManager.selectVote('${p.id}')">
                <div class="vote-avatar">${p.avatar}</div>
                <div class="vote-name">${p.name}</div>
            </div>
        `).join('');

        // เช็คว่าโหวตครบทุกคนหรือยัง
        const totalVotes = Object.keys(room.votes || {}).length;
        if (totalVotes >= room.players.length && this.state.isHost) {
            this.resolveVotes(room);
        }
    },

    /**
     * เลือกคนที่จะโหวต
     * @param {string} playerId - ID ผู้เล่นเป้าหมาย
     */
    selectVote(playerId) {
        // ลบการเลือกก่อนหน้า
        document.querySelectorAll('.vote-card').forEach(c => c.classList.remove('selected'));

        // เพิ่มการเลือกใหม่
        const card = document.querySelector(`.vote-card[data-player-id="${playerId}"]`);
        if (card) card.classList.add('selected');

        // เปิดใช้งานปุ่มส่งโหวต
        const submitBtn = document.getElementById('btn-submit-vote');
        if (submitBtn) submitBtn.disabled = false;

        this.state.selectedVote = playerId;
    },

    /**
     * ส่งโหวต
     */
    async submitVoteAction() {
        if (!this.state.selectedVote) return;

        await submitVote(this.state.roomCode, this.state.playerId, this.state.selectedVote);
        showToast('Vote submitted!', 'success');

        // ปิดการโหวต
        document.querySelectorAll('.vote-card').forEach(c => {
            c.style.pointerEvents = 'none';
            c.style.opacity = '0.5';
        });
        const submitBtn = document.getElementById('btn-submit-vote');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Waiting for others...';
        }
    },

    /**
     * ประมวลผลโหวตและหาผู้ชนะ
     * @param {Object} room - ข้อมูลห้อง
     */
    async resolveVotes(room) {
        const votes = room.votes || {};
        const voteCounts = {};

        // นับคะแนนโหวต
        Object.values(votes).forEach(targetId => {
            voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
        });

        // หาคนที่ถูกโหวตมากสุด
        let maxVotes = 0;
        let mostVoted = null;
        Object.entries(voteCounts).forEach(([id, count]) => {
            if (count > maxVotes) {
                maxVotes = count;
                mostVoted = id;
            }
        });

        // เช็คว่าจับ spy ได้หรือไม่
        const spyIds = Object.keys(room.gameData.assignments).filter(
            id => room.gameData.assignments[id].isSpy
        );

        const spyCaught = spyIds.includes(mostVoted);

        // อัพเดทคะแนน
        const scores = { ...room.scores };
        room.players.forEach(p => {
            if (!scores[p.id]) {
                scores[p.id] = { wins: 0, spyWins: 0, spyCount: 0, totalGames: 0 };
            }
            scores[p.id].totalGames++;

            if (spyIds.includes(p.id)) {
                scores[p.id].spyCount++;
                if (!spyCaught) scores[p.id].spyWins++;
            }

            if (spyCaught && !spyIds.includes(p.id)) {
                scores[p.id].wins++;
            }
            if (!spyCaught && spyIds.includes(p.id)) {
                scores[p.id].wins++;
            }
        });

        await updateRoom(this.state.roomCode, {
            status: 'finished',
            result: {
                spyCaught,
                spyIds,
                mostVoted,
                voteCounts,
                location: room.gameData.location
            },
            scores
        });
    },

    /**
     * จัดการเมื่อเกมจบ - แสดงผลลัพธ์
     * @param {Object} room - ข้อมูลห้อง
     */
    handleGameEnd(room) {
        if (document.querySelector('#screen-results.active')) return;

        clearInterval(this.state.timerInterval);
        showScreen('results');

        const result = room.result;
        if (!result) return;

        const resultsAnim = document.getElementById('results-animation');
        const resultsTitle = document.getElementById('results-title');
        const resultsSub = document.getElementById('results-subtitle');
        const resultsDetails = document.getElementById('results-details');
        const voteResults = document.getElementById('vote-results');

        if (result.spyCaught) {
            resultsAnim.textContent = '🎉';
            resultsTitle.textContent = 'Civilians Win!';
            resultsSub.textContent = 'The spy has been caught!';
            // เล่น confetti animation (ใหม่ v2)
            launchConfetti();
        } else {
            resultsAnim.textContent = '🕵️';
            resultsTitle.textContent = 'Spy Wins!';
            resultsSub.textContent = 'The spy escaped detection!';
        }

        // แสดงรายละเอียด
        const spyNames = result.spyIds.map(id => {
            const player = room.players.find(p => p.id === id);
            return player ? player.name : 'Unknown';
        });

        resultsDetails.innerHTML = `
            <div class="detail-item"><span>Location:</span><span>${result.location}</span></div>
            <div class="detail-item"><span>Spy:</span><span>${spyNames.join(', ')}</span></div>
            <div class="detail-item"><span>Most Voted:</span><span>${room.players.find(p => p.id === result.mostVoted)?.name || 'N/A'}</span></div>
        `;

        // แสดงผลโหวต
        if (result.voteCounts) {
            voteResults.innerHTML = '<h3 class="mb-8">Vote Results</h3>' +
                Object.entries(result.voteCounts).map(([id, count]) => {
                    const player = room.players.find(p => p.id === id);
                    const pct = Math.round((count / room.players.length) * 100);
                    return `
                        <div class="vote-result-item">
                            <span>${player?.name || 'Unknown'} ${result.spyIds.includes(id) ? '🕵️' : ''}</span>
                            <span>${count} votes</span>
                            <div class="vote-bar" style="width:${pct}%"></div>
                        </div>
                    `;
                }).join('');
        }

        playSound('winner');
    },

    /**
     * เล่นอีกรอบ - รีเซ็ตสถานะ
     */
    async playAgain() {
        if (!this.state.isHost) return;

        const roomRef = db.collection('rooms').doc(this.state.roomCode);
        const roomSnap = await roomRef.get();
        const room = roomSnap.data();

        const resetPlayers = room.players.map(p => ({ ...p, ready: p.isHost }));

        await roomRef.update({
            status: 'waiting',
            players: resetPlayers,
            gameData: null,
            result: null,
            votes: {},
            randomEvent: null
        });

        this.state.cardRevealed = false;
        this.state.isSpy = false;
        this.state.role = null;
        this.state.location = null;

        showScreen('lobby');
    },

    /**
     * ออกจากห้อง
     */
    async leaveRoom() {
        if (this.state.unsubscribeRoom) {
            this.state.unsubscribeRoom();
        }
        if (this.state.unsubscribeChat) {
            this.state.unsubscribeChat();
        }

        if (this.state.roomCode && this.state.playerId) {
            try {
                const roomRef = db.collection('rooms').doc(this.state.roomCode);
                const roomSnap = await roomRef.get();

                if (roomSnap.exists) {
                    const room = roomSnap.data();
                    const updatedPlayers = room.players.filter(p => p.id !== this.state.playerId);

                    if (updatedPlayers.length === 0) {
                        await roomRef.delete();
                    } else {
                        // โอน host ถ้า host ออก
                        if (this.state.isHost && updatedPlayers.length > 0) {
                            updatedPlayers[0].isHost = true;
                        }
                        await roomRef.update({
                            players: updatedPlayers,
                            hostId: updatedPlayers[0].id
                        });
                    }
                }
            } catch (e) {
                console.error('Error leaving room:', e);
            }
        }

        // รีเซ็ต state
        clearInterval(this.state.timerInterval);
        this.state.roomCode = null;
        this.state.playerId = null;
        this.state.isHost = false;
        this.state.cardRevealed = false;
        this.state.players = [];

        showScreen('home');
    },

    /**
     * ส่งข้อความแชท
     * @param {string} text - ข้อความ
     */
    async sendMessage(text) {
        if (!text.trim() || !this.state.roomCode) return;

        await sendChatMessage(this.state.roomCode, {
            name: this.state.playerName,
            text: text.trim(),
            playerId: this.state.playerId
        });
    },

    /**
     * ดึงข้อมูล Scoreboard
     * @returns {Array} ข้อมูลคะแนนเรียงตามอันดับ
     */
    getScoreBoard() {
        const scores = this.state.scores;
        const players = this.state.players;

        return players.map(p => {
            const s = scores[p.id] || { wins: 0, spyWins: 0, spyCount: 0, totalGames: 0 };
            return {
                name: p.name,
                avatar: p.avatar,
                wins: s.wins,
                spyWins: s.spyWins,
                spyCount: s.spyCount,
                totalGames: s.totalGames,
                winRate: s.totalGames > 0 ? Math.round((s.wins / s.totalGames) * 100) : 0
            };
        }).sort((a, b) => b.wins - a.wins);
    },

    /**
     * แสดง Scoreboard (ใหม่ v2)
     */
    showScoreBoard() {
        const scoreData = this.getScoreBoard();
        const scoreList = document.getElementById('score-list');

        if (scoreList) {
            scoreList.innerHTML = scoreData.length > 0 ? scoreData.map((p, i) => {
                const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
                const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
                return `
                    <div class="score-item">
                        <span class="score-rank ${rankClass}">${rankEmoji}</span>
                        <span class="score-avatar">${p.avatar}</span>
                        <div class="score-info">
                            <div class="score-name">${p.name}</div>
                            <div class="score-stats">Win Rate: ${p.winRate}% | Spy: ${p.spyCount}x</div>
                        </div>
                        <span class="score-points">${p.wins}W</span>
                    </div>
                `;
            }).join('') : '<p class="text-muted text-center">No games played yet</p>';
        }

        showScreen('score');
    },

    /**
     * Escape HTML เพื่อป้องกัน XSS
     * @param {string} text - ข้อความดิบ
     * @returns {string} ข้อความที่ปลอดภัย
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
