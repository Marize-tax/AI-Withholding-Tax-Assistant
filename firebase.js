import {firebaseConfig} from "./firebase-config.js";
const status=document.getElementById("firebaseStatus");
const setStatus=t=>{if(status)status.textContent="การจัดเก็บ: "+t;};
const configured=firebaseConfig.apiKey && firebaseConfig.apiKey!=="YOUR_API_KEY" && firebaseConfig.projectId!=="YOUR_PROJECT_ID";
if(!configured){setStatus("ในเครื่อง — กรุณาตั้งค่า firebase-config.js");}
else{
 try{
  const [{initializeApp},{getAuth,signInAnonymously,onAuthStateChanged},{getFirestore,collection,doc,addDoc,deleteDoc,onSnapshot,query,orderBy,limit,serverTimestamp}] = await Promise.all([
   import("https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js"),
   import("https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js"),
   import("https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js")
  ]);
  const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
  const records=collection(db,"sharedTaxHistory");
  setStatus("กำลังลงชื่อเข้าใช้...");
  onAuthStateChanged(auth,user=>{
   if(!user){window.sharedHistoryMode=false;return;}
   window.sharedUserId=user.uid;
   // Never auto-upload older local records to the shared database.
   const q=query(records,orderBy("createdAt","desc"),limit(200));
   onSnapshot(q,snapshot=>{
    const items=snapshot.docs.map(d=>({...d.data(),id:d.id}));
    window.sharedHistoryMode=true;
    window.setSharedHistory(items);
    setStatus("Cloud Firestore — ประวัติร่วมกัน ("+items.length+" รายการล่าสุด)");
   },error=>{console.error(error);window.sharedHistoryMode=false;setStatus("อ่านข้อมูลส่วนกลางไม่สำเร็จ — ตรวจ Rules / Index");});
   window.firebaseAddShared=async record=>{
    const {id,ownerUid,createdAt,...rest}=record;
    // Avoid publishing counterparty names and free-form special notes in the shared database.
    delete rest.payerName;delete rest.payeeName;delete rest.special;
    await addDoc(records,{...rest,ownerUid:user.uid,createdAt:new Date().toISOString(),createdOnServer:serverTimestamp()});
   };
   window.firebaseDeleteShared=async id=>deleteDoc(doc(db,"sharedTaxHistory",String(id)));
  });
  await signInAnonymously(auth);
 }catch(error){console.error(error);setStatus("เชื่อมต่อ Firebase ไม่สำเร็จ — ใช้ในเครื่อง");}
}
