import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js'
import type { EngineAnalysis } from '../engine/engine'

// A finished game, handed from the game screen to the review screen
export interface GameRecord {
    startFen: string;
    moves: string[]; // SAN, e.g. ["e4", "e5", "Nf3"]
    result: string | null;
    flipped: boolean; // show the board from black's side
}

export interface PlayedMove {
    san: string;
    from: Square;
    to: Square;
    promotion?: PieceSymbol;
}

export interface Position {
    fen: string;
    turn: Color;
    moveNumber: number;
    move?: PlayedMove; // the move that led here; missing for the starting position
    final?: Evaluation; // set when the game is over here, so there is nothing to ask the engine
}

// Always from White's point of view; mates are scored as ±MATE so they compare with centipawns
export interface Evaluation {
    cp: number;
    mate?: number; // moves until mate, negative when Black mates; 0 once the game is over by checkmate
    best?: PlayedMove; // the engine's choice in this position
}

export type MoveKind = 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder'

export interface MoveReview {
    ply: number; // index of the position this move leads to
    color: Color;
    moveNumber: number;
    move: PlayedMove;
    kind?: MoveKind; // missing until both positions around the move are evaluated
    loss?: number; // how much the move lowered the mover's chance of winning, in percentage points
    best?: PlayedMove; // what the engine preferred
}

export const MATE = 10000

// Every position in the game, from the start to after the last move
export function buildPositions(startFen: string, moves: string[]): Position[] {
    const game = new Chess(startFen)
    const snapshot = (move?: PlayedMove): Position => {
        const position: Position = {
            fen: game.fen(),
            turn: game.turn(),
            moveNumber: game.moveNumber(),
            move,
        }
        if (game.isCheckmate()) position.final = { cp: game.turn() === 'w' ? -MATE : MATE, mate: 0 }
        else if (game.isDraw()) position.final = { cp: 0 }
        return position
    }

    const positions = [snapshot()]
    for (const san of moves) {
        const { from, to, promotion, san: played } = game.move(san)
        positions.push(snapshot({ san: played, from, to, promotion }))
    }
    return positions
}

// Turns the engine's side-to-move score into an Evaluation from White's point of view
export function toEvaluation(position: Position, { score, best }: EngineAnalysis): Evaluation {
    const sign = position.turn === 'w' ? 1 : -1
    const evaluation: Evaluation = 'mate' in score
        ? { cp: Math.sign(score.mate) * sign * MATE, mate: score.mate * sign }
        : { cp: score.cp * sign }
    if (best) {
        const { san } = new Chess(position.fen).move(best)
        evaluation.best = { ...best, san }
    }
    return evaluation
}

// Chance of winning for White, 0-100, using Lichess's centipawn-to-win-rate curve
export function winPercent(cp: number) {
    return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1)
}

// Lichess's per-move accuracy, from the drop in win percentage
function moveAccuracy(loss: number) {
    return Math.min(100, Math.max(0, 103.1668 * Math.exp(-0.04354 * loss) - 3.1669))
}

const sameMove = (a: PlayedMove, b?: PlayedMove) =>
    !!b && a.from === b.from && a.to === b.to && (a.promotion ?? null) === (b.promotion ?? null)

export function reviewMoves(positions: Position[], evaluations: (Evaluation | undefined)[]): MoveReview[] {
    return positions.slice(1).map((position, i) => {
        const before = positions[i]
        const review: MoveReview = {
            ply: i + 1,
            color: before.turn,
            moveNumber: before.moveNumber,
            move: position.move!,
            best: evaluations[i]?.best,
        }
        const [start, end] = [evaluations[i], evaluations[i + 1]]
        if (!start || !end) return review

        const sign = before.turn === 'w' ? 1 : -1
        review.loss = Math.max(0, winPercent(start.cp * sign) - winPercent(end.cp * sign))
        // Thresholds are Lichess's: 0.1 / 0.2 / 0.3 winning chances, i.e. 5 / 10 / 15 percentage points
        review.kind =
            sameMove(review.move, review.best) ? 'best' :
            review.loss >= 15 ? 'blunder' :
            review.loss >= 10 ? 'mistake' :
            review.loss >= 5 ? 'inaccuracy' :
            'good'
        return review
    })
}

export interface SideSummary {
    accuracy: number;
    inaccuracies: number;
    mistakes: number;
    blunders: number;
}

export function summarize(reviews: MoveReview[], color: Color): SideSummary | null {
    const own = reviews.filter(r => r.color === color)
    if (own.length === 0 || own.some(r => r.loss === undefined)) return null
    const count = (kind: MoveKind) => own.filter(r => r.kind === kind).length
    return {
        accuracy: Math.round(own.reduce((sum, r) => sum + moveAccuracy(r.loss!), 0) / own.length),
        inaccuracies: count('inaccuracy'),
        mistakes: count('mistake'),
        blunders: count('blunder'),
    }
}

// "+0.4", "-1.2", "M3", "-M2", or the result once the game is over by checkmate
export function formatEvaluation({ cp, mate }: Evaluation) {
    if (mate === 0) return cp > 0 ? '1-0' : '0-1'
    if (mate !== undefined) return `${mate < 0 ? '-' : ''}M${Math.abs(mate)}`
    return `${cp >= 0 ? '+' : ''}${(cp / 100).toFixed(1)}`
}

export const moveLabels: Record<MoveKind, string> = {
    best: 'Best move',
    good: 'Good move',
    inaccuracy: 'Inaccuracy',
    mistake: 'Mistake',
    blunder: 'Blunder',
}

export const moveSymbols: Partial<Record<MoveKind, string>> = {
    inaccuracy: '?!',
    mistake: '?',
    blunder: '??',
}
