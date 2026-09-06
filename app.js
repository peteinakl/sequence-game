// Sequence Game Application Controller

// Audio Engine (Synthesized Web Audio API featuring Chic's "Good Times" Riff & Tactile Acoustics)
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

  // Synthesizes a punchy, funky 70s slap bass note using filtered sawtooth + sub-triangle
  function playSlapBass(freq, startTime = 0, duration = 0.12, gainVal = 0.28) {
    if (muted) return;
    initCtx();
    const now = audioCtx.currentTime + startTime;

    // Sawtooth attack through resonant low-pass filter
    const saw = audioCtx.createOscillator();
    saw.type = 'sawtooth';
    saw.frequency.setValueAtTime(freq, now);

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(4.0, now);
    filter.frequency.setValueAtTime(freq * 5.5, now);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.5, now + duration);

    // Deep sub-bass body
    const sub = audioCtx.createOscillator();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(freq, now);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    saw.connect(filter);
    filter.connect(gain);
    sub.connect(gain);
    gain.connect(audioCtx.destination);

    saw.start(now);
    sub.start(now);
    saw.stop(now + duration);
    sub.stop(now + duration);
  }

  // Disco brass chord stab
  function playDiscoStab(freqs, startTime = 0, duration = 0.18) {
    if (muted) return;
    initCtx();
    freqs.forEach(f => {
      playTone(f, 'sawtooth', duration, startTime, 0.06);
    });
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

    // Realistic clay poker chip acoustic clack (high transient snap + low felt thump)
    chipPlace(chainLength = 1) {
      initCtx();
      if (muted) return;
      const now = audioCtx.currentTime;

      // 1. High frequency chip snap (1800Hz resonant burst)
      const snap = audioCtx.createOscillator();
      const snapGain = audioCtx.createGain();
      snap.type = 'triangle';
      snap.frequency.setValueAtTime(1750, now);
      snap.frequency.exponentialRampToValueAtTime(800, now + 0.04);
      snapGain.gain.setValueAtTime(0.18, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      snap.connect(snapGain);
      snapGain.connect(audioCtx.destination);
      snap.start(now);
      snap.stop(now + 0.04);

      // 2. Low felt impact thud (140Hz)
      const thud = audioCtx.createOscillator();
      const thudGain = audioCtx.createGain();
      thud.type = 'sine';
      thud.frequency.setValueAtTime(145, now);
      thud.frequency.exponentialRampToValueAtTime(60, now + 0.08);
      thudGain.gain.setValueAtTime(0.22, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      thud.connect(thudGain);
      thudGain.connect(audioCtx.destination);
      thud.start(now);
      thud.stop(now + 0.08);

      // 3. Ascending musical combo arpeggio as player builds chains
      const comboNotes = [261.63, 329.63, 392.00, 493.88]; // C4, E4, G4, B4
      const noteIdx = Math.min(Math.max(chainLength - 1, 0), comboNotes.length - 1);
      const noteFreq = comboNotes[noteIdx];
      playTone(noteFreq, 'sine', 0.22, 0.03, 0.16);

      // If 4-in-a-row tension, add subtle tense sub-pulse
      if (chainLength >= 4) {
        playTone(130.81, 'triangle', 0.35, 0.05, 0.2); // C3 tension
      }
    },

    // Card handling acoustics
    cardDraw() {
      initCtx();
      playTone(340, 'sine', 0.06, 0, 0.12);
      playTone(520, 'triangle', 0.08, 0.02, 0.12);
    },

    cardSlide() {
      initCtx();
      playTone(280, 'triangle', 0.09, 0, 0.1);
    },

    jackAction(isRemoval = false) {
      initCtx();
      if (isRemoval) {
        // Dramatic bass drop + shatter
        playTone(196, 'sawtooth', 0.25, 0, 0.18);
        playTone(98, 'triangle', 0.3, 0.05, 0.22);
        playTone(880, 'sine', 0.15, 0.02, 0.1);
      } else {
        // Wild Jack fanfare
        playTone(440, 'triangle', 0.12, 0, 0.15);
        playTone(659.25, 'triangle', 0.18, 0.08, 0.18);
      }
    },

    // THE ICONIC "GOOD TIMES" BY CHIC CELEBRATORY DISCO BASS GROOVE!
    // Bernard Edwards' legendary bouncy E-minor octave slap bassline + disco stabs
    playGoodTimesRiff() {
      initCtx();
      if (muted) return;

      // Note frequencies (Key of E minor / D disco funk)
      const E2 = 82.41;
      const G2 = 98.00;
      const A2 = 110.00;
      const B2 = 123.47;
      const D3 = 146.83;
      const E3 = 164.81;

      // Signature "Good Times" rhythmic slap bass sequence
      const bassRiff = [
        { note: E2, t: 0.00, dur: 0.11 }, // Dun
        { note: E2, t: 0.14, dur: 0.09 }, // dun
        { note: E3, t: 0.28, dur: 0.15 }, // DUN! (octave slap)
        { note: D3, t: 0.48, dur: 0.10 }, // dun
        { note: B2, t: 0.60, dur: 0.10 }, // dun
        { note: G2, t: 0.72, dur: 0.10 }, // dun
        { note: A2, t: 0.84, dur: 0.10 }, // dun
        { note: B2, t: 0.96, dur: 0.12 }, // dun
        { note: E2, t: 1.12, dur: 0.38 }  // DUUUN! (landing slap)
      ];

      bassRiff.forEach(b => {
        playSlapBass(b.note, b.t, b.dur, 0.32);
      });

      // Joyous Disco Brass/Chords accompanying the riff:
      // Em7 chord on downbeat: G4, B4, D5, E5
      playDiscoStab([392.00, 493.88, 587.33, 659.25], 0.00, 0.16);
      // D chord on 2nd beat: F#4, A4, D5
      playDiscoStab([369.99, 440.00, 587.33], 0.48, 0.14);
      // Celebratory Big Em7 landing chord:
      playDiscoStab([392.00, 493.88, 587.33, 659.25, 783.99], 1.12, 0.45);
    },

    playTone(freq, type = 'sine', duration = 0.15, startTime = 0, gainVal = 0.15) {
      playTone(freq, type, duration, startTime, gainVal);
    },

    defeat() {
      initCtx();
      if (muted) return;
      playTone(392.00, 'triangle', 0.25, 0, 0.2);
      playTone(349.23, 'triangle', 0.25, 0.2, 0.2);
      playTone(329.63, 'triangle', 0.45, 0.4, 0.25);
    },

    sequenceFormed() {
      this.playGoodTimesRiff();
    },

    victory() {
      this.playGoodTimesRiff();
      // Followed by ascending victory flourish
      setTimeout(() => {
        const victoryFanfare = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        victoryFanfare.forEach((n, i) => {
          playTone(n, 'triangle', 0.4, i * 0.1, 0.18);
        });
      }, 1400);
    }
  };
})();

// Confetti Celebration Engine (Lightweight, 60fps HTML5 Canvas)
const ConfettiEngine = (() => {
  let canvas = null;
  let ctx = null;
  let particles = [];
  let animId = null;

  function init() {
    canvas = document.getElementById('confettiCanvas');
    if (canvas) {
      ctx = canvas.getContext('2d');
      resize();
      window.addEventListener('resize', resize);
    }
  }

  function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function launch(count = 70) {
    if (!canvas) init();
    if (!canvas || !ctx) return;
    resize();

    const colors = ['#fbbf24', '#10b981', '#2563eb', '#ef4444', '#a855f7', '#38bdf8'];
    const originX = canvas.width / 2;
    const originY = canvas.height * 0.45;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = Math.random() * 9 + 4;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        alpha: 1,
        decay: Math.random() * 0.015 + 0.008
      });
    }

    if (!animId) {
      animId = requestAnimationFrame(update);
    }
  }

  function update() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // Gravity
      p.rotation += p.rotSpeed;
      p.alpha -= p.decay;

      if (p.alpha <= 0 || p.y > canvas.height) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
      ctx.restore();
    }

    if (particles.length > 0) {
      animId = requestAnimationFrame(update);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      animId = null;
    }
  }

  return { init, launch };
})();

// LocalStorage Persistence & Lifetime Stats Manager
const StorageManager = (() => {
  const KEYS = {
    SAVE: 'sequence_match_save_v1',
    STATS: 'sequence_lifetime_stats_v1',
    SETTINGS: 'sequence_user_settings_v1'
  };

  return {
    saveMatch(gameState) {
      try {
        if (!gameState || gameState.isGameOver) {
          localStorage.removeItem(KEYS.SAVE);
          return;
        }
        const stateToSave = {
          boardState: gameState.boardState,
          deck: gameState.deck,
          discardPile: gameState.discardPile,
          playerHand: gameState.playerHand,
          aiHand: gameState.aiHand,
          currentTurn: gameState.currentTurn,
          targetSequences: gameState.targetSequences,
          drawMode: gameState.drawMode,
          lastPlayerDiscard: gameState.lastPlayerDiscard,
          lastAiDiscard: gameState.lastAiDiscard,
          playerSequences: gameState.playerSequences,
          aiSequences: gameState.aiSequences
        };
        localStorage.setItem(KEYS.SAVE, JSON.stringify(stateToSave));
      } catch (e) {
        console.warn("Storage save failed", e);
      }
    },

    loadMatch() {
      try {
        const raw = localStorage.getItem(KEYS.SAVE);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    clearMatch() {
      try {
        localStorage.removeItem(KEYS.SAVE);
      } catch (e) {}
    },

    getStats() {
      try {
        const raw = localStorage.getItem(KEYS.STATS);
        const defaults = { plays: 1, wins: 0, losses: 0, currentStreak: 0, bestStreak: 0, sequences: 0 };
        if (!raw) {
          localStorage.setItem(KEYS.STATS, JSON.stringify(defaults));
          return defaults;
        }
        const p = JSON.parse(raw);
        const wins = Number(p.wins) || 0;
        const losses = Number(p.losses) || 0;
        let plays = Number(p.plays);
        if (isNaN(plays) || plays < 1) {
          plays = Math.max(1, wins + losses);
        }
        return {
          plays,
          wins,
          losses,
          currentStreak: Number(p.currentStreak) || 0,
          bestStreak: Number(p.bestStreak) || 0,
          sequences: Number(p.sequences) || 0
        };
      } catch (e) {
        return { plays: 1, wins: 0, losses: 0, currentStreak: 0, bestStreak: 0, sequences: 0 };
      }
    },

    saveStats(stats) {
      try {
        localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
      } catch (e) {
        console.warn("Could not save stats", e);
      }
    },

    recordMatchStarted() {
      const stats = this.getStats();
      stats.plays += 1;
      this.saveStats(stats);
      return stats;
    },

    recordWin() {
      const stats = this.getStats();
      stats.wins += 1;
      stats.currentStreak += 1;
      if (stats.currentStreak > stats.bestStreak) {
        stats.bestStreak = stats.currentStreak;
      }
      if (stats.plays < stats.wins + stats.losses) {
        stats.plays = stats.wins + stats.losses;
      }
      this.saveStats(stats);
      return stats;
    },

    recordLoss() {
      const stats = this.getStats();
      stats.losses += 1;
      stats.currentStreak = 0;
      if (stats.plays < stats.wins + stats.losses) {
        stats.plays = stats.wins + stats.losses;
      }
      this.saveStats(stats);
      return stats;
    },

    recordSequence() {
      const stats = this.getStats();
      stats.sequences += 1;
      this.saveStats(stats);
      return stats;
    },

    resetStats() {
      const fresh = { plays: 1, wins: 0, losses: 0, currentStreak: 0, bestStreak: 0, sequences: 0 };
      this.saveStats(fresh);
      return fresh;
    },

    recordVisit() {
      try {
        const stats = this.getStats();
        if (!sessionStorage.getItem('sequence_session_active')) {
          sessionStorage.setItem('sequence_session_active', '1');
          const saved = this.loadMatch();
          if (!saved && (stats.wins + stats.losses > 0)) {
            stats.plays = Math.max(stats.plays + 1, stats.wins + stats.losses + 1);
            this.saveStats(stats);
          }
        }
        return stats;
      } catch (e) {
        return this.getStats();
      }
    },

    getSettings() {
      try {
        const raw = localStorage.getItem(KEYS.SETTINGS);
        return raw ? JSON.parse(raw) : { theme: 'light', isTurbo: false };
      } catch (e) {
        return { theme: 'light', isTurbo: false };
      }
    },

    saveSettings(settings) {
      try {
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
      } catch (e) {}
    }
  };
})();

// Helper to evaluate longest connected chain at (r, c)
function getMaxChainLengthAt(boardState, r, c, color) {
  const directions = [
    { dr: 0, dc: 1 },  // horizontal
    { dr: 1, dc: 0 },  // vertical
    { dr: 1, dc: 1 },  // diagonal down-right
    { dr: 1, dc: -1 }  // diagonal down-left
  ];

  let maxLen = 1;

  for (const { dr, dc } of directions) {
    let count = 1;
    // Step forward
    let step = 1;
    while (true) {
      const nr = r + dr * step;
      const nc = c + dc * step;
      if (nr < 0 || nr >= 10 || nc < 0 || nc >= 10) break;
      const cell = boardState[nr][nc];
      if (cell.isCorner || cell.token === color) {
        count++;
        step++;
      } else break;
    }
    // Step backward
    step = 1;
    while (true) {
      const nr = r - dr * step;
      const nc = c - dc * step;
      if (nr < 0 || nr >= 10 || nc < 0 || nc >= 10) break;
      const cell = boardState[nr][nc];
      if (cell.isCorner || cell.token === color) {
        count++;
        step++;
      } else break;
    }
    if (count > maxLen) maxLen = count;
  }

  return Math.min(maxLen, 5);
}

// Game State
class SequenceGame {
  constructor(forceFresh = false) {
    const saved = !forceFresh ? StorageManager.loadMatch() : null;
    const settings = StorageManager.getSettings();
    this.isTurbo = settings.isTurbo || false;

    const isValidSaved = saved && 
      !saved.isGameOver && 
      Array.isArray(saved.playerHand) && saved.playerHand.length === 7 &&
      Array.isArray(saved.aiHand) && saved.aiHand.length === 7 &&
      Array.isArray(saved.boardState) && saved.boardState.length === 10 &&
      Array.isArray(saved.deck);

    if (isValidSaved) {
      this.boardState = saved.boardState;
      this.deck = saved.deck;
      this.discardPile = saved.discardPile || [];
      this.playerHand = saved.playerHand;
      this.aiHand = saved.aiHand;
      this.currentTurn = saved.currentTurn || 'player';
      this.selectedCardIndex = null;
      this.targetSequences = saved.targetSequences || 1;
      this.drawMode = saved.drawMode || 'auto';
      this.lastPlayerDiscard = saved.lastPlayerDiscard;
      this.lastAiDiscard = saved.lastAiDiscard;
      this.lastDrawnSlot = null;
      this.pendingDrawSlot = null;
      this.playerSequences = saved.playerSequences || [];
      this.aiSequences = saved.aiSequences || [];
      this.isGameOver = false;
      this.isAiThinking = false;
    } else {
      this.boardState = initBoardState();
      this.deck = createFreshDeck();
      this.discardPile = [];
      this.playerHand = [];
      this.aiHand = [];
      this.currentTurn = 'player';
      this.selectedCardIndex = null;
      this.targetSequences = 1;
      this.drawMode = 'auto';
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
  }

  showCompanion(text) {
    // Machine feedback bar removed per user preference - safe no-op
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
    StorageManager.saveMatch(this);
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
      this.showCompanion("Fresh card drawn! Better luck with this one.");
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
    StorageManager.saveMatch(this);
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
      const chainLen = getMaxChainLengthAt(this.boardState, move.r, move.c, color);
      
      if (parsed.isTwoEyed) {
        SoundEngine.jackAction(false);
        this.log(`${player === 'player' ? 'You' : 'Machine'} played Two-Eyed Jack (${parsed.name}) at (${move.r}, ${move.c})!`, 'jack');
        if (player === 'player') this.showCompanion("Wild Jack! Very clever placement.");
      } else {
        SoundEngine.chipPlace(chainLen);
        this.log(`${player === 'player' ? 'You' : 'Machine'} played ${parsed.name} and placed chip at (${move.r}, ${move.c}).`, player);
        if (player === 'player') {
          if (chainLen === 3) this.showCompanion("Ooh, 3 in a row! Nice build.");
          else if (chainLen === 4) this.showCompanion("Whoa, you're only 1 chip away from a sequence!");
        }
      }
    } else if (move.action === 'remove') {
      this.boardState[move.r][move.c].token = null;
      SoundEngine.jackAction(true);
      // Screen micro-shake
      document.body.classList.add('screen-shake');
      setTimeout(() => document.body.classList.remove('screen-shake'), 320);

      this.log(`${player === 'player' ? 'You' : 'Machine'} played One-Eyed Jack (${parsed.name}) to REMOVE ${oppColor} chip at (${move.r}, ${move.c})!`, 'jack');
      if (player === 'player') {
        this.showCompanion("Ouch! You sniped my token!");
      } else {
        this.showCompanion("Oops, had to clear that one!");
      }
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
      if (player === 'player') {
        SoundEngine.sequenceFormed(); // Triggers the Chic "Good Times" Bass Riff!
        ConfettiEngine.launch(75);
        StorageManager.recordSequence();
        this.showCompanion("GOOD TIMES! 🎉 What a sequence!");
      } else {
        SoundEngine.playTone(392, 'triangle', 0.25, 0, 0.2);
        this.showCompanion("Sequence for me! Keep pushing!");
      }
      this.log(`🎉 ${player === 'player' ? 'YOU' : 'LUCKY'} FORMED A SEQUENCE! (${currentSeqs.length}/${this.targetSequences})`, 'sequence');
    }

    if (currentSeqs.length >= this.targetSequences) {
      this.isGameOver = true;
      this.selectedCardIndex = null;
      if (player === 'player') {
        StorageManager.recordWin();
        SoundEngine.victory();
        ConfettiEngine.launch(110);
        this.showCompanion("Spectacular win! You're on fire! 🔥");
      } else {
        StorageManager.recordLoss();
        this.showCompanion("Good match! Care for a rematch?");
      }
      StorageManager.clearMatch();
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
        StorageManager.saveMatch(this);
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
        StorageManager.saveMatch(this);
        this.render();
        this.triggerAiTurn();
      }
    } else {
      // AI automatically draws
      const newCard = this.drawCard();
      this.aiHand[cardIndex] = newCard;
      this.log(`🃏 Lucky discarded ${parsed.name} and drew next card.`, 'ai');

      this.currentTurn = 'player';
      StorageManager.saveMatch(this);
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
    StorageManager.saveMatch(this);
    this.render();
    this.triggerAiTurn();
  }

  triggerAiTurn(swapAttempts = 0) {
    if (this.isGameOver) {
      this.isAiThinking = false;
      return;
    }

    this.isAiThinking = true;
    this.render();

    const thinkTime = this.isTurbo ? 120 : (500 + Math.floor(Math.random() * 200));
    setTimeout(() => {
      try {
        if (this.isGameOver) {
          this.isAiThinking = false;
          return;
        }

        const aiDecision = getBestAIMove(this.aiHand, this.boardState, 'red');
        this.isAiThinking = false;

        if (!aiDecision) {
          this.log("Lucky had no playable moves and passed turn.", "ai");
          this.currentTurn = 'player';
          StorageManager.saveMatch(this);
          this.render();
          return;
        }

        if (aiDecision.type === 'swap') {
          if (swapAttempts >= 7) {
            this.log("Lucky finished card adjustments.", "ai");
            this.currentTurn = 'player';
            StorageManager.saveMatch(this);
            this.render();
            return;
          }
          this.swapDeadCard('ai', aiDecision.index);
          setTimeout(() => this.triggerAiTurn(swapAttempts + 1), this.isTurbo ? 100 : 300);
        } else if (aiDecision.type === 'play') {
          this.executeMove('ai', aiDecision.index, aiDecision.move);
        }
      } catch (err) {
        console.error("AI turn exception handled:", err);
        this.isAiThinking = false;
        this.currentTurn = 'player';
        StorageManager.saveMatch(this);
        this.render();
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

  simulateWin(winner) {
    SoundEngine.unlock();
    this.isGameOver = true;
    this.selectedCardIndex = null;

    if (winner === 'player') {
      this.playerSequences = Array.from({ length: this.targetSequences }, (_, i) => ({ id: `sim-${i}` }));
      StorageManager.recordWin();
      SoundEngine.victory();
      ConfettiEngine.launch(120);
      this.showCompanion("GOOD TIMES! 🎉 Spectacular win! You're on fire! 🔥");
      this.log(`🏆 [TEST SIMULATION] Player formed ${this.targetSequences} sequence(s) and won!`, 'sequence');
    } else {
      this.aiSequences = Array.from({ length: this.targetSequences }, (_, i) => ({ id: `sim-${i}` }));
      StorageManager.recordLoss();
      SoundEngine.defeat();
      this.showCompanion("Good match! Care for a rematch? 🍀");
      this.log(`🍀 [TEST SIMULATION] Lucky formed ${this.targetSequences} sequence(s) and won!`, 'ai');
    }

    StorageManager.clearMatch();
    this.render();
    this.showVictoryModal(winner);
  }

  showVictoryModal(winner) {
    const overlay = document.getElementById('victoryOverlay');
    const title = document.getElementById('victoryTitle');
    const subtitle = document.getElementById('victorySubtitle');
    if (!overlay) return;

    const stats = StorageManager.getStats();
    if (winner === 'player') {
      title.textContent = '🏆 Victory!';
      title.className = 'victory-title player';
      subtitle.innerHTML = `Spectacular! You formed ${this.targetSequences} sequence${this.targetSequences > 1 ? 's' : ''} and defeated Lucky!<br><span style="display:inline-block; margin-top:10px; color:#d97706; font-weight:800;">🔥 Current Win Streak: ${stats.currentStreak} (Best: ${stats.bestStreak})</span>`;
    } else {
      title.textContent = '🍀 Lucky Wins!';
      title.className = 'victory-title ai';
      subtitle.innerHTML = `Lucky formed ${this.targetSequences} sequence${this.targetSequences > 1 ? 's' : ''}. Better luck next round!<br><span style="display:inline-block; margin-top:10px; color:#64748b; font-weight:600;">Total Lifetime Wins: ${stats.wins}</span>`;
    }
    overlay.style.display = 'flex';
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

    const streakCount = document.getElementById('streakCount');
    const headerPlayCount = document.getElementById('headerPlayCount');
    if (streakCount || headerPlayCount) {
      const stats = StorageManager.getStats();
      if (streakCount) streakCount.textContent = stats.currentStreak || 0;
      if (headerPlayCount) headerPlayCount.textContent = stats.plays || 1;
    }

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
        statusText.innerHTML = '<span class="pulse-dot"></span> <b>Lucky is thinking...</b>';
      } else if (this.currentTurn === 'player') {
        turnBanner.className = 'turn-banner player-turn';
        if (this.selectedCardIndex !== null && this.playerHand[this.selectedCardIndex]) {
          const card = parseCard(this.playerHand[this.selectedCardIndex]);
          if (card.isTwoEyed) {
            statusText.innerHTML = '<span class="pulse-dot"></span> <b>TWO-EYED JACK:</b> Click ANY empty square on the board!';
          } else if (card.isOneEyed) {
            statusText.innerHTML = '<span class="pulse-dot"></span> <b>ONE-EYED JACK:</b> Click any RED chip to remove!';
          } else {
            statusText.innerHTML = `<span class="pulse-dot"></span> Selected <b>${card.name}</b> — Click a highlighted square on board.`;
          }
        } else {
          statusText.innerHTML = '<span class="pulse-dot"></span> <b>YOUR TURN:</b> Select a card from your hand below.';
        }
      } else {
        turnBanner.className = 'turn-banner ai-turn';
        statusText.innerHTML = '<span class="pulse-dot"></span> <b>Lucky\'s Turn</b>';
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
  ConfettiEngine.init();
  StorageManager.recordVisit();

  const settings = StorageManager.getSettings();

  // Apply Theme
  const applyTheme = (themeName) => {
    document.body.className = `theme-${themeName}`;
    document.querySelectorAll('.settings-options [data-theme]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === themeName);
    });
  };
  applyTheme(settings.theme || 'light');

  game = new SequenceGame();
  game.render();
  if (game.currentTurn === 'ai' && !game.isGameOver) {
    setTimeout(() => game.triggerAiTurn(), 350);
  }
  game.log("Welcome to Sequence! You play Blue, Lucky plays Red.", "system");
  game.log("Rule: When a card is played, it is discarded and you draw the next card from the deck!", "system");
  game.log("Click any card in your hand to highlight playable board squares.", "system");

  const restartBtn = document.getElementById('restartBtn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      if (confirm("Restart game with a fresh shuffle?")) {
        StorageManager.clearMatch();
        StorageManager.recordMatchStarted();
        game = new SequenceGame(true);
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

  // Settings & Theme Switcher
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');

  const updateStatsDisplay = () => {
    const stats = StorageManager.getStats();
    const elPlays = document.getElementById('statPlays');
    const elWins = document.getElementById('statWins');
    const elStreak = document.getElementById('statStreak');
    const elBest = document.getElementById('statBestStreak');
    if (elPlays) elPlays.textContent = stats.plays || 1;
    if (elWins) elWins.textContent = stats.wins;
    if (elStreak) elStreak.textContent = stats.currentStreak;
    if (elBest) elBest.textContent = stats.bestStreak;
  };

  if (settingsBtn && settingsModal) {
    settingsBtn.addEventListener('click', () => {
      updateStatsDisplay();
      settingsModal.style.display = 'flex';
      settingsModal.classList.add('open');
    });
  }
  if (closeSettingsBtn && settingsModal) {
    closeSettingsBtn.addEventListener('click', () => {
      settingsModal.style.display = 'none';
      settingsModal.classList.remove('open');
    });
  }

  // Theme selector buttons
  document.querySelectorAll('.settings-options [data-theme]').forEach(btn => {
    btn.addEventListener('click', () => {
      const selected = btn.dataset.theme;
      const s = StorageManager.getSettings();
      s.theme = selected;
      StorageManager.saveSettings(s);
      applyTheme(selected);
      SoundEngine.cardDraw();
    });
  });

  // Speed toggle buttons
  const speedNormalBtn = document.getElementById('speedNormalBtn');
  const speedTurboBtn = document.getElementById('speedTurboBtn');
  const updateSpeedUI = (isTurbo) => {
    if (speedNormalBtn) speedNormalBtn.classList.toggle('active', !isTurbo);
    if (speedTurboBtn) speedTurboBtn.classList.toggle('active', isTurbo);
    if (game) game.isTurbo = isTurbo;
  };
  updateSpeedUI(settings.isTurbo || false);

  if (speedNormalBtn) {
    speedNormalBtn.addEventListener('click', () => {
      const s = StorageManager.getSettings();
      s.isTurbo = false;
      StorageManager.saveSettings(s);
      updateSpeedUI(false);
      SoundEngine.cardDraw();
    });
  }
  if (speedTurboBtn) {
    speedTurboBtn.addEventListener('click', () => {
      const s = StorageManager.getSettings();
      s.isTurbo = true;
      StorageManager.saveSettings(s);
      updateSpeedUI(true);
      SoundEngine.cardDraw();
    });
  }

  // Reset stats button
  const resetStatsBtn = document.getElementById('resetStatsBtn');
  if (resetStatsBtn) {
    resetStatsBtn.addEventListener('click', () => {
      if (confirm("Reset all lifetime win/streak statistics?")) {
        StorageManager.resetStats();
        updateStatsDisplay();
        if (game) game.render();
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
    rulesBtn.addEventListener('click', () => {
      rulesModal.style.display = 'flex';
      rulesModal.classList.add('open');
    });
  }
  if (closeRulesBtn && rulesModal) {
    closeRulesBtn.addEventListener('click', () => {
      rulesModal.style.display = 'none';
      rulesModal.classList.remove('open');
    });
  }

  const playAgainBtn = document.getElementById('playAgainBtn');
  const victoryOverlay = document.getElementById('victoryOverlay');
  if (playAgainBtn && victoryOverlay) {
    playAgainBtn.addEventListener('click', () => {
      victoryOverlay.style.display = 'none';
      victoryOverlay.classList.remove('open');
      StorageManager.clearMatch();
      StorageManager.recordMatchStarted();
      game = new SequenceGame(true);
      document.getElementById('logContent').innerHTML = '';
      game.render();
      game.log("New game started! Good luck.", "system");
    });
  }
}

window.addEventListener('DOMContentLoaded', initApp);
