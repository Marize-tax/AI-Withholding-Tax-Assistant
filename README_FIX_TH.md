# AI Withholding Tax Assistant — ชุดตรวจสอบ Firebase

## สิ่งที่ปรับปรุง
- แสดงรหัสข้อผิดพลาด Firebase ที่เข้าใจได้บนหน้าเว็บไซต์แทนข้อความรวม ๆ
- ไม่เรียก signInAnonymously ซ้ำถ้ามีผู้ใช้ลงชื่อเข้าใช้อยู่แล้ว
- เพิ่ม billMode และ serviceAmount ในรายการฟิลด์ที่ Firestore Rules อนุญาต เพราะฟอร์มปัจจุบันบันทึกสองฟิลด์นี้
- คงระบบคำนวณภาษีและหน้าเว็บเดิมไว้

## สำคัญ: API Key
จากภาพ Console ก่อนหน้านี้ Firebase ตอบ `auth/api-key-not-valid` (HTTP 400) แม้ค่าในไฟล์จะตรงกับ Firebase Console ที่แสดง ข้อผิดพลาดนี้ **ไม่สามารถแก้ด้วย Firestore Rules** และไม่สามารถรับประกันแก้ได้ด้วยโค้ดเว็บ

1. เปิด Google Cloud Console > APIs & Services > Credentials ในโปรเจกต์ `ai-withholding-tax`
2. ค้นหา API Key ที่ตรงกับ `firebase-config.js` และตรวจว่าไม่ถูกลบ/ปิดใช้งาน
3. หากมี Application restrictions แบบ Websites ให้เพิ่ม `https://marize-tax.github.io/*` และหากมี API restrictions ให้แน่ใจว่าอนุญาต Identity Toolkit API
4. เปิด APIs & Services > Enabled APIs & services และตรวจว่า Identity Toolkit API เปิดใช้งาน
5. หากคีย์ยังใช้ไม่ได้ ให้สร้าง/เลือก Web API Key ที่ใช้งานได้ในโปรเจกต์เดียวกัน และปรับ firebase-config.js ตามค่าจริงจาก Firebase/Google Cloud โดยไม่ใช้ service account key
6. อัปโหลดไฟล์เว็บทั้งหมดไปยัง root ของ GitHub Pages repository แล้วรอ deploy จากนั้นกด Ctrl+Shift+R
7. ทดสอบ Console และ Network > accounts:signUp ต้องไม่ตอบ auth/api-key-not-valid อีก
8. เปิด Firestore > Rules และนำเนื้อหา `firestore.rules` ไปเผยแพร่ (Publish) เฉพาะหลังตรวจสอบว่าเหมาะกับการเปิดประวัติร่วมกันแล้ว

## ข้อควรระวังข้อมูลส่วนบุคคล
ประวัติร่วมกันอ่านได้โดยผู้ใช้ที่ล็อกอินแบบ Anonymous ทุกคน จึงไม่ควรบันทึกชื่อคู่ค้า ข้อมูลส่วนบุคคล หรือข้อความอ่อนไหวในช่องคำอธิบาย

## ตรวจสอบหลังติดตั้ง
- สถานะหน้าเว็บควรขึ้น `Cloud Firestore — ประวัติร่วมกัน`
- ทดสอบเพิ่มรายการจากเบราว์เซอร์หนึ่ง และเปิดอีกเบราว์เซอร์เพื่อดูรายการเดียวกัน
- หากขึ้น `permission-denied` ให้ตรวจ Firestore Rules และข้อมูลฟิลด์ที่บันทึก
