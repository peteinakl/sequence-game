# Sequence Board Game (Single Player vs. AI)

A web implementation of the classic board game **Sequence**, built with clean HTML5, CSS3, and JavaScript, featuring an intelligent heuristic AI opponent.

![Sequence Demo Preview](index.html)

## 🎮 Game Rules & Features

- **Official 10x10 Board Layout**: 100 spaces consisting of 4 wild corner spaces and 96 playing cards (each of the 48 non-Jack cards appears twice).
- **104-Card Dual Deck**:
  - 96 standard cards matching the board.
  - **Two-Eyed Jacks (♣, ♦)**: Completely WILD — place a token anywhere on the board.
  - **One-Eyed Jacks (♠, ♥)**: REMOVAL — remove an opponent's token from the board (unless it is part of a completed sequence).
- **Discard & Draw Flow**:
  - When a card is played, it is discarded to your discard pile.
  - A replacement card is drawn from the draw deck into your hand.
  - Choose between **Auto-Draw** and **Manual Draw** modes.
  - Supports **Dead Card** swapping (if both spaces on the board are already occupied).
- **Sequence Detection**:
  - Detects 5-in-a-row horizontally, vertically, and diagonally.
  - Integrates wild corner spaces.
  - Locks completed sequences with gold star badges and immunity against removal.
- **Smart AI Machine Opponent**:
  - Detects immediate winning opportunities.
  - Actively identifies and blocks player 4-in-a-row threats.
  - Uses One-Eyed Jacks strategically to break player chains.
- **Audio Synthesizer**: Dependency-free synthesized sound effects using the Web Audio API.

## 🚀 Getting Started

Simply open `index.html` in any modern web browser:

```bash
open index.html
```

Or run a local server:

```bash
python3 server.py
```

## 🧪 Testing

Run the automated test suite using Node.js:

```bash
node test_logic.js
```
