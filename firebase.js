// Firebase connection (rewritten).
// Contract with script.js (unchanged):
//   window.sharedHistoryMode  : true while Firestore is connected
//   window.sharedUserId       : current Firebase uid
//   window.setSharedHistory() : defined by script.js, receives the latest records
//   window.firebaseAddShared(record) / window.firebaseDeleteShared(id) : defined here
import { firebaseConfig } from "./firebase-config.js";

const SDK = "https://www.gstatic.com/firebasejs/11.10.0";
const COLLECTION = "sharedTaxHistory";
const LIMIT = 200;

// Only these fields are uploaded. Must match the allowlist in firestore.rules.
// Names of payer/payee and the free-text "special" note are deliberately NOT included.
const UPLOAD_FIELDS = [
  "payerType", "payeeType", "residence", "description", "type", "amount",
  "vatRate", "paymentDate", "vat", "gross", "tax", "rate", "base", "net",
  "form", "status", "statusText", "reason", "warnings", "law",
  "billMode", "serviceAmount"
];

const statusEl = document.getElementById("firebaseStatus");
const setStatus = text => { if (statusEl) statusEl.textContent = "การจัดเก็บ: " + text; };

const explainError = error => {
  const code = error?.code || "unknown";
  const map = {
    "auth/invalid-api-key": "API Key ไม่ถูกต้อง",
    "auth/api-key-not-valid": "API Key ไม่ถูกต้องหรือถูกจำกัด — ตรวจ Google Cloud > Credentials",
    "auth/operation-not-allowed": "ยังไม่ได้เปิด Anonymous Authentication",
    "auth/unauthorized-domain": "โดเมนนี้ยังไม่ได้อยู่ใน Authorized domains",
    "auth/network-request-failed": "เชื่อมต่อไม่ได้ — ตรวจเครือข่าย / ตัวบล็อกโฆษณา",
    "permission-denied": "Firestore ปฏิเสธสิทธิ์ — ตรวจ Rules",
    "failed-precondition": "Firestore ยังไม่ได้สร้างฐานข้อมูล หรือขาด index",
    "unavailable": "เข้าถึง Firestore ไม่ได้ชั่วคราว"
  };
  return (map[code] || "เชื่อมต่อ Firebase ไม่สำเร็จ") + " (" + code + ")";
};

const isConfigured = c =>
  c && ["apiKey", "authDomain", "projectId", "appId"].every(k => typeof c[k] === "string" && c[k].trim() && !c[k].startsWith("YOUR_"));

function goLocal(message) {
  window.sharedHistoryMode = false;
  window.sharedUserId = null;
  window.firebaseAddShared = undefined;
  window.firebaseDeleteShared = undefined;
  setStatus(message);
}

async function start() {
  if (location.protocol === "file:") return goLocal("ในเครื่อง — ต้องเปิดผ่าน http(s) ไม่ใช่ file://");
  if (!isConfigured(firebaseConfig)) return goLocal("ในเครื่อง — กรุณาตั้งค่า firebase-config.js");

  setStatus("กำลังเชื่อมต่อ Firebase...");

  const [{ initializeApp }, authSdk, fs] = await Promise.all([
    import(`${SDK}/firebase-app.js`),
    import(`${SDK}/firebase-auth.js`),
    import(`${SDK}/firebase-firestore.js`)
  ]);
  const { getAuth, onAuthStateChanged, signInAnonymously } = authSdk;
  const { getFirestore, collection, doc, addDoc, deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp } = fs;

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const records = collection(db, COLLECTION);

  let unsubscribe = null;

  onAuthStateChanged(auth, user => {
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    if (!user) return goLocal("กำลังลงชื่อเข้าใช้...");

    window.sharedUserId = user.uid;

    window.firebaseAddShared = async record => {
      const data = {};
      for (const key of UPLOAD_FIELDS) if (record[key] !== undefined) data[key] = record[key];
      await addDoc(records, {
        ...data,
        ownerUid: user.uid,
        createdAt: new Date().toISOString(),
        createdOnServer: serverTimestamp()
      });
    };
    window.firebaseDeleteShared = id => deleteDoc(doc(db, COLLECTION, String(id)));

    const q = query(records, orderBy("createdAt", "desc"), limit(LIMIT));
    unsubscribe = onSnapshot(
      q,
      snapshot => {
        const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        window.sharedHistoryMode = true;
        window.setSharedHistory?.(items);
        setStatus(`Cloud Firestore — ประวัติร่วมกัน (${items.length} รายการล่าสุด)`);
      },
      error => {
        console.error("Firestore:", error);
        goLocal(explainError(error) + " — ใช้ในเครื่อง");
      }
    );
  });

  if (!auth.currentUser) await signInAnonymously(auth);
}

start().catch(error => {
  console.error("Firebase:", error);
  goLocal(explainError(error) + " — ใช้ในเครื่อง");
});
