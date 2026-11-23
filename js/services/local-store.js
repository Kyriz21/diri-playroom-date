const DB_NAME = 'diri-ldr-playroom-local-v1';
const DB_VERSION = 1;
let dbPromise;
function openDB(){
  if(dbPromise)return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('collections'))db.createObjectStore('collections',{keyPath:'key'});if(!db.objectStoreNames.contains('media'))db.createObjectStore('media',{keyPath:'key'});};
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('IndexedDB tidak dapat dibuka.'));
  });return dbPromise;
}
async function transact(store,mode,work){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(store,mode);const os=tx.objectStore(store);let result;try{result=work(os);}catch(e){reject(e);return;}tx.oncomplete=()=>resolve(result?.result??result);tx.onerror=()=>reject(tx.error||new Error('Penyimpanan lokal gagal.'));tx.onabort=()=>reject(tx.error||new Error('Transaksi penyimpanan dibatalkan.'));});}
export async function getLocalCollection(name){const db=await openDB();return new Promise((resolve,reject)=>{const r=db.transaction('collections','readonly').objectStore('collections').get(name);r.onsuccess=()=>resolve(r.result?.items||[]);r.onerror=()=>reject(r.error);});}
export async function saveLocalItem(name,item){const items=await getLocalCollection(name);items.push(item);const db=await openDB();return new Promise((resolve,reject)=>{const r=db.transaction('collections','readwrite').objectStore('collections').put({key:name,items});r.onsuccess=()=>resolve(true);r.onerror=()=>reject(r.error);});}
export async function putLocalMedia(collection,id,blob){const db=await openDB();const key=`${collection}:${id}`;return new Promise((resolve,reject)=>{const r=db.transaction('media','readwrite').objectStore('media').put({key,collection,id,blob,updatedAt:Date.now()});r.onsuccess=()=>resolve(key);r.onerror=()=>reject(r.error);});}
export async function getLocalMedia(collection,id){const db=await openDB();return new Promise((resolve,reject)=>{const r=db.transaction('media','readonly').objectStore('media').get(`${collection}:${id}`);r.onsuccess=()=>resolve(r.result?.blob||null);r.onerror=()=>reject(r.error);});}
export async function listLocalMedia(collection){const db=await openDB();return new Promise((resolve,reject)=>{const r=db.transaction('media','readonly').objectStore('media').getAll();r.onsuccess=()=>resolve((r.result||[]).filter(x=>x.collection===collection));r.onerror=()=>reject(r.error);});}
export async function deleteLocalMedia(collection,id){const db=await openDB();return new Promise((resolve,reject)=>{const r=db.transaction('media','readwrite').objectStore('media').delete(`${collection}:${id}`);r.onsuccess=()=>resolve(true);r.onerror=()=>reject(r.error);});}
export async function setLocalValue(key,value){const db=await openDB();return new Promise((resolve,reject)=>{const r=db.transaction('collections','readwrite').objectStore('collections').put({key:`value:${key}`,items:value});r.onsuccess=()=>resolve(true);r.onerror=()=>reject(r.error);});}
export async function getLocalValue(key){const db=await openDB();return new Promise((resolve,reject)=>{const r=db.transaction('collections','readonly').objectStore('collections').get(`value:${key}`);r.onsuccess=()=>resolve(r.result?.items??null);r.onerror=()=>reject(r.error);});}

/** Best-effort expiry for temporary media only; never touches Private Gallery collections. */
export async function cleanupExpiredMedia(collection, maxAgeMs, now = Date.now()) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('media', 'readwrite');
    const store = tx.objectStore('media');
    const request = store.getAll();
    let removed = 0;
    request.onsuccess = () => {
      for (const item of request.result || []) {
        if (item.collection === collection && Number(item.updatedAt || 0) > 0 && now - Number(item.updatedAt) >= maxAgeMs) {
          store.delete(item.key);
          removed += 1;
        }
      }
    };
    request.onerror = () => reject(request.error || new Error('Local media cleanup failed.'));
    tx.oncomplete = () => resolve(removed);
    tx.onerror = () => reject(tx.error || new Error('Local media cleanup failed.'));
    tx.onabort = () => reject(tx.error || new Error('Local media cleanup aborted.'));
  });
}
