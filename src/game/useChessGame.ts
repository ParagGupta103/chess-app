import { Chess, DEFAULT_POSITION, type Move, type PieceSymbol, type Square } from 'chess.js'
import { useState } from 'react'

// Text describing how the game ended, or null while it is still going
function result(game: Chess) {
    if (game.isCheckmate()) return `Checkmate — ${game.turn() === 'w' ? 'Black' : 'White'} wins`
    if (game.isStalemate()) return 'Draw by stalemate'
    if (game.isInsufficientMaterial()) return 'Draw by insufficient material'
    if (game.isThreefoldRepetition()) return 'Draw by threefold repetition'
    if (game.isDrawByFiftyMoves()) return 'Draw by the 50-move rule'
    return null
}

export function useChessGame(fen = DEFAULT_POSITION) {
    // chess.js mutates itself in place, so keep one instance and bump a counter to re-render
    const [game] = useState(() => new Chess(fen))
    const [, setVersion] = useState(0)
    const changed = () => setVersion(v => v + 1)

    return {
        board: game.board(),
        turn: game.turn(),
        inCheck: game.inCheck(),
        result: result(game),
        lastMove: game.history({ verbose: true }).at(-1),
        pieceAt: (square: Square) => game.get(square),
        movesFrom: (square: Square): Move[] =>
            game.isGameOver() ? [] : game.moves({ square, verbose: true }),
        move(from: Square, to: Square, promotion?: PieceSymbol) {
            try {
                game.move({ from, to, promotion })
            } catch {
                return false
            }
            changed()
            return true
        },
        reset() {
            game.load(fen)
            changed()
        },
    }
}

export type ChessGame = ReturnType<typeof useChessGame>
