# 🕵️ Spyfall Online

> เกม Spyfall แบบ Multiplayer เล่นออนไลน์ได้ทั้งบนมือถือและคอมพิวเตอร์ ผ่าน Firebase Real-time

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

## 📖 เกี่ยวกับโปรเจค

Spyfall Online เป็นเกมปาร์ตี้ออนไลน์สำหรับ 3-20 คน ผู้เล่นทุกคนจะได้รับ **สถานที่** และ **บทบาท** ยกเว้น **Spy** ที่จะไม่รู้สถานที่ ผู้เล่นต้องผลัดกันถามคำถามเพื่อหาว่าใครเป็น Spy ในขณะที่ Spy ต้องพยายามเดาสถานที่โดยไม่ถูกจับได้!

---

## ✨ ฟีเจอร์หลัก

### 🎮 ระบบเกม
- สร้างห้อง / เข้าห้อง ด้วย Room Code 6 ตัว
- QR Code สำหรับเข้าห้องง่ายๆ
- Lobby พร้อม Chat, ระบบ Ready, Kick ผู้เล่น
- Card Flip Animation (เปิดการ์ดได้ครั้งเดียว!)
- Timer นับถอยหลัง + โหมดเร่งด่วนตอนเวลาใกล้หมด
- ระบบ Voting + แสดงผลแบบ Animation
- Scoreboard เก็บสถิติ (Win Rate, MVP, จำนวนครั้งที่เป็น Spy)

### 🎲 โหมดเกม
| โหมด | รายละเอียด |
|------|-------------|
| **Normal** | เล่นปกติ — ทุกคนเห็นสถานที่และบทบาทของตัวเอง |
| **Hard** | Civilian ไม่เห็น Role ของตัวเอง รู้แค่สถานที่ |
| **Blind Spy** | Spy ไม่ได้รับคำใบ้ใดๆ เลย |

### ⚡ ฟีเจอร์พิเศษ
- **Random Events** — เหตุการณ์สุ่มระหว่างเกม (เช่น Overtime, Silence Round)
- **Double Spy** — ตั้งค่าให้มี 2 Spy ในเกมเดียว
- **Confetti Animation** — เอฟเฟกต์ฉลองตอน Civilians ชนะ
- **Location List** — ดูรายชื่อสถานที่ทั้งหมดขณะเล่นได้

### 🎨 การออกแบบ
- ธีมมืด (Dark Theme) + Glassmorphism
- เอฟเฟกต์ Neon Glow
- Gradient สีสันสดใส
- CSS Animations (Card Flip, Fade, Scale, Pulse, Particles)
- Web Audio API (เสียงเอฟเฟกต์ไม่ต้องโหลดไฟล์เสียงภายนอก)
- Responsive — รองรับทุกขนาดหน้าจอ

### ⚙️ หน้า Admin
- เพิ่ม / ลบ / แก้ไข สถานที่และ Role
- Import / Export JSON
- มี 62 สถานที่พร้อมใช้งาน (แต่ละที่มี 10 บทบาท)

---

## 🚀 เริ่มต้นใช้งาน

### สิ่งที่ต้องมี
- [Node.js](https://nodejs.org/) (สำหรับ Firebase CLI)
- [Firebase CLI](https://firebase.google.com/docs/cli)
- Firebase Project ที่เปิดใช้ Firestore + Anonymous Auth

### การติดตั้ง

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

### ตั้งค่า Firebase

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

### ตั้งค่า Firebase Console

1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. สร้าง Project ใหม่
3. เปิด **Authentication** → Sign-in method → เปิด **Anonymous**
4. เปิด **Firestore Database** → สร้าง Database
5. Deploy Security Rules จากไฟล์ `firestore.rules`

### Deploy ขึ้น Hosting

```bash
firebase deploy
```

### ทดสอบในเครื่อง (Local Development)

```bash
# วิธีที่ 1: ใช้ Live Server (VS Code Extension)
# ติดตั้ง extension "Live Server" แล้วคลิก "Go Live"

# วิธีที่ 2: ใช้ Python
python -m http.server 8080

# วิธีที่ 3: ใช้ Firebase Emulator
firebase emulators:start
```

---

## 📁 โครงสร้างโปรเจค

```
spyfall-online/
├── index.html          # หน้าหลัก — โครงสร้าง HTML ทุกหน้าจอ
├── style.css           # ธีมมืด + Glassmorphism + Responsive
├── app.js              # ตัวควบคุม UI, การนำทาง, เสียง, Particles
├── firebase.js         # ตั้งค่า Firebase Auth + Firestore
├── game.js             # ลอจิกเกม, State, Timer, Voting, Score
├── admin.js            # หน้า Admin — จัดการสถานที่/Role
├── locations.json      # 62 สถานที่ + 10 บทบาทต่อที่
├── firebase.json       # ตั้งค่า Firebase Hosting
└── firestore.rules     # กฎความปลอดภัย Firestore
```

---

## 🎯 วิธีเล่น

1. **Host** สร้างห้องและตั้งค่า (จำนวนผู้เล่น, เวลา, จำนวน Spy, โหมด)
2. **ผู้เล่น** เข้าห้องด้วย Room Code 6 ตัว หรือสแกน QR Code
3. ทุกคนกด **Ready** แล้ว Host กด **Start Game**
4. กด **TAP TO REVEAL** เพื่อเปิดการ์ด (**เปิดได้ครั้งเดียวเท่านั้น!**)
   - 👤 **Civilian**: เห็นสถานที่ + บทบาทของตัวเอง
   - 🕵️ **Spy**: เห็นแค่ "YOU ARE THE SPY" (ไม่เห็นสถานที่)
5. ผลัดกัน **ถามคำถาม** เพื่อหา Spy
   - ⚠️ อย่าเปิดเผยสถานที่ตรงๆ! ใช้คำถามอ้อมๆ
   - 💡 Spy ต้องตอบให้ดูเหมือนรู้สถานที่
6. เมื่อหมดเวลา → ทุกคน **Vote** เลือกคนที่คิดว่าเป็น Spy
7. ผลลัพธ์:
   - ✅ โหวตถูก → **Civilians ชนะ!** 🎉
   - ❌ โหวตผิด → **Spy ชนะ!** 🕵️

### 💡 เทคนิคการเล่น

**สำหรับ Civilian:**
- ถามคำถามที่คนรู้สถานที่จะตอบได้ แต่ Spy จะลำบาก
- อย่าถามตรงเกินไป เช่น "เราอยู่โรงพยาบาลใช่ไหม?"
- สังเกตคนที่ตอบคลุมเครือหรือตอบช้า

**สำหรับ Spy:**
- ฟังคำถามและคำตอบของคนอื่นอย่างตั้งใจ
- ตอบให้กว้างๆ แต่ดูมีเหตุผล
- พยายามเดาสถานที่จากบริบทคำถาม

---

## 📍 รายชื่อสถานที่ (62 แห่ง)

<details>
<summary>คลิกเพื่อดูรายชื่อสถานที่ทั้งหมด</summary>

| # | สถานที่ | # | สถานที่ |
|---|---------|---|---------|
| 1 | Hospital (โรงพยาบาล) | 32 | Coffee Shop (ร้านกาแฟ) |
| 2 | Airport (สนามบิน) | 33 | Bakery (ร้านเบเกอรี่) |
| 3 | School (โรงเรียน) | 34 | Night Club (ไนท์คลับ) |
| 4 | Casino (คาสิโน) | 35 | Laboratory (ห้องปฏิบัติการ) |
| 5 | Cinema (โรงหนัง) | 36 | Embassy (สถานทูต) |
| 6 | Prison (เรือนจำ) | 37 | Theme Park (สวนสนุก) |
| 7 | Cruise Ship (เรือสำราญ) | 38 | Aquarium (พิพิธภัณฑ์สัตว์น้ำ) |
| 8 | Space Station (สถานีอวกาศ) | 39 | Construction Site (ไซต์ก่อสร้าง) |
| 9 | Military Base (ฐานทัพ) | 40 | Office (ออฟฟิศ) |
| 10 | Restaurant (ร้านอาหาร) | 41 | Warehouse (โกดัง) |
| 11 | Shopping Mall (ห้างสรรพสินค้า) | 42 | Music Festival (เทศกาลดนตรี) |
| 12 | Factory (โรงงาน) | 43 | Game Convention (งานเกม) |
| 13 | Temple (วัด) | 44 | Castle (ปราสาท) |
| 14 | Zoo (สวนสัตว์) | 45 | Pirate Ship (เรือโจรสลัด) |
| 15 | Museum (พิพิธภัณฑ์) | 46 | Volcano Research Station (สถานีวิจัยภูเขาไฟ) |
| 16 | Beach (ชายหาด) | 47 | Luxury Yacht (เรือยอชต์หรู) |
| 17 | Train (รถไฟ) | 48 | Movie Set (กองถ่ายหนัง) |
| 18 | Submarine (เรือดำน้ำ) | 49 | Data Center (ศูนย์ข้อมูล) |
| 19 | Wedding (งานแต่งงาน) | 50 | Tech Company (บริษัทเทค) |
| 20 | Concert (คอนเสิร์ต) | 51 | Board Game Cafe (คาเฟ่บอร์ดเกม) |
| 21 | Library (ห้องสมุด) | 52 | Escape Room (ห้องหนีปริศนา) |
| 22 | Police Station (สถานีตำรวจ) | 53 | Comic Convention (งาน Comic) |
| 23 | Fire Station (สถานีดับเพลิง) | 54 | Marketplace (ตลาด) |
| 24 | University (มหาวิทยาลัย) | 55 | Harbor (ท่าเรือ) |
| 25 | Hotel (โรงแรม) | 56 | Mountain Cabin (กระท่อมบนเขา) |
| 26 | Bank (ธนาคาร) | 57 | Airport Lounge (เลานจ์สนามบิน) |
| 27 | Farm (ฟาร์ม) | 58 | Fashion Show (แฟชั่นโชว์) |
| 28 | Circus (ละครสัตว์) | 59 | Art Gallery (แกลเลอรี่ศิลปะ) |
| 29 | TV Studio (สตูดิโอทีวี) | 60 | Football Stadium (สนามฟุตบอล) |
| 30 | Arcade (ตู้เกม) | 61 | Haunted House (บ้านผีสิง) |
| 31 | Camping (แคมป์ปิ้ง) | 62 | Ski Resort (สกีรีสอร์ท) |

</details>

---

## 🛠️ เทคโนโลยีที่ใช้

| เทคโนโลยี | การใช้งาน |
|-----------|-----------|
| HTML5 | โครงสร้างหน้าเว็บ |
| CSS3 | สไตล์, แอนิเมชัน, Responsive |
| Vanilla JavaScript (ES6) | ลอจิก, จัดการ State |
| Firebase Firestore | ฐานข้อมูล Real-time Multiplayer |
| Firebase Auth | ยืนยันตัวตนแบบ Anonymous |
| Firebase Hosting | Deploy เว็บ |
| Web Audio API | เสียงเอฟเฟกต์ |
| QRCode.js | สร้าง QR Code |

---

## 🤝 ร่วมพัฒนา (Contributing)

1. Fork โปรเจค
2. สร้าง Branch ใหม่ (`git checkout -b feature/ฟีเจอร์ใหม่`)
3. Commit การเปลี่ยนแปลง (`git commit -m 'เพิ่มฟีเจอร์ใหม่'`)
4. Push ขึ้น Branch (`git push origin feature/ฟีเจอร์ใหม่`)
5. เปิด Pull Request

### วิธีเพิ่มสถานที่ใหม่

แก้ไข `locations.json` ตามรูปแบบนี้:

```json
{
  "name": "ชื่อสถานที่",
  "roles": [
    "บทบาทที่ 1",
    "บทบาทที่ 2",
    "บทบาทที่ 3",
    "บทบาทที่ 4",
    "บทบาทที่ 5",
    "บทบาทที่ 6",
    "บทบาทที่ 7",
    "บทบาทที่ 8",
    "บทบาทที่ 9",
    "บทบาทที่ 10"
  ]
}
```

หรือใช้ **หน้า Admin** ในเกมเพื่อเพิ่ม/แก้ไข/Import JSON ได้เลย

---

## 📄 สัญญาอนุญาต

เผยแพร่ภายใต้สัญญาอนุญาต MIT — ดูรายละเอียดที่ไฟล์ `LICENSE`

---

<p align="center">
  สร้างด้วย ❤️ และ 🕵️
</p>
