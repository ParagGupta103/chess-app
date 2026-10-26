import type { Color } from 'chess.js'
import { useState } from 'react'
import './Game.css'
import Chessboard from '../Chessboard/Chessboard'
import { levels } from '../../engine/levels'
import type { GameSettings } from '../../game/settings'
import { useChessGame } from '../../game/useChessGame'
import { useComputerOpponent } from '../../game/useComputerOpponent'

interface Props {
    settings: GameSettings;
    onNewGame: () => void;
    fen?: string; // starting position, defaults to the normal one
}

export default function Game({ settings, onNewGame, fen }: Props) {
    const game = useChessGame(fen)
    const [player] = useState<Color>(() =>
        settings.color === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : settings.color)
    const computer = settings.opponent === 'computer' ? (player === 'w' ? 'b' : 'w') : null
    const { thinking, error } = useComputerOpponent(game, computer, levels[settings.level - 1])

    const turn = computer ? 'Your move' : `${game.turn === 'w' ? 'White' : 'Black'} to move`
    const status = error ?? game.result ?? (thinking ? 'Computer is thinking…' : turn) +
        (game.inCheck ? ' — check!' : '')

    return <div className='game'>
        <output className='status'>{status}</output>
        <Chessboard game={game} flipped={computer === 'w'} disabled={thinking || !!error} />
        <button className='text-button' onClick={onNewGame}>New game</button>
    </div>
}
