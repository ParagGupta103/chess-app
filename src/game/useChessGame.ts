import { Chess, DEFAULT_POSITION, type Color, type Move, type PieceSymbol, type Square } from 'chess.js'
import { useCallback, useState } from 'react'

const sideName = (color: Color) => color === 'w' ? 'White' : 'Black'
const other = (color: Color): Color => color === 'w' ? 'b' : 'w'

// Whether `color` has the material to ever checkmate. Simplified from the official rule:
// a lone king, or a king with a single bishop or knight, cannot.
function canCheckmate(game: Chess, color: Color) {
    const pieces = game.board().flat().filter(p => p && p.color === color && p.type !== 'k')
    return pieces.length >= 2 || pieces.some(p => p!.type === 'p' || p!.type === 'r' || p!.type === 'q')
}

// Text describing how the game ended by the rules of play, or null while it is still going
function result(game: Chess) {
    if (game.isCheckmate()) return `Checkmate — ${sideName(other(game.turn()))} wins`
    if (game.isStalemate()) return 'Draw by stalemate'
    if (game.isInsufficientMaterial()) return 'Draw by insufficient material'
    if (game.isThreefoldRepetition()) return 'Draw by threefold repetition'
    if (game.isDrawByFiftyMoves()) return 'Draw by the 50-move rule'
    return null
}

// Everything the board needs to draw a position and offer its legal moves.
// `ended` is set when the game finished another way, by resignation or on time.
export function viewOf(game: Chess, ended: string | null = null) {
    const over = ended ?? result(game)
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
    const [ended, setEnded] = useState<string | null>(null)
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
        ...viewOf(game, ended),
        move,
        resign: (color: Color) => setEnded(`${sideName(color)} resigned — ${sideName(other(color))} wins`),
        timeOut: (color: Color) => setEnded(canCheckmate(game, other(color))
            ? `${sideName(color)} ran out of time — ${sideName(other(color))} wins`
            : `Draw — ${sideName(color)} ran out of time, but ${sideName(other(color))} cannot checkmate`),
    }
}

export type ChessGame = ReturnType<typeof useChessGame>
