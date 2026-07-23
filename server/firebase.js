/**
 * ============================================
 * SPYFALL ONLINE - FIREBASE.JS
 * Firebase Configuration & Initialization
 * ============================================
 */

// Firebase Configuration
// Replace with your own Firebase project credentials
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase Services
const db = firebase.firestore();
const auth = firebase.auth();

/**
 * Sign in anonymously
 * @returns {Promise<firebase.User>} The authenticated user
 */
async function signInAnonymously() {
    try {
        const result = await auth.signInAnonymously();
        console.log('Signed in anonymously:', result.user.uid);
        return result.user;
    } catch (error) {
        console.error('Anonymous sign-in error:', error);
        throw error;
    }
}

/**
 * Get current user ID
 * @returns {string|null} Current user UID or null
 */
function getCurrentUserId() {
    return auth.currentUser ? auth.currentUser.uid : null;
}

/**
 * Create a new room in Firestore
 * @param {Object} roomData - Room configuration data
 * @returns {Promise<string>} Room ID
 */
async function createRoom(roomData) {
    try {
        const roomRef = db.collection('rooms').doc(roomData.code);
        await roomRef.set({
            ...roomData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'waiting' // waiting, playing, voting, finished
        });
        return roomData.code;
    } catch (error) {
        console.error('Error creating room:', error);
        throw error;
    }
}

/**
 * Join an existing room
 * @param {string} roomCode - 6-digit room code
 * @param {Object} playerData - Player information
 * @returns {Promise<Object>} Room data
 */
async function joinRoom(roomCode, playerData) {
    try {
        const roomRef = db.collection('rooms').doc(roomCode);
        const roomSnap = await roomRef.get();

        if (!roomSnap.exists) {
            throw new Error('Room not found');
        }

        const room = roomSnap.data();
        if (room.status !== 'waiting') {
            throw new Error('Game already in progress');
        }

        if (room.players && room.players.length >= room.maxPlayers) {
            throw new Error('Room is full');
        }

        // Add player to room
        await roomRef.update({
            players: firebase.firestore.FieldValue.arrayUnion(playerData)
        });

        return room;
    } catch (error) {
        console.error('Error joining room:', error);
        throw error;
    }
}

/**
 * Listen to room changes in real-time
 * @param {string} roomCode - Room code to listen
 * @param {Function} callback - Callback function for updates
 * @returns {Function} Unsubscribe function
 */
function listenToRoom(roomCode, callback) {
    return db.collection('rooms').doc(roomCode)
        .onSnapshot((doc) => {
            if (doc.exists) {
                callback({ id: doc.id, ...doc.data() });
            } else {
                callback(null);
            }
        }, (error) => {
            console.error('Room listener error:', error);
        });
}

/**
 * Update room data
 * @param {string} roomCode - Room code
 * @param {Object} data - Data to update
 */
async function updateRoom(roomCode, data) {
    try {
        await db.collection('rooms').doc(roomCode).update(data);
    } catch (error) {
        console.error('Error updating room:', error);
        throw error;
    }
}

/**
 * Delete a room
 * @param {string} roomCode - Room code to delete
 */
async function deleteRoom(roomCode) {
    try {
        await db.collection('rooms').doc(roomCode).delete();
    } catch (error) {
        console.error('Error deleting room:', error);
    }
}

/**
 * Send a chat message
 * @param {string} roomCode - Room code
 * @param {Object} message - Message object {name, text, timestamp}
 */
async function sendChatMessage(roomCode, message) {
    try {
        await db.collection('rooms').doc(roomCode).collection('chat').add({
            ...message,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

/**
 * Listen to chat messages
 * @param {string} roomCode - Room code
 * @param {Function} callback - Callback for new messages
 * @returns {Function} Unsubscribe function
 */
function listenToChat(roomCode, callback) {
    return db.collection('rooms').doc(roomCode).collection('chat')
        .orderBy('timestamp', 'asc')
        .limitToLast(50)
        .onSnapshot((snapshot) => {
            const messages = [];
            snapshot.forEach(doc => messages.push({ id: doc.id, ...doc.data() }));
            callback(messages);
        });
}

/**
 * Submit a vote
 * @param {string} roomCode - Room code
 * @param {string} voterId - Who is voting
 * @param {string} targetId - Who they voted for
 */
async function submitVote(roomCode, voterId, targetId) {
    try {
        const roomRef = db.collection('rooms').doc(roomCode);
        await roomRef.update({
            [`votes.${voterId}`]: targetId
        });
    } catch (error) {
        console.error('Error submitting vote:', error);
        throw error;
    }
}

/**
 * Update player scores
 * @param {string} roomCode - Room code
 * @param {Object} scores - Updated scores object
 */
async function updateScores(roomCode, scores) {
    try {
        await db.collection('rooms').doc(roomCode).update({ scores });
    } catch (error) {
        console.error('Error updating scores:', error);
    }
}
