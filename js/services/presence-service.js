import { db, ref, onValue, onDisconnect, set, serverTimestamp } from '../firebase.js';

/**
 * Registers room presence for the current member. The server-side onDisconnect
 * write marks the member offline if their connection disappears unexpectedly.
 */
export function attachPresence(roomCode, role) {
  const presenceRef = ref(db, `rooms/${roomCode}/presence/${role}`);
  const connectionRef = ref(db, '.info/connected');
  let disposed = false;
  let settingUp = false;
  const unsubscribe = onValue(connectionRef, async (snapshot) => {
    if (snapshot.val() !== true || disposed || settingUp) return;
    settingUp = true;
    try {
      const disconnectOperation = onDisconnect(presenceRef);
      await disconnectOperation.set({
        connected: false,
        lastChangedAt: serverTimestamp()
      });
      if (disposed) {
        await disconnectOperation.cancel();
        return;
      }
      await set(presenceRef, {
        connected: true,
        lastChangedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Presence setup failed:', error);
    } finally {
      settingUp = false;
    }
  });
  return async () => {
    disposed = true;
    unsubscribe();
    try {
      await onDisconnect(presenceRef).cancel();
    } catch (error) {
      // A room may already have been deleted or the guest slot released.
      console.debug('Presence cleanup skipped:', error?.code ?? error);
    }
  };
}
