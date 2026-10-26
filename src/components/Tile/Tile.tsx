import type { Piece, Square } from 'chess.js'
import type { PointerEvent } from 'react'
import './Tile.css'
import { pieceImage, pieceLabel } from '../../game/pieces'

interface Props {
    square: Square;
    piece: Piece | null;
    dark: boolean;
    selected: boolean;
    lastMove: boolean;
    inCheck: boolean;
    hint: boolean;
    dragging: boolean; // this square's piece is being dragged elsewhere
    target?: 'move' | 'capture';
    onClick: () => void;
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => void;
}

export default function Tile({square, piece, dark, selected, lastMove, inCheck, hint, dragging, target, onClick, onPointerDown}: Props){
    const className = [
        'tile',
        dark ? 'black-tile' : 'white-tile',
        (selected || lastMove) && 'highlight',
        hint && 'hint',
        inCheck && 'in-check',
        dragging && 'dragging',
        target && `${target}-target`,
    ].filter(Boolean).join(' ');

    return <button
        className={className}
        data-square={square}
        aria-label={piece ? `${square}, ${pieceLabel(piece)}` : square}
        onClick={onClick}
        onPointerDown={onPointerDown}
    >
        {piece && <img src={pieceImage(piece)} alt={pieceLabel(piece)} draggable={false} />}
    </button>
}
