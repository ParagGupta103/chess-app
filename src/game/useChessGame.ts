import { Chess, DEFAULT_POSITION, type Color, type Move, type PieceSymbol, type Square } from 'chess.js'
import { useCallback, useState } from 'react'

const sideName = (color: Color) => color === 'w' ? 'White' : 'Black'

// Text describing how the game ended, or null while it is still going
function result(game: Chess, resigned: Color | null) {
    if (resigned) return `${sideName(resigned)} resigned — ${sideName(resigned === 'w' ? 'b' : 'w')} wins`
    if (game.isCheckmate()) return `Checkmate — ${sideName(game.turn() === 'w' ? 'b' : 'w')} wins`
    if (game.isStalemate()) return 'Draw by stalemate'
    if (game.isInsufficientMaterial()) return 'Draw by insufficient material'
    if (game.isThreefoldRepetition()) return 'Draw by threefold repetition'
    if (game.isDrawByFiftyMoves()) return 'Draw by the 50-move rule'
    return null
}

// Everything the board needs to draw a position and offer its legal moves
export function viewOf(game: Chess, resigned: Color | null = null) {
    const over = result(game, resigned)
    return {
        fen: game.fen(),
        board: game.board(),
        turn: game.turn(),
        inCheck: game.inCheck(),
        result: over,
        moves: game.history(),
        lastMove: game.history({ verbose: true }).at(-1),
        pieceAt: (square: Square) => game.get(square),
        movesFrom: (square: Square): Move[] => over ? [] : game.moves({ square, verbose: true }),
    }
}

export type BoardView = ReturnType<typeof viewOf>

export function useChessGame(fen = DEFAULT_POSITION) {
    // chess.js mutates itself in place, so keep one instance and bump a counter to re-render
    const [game] = useState(() => new Chess(fen))
    const [resigned, setResigned] = useState<Color | null>(null)
    const [, setVersion] = useState(0)

    const move = useCallback((from: Square, to: Square, promotion?: PieceSymbol) => {
        try {
            game.move({ from, to, promotion })
        } catch {
            return false
        }
        setVersion(v => v + 1)
        return true
    }, [game])

    return {
        ...viewOf(game, resigned),
        move,
        resign: (color: Color) => setResigned(color),
    }
}

export type ChessGame = ReturnType<typeof useChessGame>
