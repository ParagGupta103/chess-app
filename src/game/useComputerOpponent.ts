import type { Color, PieceSymbol, Square } from 'chess.js'
import { useEffect, useState } from 'react'
import { stopEngine } from '../engine/engine'
import { computerMove, type Level } from '../engine/levels'
import type { BoardView } from './useChessGame'

// Plays the computer's moves through `play` whenever it is `computer`'s turn.
// With a clock, `timeLeft` is the computer's remaining time in ms and it thinks faster when short of it.
export function useComputerOpponent(
    game: BoardView,
    computer: Color | null,
    level: Level,
    play: (from: Square, to: Square, promotion?: PieceSymbol) => void,
    timeLeft?: number,
) {
    const [error, setError] = useState<string | null>(null)
    const thinking = game.turn === computer && !game.result && !error
    const { fen } = game

    useEffect(() => {
        if (!thinking) return
        let cancelled = false // set if the game is left or the position changes mid-search
        // Spend at most a thirtieth of the remaining time on a move
        const limits = timeLeft === undefined
            ? level
            : { ...level, movetime: Math.max(50, Math.min(level.movetime, Math.floor(timeLeft / 30))) }
        computerMove(fen, limits)
            .then(m => {
                if (!cancelled) play(m.from, m.to, m.promotion)
            })
            .catch(() => {
                if (!cancelled) setError('The computer opponent failed to load')
            })
        return () => {
            cancelled = true
            stopEngine()
        }
    }, [thinking, fen, level, play, timeLeft])

    return { thinking, error }
}
