/*
 * Diri. Playroom Date — Firebase client bootstrap
 * Firebase web configuration is public client configuration, not a server secret.
 * Do not add Admin SDK credentials or service-account keys to this repository.
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js';
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  remove,
  onValue,
  runTransaction,
  onDisconnect,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-database.js';

export const firebaseConfig = {
  apiKey: 'AIzaSyBC-hBpMcJCN1BsIe6oo2LZ72QKh2YzIU4',
  authDomain: 'diri-playroom-date.firebaseapp.com',
  databaseURL: 'https://diri-playroom-date-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'diri-playroom-date',
  storageBucket: 'diri-playroom-date.firebasestorage.app',
  messagingSenderId: '667695982695',
  appId: '1:667695982695:web:acd2dae896fc75049eccc2'
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(value =>
  typeof value === 'string' && value.length > 0 && !/^(PASTE_|REPLACE_)/.test(value)
);

let firebaseApp = null;
export let auth = null;
export let db = null;
if (isFirebaseConfigured) {
  firebaseApp = initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
  db = getDatabase(firebaseApp);
}

export {
  ref, get, set, update, remove, onValue,
  runTransaction, onDisconnect, serverTimestamp,
  onAuthStateChanged, signInAnonymously,
  setPersistence, browserLocalPersistence
};

let authPromise;

/** Keep the anonymous UID stable across refreshes in the same browser profile. */
export async function ensureSignedIn() {
  if (!isFirebaseConfigured || !auth) throw new Error('FIREBASE_NOT_CONFIGURED: Isi konfigurasi Web App project baru pada js/firebase.js.');
  await setPersistence(auth, browserLocalPersistence);
  if (auth.currentUser) return auth.currentUser;
  if (!authPromise) {
    authPromise = new Promise((resolve, reject) => {
      let unsubscribe = () => {};
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe();
        try {
          if (user) {
            resolve(user);
            return;
          }
          const credential = await signInAnonymously(auth);
          resolve(credential.user);
        } catch (error) {
          reject(error);
        }
      }, reject);
    }).finally(() => {
      authPromise = null;
    });
  }
  return authPromise;
}
