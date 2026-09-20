import{initializeApp}from"https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import{getFirestore,collection,getDocs,doc,getDoc}from"https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const editable=["title","en","summary","prompt","setting","system","type","themes","contentLanguage"];
try{
  const app=initializeApp(window.CINEMED_FIREBASE_CONFIG);
  const db=getFirestore(app);
  const snapshot=await getDocs(collection(db,"videoOverrides"));
  const byId=new Map((window.CINEMED_VIDEOS||[]).map(video=>[video.id,video]));
  snapshot.forEach(record=>{
    const video=byId.get(record.id);if(!video)return;
    const data=record.data();
    editable.forEach(key=>{if(Object.hasOwn(data,key))video[key]=data[key]});
  });
  const forms=await getDoc(doc(db,"siteSettings","forms"));
  if(forms.exists())window.CINEMED_FORM_URLS=forms.data();
  window.CINEMED_REFRESH?.();
}catch(error){
  console.info("CineMed-AI: Firebase overrides are not available; static catalog is being used.");
}
