# 🕵️ Spyfall Online

> เกม Spyfall แบบ Multiplayer เล่นได้ทั้งบนมือถือและคอมพิวเตอร์ ผ่าน Firebase Real-time

![Version](https://img.shields.io/badge/version-2.0-purple)
![License](https://img.shields.io/badge/license-MIT-blue)
![Firebase](https://img.shields.io/badge/Firebase-Hosting-orange)

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white" />
</p>

---

## 📖 About

Spyfall Online เป็นเกมปาร์ตี้สำหรับ 3-20 คน ผู้เล่นทุกคนจะได้รับสถานที่และบทบาท ยกเว้น **Spy** ที่จะไม่รู้สถานที่ ผู้เล่นต้องถามคำถามเพื่อหาว่าใครเป็น Spy ในขณะที่ Spy ต้องพยายามเดาสถานที่โดยไม่ถูกจับได้!

## ✨ Features

### 🎮 Core Gameplay
- สร้างห้อง / เข้าห้อง ด้วย Room Code 6 ตัว
- QR Code สำหรับเข้าห้องง่ายๆ
- Lobby พร้อม Chat, Ready system, Kick player
- Card Flip Animation (เปิดได้ครั้งเดียว!)
- Timer นับถอยหลัง + Urgent mode
- ระบบ Voting + แสดงผลแบบ Animation
- Scoreboard เก็บสถิติ (Win Rate, MVP, Spy Count)

### 🎲 Game Modes
| Mode | Description |
|------|-------------|
| **Normal** | เล่นปกติ |
| **Hard** | Civilian ไม่เห็น Role ของตัวเอง |
| **Blind Spy** | Spy ไม่ได้รับ Hint ใดๆ |

### ⚡ Extra Features
- **Random Events** — เหตุการณ์สุ่มระหว่างเกม
- **Double Spy** — 2 Spy ในเกมเดียว
- **Confetti Animation** — ตอน Civilians ชนะ
- **Location List** — ดูรายชื่อสถานที่ทั้งหมดขณะเล่น

### 🎨 Design
- Dark Theme + Glassmorphism
- Neon Glow Effects
- Vivid Gradients
- CSS Animations (Card Flip, Fade, Scale, Pulse)
- Web Audio API (Sound effects ไม่ต้องไฟล์ภายนอก)
- Responsive — รองรับทุกขนาดหน้าจอ

### ⚙️ Admin Panel
- เพิ่ม / ลบ / แก้ไข สถานที่และ Role
- Import / Export JSON
- 62 สถานที่พร้อมใช้งาน (แต่ละที่มี 10 Roles)

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (สำหรับ Firebase CLI)
- [Firebase CLI](https://firebase.google.com/docs/cli)
- Firebase Project ที่เปิดใช้ Firestore + Anonymous Auth

### Installation

```bash
# 1. Clone repository
git clone https://github.com/your-username/spyfall-online.git
cd spyfall-online

# 2. ติดตั้ง Firebase CLI (ถ้ายังไม่มี)
npm install -g firebase-tools

# 3. Login Firebase
firebase login

# 4. เชื่อมต่อ project
firebase use --add
```

### Configuration

แก้ไขไฟล์ `firebase.js` ใส่ Firebase config ของคุณ:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Firebase Setup

1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. สร้าง Project ใหม่
3. เปิด **Authentication** → Sign-in method → เปิด **Anonymous**
4. เปิด **Firestore Database** → สร้าง Database
5. Deploy Security Rules จากไฟล์ `firestore.rules`

### Deploy

```bash
firebase deploy
```

### Local Development

```bash
# เปิดไฟล์ index.html ตรงๆ หรือใช้ Live Server
# VS Code: ติดตั้ง extension "Live Server" แล้วคลิก "Go Live"

# หรือใช้ Python
python -m http.server 8080

# หรือใช้ Firebase emulator
firebase emulators:start
```

---

## 📁 Project Structure

```
spyfall-online/
├── index.html          # หน้าหลัก - โครงสร้าง HTML ทุกหน้าจอ
├── style.css           # Dark Theme + Glassmorphism + Responsive
├── app.js              # UI Controller, Navigation, Sound, Particles
├── firebase.js         # Firebase Auth + Firestore helpers
├── game.js             # Game Logic, State, Timer, Voting, Score
├── admin.js            # Admin Panel - จัดการสถานที่/Role
├── locations.json      # 62 สถานที่ + 10 Roles แต่ละที่
├── firebase.json       # Firebase Hosting configuration
└── firestore.rules     # Firestore security rules
```

---

## 🎯 How to Play

1. **Host** สร้างห้องและตั้งค่า (จำนวนผู้เล่น, เวลา, จำนวน Spy)
2. **ผู้เล่น** เข้าห้องด้วย Room Code หรือ QR Code
3. ทุกคนกด **Ready** แล้ว Host กด **Start Game**
4. กด **TAP TO REVEAL** เพื่อเปิดการ์ด (เปิดได้ครั้งเดียว!)
   - **Civilian**: เห็นสถานที่ + Role ของตัวเอง
   - **Spy**: เห็นแค่ "YOU ARE THE SPY"
5. ผลัดกัน **ถามคำถาม** เพื่อหา Spy (อย่าเปิดเผยสถานที่ตรงๆ!)
6. เมื่อหมดเวลา ทุกคน **Vote** เลือกคนที่คิดว่าเป็น Spy
7. ถ้าโหวตถูก → **Civilians ชนะ!** 🎉 / ถ้าผิด → **Spy ชนะ!** 🕵️

---

## 📍 Locations (62 สถานที่)

<details>
<summary>คลิกดูรายชื่อสถานที่ทั้งหมด</summary>

| # | Location | # | Location |
|---|----------|---|----------|
| 1 | Hospital | 32 | Coffee Shop |
| 2 | Airport | 33 | Bakery |
| 3 | School | 34 | Night Club |
| 4 | Casino | 35 | Laboratory |
| 5 | Cinema | 36 | Embassy |
| 6 | Prison | 37 | Theme Park |
| 7 | Cruise Ship | 38 | Aquarium |
| 8 | Space Station | 39 | Construction Site |
| 9 | Military Base | 40 | Office |
| 10 | Restaurant | 41 | Warehouse |
| 11 | Shopping Mall | 42 | Music Festival |
| 12 | Factory | 43 | Game Convention |
| 13 | Temple | 44 | Castle |
| 14 | Zoo | 45 | Pirate Ship |
| 15 | Museum | 46 | Volcano Research Station |
| 16 | Beach | 47 | Luxury Yacht |
| 17 | Train | 48 | Movie Set |
| 18 | Submarine | 49 | Data Center |
| 19 | Wedding | 50 | Tech Company |
| 20 | Concert | 51 | Board Game Cafe |
| 21 | Library | 52 | Escape Room |
| 22 | Police Station | 53 | Comic Convention |
| 23 | Fire Station | 54 | Marketplace |
| 24 | University | 55 | Harbor |
| 25 | Hotel | 56 | Mountain Cabin |
| 26 | Bank | 57 | Airport Lounge |
| 27 | Farm | 58 | Fashion Show |
| 28 | Circus | 59 | Art Gallery |
| 29 | TV Studio | 60 | Football Stadium |
| 30 | Arcade | 61 | Haunted House |
| 31 | Camping | 62 | Ski Resort |

</details>

---

## 🛠️ Tech Stack

| Technology | Usage |
|-----------|-------|
| HTML5 | Structure |
| CSS3 | Styling, Animations, Responsive |
| Vanilla JavaScript (ES6) | Logic, State Management |
| Firebase Firestore | Real-time Multiplayer Database |
| Firebase Auth | Anonymous Authentication |
| Firebase Hosting | Deployment |
| Web Audio API | Sound Effects |
| QRCode.js | QR Code Generation |

---

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### เพิ่มสถานที่ใหม่

แก้ไข `locations.json` ตามรูปแบบ:

```json
{
  "name": "Your Location",
  "roles": [
    "Role 1",
    "Role 2",
    "Role 3",
    "Role 4",
    "Role 5",
    "Role 6",
    "Role 7",
    "Role 8",
    "Role 9",
    "Role 10"
  ]
}
```

หรือใช้ **Admin Panel** ในเกมเพื่อเพิ่ม/แก้ไข/Import JSON ได้เลย

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🙏 Acknowledgments

- Inspired by the original [Spyfall](http://spyfall.crabhat.com/) board game
- Firebase for real-time capabilities
- QRCode.js for QR code generation

---

<p align="center">
  Made with ❤️ and 🕵️
</p>
