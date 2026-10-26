import { SQUARES, type Move, type PieceSymbol, type Square } from 'chess.js'
import { useState } from 'react'
import './Chessboard.css'
import Tile from '../Tile/Tile'
import { pieceImage, pieceNames } from '../../game/pieces'
import type { BoardView } from '../../game/useChessGame'

interface Props {
    game: BoardView;
    onMove?: (from: Square, to: Square, promotion?: PieceSymbol) => void; // leave out for a board you can only look at
    flipped?: boolean; // show the board from black's side
    disabled?: boolean; // ignore clicks, e.g. while the computer is thinking
    hint?: { from: Square; to: Square }; // a move to point out, e.g. the engine's suggestion
}

const promotionChoices = ['q', 'r', 'b', 'n'] as const

export default function Chessboard({ game, onMove, flipped, disabled, hint }: Props) {
    const [selected, setSelected] = useState<Square | null>(null)
    const [promotion, setPromotion] = useState<Move | null>(null) // pawn move waiting for a piece choice
    const targets = selected ? game.movesFrom(selected) : []

    function handleClick(square: Square) {
        if (disabled || !onMove || game.result || promotion) return

        const move = targets.find(m => m.to === square)
        if (move?.isPromotion()) {
            setPromotion(move)
        } else if (move) {
            onMove(move.from, move.to)
            setSelected(null)
        } else {
            // Select one of your own pieces, or clear the selection
            const piece = game.pieceAt(square)
            setSelected(piece?.color === game.turn && square !== selected ? square : null)
        }
    }

    function promote(type: typeof promotionChoices[number] | null) {
        if (promotion && type) {
            onMove?.(promotion.from, promotion.to, type)
            setSelected(null)
        }
        setPromotion(null)
    }

    // board() and SQUARES both run a8, b8 ... h1
    const board = game.board.flat().map((piece, index) => {
        const square = SQUARES[index]
        const target = targets.find(m => m.to === square)
        return <Tile
            key={square}
            square={square}
            piece={piece}
            dark={(Math.floor(index / 8) + index % 8) % 2 === 1}
            selected={square === selected}
            lastMove={square === game.lastMove?.from || square === game.lastMove?.to}
            inCheck={game.inCheck && piece?.type === 'k' && piece.color === game.turn}
            hint={square === hint?.from || square === hint?.to}
            target={target && (target.isCapture() ? 'capture' : 'move')}
            onClick={() => handleClick(square)}
        />
    })

    return <div id='Chessboard'>
        {flipped ? board.reverse() : board}
        {promotion && <div className='promotion'>
            <div className='choices'>
                {promotionChoices.map(type =>
                    <button key={type} aria-label={`Promote to ${pieceNames[type]}`} onClick={() => promote(type)}>
                        <img src={pieceImage({ type, color: game.turn })} alt='' />
                    </button>
                )}
            </div>
            <button className='text-button' onClick={() => promote(null)}>Cancel</button>
        </div>}
    </div>
}
