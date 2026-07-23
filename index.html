/**
 * ============================================
 * FIREBASE CONFIG
 * แก้ไขค่าด้านล่างเป็น Firebase Project ของคุณ
 * ถ้าไม่แก้ → เกมจะทำงานในโหมด Local อัตโนมัติ
 * ============================================
 */

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// ตรวจสอบว่า config ถูกตั้งค่าแล้วหรือยัง
let firebaseReady = false;
let db = null;
let auth = null;

function isFirebaseConfigured() {
    return firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('YOUR_');
}

if (isFirebaseConfigured()) {
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        firebaseReady = true;
        console.log('✅ Firebase พร้อมใช้งาน — โหมด Online เปิดแล้ว');
    } catch (e) {
        console.warn('⚠️ Firebase เริ่มต้นไม่สำเร็จ:', e.message);
        firebaseReady = false;
    }
} else {
    console.log('ℹ️ ยังไม่ตั้งค่า Firebase — ใช้โหมด Local เท่านั้น');
}
