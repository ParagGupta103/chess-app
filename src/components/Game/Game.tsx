import { DEFAULT_POSITION, type Color, type PieceSymbol, type Square } from 'chess.js'
import { useCallback, useMemo, useState } from 'react'
import './Game.css'
import Chessboard from '../Chessboard/Chessboard'
import Clock from '../Clock/Clock'
import type { GameRecord } from '../../analysis/analysis'
import { levels } from '../../engine/levels'
import { parseTimeControl } from '../../game/clock'
import type { GameSettings } from '../../game/settings'
import { useChessClock } from '../../game/useChessClock'
import { useChessGame } from '../../game/useChessGame'
import { useComputerOpponent } from '../../game/useComputerOpponent'

interface Props {
    settings: GameSettings;
    onNewGame: () => void;
    onAnalyze: (record: GameRecord) => void;
    fen?: string; // starting position, defaults to the normal one
}

const other = (color: Color): Color => color === 'w' ? 'b' : 'w'

export default function Game({ settings, onNewGame, onAnalyze, fen = DEFAULT_POSITION }: Props) {
    const game = useChessGame(fen)
    const [player] = useState<Color>(() =>
        settings.color === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : settings.color)
    const computer = settings.opponent === 'computer' ? other(player) : null

    const control = useMemo(() => parseTimeControl(settings.timeControl), [settings.timeControl])
    const clock = useChessClock(control, !game.result, game.timeOut)

    // Every move, the player's or the computer's, also presses the clock
    const { move, turn } = game
    const { press } = clock
    const play = useCallback((from: Square, to: Square, promotion?: PieceSymbol) => {
        if (move(from, to, promotion)) press(turn)
    }, [move, press, turn])

    const computerTime = computer && clock.running === computer ? clock.remaining[computer] : undefined
    const { thinking, error } = useComputerOpponent(game, computer, levels[settings.level - 1], play, computerTime)

    const sideToMove = computer ? 'Your move' : `${game.turn === 'w' ? 'White' : 'Black'} to move`
    const status = error ?? game.result ?? (thinking ? 'Computer is thinking…' : sideToMove) +
        (game.inCheck ? ' — check!' : '')

    function resign() {
        clock.stop()
        // Against the computer you resign; between friends, whoever's turn it is does
        game.resign(computer ? player : game.turn)
    }

    function analyze() {
        onAnalyze({ startFen: fen, moves: game.moves, result: game.result, flipped: computer === 'w' })
    }

    // Your clock goes below the board, the opponent's above it
    const bottom = computer === 'w' ? 'b' : 'w'
    const clockFor = (color: Color) => control && <Clock
        label={computer ? (color === computer ? 'Computer' : 'You') : (color === 'w' ? 'White' : 'Black')}
        remaining={clock.remaining[color]}
        since={clock.since}
        running={clock.running === color}
    />

    return <div className='game'>
        <output className='status'>{status}</output>
        <div className='board-column'>
            {clockFor(other(bottom))}
            <Chessboard game={game} onMove={play} flipped={computer === 'w'} disabled={thinking || !!error} />
            {clockFor(bottom)}
        </div>
        <div className='actions'>
            {!game.result && <button className='text-button secondary' onClick={resign}>Resign</button>}
            {game.result && game.moves.length > 0 && <button className='text-button' onClick={analyze}>
                Analyze game
            </button>}
            <button className='text-button' onClick={onNewGame}>New game</button>
        </div>
    </div>
}
