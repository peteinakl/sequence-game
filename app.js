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
    unlock() {
      initCtx();
    },
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

  findMatchingHandCard(r, c) {
    let wildIndex = -1;
    for (let i = 0; i < this.playerHand.length; i++) {
      const cardCode = this.playerHand[i];
      if (!cardCode) continue;
      const moves = getValidMovesForCard(cardCode, this.boardState, 'blue');
      const match = moves.find(m => m.r === r && m.c === c);
      if (match) {
        const parsed = parseCard(cardCode);
        if (parsed.isTwoEyed) {
          if (wildIndex === -1) wildIndex = i;
        } else {
          return i; // Prefer standard card match over using wild Jack
        }
      }
    }
    return wildIndex;
  }

  handleCellClick(r, c) {
    if (this.currentTurn !== 'player' || this.isGameOver || this.isAiThinking) return;

    if (this.selectedCardIndex === null) {
      // Mobile Smart Tap: Check if player holds a card that can be played at this spot
      const matchIdx = this.findMatchingHandCard(r, c);
      if (matchIdx !== -1) {
        this.selectPlayerCard(matchIdx);
        SoundEngine.cardDraw();
      }
      return;
    }

    const cardCode = this.playerHand[this.selectedCardIndex];
    if (!cardCode) return;

    const validMoves = getValidMovesForCard(cardCode, this.boardState, 'blue');
    const move = validMoves.find(m => m.r === r && m.c === c);

    if (!move) {
      // If cell isn't valid for current card, check if player tapped a spot valid for another card in hand
      const altIdx = this.findMatchingHandCard(r, c);
      if (altIdx !== -1 && altIdx !== this.selectedCardIndex) {
        this.selectPlayerCard(altIdx);
        SoundEngine.cardDraw();
      }
      return;
    }

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
        this.updateMoveFeedback(parsed.name, "Click Draw Deck to draw replacement!");
        this.render();
      } else {
        // Auto-draw immediately
        const newCard = this.drawCard();
        this.playerHand[cardIndex] = newCard;
        this.lastDrawnSlot = cardIndex;
        setTimeout(() => SoundEngine.cardDraw(), 100);
        this.updateMoveFeedback(parsed.name, parseCard(newCard).name);
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

  updateMoveFeedback(discardedName, drawnName) {
    const bar = document.getElementById('moveFeedbackBar');
    const disc = document.getElementById('feedbackDiscard');
    const draw = document.getElementById('feedbackDraw');
    if (!bar) return;
    if (discardedName) {
      bar.style.display = 'flex';
      if (disc) disc.innerHTML = `📤 Discarded: <b>${discardedName}</b>`;
      if (draw) draw.innerHTML = drawnName ? `&nbsp;&nbsp;➔&nbsp;&nbsp; 📥 Drew: <b>${drawnName}</b>` : '';
    } else {
      bar.style.display = 'none';
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

    const discName = this.lastPlayerDiscard ? parseCard(this.lastPlayerDiscard).name : '';
    this.updateMoveFeedback(discName, parseCard(newCard).name);
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
    if (drawModeBtn) {
      const textSpan = drawModeBtn.querySelector('.btn-text');
      if (textSpan) {
        textSpan.textContent = this.drawMode === 'auto' ? 'Auto' : 'Manual';
      } else {
        drawModeBtn.textContent = `🎴 Draw: ${this.drawMode === 'auto' ? 'Auto' : 'Manual'}`;
      }
    }
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

    const playerDiscardName = document.getElementById('playerDiscardName');
    const aiDiscardName = document.getElementById('aiDiscardName');

    const updateDiscardDisplay = (cardCode, cardEl, nameEl) => {
      if (!cardEl) return;
      if (cardCode) {
        const card = parseCard(cardCode);
        cardEl.className = `discard-card recent ${card.color === 'red' ? 'suit-red' : 'suit-black'}`;
        let centerHtml = `<div style="font-size: 1.3rem; line-height: 1; align-self: center;">${card.symbol}</div>`;
        let eyeBadge = '';

        if (card.isTwoEyed) {
          eyeBadge = '<div style="position: absolute; top: -6px; right: -4px; background: #10b981; color: white; border-radius: 4px; padding: 1px 4px; font-size: 0.55rem; font-weight: 800;">👀 WILD</div>';
          centerHtml = `
            <div style="display: flex; flex-direction: column; align-items: center; line-height: 1;">
              <span style="font-size: 1.1rem;">👀</span>
              <span style="font-size: 0.85rem; line-height: 1;">${card.symbol}</span>
            </div>
          `;
        } else if (card.isOneEyed) {
          eyeBadge = '<div style="position: absolute; top: -6px; right: -4px; background: #ef4444; color: white; border-radius: 4px; padding: 1px 4px; font-size: 0.55rem; font-weight: 800;">👁️ REMOVE</div>';
          centerHtml = `
            <div style="display: flex; flex-direction: column; align-items: center; line-height: 1;">
              <span style="font-size: 1.1rem;">👁️</span>
              <span style="font-size: 0.85rem; line-height: 1;">${card.symbol}</span>
            </div>
          `;
        }

        cardEl.innerHTML = `
          ${eyeBadge}
          <div class="card-top" style="line-height: 1;">
            <span style="font-size: 0.85rem; font-weight: 800;">${card.rank}</span>
            <span style="font-size: 0.75rem;">${card.symbol}</span>
          </div>
          ${centerHtml}
          <div class="card-bottom" style="line-height: 1; transform: rotate(180deg); align-items: flex-end;">
            <span style="font-size: 0.85rem; font-weight: 800;">${card.rank}</span>
            <span style="font-size: 0.75rem;">${card.symbol}</span>
          </div>
        `;
        if (nameEl) nameEl.textContent = card.name;
      } else {
        cardEl.className = 'discard-card empty-pile';
        cardEl.innerHTML = '<span style="font-size: 0.65rem; color: #94a3b8;">Empty</span>';
        if (nameEl) nameEl.textContent = 'None yet';
      }
    };

    updateDiscardDisplay(this.lastPlayerDiscard, playerDiscardCard, playerDiscardName);
    updateDiscardDisplay(this.lastAiDiscard, aiDiscardCard, aiDiscardName);

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
          const emptySlot = document.createElement('div');
          emptySlot.className = 'empty-card-slot';
          emptySlot.innerHTML = '<span>🃏</span><span style="font-size: 0.7rem; margin-top: 4px;">CLICK TO DRAW</span>';
          emptySlot.addEventListener('click', () => this.drawForPlayer());
          handTray.appendChild(emptySlot);
          return;
        }

        const card = parseCard(cardCode);
        const cardEl = document.createElement('div');
        cardEl.className = `player-card ${card.color === 'red' ? 'suit-red' : 'suit-black'}`;
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
        let centerContent = `<div class="card-center-icon">${card.symbol}</div>`;
        let bottomPip = `<span class="suit">${card.symbol}</span>`;

        if (card.isTwoEyed) {
          cardEl.classList.add('is-two-eyed');
          cardEl.title = `👀 Two-Eyed Jack of ${card.suitName} — WILD: Place on ANY empty square!`;
          badgeHtml = '<div class="card-badge badge-wild">👀 2-EYED WILD</div>';
          centerContent = `
            <div class="jack-center-content">
              <span class="jack-eyes-icon">👀</span>
              <span style="font-size: 1.25rem; line-height: 1;">${card.symbol}</span>
              <span class="jack-ability-text wild">WILD</span>
            </div>
          `;
          bottomPip = '<span class="suit" style="font-size: 0.8rem;">👀</span>';
        } else if (card.isOneEyed) {
          cardEl.classList.add('is-one-eyed');
          cardEl.title = `👁️ One-Eyed Jack of ${card.suitName} — REMOVAL: Clear any opponent chip!`;
          badgeHtml = '<div class="card-badge badge-remove">👁️ 1-EYED REMOVE</div>';
          centerContent = `
            <div class="jack-center-content">
              <span class="jack-eyes-icon">👁️</span>
              <span style="font-size: 1.25rem; line-height: 1;">${card.symbol}</span>
              <span class="jack-ability-text remove">REMOVE</span>
            </div>
          `;
          bottomPip = '<span class="suit" style="font-size: 0.8rem;">👁️</span>';
        }

        if (this.lastDrawnSlot === index) {
          badgeHtml = '<div class="card-badge badge-new">NEW ★</div>';
        } else if (isDead) {
          badgeHtml = '<div class="card-badge badge-dead" title="Both spots filled! Click to swap.">DEAD ↺</div>';
        }

        cardEl.innerHTML = `
          ${badgeHtml}
          <div class="card-top">
            <span class="rank">${card.rank}</span>
            <span class="suit">${card.symbol}</span>
          </div>
          ${centerContent}
          <div class="card-bottom">
            <span class="rank">${card.rank}</span>
            ${bottomPip}
          </div>
        `;

        cardEl.addEventListener('click', () => {
          if (isDead) {
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
      const textSpan = muteBtn.querySelector('.btn-text');
      const iconSpan = muteBtn.querySelector('.btn-icon');
      if (textSpan && iconSpan) {
        iconSpan.textContent = isMuted ? '🔇' : '🔊';
        textSpan.textContent = isMuted ? 'Muted' : 'Sound';
      } else {
        muteBtn.textContent = isMuted ? '🔇 Muted' : '🔊 Sound';
      }
    });
  }

  // Mobile Log Accordion Toggle
  const logToggleTitle = document.getElementById('logToggleTitle');
  const logCardBox = document.getElementById('logCardBox');
  if (logToggleTitle && logCardBox) {
    logToggleTitle.addEventListener('click', () => {
      logCardBox.classList.toggle('collapsed');
      const icon = document.getElementById('logToggleIcon');
      if (icon) {
        icon.textContent = logCardBox.classList.contains('collapsed') ? '▸' : '▾';
      }
    });
  }

  // Mobile Audio Unlock on first touch/click
  const unlockAudio = () => {
    SoundEngine.unlock();
  };
  ['click', 'touchstart', 'touchend'].forEach(evt => {
    window.addEventListener(evt, unlockAudio, { once: true, passive: true });
  });

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
