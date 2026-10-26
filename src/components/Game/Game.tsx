import { DEFAULT_POSITION, type Color } from 'chess.js'
import { useState } from 'react'
import './Game.css'
import Chessboard from '../Chessboard/Chessboard'
import type { GameRecord } from '../../analysis/analysis'
import { levels } from '../../engine/levels'
import type { GameSettings } from '../../game/settings'
import { useChessGame } from '../../game/useChessGame'
import { useComputerOpponent } from '../../game/useComputerOpponent'

interface Props {
    settings: GameSettings;
    onNewGame: () => void;
    onAnalyze: (record: GameRecord) => void;
    fen?: string; // starting position, defaults to the normal one
}

export default function Game({ settings, onNewGame, onAnalyze, fen = DEFAULT_POSITION }: Props) {
    const game = useChessGame(fen)
    const [player] = useState<Color>(() =>
        settings.color === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : settings.color)
    const computer = settings.opponent === 'computer' ? (player === 'w' ? 'b' : 'w') : null
    const { thinking, error } = useComputerOpponent(game, computer, levels[settings.level - 1])

    const turn = computer ? 'Your move' : `${game.turn === 'w' ? 'White' : 'Black'} to move`
    const status = error ?? game.result ?? (thinking ? 'Computer is thinking…' : turn) +
        (game.inCheck ? ' — check!' : '')

    function analyze() {
        onAnalyze({ startFen: fen, moves: game.moves, result: game.result, flipped: computer === 'w' })
    }

    return <div className='game'>
        <output className='status'>{status}</output>
        <Chessboard game={game} onMove={game.move} flipped={computer === 'w'} disabled={thinking || !!error} />
        <div className='actions'>
            {/* Against the computer you resign; between friends, whoever's turn it is does */}
            {!game.result && <button className='text-button secondary' onClick={() => game.resign(computer ? player : game.turn)}>
                Resign
            </button>}
            {game.result && game.moves.length > 0 && <button className='text-button' onClick={analyze}>
                Analyze game
            </button>}
            <button className='text-button' onClick={onNewGame}>New game</button>
        </div>
    </div>
}
