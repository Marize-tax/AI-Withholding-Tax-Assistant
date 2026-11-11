import {firebaseConfig} from "./firebase-config.js";
const status=document.getElementById("firebaseStatus");
const setStatus=t=>{status.textContent="การจัดเก็บ: "+t;};
if(firebaseConfig.apiKey==="YOUR_API_KEY"||firebaseConfig.projectId==="YOUR_PROJECT_ID") {
 setStatus("LocalStorage (ยังไม่ได้ตั้งค่า Firebase)");
} else {
 try {
  const [{initializeApp},{getAuth,signInAnonymously,onAuthStateChanged},{getFirestore,doc,setDoc,getDoc}] = await Promise.all([
   import("https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js"),
   import("https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js"),
   import("https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js")
  ]);
  const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
  setStatus("กำลังเชื่อมต่อ Firebase...");
  onAuthStateChanged(auth,async user=>{
   if(!user)return;
   const ref=doc(db,"users",user.uid,"data","history");
   try{
    const snapshot=await getDoc(ref);
    const local=JSON.parse(localStorage.getItem("aiWhtHistoryV1")||"[]");
    if(snapshot.exists()) {
     const cloud=snapshot.data().items||[];
     const combined=new Map([...cloud,...local].map(item=>[String(item.id),item]));
     const merged=[...combined.values()].sort((a,b)=>String(b.createdAt||"").localeCompare(String(a.createdAt||"")));
     localStorage.setItem("aiWhtHistoryV1",JSON.stringify(merged));
     if(merged.length!==cloud.length)await setDoc(ref,{items:merged,updatedAt:new Date().toISOString()});
    } else if(local.length)await setDoc(ref,{items:local,updatedAt:new Date().toISOString()});
    window.refreshTaxViews?.();setStatus("เชื่อมต่อ Cloud Firestore แล้ว (ผู้ใช้ไม่ระบุตัวตน)");
    window.firebaseHistorySync=async list=>{try{await setDoc(ref,{items:list,updatedAt:new Date().toISOString()});setStatus("บันทึกบน Cloud Firestore แล้ว");}catch(e){console.error(e);setStatus("บันทึกในเครื่องแล้ว แต่ส่งขึ้น Firebase ไม่สำเร็จ");}};
   }catch(e){console.error(e);setStatus("เชื่อม Firebase ได้ แต่เข้าถึง Firestore ไม่สำเร็จ");}
  });
  await signInAnonymously(auth);
 }catch(e){console.error(e);setStatus("Firebase เชื่อมต่อไม่สำเร็จ — ใช้ LocalStorage");}
}
