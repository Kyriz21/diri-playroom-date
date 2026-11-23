/** Pure game rules shared with the test suite. */
const TTT_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

export function isTicTacToeWin(board, symbol) {
  if (!Array.isArray(board) || board.length !== 9 || !symbol) return false;
  return TTT_LINES.some(line => line.every(index => board[index] === symbol));
}


/** Returns the lowest available board index for a Connect Four column, or -1. */
export function getConnectFourDropIndex(board, column) {
  if (!Array.isArray(board) || board.length !== 42 || !Number.isInteger(column) || column < 0 || column > 6) return -1;
  for (let row = 5; row >= 0; row -= 1) {
    const index = row * 7 + column;
    if (!board[index]) return index;
  }
  return -1;
}

/** Standard Memory rule: a successful pair keeps the turn; a miss passes it. */
export function nextMemoryTurn(currentUid, otherUid, matched) {
  return matched ? currentUid : otherUid;
}

/** Returns the four winning board indices for a 7-column × 6-row Connect Four board. */
export function getConnectFourWin(board) {
  if (!Array.isArray(board) || board.length !== 42) return null;
  const rows = 6;
  const columns = 7;
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const token = board[row * columns + column];
      if (!token) continue;
      for (const [dr, dc] of directions) {
        const cells = [];
        for (let offset = 0; offset < 4; offset += 1) {
          const r = row + dr * offset;
          const c = column + dc * offset;
          if (r < 0 || r >= rows || c < 0 || c >= columns || board[r * columns + c] !== token) break;
          cells.push(r * columns + c);
        }
        if (cells.length === 4) return { uid: token, cells };
      }
    }
  }
  return null;
}

export function normalizeGuess(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isExactAnswerGuess(value, acceptedAnswers = []) {
  const normalized = normalizeGuess(value);
  if (!normalized) return false;
  return acceptedAnswers.some(answer => normalizeGuess(answer) === normalized);
}

/** Checks forbidden words as whole normalized word/phrase sequences, including punctuation boundaries. */
export function findForbiddenWord(clue, forbiddenWords = []) {
  const normalizedClue = ` ${normalizeGuess(clue)} `;
  return forbiddenWords.find(word => {
    const normalizedWord = normalizeGuess(word);
    return normalizedWord && normalizedClue.includes(` ${normalizedWord} `);
  }) || null;
}

/** Returns the first empty one of the four Photobooth slots, or -1 when complete. */
export function nextPhotoSlot(photos, count = 4) {
  for (let index = 0; index < count; index += 1) {
    if (!photos?.[index]) return index;
  }
  return -1;
}

/** Array.every skips sparse holes, so check every required index explicitly. */
export function hasCompletePhotoSet(photos, count = 4) {
  return Array.isArray(photos) && photos.length >= count && Array.from({ length: count }, (_, index) => Boolean(photos[index])).every(Boolean);
}

export function hasMatchingImageDeck(hostHashes, guestHashes, requiredCount) {
  return Array.isArray(hostHashes)
    && Array.isArray(guestHashes)
    && hostHashes.length >= requiredCount
    && guestHashes.length >= requiredCount
    && hostHashes.slice(0, requiredCount).every((hash, index) => hash === guestHashes[index]);
}

export function calculateCompatibility(matches, total) {
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.round((Math.max(0, Math.min(matches, total)) / total) * 100);
}

export function nextMatchStreak(current, matched) {
  return matched ? Math.max(0, current) + 1 : 0;
}
