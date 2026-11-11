# วิธีเชื่อม Firebase

1. เปิด https://console.firebase.google.com/ แล้วสร้างโปรเจกต์
2. Project overview > Add app > Web (ไอคอน </>) > Register app แล้วคัดลอก firebaseConfig
3. เปิดไฟล์ `firebase-config.js` และแทนที่ค่าตัวอย่างด้วยค่าจริงจาก Firebase Console
4. Build > Authentication > Sign-in method > Anonymous > Enable
5. Build > Firestore Database > Create database (เลือก region และเริ่มแบบ production)
6. Firestore Database > Rules นำเนื้อหาจาก `firestore.rules` ไปวาง แล้วกด Publish
7. อัปโหลดทุกไฟล์ใน ZIP ขึ้น GitHub Pages หรือ Firebase Hosting (ต้องใช้เว็บผ่าน http/https ไม่ใช่เปิด index.html ด้วย file:// เพราะ ES modules)
8. เปิดเว็บไซต์แล้วตรวจแถบสถานะด้านล่างซ้าย จากนั้นลองบันทึกประวัติ แล้วดู Firestore > Data > users > {uid} > data > history

**ข้อจำกัด:** Anonymous Authentication ให้ UID แยกตามเบราว์เซอร์ ไม่ใช่ระบบบัญชีล็อกอินข้ามอุปกรณ์ หากล้างข้อมูลเว็บไซต์หรือเปลี่ยนเครื่องอาจเข้าถึงข้อมูลเดิมไม่ได้ ต้องเพิ่ม Google Sign-In หากต้องการใช้งานหลายอุปกรณ์

**ความปลอดภัย:** ห้ามใช้ Firestore rules แบบ `allow read, write: if true;` และห้ามเก็บข้อมูลผู้เสียภาษีจริงในต้นแบบก่อนออกแบบระบบสิทธิ์ การยินยอม และการรักษาความปลอดภัยที่เหมาะสม

**ข้อควรทราบ:** การเก็บประวัติในตัวอย่างใช้เอกสาร Firestore เดียวเพื่อให้เริ่มง่าย เหมาะกับข้อมูลทดลองจำนวนน้อย หากใช้จริงควรแยกเป็น 1 เอกสารต่อรายการ และใช้ pagination
