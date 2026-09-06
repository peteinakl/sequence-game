// Sequence Game Core Logic

const BOARD_LAYOUT = [
  ["W",  "2S", "3S", "4S", "5S", "6S", "7S", "8S", "9S", "W"],
  ["6C", "5C", "4C", "3C", "2C", "AH", "KH", "QH", "TH", "TS"],
  ["7C", "AS", "2D", "3D", "4D", "5D", "6D", "7D", "9H", "QS"],
  ["8C", "KS", "6C", "5C", "4C", "3C", "2C", "8D", "8H", "KS"],
  ["9C", "QS", "7C", "6H", "5H", "4H", "AH", "9D", "7H", "AS"],
  ["TC", "TS", "8C", "7H", "2H", "3H", "KH", "TD", "6H", "2D"],
  ["QC", "9S", "9C", "8H", "9H", "TH", "QH", "QD", "5H", "3D"],
  ["KC", "8S", "TC", "QC", "KC", "AC", "AD", "KD", "4H", "4D"],
  ["AC", "7S", "6S", "5S", "4S", "3S", "2S", "2H", "3H", "5D"],
  ["W",  "AD", "KD", "QD", "TD", "9D", "8D", "7D", "6D", "W"]
];

const SUITS = {
  S: { name: 'Spades', symbol: '♠', color: 'black' },
  H: { name: 'Hearts', symbol: '♥', color: 'red' },
  D: { name: 'Diamonds', symbol: '♦', color: 'red' },
  C: { name: 'Clubs', symbol: '♣', color: 'black' }
};

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

function parseCard(code) {
  if (code === 'W') {
    return { code: 'W', rank: 'W', suit: 'W', name: 'Free Corner', isCorner: true };
  }
  const rank = code[0];
  const suit = code[1];
  const isJack = rank === 'J';
  // Two-eyed Jacks: Clubs and Diamonds (Wild)
  const isTwoEyed = isJack && (suit === 'C' || suit === 'D');
  // One-eyed Jacks: Spades and Hearts (Anti-wild / Remove)
  const isOneEyed = isJack && (suit === 'S' || suit === 'H');

  let rankDisplay = rank === 'T' ? '10' : rank;
  return {
    code,
    rank: rankDisplay,
    suit,
    suitName: SUITS[suit]?.name || '',
    symbol: SUITS[suit]?.symbol || '',
    color: SUITS[suit]?.color || 'black',
    name: `${rankDisplay === 'J' ? (isTwoEyed ? 'Two-Eyed Jack' : 'One-Eyed Jack') : rankDisplay} of ${SUITS[suit]?.name || ''}`,
    isJack,
    isTwoEyed,
    isOneEyed,
    isCorner: false
  };
}

function createFreshDeck() {
  const deck = [];
  const suits = ['S', 'H', 'D', 'C'];
  // Two standard 52-card decks = 104 cards
  for (let d = 0; d < 2; d++) {
    for (const s of suits) {
      for (const r of RANKS) {
        deck.push(`${r}${s}`);
      }
    }
  }
  return shuffle(deck);
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function initBoardState() {
  const board = [];
  for (let r = 0; r < 10; r++) {
    const row = [];
    for (let c = 0; c < 10; c++) {
      const code = BOARD_LAYOUT[r][c];
      const isCorner = code === 'W';
      row.push({
        r,
        c,
        cardCode: code,
        card: parseCard(code),
        isCorner,
        token: isCorner ? 'W' : null, // 'blue', 'red', or 'W'
        inSequence: isCorner // corners are wild and can participate in sequences
      });
    }
    board.push(row);
  }
  return board;
}

function getCardLocations(cardCode) {
  const locations = [];
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if (BOARD_LAYOUT[r][c] === cardCode) {
        locations.push({ r, c });
      }
    }
  }
  return locations;
}

function isDeadCard(cardCode, boardState) {
  const parsed = parseCard(cardCode);
  if (parsed.isJack || parsed.isCorner) return false;
  const locs = getCardLocations(cardCode);
  if (locs.length === 0) return false;
  return locs.every(loc => boardState[loc.r][loc.c].token !== null);
}

function getValidMovesForCard(cardCode, boardState, playerColor) {
  const parsed = parseCard(cardCode);
  const opponentColor = playerColor === 'blue' ? 'red' : 'blue';
  const moves = [];

  if (parsed.isTwoEyed) {
    // Two-eyed Jack: place token on ANY unoccupied square (except corners)
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const cell = boardState[r][c];
        if (!cell.isCorner && cell.token === null) {
          moves.push({ r, c, action: 'place', cardCode });
        }
      }
    }
  } else if (parsed.isOneEyed) {
    // One-eyed Jack: remove opponent's token from ANY square that is NOT already in a sequence
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const cell = boardState[r][c];
        if (!cell.isCorner && cell.token === opponentColor && !cell.inSequence) {
          moves.push({ r, c, action: 'remove', cardCode });
        }
      }
    }
  } else {
    // Standard card: place on matching square if empty
    const locs = getCardLocations(cardCode);
    for (const loc of locs) {
      if (boardState[loc.r][loc.c].token === null) {
        moves.push({ r: loc.r, c: loc.c, action: 'place', cardCode });
      }
    }
  }

  return moves;
}

// Find sequences of 5
function detectSequences(boardState, color) {
  const directions = [
    { dr: 0, dc: 1, name: 'horizontal' },
    { dr: 1, dc: 0, name: 'vertical' },
    { dr: 1, dc: 1, name: 'diag-down' },
    { dr: -1, dc: 1, name: 'diag-up' }
  ];

  const sequences = [];
  const visitedKeys = new Set();

  function cellMatches(r, c) {
    if (r < 0 || r >= 10 || c < 0 || c >= 10) return false;
    const t = boardState[r][c].token;
    return t === color || t === 'W';
  }

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      for (const dir of directions) {
        let isFive = true;
        const coords = [];
        for (let step = 0; step < 5; step++) {
          const nr = r + dir.dr * step;
          const nc = c + dir.dc * step;
          if (!cellMatches(nr, nc)) {
            isFive = false;
            break;
          }
          coords.push({ r: nr, c: nc });
        }

        if (isFive) {
          // At least 4 must be actual player tokens (can't have 5 wild corners)
          const realTokens = coords.filter(p => boardState[p.r][p.c].token === color);
          if (realTokens.length >= 4) {
            const key = coords.map(p => `${p.r},${p.c}`).sort().join(';');
            if (!visitedKeys.has(key)) {
              visitedKeys.add(key);
              sequences.push(coords);
            }
          }
        }
      }
    }
  }

  return sequences;
}

// Count non-overlapping sequences (sharing at most 1 common space per standard sequence rules)
function getValidSequenceSets(detectedSequences) {
  if (detectedSequences.length <= 1) return detectedSequences;

  const chosen = [];
  for (const seq of detectedSequences) {
    let canAdd = true;
    for (const existing of chosen) {
      // count shared cells (excluding wild corners which are always shared)
      const shared = seq.filter(p1 => 
        !BOARD_LAYOUT[p1.r][p1.c].includes('W') &&
        existing.some(p2 => p2.r === p1.r && p2.c === p1.c)
      );
      if (shared.length > 1) {
        canAdd = false;
        break;
      }
    }
    if (canAdd) {
      chosen.push(seq);
    }
  }
  return chosen;
}

// Update `inSequence` flags on board
function updateBoardSequenceFlags(boardState) {
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if (!boardState[r][c].isCorner) {
        boardState[r][c].inSequence = false;
        boardState[r][c].sequenceColor = null;
      }
    }
  }

  for (const color of ['blue', 'red']) {
    const seqs = getValidSequenceSets(detectSequences(boardState, color));
    for (const seq of seqs) {
      for (const pt of seq) {
        boardState[pt.r][pt.c].inSequence = true;
        boardState[pt.r][pt.c].sequenceColor = color;
      }
    }
  }
}

// AI evaluation function
function getBestAIMove(hand, boardState, aiColor = 'red') {
  const opponentColor = aiColor === 'red' ? 'blue' : 'red';

  const playableCards = [];
  const deadCards = [];

  hand.forEach((cardCode, index) => {
    if (!cardCode) return;
    if (isDeadCard(cardCode, boardState)) {
      deadCards.push({ index, cardCode });
    } else {
      const moves = getValidMovesForCard(cardCode, boardState, aiColor);
      if (moves.length > 0) {
        playableCards.push({ index, cardCode, moves });
      }
    }
  });

  // If AI holds any dead card, swap it for a fresh one
  if (deadCards.length > 0) {
    return { type: 'swap', index: deadCards[0].index, cardCode: deadCards[0].cardCode };
  }

  if (playableCards.length === 0) {
    return null;
  }

  let bestMove = null;
  let highestScore = -Infinity;

  // 1. Check for immediate winning move for AI (completes sequence)
  for (const item of playableCards) {
    for (const move of item.moves) {
      if (move.action === 'place') {
        const testBoard = simulatePlacement(boardState, move.r, move.c, aiColor);
        const seqs = getValidSequenceSets(detectSequences(testBoard, aiColor));
        const currentSeqs = getValidSequenceSets(detectSequences(boardState, aiColor));
        if (seqs.length > currentSeqs.length) {
          return { type: 'play', index: item.index, cardCode: item.cardCode, move, score: 99999 };
        }
      }
    }
  }

  // 2. Defensive block: if opponent is 1 token away from sequence
  const oppThreatSpots = [];
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if (!boardState[r][c].isCorner && boardState[r][c].token === null) {
        const testBoard = simulatePlacement(boardState, r, c, opponentColor);
        const oppSeqs = getValidSequenceSets(detectSequences(testBoard, opponentColor));
        const currentOppSeqs = getValidSequenceSets(detectSequences(boardState, opponentColor));
        if (oppSeqs.length > currentOppSeqs.length) {
          oppThreatSpots.push({ r, c });
        }
      }
    }
  }

  if (oppThreatSpots.length > 0) {
    // Try to block directly
    for (const item of playableCards) {
      for (const move of item.moves) {
        if (move.action === 'place' && oppThreatSpots.some(s => s.r === move.r && s.c === move.c)) {
          return { type: 'play', index: item.index, cardCode: item.cardCode, move, score: 50000 };
        }
      }
    }

    // Try to break player's 4-in-a-row using One-Eyed Jack
    for (const item of playableCards) {
      for (const move of item.moves) {
        if (move.action === 'remove') {
          const testBoard = simulateRemoval(boardState, move.r, move.c);
          let stillThreat = false;
          for (const spot of oppThreatSpots) {
            const afterTest = simulatePlacement(testBoard, spot.r, spot.c, opponentColor);
            if (getValidSequenceSets(detectSequences(afterTest, opponentColor)).length > 
                getValidSequenceSets(detectSequences(testBoard, opponentColor)).length) {
              stillThreat = true;
              break;
            }
          }
          if (!stillThreat) {
            return { type: 'play', index: item.index, cardCode: item.cardCode, move, score: 45000 };
          }
        }
      }
    }
  }

  // 3. General heuristic evaluation for all available moves
  for (const item of playableCards) {
    for (const move of item.moves) {
      let score = 0;
      if (move.action === 'place') {
        const testBoard = simulatePlacement(boardState, move.r, move.c, aiColor);
        score += evaluatePosition(testBoard, move.r, move.c, aiColor, opponentColor);
        const parsed = parseCard(item.cardCode);
        if (parsed.isTwoEyed) {
          score -= 50; // preserve Two-Eyed Jack unless move is genuinely strong
        }
      } else if (move.action === 'remove') {
        score += evaluateRemovalValue(boardState, move.r, move.c, opponentColor);
      }

      score += Math.random() * 2;

      if (score > highestScore) {
        highestScore = score;
        bestMove = { type: 'play', index: item.index, cardCode: item.cardCode, move, score };
      }
    }
  }

  return bestMove;
}

function simulatePlacement(boardState, r, c, color) {
  return boardState.map(row => row.map(cell => {
    if (cell.r === r && cell.c === c) {
      return { ...cell, token: color };
    }
    return cell;
  }));
}

function simulateRemoval(boardState, r, c) {
  return boardState.map(row => row.map(cell => {
    if (cell.r === r && cell.c === c) {
      return { ...cell, token: null };
    }
    return cell;
  }));
}

function evaluatePosition(boardState, r, c, myColor, oppColor) {
  let value = 0;
  const directions = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 1, dc: 1 },
    { dr: -1, dc: 1 }
  ];

  const distToCorner = Math.min(
    Math.hypot(r - 0, c - 0),
    Math.hypot(r - 0, c - 9),
    Math.hypot(r - 9, c - 0),
    Math.hypot(r - 9, c - 9)
  );
  if (distToCorner <= 3) {
    value += (4 - distToCorner) * 12;
  }

  const distToCenter = Math.hypot(r - 4.5, c - 4.5);
  value += Math.max(0, 10 - distToCenter * 2);

  for (const { dr, dc } of directions) {
    for (let offset = -4; offset <= 0; offset++) {
      let myTokens = 0;
      let oppTokens = 0;
      let emptyCount = 0;
      let hasWildCorner = false;
      let validWindow = true;

      for (let i = 0; i < 5; i++) {
        const nr = r + (offset + i) * dr;
        const nc = c + (offset + i) * dc;
        if (nr < 0 || nr >= 10 || nc < 0 || nc >= 10) {
          validWindow = false;
          break;
        }
        const cell = boardState[nr][nc];
        if (cell.isCorner) {
          hasWildCorner = true;
          myTokens++;
        } else if (cell.token === myColor) {
          myTokens++;
        } else if (cell.token === oppColor) {
          oppTokens++;
        } else {
          emptyCount++;
        }
      }

      if (validWindow) {
        if (oppTokens === 0) {
          if (myTokens === 4) value += 450;
          else if (myTokens === 3) value += 120;
          else if (myTokens === 2) value += 30;
          else value += 5;
          if (hasWildCorner) value += 25;
        } else if (myTokens === 1 && oppTokens >= 2) {
          if (oppTokens === 3) value += 200;
          else if (oppTokens === 2) value += 60;
        }
      }
    }
  }

  return value;
}

function evaluateRemovalValue(boardState, r, c, oppColor) {
  let value = 40;
  const directions = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 1, dc: 1 },
    { dr: -1, dc: 1 }
  ];

  for (const { dr, dc } of directions) {
    for (let offset = -4; offset <= 0; offset++) {
      let oppTokens = 0;
      let blocked = false;
      let valid = true;

      for (let i = 0; i < 5; i++) {
        const nr = r + (offset + i) * dr;
        const nc = c + (offset + i) * dc;
        if (nr < 0 || nr >= 10 || nc < 0 || nc >= 10) {
          valid = false;
          break;
        }
        const cell = boardState[nr][nc];
        if (cell.isCorner || cell.token === oppColor) {
          oppTokens++;
        } else if (cell.token !== null) {
          blocked = true;
          break;
        }
      }

      if (valid && !blocked) {
        if (oppTokens === 4) value += 500;
        else if (oppTokens === 3) value += 150;
        else if (oppTokens === 2) value += 40;
      }
    }
  }

  return value;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
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
  };
}
