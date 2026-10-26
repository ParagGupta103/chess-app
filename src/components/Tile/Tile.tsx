import type { Piece, Square } from 'chess.js'
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
    target?: 'move' | 'capture';
    onClick: () => void;
}

export default function Tile({square, piece, dark, selected, lastMove, inCheck, hint, target, onClick}: Props){
    const className = [
        'tile',
        dark ? 'black-tile' : 'white-tile',
        (selected || lastMove) && 'highlight',
        hint && 'hint',
        inCheck && 'in-check',
        target && `${target}-target`,
    ].filter(Boolean).join(' ');

    return <button
        className={className}
        aria-label={piece ? `${square}, ${pieceLabel(piece)}` : square}
        onClick={onClick}
    >
        {piece && <img src={pieceImage(piece)} alt={pieceLabel(piece)} />}
    </button>
}
