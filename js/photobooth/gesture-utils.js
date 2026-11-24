/** Normalize a rotation angle to the inclusive 0–359 degree range. */
export function normalizeElementRotation(value) {
  const number = Number(value);
  return ((Number.isFinite(number) ? number : 0) % 360 + 360) % 360;
}

/** Return the shortest signed angular change from start to current (-180..180]. */
export function signedAngleDelta(current, start) {
  return ((Number(current) - Number(start) + 540) % 360) - 180;
}
