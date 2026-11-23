import { ROOM_STORAGE_KEY, DISPLAY_NAME_STORAGE_KEY } from '../constants.js';

export function saveRoomCode(code) {
  localStorage.setItem(ROOM_STORAGE_KEY, code);
}

export function loadRoomCode() {
  return localStorage.getItem(ROOM_STORAGE_KEY) || '';
}

export function clearRoomCode() {
  localStorage.removeItem(ROOM_STORAGE_KEY);
}

export function saveDisplayName(name) {
  localStorage.setItem(DISPLAY_NAME_STORAGE_KEY, name);
}

export function loadDisplayName() {
  return localStorage.getItem(DISPLAY_NAME_STORAGE_KEY) || '';
}
