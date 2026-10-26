import { SQUARES, type Move, type Piece, type PieceSymbol, type Square } from 'chess.js'
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
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

interface Drag {
    from: Square;
    piece: Piece;
    start: { x: number; y: number };
    x: number;
    y: number;
    size: number; // width of a square, so the dragged piece matches the board
    moved: boolean; // false until the pointer goes far enough to count as a drag rather than a click
}

const promotionChoices = ['q', 'r', 'b', 'n'] as const

export default function Chessboard({ game, onMove, flipped, disabled, hint }: Props) {
    const [selected, setSelected] = useState<Square | null>(null)
    const [promotion, setPromotion] = useState<Move | null>(null) // pawn move waiting for a piece choice
    const [drag, setDrag] = useState<Drag | null>(null)
    const skipClick = useRef(false) // a drag dropped back on its own square still fires a click there

    const canMove = !disabled && !!onMove && !game.result && !promotion
    const active = drag?.moved ? drag.from : selected
    const targets = active ? game.movesFrom(active) : []

    function play(move: Move) {
        if (move.isPromotion()) {
            setSelected(move.from)
            setPromotion(move)
        } else {
            onMove?.(move.from, move.to)
            setSelected(null)
        }
    }

    function handleClick(square: Square) {
        if (skipClick.current || !canMove) return

        const move = targets.find(m => m.to === square)
        if (move) {
            play(move)
        } else {
            // Select one of your own pieces, or clear the selection
            const piece = game.pieceAt(square)
            setSelected(piece?.color === game.turn && square !== selected ? square : null)
        }
    }

    function startDrag(square: Square, e: ReactPointerEvent<HTMLButtonElement>) {
        const piece = game.pieceAt(square)
        if (!canMove || e.button !== 0 || piece?.color !== game.turn) return
        const point = { x: e.clientX, y: e.clientY }
        setDrag({ from: square, piece, start: point, ...point, size: e.currentTarget.offsetWidth, moved: false })
    }

    // While a piece is held, follow the pointer anywhere on the page and drop it where it's released
    useEffect(() => {
        if (!drag) return
        const held = drag

        function onPointerMove(e: PointerEvent) {
            const moved = held.moved || Math.hypot(e.clientX - held.start.x, e.clientY - held.start.y) > 4
            setDrag({ ...held, x: e.clientX, y: e.clientY, moved })
        }
        function onPointerUp(e: PointerEvent) {
            setDrag(null)
            if (!held.moved) return // just a click, which handleClick deals with

            skipClick.current = true
            setTimeout(() => { skipClick.current = false }) // after any click from this release
            const square = document.elementFromPoint(e.clientX, e.clientY)
                ?.closest<HTMLElement>('[data-square]')?.dataset.square
            const move = game.movesFrom(held.from).find(m => m.to === square)
            if (move) play(move)
            else setSelected(held.from) // dropped somewhere illegal: keep the piece selected
        }
        const cancel = () => setDrag(null)

        window.addEventListener('pointermove', onPointerMove)
        window.addEventListener('pointerup', onPointerUp)
        window.addEventListener('pointercancel', cancel)
        return () => {
            window.removeEventListener('pointermove', onPointerMove)
            window.removeEventListener('pointerup', onPointerUp)
            window.removeEventListener('pointercancel', cancel)
        }
    })

    function promote(type: typeof promotionChoices[number] | null) {
        if (promotion && type) {
            onMove?.(promotion.from, promotion.to, type)
        }
        setSelected(null)
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
            selected={square === active}
            lastMove={square === game.lastMove?.from || square === game.lastMove?.to}
            inCheck={game.inCheck && piece?.type === 'k' && piece.color === game.turn}
            hint={square === hint?.from || square === hint?.to}
            dragging={!!drag?.moved && square === drag.from}
            target={target && (target.isCapture() ? 'capture' : 'move')}
            onClick={() => handleClick(square)}
            onPointerDown={e => startDrag(square, e)}
        />
    })

    return <div id='Chessboard' className={onMove ? 'playable' : undefined}>
        {flipped ? board.reverse() : board}
        {drag?.moved && <img
            className='drag-piece'
            src={pieceImage(drag.piece)}
            alt=''
            style={{ left: drag.x, top: drag.y, width: drag.size * 0.9 }}
        />}
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
