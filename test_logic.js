const assert = require('assert');
const {
  BOARD_LAYOUT,
  SUITS,
  RANKS,
  parseCard,
  createFreshDeck,
  initBoardState,
  getCardLocations,
  isDeadCard,
  getValidMovesForCard,
  detectSequences,
  getValidSequenceSets,
  updateBoardSequenceFlags,
  getBestAIMove
} = require('./logic');

console.log("=== Running Sequence Logic Tests ===");

// 1. Board Dimension & Corners
assert.strictEqual(BOARD_LAYOUT.length, 10, "Board should have 10 rows");
BOARD_LAYOUT.forEach(row => assert.strictEqual(row.length, 10, "Each row should have 10 cols"));
assert.strictEqual(BOARD_LAYOUT[0][0], "W");
assert.strictEqual(BOARD_LAYOUT[0][9], "W");
assert.strictEqual(BOARD_LAYOUT[9][0], "W");
assert.strictEqual(BOARD_LAYOUT[9][9], "W");
console.log("✓ Board dimensions and corners verified");

// 2. Card Frequency on Board
const cardCounts = {};
for (let r = 0; r < 10; r++) {
  for (let c = 0; c < 10; c++) {
    const code = BOARD_LAYOUT[r][c];
    if (code !== 'W') {
      cardCounts[code] = (cardCounts[code] || 0) + 1;
    }
  }
}
const nonJackRanks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'Q', 'K', 'A'];
const suits = ['S', 'H', 'D', 'C'];
for (const s of suits) {
  for (const r of nonJackRanks) {
    const code = `${r}${s}`;
    assert.strictEqual(cardCounts[code], 2, `Card ${code} should appear exactly twice on board, but found ${cardCounts[code]}`);
  }
}
assert.strictEqual(Object.keys(cardCounts).length, 48, "Exactly 48 distinct cards on board");
console.log("✓ All 48 non-Jack cards appear exactly 2 times (total 96 + 4 corners = 100)");

// 3. Deck Verification
const deck = createFreshDeck();
assert.strictEqual(deck.length, 104, "Deck should have 104 cards");
const jackCounts = { twoEyed: 0, oneEyed: 0 };
deck.forEach(c => {
  const p = parseCard(c);
  if (p.isTwoEyed) jackCounts.twoEyed++;
  if (p.isOneEyed) jackCounts.oneEyed++;
});
assert.strictEqual(jackCounts.twoEyed, 4, "Deck should have 4 two-eyed Jacks (2x JC, 2x JD)");
assert.strictEqual(jackCounts.oneEyed, 4, "Deck should have 4 one-eyed Jacks (2x JS, 2x JH)");
console.log("✓ 104-card deck verified (including 4 Two-Eyed Jacks and 4 One-Eyed Jacks)");

// 4. Sequence Detection
// Test A: Horizontal sequence
let board = initBoardState();
for (let c = 1; c <= 5; c++) {
  board[1][c].token = 'blue';
}
let seqs = detectSequences(board, 'blue');
assert.strictEqual(seqs.length, 1, "Should detect 1 horizontal sequence of 5");
console.log("✓ Horizontal sequence detected");

// Test B: Corner-assisted sequence (corner (0,0) + 4 tokens at (0,1)..(0,4))
board = initBoardState();
for (let c = 1; c <= 4; c++) {
  board[0][c].token = 'red';
}
seqs = detectSequences(board, 'red');
assert.strictEqual(seqs.length, 1, "Should detect 1 sequence using wild corner");
console.log("✓ Corner-assisted sequence detected (4 tokens + corner)");

// Test C: Diagonal sequence
board = initBoardState();
for (let i = 2; i <= 6; i++) {
  board[i][i].token = 'blue';
}
seqs = detectSequences(board, 'blue');
assert.strictEqual(seqs.length, 1, "Should detect 1 diagonal sequence");
console.log("✓ Diagonal sequence detected");

// 5. One-Eyed Jack Sequence Protection
updateBoardSequenceFlags(board);
assert.strictEqual(board[3][3].inSequence, true, "Tokens in completed sequence must be marked inSequence");
// Opponent (red) has One-Eyed Jack 'JS'
const redMoves = getValidMovesForCard('JS', board, 'red');
// Cannot remove protected tokens
const canRemoveProtected = redMoves.some(m => m.r === 3 && m.c === 3);
assert.strictEqual(canRemoveProtected, false, "One-Eyed Jack cannot remove token from completed sequence");
console.log("✓ One-Eyed Jack protected from removing locked sequence tokens");

// 6. AI Immediate Block Test
board = initBoardState();
// Player (blue) has 4 tokens in row 4, cols 1..4, col 5 is open
board[4][1].token = 'blue';
board[4][2].token = 'blue';
board[4][3].token = 'blue';
board[4][4].token = 'blue';
// Spot (4, 5) card is BOARD_LAYOUT[4][5]
const threatCard = BOARD_LAYOUT[4][5];
// Give AI the threat card in hand
const aiHand = [threatCard, '2S', '3S', '4S', '5S', '6S', '7S'];
const aiMove = getBestAIMove(aiHand, board, 'red');
assert.strictEqual(aiMove.type, 'play');
assert.strictEqual(aiMove.move.r, 4);
assert.strictEqual(aiMove.move.c, 5);
console.log(`✓ AI successfully identified and blocked player 4-in-a-row at (4, 5) using ${threatCard}`);

console.log("\nALL LOGIC TESTS PASSED SUCCESSFULLY! 🎉");
