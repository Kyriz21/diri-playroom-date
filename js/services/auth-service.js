import { ensureSignedIn } from '../firebase.js';

export async function getCurrentPlayer() {
  const user = await ensureSignedIn();
  if (!user?.uid) throw new Error('Autentikasi anonim gagal. Muat ulang halaman dan coba lagi.');
  return { uid: user.uid, isAnonymous: user.isAnonymous === true };
}
