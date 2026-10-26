import { useState } from 'react'
import './Game.css'
import Chessboard from '../Chessboard/Chessboard'
import { useChessGame } from '../../game/useChessGame'

interface Props {
    fen?: string; // starting position, defaults to the normal one
}

export default function Game({ fen }: Props) {
    const game = useChessGame(fen)
    // Changing the board's key remounts it, clearing any selection from the old game
    const [gameNumber, setGameNumber] = useState(0)

    function newGame() {
        game.reset()
        setGameNumber(n => n + 1)
    }

    const side = game.turn === 'w' ? 'White' : 'Black'
    const status = game.result ?? `${side} to move${game.inCheck ? ' — check!' : ''}`

    return <div className='game'>
        <output className='status'>{status}</output>
        <Chessboard key={gameNumber} game={game} />
        <button className='text-button' onClick={newGame}>New game</button>
    </div>
}
