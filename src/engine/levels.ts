import { Chess } from 'chess.js'
import { getEngine, type EngineMove, type SearchLimits } from './engine'

export interface Level extends SearchLimits {
    name: string;
    randomness: number; // chance of playing a random legal move instead of asking Stockfish
}

// Stockfish's weakest setting is still too strong for beginners,
// so the lowest levels also play some random moves
export const levels: Level[] = [
    { name: 'Beginner', skill: 0, depth: 1, movetime: 100, randomness: 0.5 },
    { name: 'Novice', skill: 0, depth: 1, movetime: 100, randomness: 0.25 },
    { name: 'Casual', skill: 0, depth: 2, movetime: 200, randomness: 0.1 },
    { name: 'Intermediate', skill: 3, depth: 4, movetime: 300, randomness: 0 },
    { name: 'Club player', skill: 6, depth: 6, movetime: 500, randomness: 0 },
    { name: 'Strong', skill: 10, depth: 8, movetime: 700, randomness: 0 },
    { name: 'Expert', skill: 15, depth: 12, movetime: 1000, randomness: 0 },
    { name: 'Maximum', skill: 20, depth: 20, movetime: 2000, randomness: 0 },
]

export async function computerMove(fen: string, level: Level): Promise<EngineMove> {
    if (Math.random() < level.randomness) {
        const moves = new Chess(fen).moves({ verbose: true })
        const { from, to, promotion } = moves[Math.floor(Math.random() * moves.length)]
        return { from, to, promotion }
    }
    return getEngine().bestMove(fen, level)
}
