# Chess-Tutor App (Under construction)

## Purpose
You can use the app to learn chess and understand chess tactics from basics to advanced, compare your skills against a computer that can analyze your games, and then help you understand how best to get started playing chess.

## Features

### Working now
- **Play against the computer.** Choose White, Black or a random side, and pick one of 8 levels from Beginner to Maximum. The board flips when you play Black.
- **Play a friend** on the same device.
- **All the rules of chess.** Only legal moves are allowed, including castling, en passant and promotion (you choose the piece). Check, checkmate and draws (stalemate, insufficient material, threefold repetition and the 50-move rule) are detected.
- **Move hints.** Selecting a piece shows its legal moves as dots, and pieces you can capture get a ring. The last move and a king in check are highlighted.
- **Keyboard play.** Every square is a button, so you can use Tab and Enter to play.

### Planned
- Analysis of finished games: the score of each position, the best moves, and labels for mistakes and blunders
- Tactics puzzles from basic to advanced
- Lessons for beginners
- Tracking your progress and skill over time

## How it works
- **Rules:** [chess.js](https://github.com/jhlywa/chess.js) handles move generation, legality and game-over detection. [src/game/useChessGame.ts](src/game/useChessGame.ts) wraps it for React.
- **Computer opponent:** [Stockfish 19](https://github.com/nmrugg/stockfish.js) (the single-threaded "lite" WebAssembly build, about 1.8 MB) runs in a Web Worker so the page stays responsive. [src/engine/engine.ts](src/engine/engine.ts) talks to it using the UCI protocol.
- **Difficulty levels:** [src/engine/levels.ts](src/engine/levels.ts) sets each level using Stockfish's skill level (0–20), a search depth and a time limit. Stockfish's weakest setting is still strong, so levels 1–3 also sometimes play a random legal move.

Everything runs in the browser. No server is needed beyond static hosting.

## Project structure
```
src/
  components/
    NewGame/      setup screen: opponent, side and level
    Game/         status line, board and the New game button
    Chessboard/   selecting pieces, highlighting moves, choosing a promotion piece
    Tile/         one square of the board
  engine/         Stockfish worker wrapper and difficulty levels
  game/           game state hooks (rules, computer opponent) and settings
public/assets/images/   piece images
```


## Setup
Requires Node.js 20.19+ or 22.12+ and Yarn 1. A conda environment works:

```
conda create -n chess-app -c conda-forge nodejs=22 yarn=1.22
conda activate chess-app
yarn install
```

## Available Scripts
Built with [Vite](https://vite.dev), React and TypeScript. In the project directory, you can run:

### `yarn start`

Runs the app in development mode.\
Open [http://localhost:5173](http://localhost:5173) to view it in the browser. The page updates as you edit.

### `yarn test`

Runs the tests with [Vitest](https://vitest.dev) in watch mode. Use `yarn test run` to run them once.

### `yarn lint`

Checks the code with [oxlint](https://oxc.rs/docs/guide/usage/linter).

### `yarn build`

Type-checks the code and builds the app for production to the `dist` folder.

### `yarn preview`

Serves the production build locally to check it before deploying.

## Licensing note
The Stockfish engine is licensed under [GPL-3.0](https://github.com/nmrugg/stockfish.js/blob/master/Copying.txt), and the production build includes it. If you deploy the app publicly, you need to meet the GPL's terms for Stockfish, which includes making its source available. Check what the GPL means for this project before you release it as closed source.
