import type { Color } from 'chess.js'
import { useEffect, useState } from 'react'
import { stopEngine } from '../engine/engine'
import { computerMove, type Level } from '../engine/levels'
import type { ChessGame } from './useChessGame'

// Plays the computer's moves whenever it is `computer`'s turn
export function useComputerOpponent(game: ChessGame, computer: Color | null, level: Level) {
    const [error, setError] = useState<string | null>(null)
    const thinking = game.turn === computer && !game.result && !error
    const { fen, move } = game

    useEffect(() => {
        if (!thinking) return
        let cancelled = false // set if the game is left or the position changes mid-search
        computerMove(fen, level)
            .then(m => {
                if (!cancelled) move(m.from, m.to, m.promotion)
            })
            .catch(() => {
                if (!cancelled) setError('The computer opponent failed to load')
            })
        return () => {
            cancelled = true
            stopEngine()
        }
    }, [thinking, fen, level, move])

    return { thinking, error }
}
