import type { Piece, PieceSymbol } from 'chess.js'

export const pieceNames: Record<PieceSymbol, string> = {
    p: 'pawn',
    n: 'knight',
    b: 'bishop',
    r: 'rook',
    q: 'queen',
    k: 'king',
}

export function pieceImage({ type, color }: Piece) {
    return `${import.meta.env.BASE_URL}assets/images/${pieceNames[type]}_${color}.png`
}

// { type: 'k', color: 'w' } -> "white king"
export function pieceLabel({ type, color }: Piece) {
    return `${color === 'w' ? 'white' : 'black'} ${pieceNames[type]}`
}
