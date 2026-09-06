// Sequence Game Application Controller

// Audio Engine (Synthesized Web Audio API)
const SoundEngine = (() => {
  let audioCtx = null;
  let muted = false;

  function initCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, type, duration, startTime = 0, gainVal = 0.15) {
    if (muted) return;
    initCtx();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startTime);
    gain.gain.setValueAtTime(gainVal, audioCtx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + startTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime + startTime);
    osc.stop(audioCtx.currentTime + startTime + duration);
  }

  return {
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    chipPlace() {
      initCtx();
      playTone(520, 'sine', 0.08, 0, 0.2);
      playTone(340, 'triangle', 0.12, 0.02, 0.15);
    },
    cardDraw() {
      initCtx();
      playTone(300, 'sine', 0.09, 0, 0.12);
      playTone(460, 'sine', 0.1, 0.05, 0.12);
    },
    jackAction() {
      initCtx();
      playTone(220, 'sawtooth', 0.15, 0, 0.12);
      playTone(440, 'sine', 0.18, 0.08, 0.15);
    },
    sequenceFormed() {
      initCtx();
      playTone(523.25, 'sine', 0.25, 0, 0.2);     // C5
      playTone(659.25, 'sine', 0.25, 0.12, 0.2);  // E5
      playTone(783.99, 'sine', 0.4, 0.24, 0.25);  // G5
    },
    victory() {
      initCtx();
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((n, i) => {
        playTone(n, 'triangle', 0.35, i * 0.12, 0.2);
      });
      playTone(1318.51, 'sine', 0.6, 0.48, 0.25);
    }
  };
})();

// Game State
class SequenceGame {
  constructor() {
    this.boardState = initBoardState();
    this.deck = createFreshDeck();
    this.discardPile = [];
    this.playerHand = [];
    this.aiHand = [];
    this.currentTurn = 'player'; // 'player' | 'awaiting_draw' | 'ai'
    this.selectedCardIndex = null;
    this.targetSequences = 1; // 1 for quick demo, 2 for standard
    this.drawMode = 'auto'; // 'auto' | 'manual'
    this.lastPlayerDiscard = null;
    this.lastAiDiscard = null;
    this.lastDrawnSlot = null;
    this.pendingDrawSlot = null;
    this.playerSequences = [];
    this.aiSequences = [];
    this.isGameOver = false;
    this.isAiThinking = false;
    
    this.dealInitialHands();
  }

  dealInitialHands() {
    for (let i = 0; i < 7; i++) {
      this.playerHand.push(this.drawCard());
      this.aiHand.push(this.drawCard());
    }
  }

  drawCard() {
    if (this.deck.length === 0) {
      if (this.discardPile.length === 0) return null;
      this.deck = shuffle([...this.discardPile]);
      this.discardPile = [];
      this.log("Reshuffled discard pile back into draw deck.", "system");
    }
    return this.deck.pop();
  }

  discardCard(cardCode) {
    this.discardPile.push(cardCode);
  }

  toggleDrawMode() {
    this.drawMode = this.drawMode === 'auto' ? 'manual' : 'auto';
    this.log(`Draw mode switched to: ${this.drawMode === 'auto' ? 'Auto-Draw' : 'Manual (Click Deck to Draw)'}.`, 'system');
    this.render();
  }

  swapDeadCard(player, cardIndex) {
    if (this.isGameOver || this.currentTurn === 'awaiting_draw') return;
    const hand = player === 'player' ? this.playerHand : this.aiHand;
    const cardCode = hand[cardIndex];
    if (!cardCode || !isDeadCard(cardCode, this.boardState)) return;

    this.discardCard(cardCode);
    if (player === 'player') {
      this.lastPlayerDiscard = cardCode;
    } else {
      this.lastAiDiscard = cardCode;
    }

    const newCard = this.drawCard();
    hand[cardIndex] = newCard;
    if (player === 'player') {
      this.lastDrawnSlot = cardIndex;
    }
    SoundEngine.cardDraw();

    this.log(`${player === 'player' ? 'You' : 'Machine'} discarded dead card ${parseCard(cardCode).name} and drew ${parseCard(newCard).name}.`, player);
    if (player === 'player' && this.selectedCardIndex === cardIndex) {
      this.selectedCardIndex = null;
    }
    this.render();
  }

  selectPlayerCard(index) {
    if (this.currentTurn !== 'player' || this.isGameOver || this.isAiThinking) return;
    if (this.selectedCardIndex === index) {
      this.selectedCardIndex = null;
    } else {
      this.selectedCardIndex = index;
    }
    this.render();
  }

  handleCellClick(r, c) {
    if (this.currentTurn !== 'player' || this.isGameOver || this.isAiThinking) return;
    if (this.selectedCardIndex === null) return;

    const cardCode = this.playerHand[this.selectedCardIndex];
    if (!cardCode) return;

    const validMoves = getValidMovesForCard(cardCode, this.boardState, 'blue');
    const move = validMoves.find(m => m.r === r && m.c === c);

    if (!move) return;

    this.executeMove('player', this.selectedCardIndex, move);
  }

  executeMove(player, cardIndex, move) {
    const hand = player === 'player' ? this.playerHand : this.aiHand;
    const color = player === 'player' ? 'blue' : 'red';
    const oppColor = player === 'player' ? 'red' : 'blue';
    const cardCode = hand[cardIndex];
    const parsed = parseCard(cardCode);

    // 1. Apply board change
    if (move.action === 'place') {
      this.boardState[move.r][move.c].token = color;
      if (parsed.isTwoEyed) {
        SoundEngine.jackAction();
        this.log(`${player === 'player' ? 'You' : 'Machine'} played Two-Eyed Jack (${parsed.name}) at (${move.r}, ${move.c})!`, 'jack');
      } else {
        SoundEngine.chipPlace();
        this.log(`${player === 'player' ? 'You' : 'Machine'} played ${parsed.name} and placed chip at (${move.r}, ${move.c}).`, player);
      }
    } else if (move.action === 'remove') {
      this.boardState[move.r][move.c].token = null;
      SoundEngine.jackAction();
      this.log(`${player === 'player' ? 'You' : 'Machine'} played One-Eyed Jack (${parsed.name}) to REMOVE ${oppColor} chip at (${move.r}, ${move.c})!`, 'jack');
    }

    // 2. Discard Card
    this.discardCard(cardCode);
    if (player === 'player') {
      this.lastPlayerDiscard = cardCode;
    } else {
      this.lastAiDiscard = cardCode;
    }

    // 3. Sequence & Win Checks
    updateBoardSequenceFlags(this.boardState);
    const prevCount = player === 'player' ? this.playerSequences.length : this.aiSequences.length;
    const currentSeqs = getValidSequenceSets(detectSequences(this.boardState, color));

    if (player === 'player') {
      this.playerSequences = currentSeqs;
    } else {
      this.aiSequences = currentSeqs;
    }

    if (currentSeqs.length > prevCount) {
      SoundEngine.sequenceFormed();
      this.log(`🎉 ${player === 'player' ? 'YOU' : 'MACHINE'} FORMED A SEQUENCE! (${currentSeqs.length}/${this.targetSequences})`, 'sequence');
    }

    if (currentSeqs.length >= this.targetSequences) {
      this.isGameOver = true;
      SoundEngine.victory();
      this.render();
      this.showVictoryModal(player);
      return;
    }

    // 4. Draw next card from deck
    this.selectedCardIndex = null;

    if (player === 'player') {
      if (this.drawMode === 'manual') {
        // Player must manually click deck to draw
        this.playerHand[cardIndex] = null;
        this.pendingDrawSlot = cardIndex;
        this.currentTurn = 'awaiting_draw';
        this.render();
      } else {
        // Auto-draw immediately
        const newCard = this.drawCard();
        this.playerHand[cardIndex] = newCard;
        this.lastDrawnSlot = cardIndex;
        setTimeout(() => SoundEngine.cardDraw(), 100);
        this.log(`🃏 Discarded ${parsed.name} ➔ Drew ${parseCard(newCard).name} from deck (${this.deck.length} remaining).`, 'player');

        this.currentTurn = 'ai';
        this.render();
        this.triggerAiTurn();
      }
    } else {
      // AI automatically draws
      const newCard = this.drawCard();
      this.aiHand[cardIndex] = newCard;
      this.log(`🃏 Machine discarded ${parsed.name} and drew next card.`, 'ai');

      this.currentTurn = 'player';
      this.render();
    }
  }

  drawForPlayer() {
    if (this.currentTurn !== 'awaiting_draw' || this.pendingDrawSlot === null) return;
    const slot = this.pendingDrawSlot;
    const newCard = this.drawCard();
    this.playerHand[slot] = newCard;
    this.lastDrawnSlot = slot;
    this.pendingDrawSlot = null;
    SoundEngine.cardDraw();

    this.log(`🃏 Drew ${parseCard(newCard).name} from deck into your hand.`, 'player');

    this.currentTurn = 'ai';
    this.render();
    this.triggerAiTurn();
  }

  triggerAiTurn() {
    this.isAiThinking = true;
    this.render();

    const thinkTime = 700 + Math.floor(Math.random() * 400);
    setTimeout(() => {
      if (this.isGameOver) return;
      const aiDecision = getBestAIMove(this.aiHand, this.boardState, 'red');

      this.isAiThinking = false;

      if (!aiDecision) {
        this.log("Machine had no playable moves and passed turn.", "ai");
        this.currentTurn = 'player';
        this.render();
        return;
      }

      if (aiDecision.type === 'swap') {
        this.swapDeadCard('ai', aiDecision.index);
        setTimeout(() => this.triggerAiTurn(), 400);
      } else if (aiDecision.type === 'play') {
        this.executeMove('ai', aiDecision.index, aiDecision.move);
      }
    }, thinkTime);
  }

  setTargetSequences(num) {
    this.targetSequences = num;
    if (this.playerSequences.length >= this.targetSequences) {
      this.isGameOver = true;
      this.showVictoryModal('player');
    } else if (this.aiSequences.length >= this.targetSequences) {
      this.isGameOver = true;
      this.showVictoryModal('ai');
    }
    this.render();
  }

  log(msg, type = 'system') {
    const logList = document.getElementById('logContent');
    if (!logList) return;
    const item = document.createElement('div');
    item.className = `log-item ${type}`;
    item.textContent = msg;
    logList.appendChild(item);
    logList.scrollTop = logList.scrollHeight;
  }

  showVictoryModal(winner) {
    const overlay = document.getElementById('victoryOverlay');
    const title = document.getElementById('victoryTitle');
    const subtitle = document.getElementById('victorySubtitle');
    if (!overlay) return;

    if (winner === 'player') {
      title.textContent = '🏆 Victory!';
      title.className = 'victory-title player';
      subtitle.textContent = `Spectacular! You formed ${this.targetSequences} sequence${this.targetSequences > 1 ? 's' : ''} and defeated the machine!`;
    } else {
      title.textContent = '🤖 Machine Wins!';
      title.className = 'victory-title ai';
      subtitle.textContent = `The machine formed ${this.targetSequences} sequence${this.targetSequences > 1 ? 's' : ''}. Better luck next round!`;
    }
    overlay.classList.add('open');
  }

  render() {
    const pScore = document.getElementById('playerScore');
    const aScore = document.getElementById('aiScore');
    const goalBtn = document.getElementById('goalToggleBtn');
    const drawModeBtn = document.getElementById('drawModeBtn');
    const turnBanner = document.getElementById('turnBanner');
    const statusText = document.getElementById('statusText');
    const deckCount = document.getElementById('deckCount');
    const playerDiscardCard = document.getElementById('playerDiscardCard');
    const aiDiscardCard = document.getElementById('aiDiscardCard');
    const drawDeckCard = document.getElementById('drawDeckCard');

    if (pScore) pScore.textContent = this.playerSequences.length;
    if (aScore) aScore.textContent = this.aiSequences.length;
    if (goalBtn) goalBtn.textContent = `Goal: ${this.targetSequences} Seq`;
    if (drawModeBtn) drawModeBtn.textContent = `🎴 Draw: ${this.drawMode === 'auto' ? 'Auto' : 'Manual'}`;
    if (deckCount) deckCount.textContent = `${this.deck.length} left`;

    // Turn banner status
    if (turnBanner && statusText) {
      if (this.isGameOver) {
        turnBanner.className = 'turn-banner';
        statusText.textContent = 'Game Over';
      } else if (this.currentTurn === 'awaiting_draw') {
        turnBanner.className = 'turn-banner player-turn';
        statusText.innerHTML = '<span class="pulse-dot"></span> <b>Card Discarded!</b> Click the Draw Deck (or slot in hand) to draw your next card.';
      } else if (this.isAiThinking) {
        turnBanner.className = 'turn-banner ai-turn';
        statusText.innerHTML = '<span class="pulse-dot"></span> Machine is contemplating move...';
      } else if (this.currentTurn === 'player') {
        turnBanner.className = 'turn-banner player-turn';
        if (this.selectedCardIndex !== null && this.playerHand[this.selectedCardIndex]) {
          const card = parseCard(this.playerHand[this.selectedCardIndex]);
          if (card.isTwoEyed) {
            statusText.innerHTML = '<span class="pulse-dot"></span> <b>Two-Eyed Jack Selected:</b> Click ANY open square to place!';
          } else if (card.isOneEyed) {
            statusText.innerHTML = '<span class="pulse-dot"></span> <b>One-Eyed Jack Selected:</b> Click any RED chip to remove!';
          } else {
            statusText.innerHTML = `<span class="pulse-dot"></span> Selected <b>${card.name}</b>. Click highlighted space on board.`;
          }
        } else {
          statusText.innerHTML = '<span class="pulse-dot"></span> Your Turn: Select a card from your hand below.';
        }
      } else {
        turnBanner.className = 'turn-banner ai-turn';
        statusText.innerHTML = '<span class="pulse-dot"></span> Machine turn';
      }
    }

    // Draw Deck & Discard Piles
    if (drawDeckCard) {
      if (this.currentTurn === 'awaiting_draw') {
        drawDeckCard.className = 'card-back clickable-deck';
        drawDeckCard.onclick = () => this.drawForPlayer();
      } else {
        drawDeckCard.className = 'card-back';
        drawDeckCard.onclick = null;
      }
    }

    if (playerDiscardCard) {
      if (this.lastPlayerDiscard) {
        const top = parseCard(this.lastPlayerDiscard);
        playerDiscardCard.className = `discard-card recent suit-${top.color}`;
        playerDiscardCard.innerHTML = `
          <div style="font-weight: bold; font-size: 0.85rem;">${top.rank}</div>
          <div style="font-size: 1.05rem; line-height: 1;">${top.symbol}</div>
        `;
      } else {
        playerDiscardCard.className = 'discard-card';
        playerDiscardCard.innerHTML = '<span style="font-size: 0.65rem; color: #94a3b8;">Empty</span>';
      }
    }

    if (aiDiscardCard) {
      if (this.lastAiDiscard) {
        const top = parseCard(this.lastAiDiscard);
        aiDiscardCard.className = `discard-card recent suit-${top.color}`;
        aiDiscardCard.innerHTML = `
          <div style="font-weight: bold; font-size: 0.85rem;">${top.rank}</div>
          <div style="font-size: 1.05rem; line-height: 1;">${top.symbol}</div>
        `;
      } else {
        aiDiscardCard.className = 'discard-card';
        aiDiscardCard.innerHTML = '<span style="font-size: 0.65rem; color: #94a3b8;">Empty</span>';
      }
    }

    // Board Highlights
    let validMoves = [];
    if (this.currentTurn === 'player' && this.selectedCardIndex !== null && this.playerHand[this.selectedCardIndex]) {
      const cardCode = this.playerHand[this.selectedCardIndex];
      validMoves = getValidMovesForCard(cardCode, this.boardState, 'blue');
    }

    const boardGrid = document.getElementById('boardGrid');
    if (boardGrid) {
      boardGrid.innerHTML = '';
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
          const cellData = this.boardState[r][c];
          const cellEl = document.createElement('div');
          cellEl.className = 'board-cell';

          if (cellData.isCorner) {
            cellEl.classList.add('corner-cell');
            cellEl.innerHTML = `
              <div class="corner-icon">★</div>
              <div class="corner-label">FREE</div>
            `;
          } else {
            const card = cellData.card;
            cellEl.classList.add(`suit-${card.color}`);
            cellEl.innerHTML = `
              <div class="card-pip">${card.rank}</div>
              <div class="suit-symbol">${card.symbol}</div>
            `;
          }

          const move = validMoves.find(m => m.r === r && m.c === c);
          if (move) {
            if (move.action === 'place') {
              cellEl.classList.add('highlight-valid');
              cellEl.title = 'Click to place Blue chip';
            } else if (move.action === 'remove') {
              cellEl.classList.add('highlight-remove');
              cellEl.title = 'Click to remove Red chip';
            }
          }

          if (cellData.token && !cellData.isCorner) {
            const tokenEl = document.createElement('div');
            tokenEl.className = `token token-${cellData.token}`;
            if (cellData.inSequence) {
              tokenEl.classList.add('locked-sequence');
              tokenEl.title = 'Protected sequence chip';
            }
            cellEl.appendChild(tokenEl);
          }

          cellEl.addEventListener('click', () => this.handleCellClick(r, c));
          boardGrid.appendChild(cellEl);
        }
      }
    }

    // Player Hand Tray
    const handTray = document.getElementById('handTray');
    if (handTray) {
      handTray.innerHTML = '';
      this.playerHand.forEach((cardCode, index) => {
        if (!cardCode) {
          // Awaiting manual draw slot
          const emptySlot = document.createElement('div');
          emptySlot.className = 'empty-card-slot';
          emptySlot.innerHTML = '<span>🃏</span><span style="font-size: 0.7rem; margin-top: 4px;">CLICK TO DRAW</span>';
          emptySlot.addEventListener('click', () => this.drawForPlayer());
          handTray.appendChild(emptySlot);
          return;
        }

        const card = parseCard(cardCode);
        const cardEl = document.createElement('div');
        cardEl.className = `player-card suit-${card.color}`;
        if (this.selectedCardIndex === index) {
          cardEl.classList.add('selected');
        }
        if (this.lastDrawnSlot === index) {
          cardEl.classList.add('newly-drawn');
        }

        const isDead = isDeadCard(cardCode, this.boardState);
        if (isDead) {
          cardEl.classList.add('dead');
        }

        let badgeHtml = '';
        if (this.lastDrawnSlot === index) {
          badgeHtml = '<div class="card-badge badge-new">NEW</div>';
        } else if (card.isTwoEyed) {
          badgeHtml = '<div class="card-badge badge-wild">WILD</div>';
        } else if (card.isOneEyed) {
          badgeHtml = '<div class="card-badge badge-remove">REMOVE</div>';
        } else if (isDead) {
          badgeHtml = '<div class="card-badge badge-dead" title="Both spots filled! Click to swap.">DEAD ↺</div>';
        }

        cardEl.innerHTML = `
          ${badgeHtml}
          <div class="card-top">
            <span class="rank">${card.rank}</span>
            <span class="suit">${card.symbol}</span>
          </div>
          <div class="card-center-icon">${card.symbol}</div>
          <div class="card-bottom">
            <span class="rank">${card.rank}</span>
            <span class="suit">${card.symbol}</span>
          </div>
        `;

        cardEl.addEventListener('click', (e) => {
          if (isDead && e.target.classList.contains('badge-dead')) {
            this.swapDeadCard('player', index);
          } else {
            this.selectPlayerCard(index);
          }
        });

        cardEl.addEventListener('mouseenter', () => {
          if (this.currentTurn === 'player' && !this.isGameOver) {
            this.previewCardMoves(cardCode);
          }
        });

        cardEl.addEventListener('mouseleave', () => {
          if (this.selectedCardIndex === null) {
            this.clearPreviewHighlights();
          } else if (this.playerHand[this.selectedCardIndex]) {
            this.previewCardMoves(this.playerHand[this.selectedCardIndex]);
          }
        });

        handTray.appendChild(cardEl);
      });
    }
  }

  previewCardMoves(cardCode) {
    this.clearPreviewHighlights();
    const moves = getValidMovesForCard(cardCode, this.boardState, 'blue');
    const boardGrid = document.getElementById('boardGrid');
    if (!boardGrid) return;
    const cells = boardGrid.children;
    for (const move of moves) {
      const idx = move.r * 10 + move.c;
      if (cells[idx]) {
        if (move.action === 'place') {
          cells[idx].classList.add('highlight-valid');
        } else if (move.action === 'remove') {
          cells[idx].classList.add('highlight-remove');
        }
      }
    }
  }

  clearPreviewHighlights() {
    const boardGrid = document.getElementById('boardGrid');
    if (!boardGrid) return;
    const cells = boardGrid.querySelectorAll('.highlight-valid, .highlight-remove');
    cells.forEach(c => {
      c.classList.remove('highlight-valid', 'highlight-remove');
    });
  }
}

// Global instance & setup
let game = null;

function initApp() {
  game = new SequenceGame();
  game.render();
  game.log("Welcome to Sequence! You play Blue, Machine plays Red.", "system");
  game.log("Rule: When a card is played, it is discarded and you draw the next card from the deck!", "system");
  game.log("Click any card in your hand to highlight playable board squares.", "system");

  const restartBtn = document.getElementById('restartBtn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      if (confirm("Restart game with a fresh shuffle?")) {
        game = new SequenceGame();
        document.getElementById('logContent').innerHTML = '';
        game.render();
        game.log("Game restarted. Fresh 104-card deck dealt!", "system");
      }
    });
  }

  const goalToggleBtn = document.getElementById('goalToggleBtn');
  if (goalToggleBtn) {
    goalToggleBtn.addEventListener('click', () => {
      const nextGoal = game.targetSequences === 1 ? 2 : 1;
      game.setTargetSequences(nextGoal);
      game.log(`Sequence goal updated to ${nextGoal} sequence${nextGoal > 1 ? 's' : ''}.`, "system");
    });
  }

  const drawModeBtn = document.getElementById('drawModeBtn');
  if (drawModeBtn) {
    drawModeBtn.addEventListener('click', () => {
      game.toggleDrawMode();
    });
  }

  const muteBtn = document.getElementById('muteBtn');
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      const isMuted = SoundEngine.toggleMute();
      muteBtn.textContent = isMuted ? '🔇 Muted' : '🔊 Sound';
    });
  }

  const rulesBtn = document.getElementById('rulesBtn');
  const rulesModal = document.getElementById('rulesModal');
  const closeRulesBtn = document.getElementById('closeRulesBtn');
  if (rulesBtn && rulesModal) {
    rulesBtn.addEventListener('click', () => rulesModal.classList.add('open'));
  }
  if (closeRulesBtn && rulesModal) {
    closeRulesBtn.addEventListener('click', () => rulesModal.classList.remove('open'));
  }

  const playAgainBtn = document.getElementById('playAgainBtn');
  const victoryOverlay = document.getElementById('victoryOverlay');
  if (playAgainBtn && victoryOverlay) {
    playAgainBtn.addEventListener('click', () => {
      victoryOverlay.classList.remove('open');
      game = new SequenceGame();
      document.getElementById('logContent').innerHTML = '';
      game.render();
      game.log("New game started! Good luck.", "system");
    });
  }
}

window.addEventListener('DOMContentLoaded', initApp);
