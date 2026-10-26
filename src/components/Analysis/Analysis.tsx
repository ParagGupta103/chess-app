import { Chess } from 'chess.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import './Analysis.css'
import Chessboard from '../Chessboard/Chessboard'
import {
    buildPositions, formatEvaluation, moveLabels, moveSymbols, reviewMoves, summarize, winPercent,
    type Evaluation, type GameRecord, type MoveReview,
} from '../../analysis/analysis'
import { useGameAnalysis } from '../../analysis/useGameAnalysis'
import { viewOf } from '../../game/useChessGame'

interface Props {
    record: GameRecord;
    onNewGame: () => void;
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

// White's share of the bar is its chance of winning
function EvalBar({ evaluation, flipped }: { evaluation?: Evaluation; flipped: boolean }) {
    const white = evaluation ? winPercent(evaluation.cp) : 50
    return <div className={`eval-bar${flipped ? ' flipped' : ''}`} aria-hidden='true'>
        <div className='eval-white' style={{ height: `${white}%` }} />
    </div>
}

function Summary({ reviews }: { reviews: MoveReview[] }) {
    const sides = (['w', 'b'] as const).flatMap(color => {
        const summary = summarize(reviews, color)
        return summary ? [{ color, summary }] : []
    })
    if (sides.length === 0) return null

    return <dl className='summary'>
        {sides.map(({ color, summary }) => <div key={color}>
            <dt>{color === 'w' ? 'White' : 'Black'}</dt>
            <dd><strong>{summary.accuracy}%</strong> accuracy</dd>
            <dd>
                {plural(summary.inaccuracies, 'inaccuracy', 'inaccuracies')} · {plural(summary.mistakes, 'mistake', 'mistakes')} · {plural(summary.blunders, 'blunder', 'blunders')}
            </dd>
        </div>)}
    </dl>
}

function MoveDetail({ review, evaluation }: { review?: MoveReview; evaluation?: Evaluation }) {
    const title = review
        ? `${review.moveNumber}${review.color === 'w' ? '.' : '...'} ${review.move.san}`
        : 'Starting position'
    const flagged = review?.kind && moveSymbols[review.kind]

    return <section className='move-detail' aria-label='Selected move'>
        <p>
            <strong>{title}</strong>
            {review?.kind && <span className={`kind ${review.kind}`}> {moveLabels[review.kind]}</span>}
        </p>
        {flagged && review.best && <p>Best was <strong>{review.best.san}</strong></p>}
        <p className='evaluation'>Evaluation: {evaluation ? formatEvaluation(evaluation) : '…'}</p>
    </section>
}

interface MoveListProps {
    reviews: MoveReview[];
    ply: number;
    onSelect: (ply: number) => void;
}

function MoveList({ reviews, ply, onSelect }: MoveListProps) {
    const selected = useRef<HTMLButtonElement>(null)
    useEffect(() => {
        selected.current?.scrollIntoView?.({ block: 'nearest' })
    }, [ply])

    // One row per move number; a game starting with Black to move has no White move in its first row
    const rows: { number: number; white?: MoveReview; black?: MoveReview }[] = []
    for (const review of reviews) {
        const row = rows.at(-1)
        if (review.color === 'b' && row?.number === review.moveNumber && !row.black) row.black = review
        else rows.push({ number: review.moveNumber, [review.color === 'w' ? 'white' : 'black']: review })
    }

    const cell = (review?: MoveReview) => review
        ? <button
            ref={review.ply === ply ? selected : undefined}
            className={['move', review.kind, review.ply === ply && 'selected'].filter(Boolean).join(' ')}
            aria-current={review.ply === ply ? 'step' : undefined}
            onClick={() => onSelect(review.ply)}
        >
            {review.move.san}{review.kind && moveSymbols[review.kind]}
        </button>
        : <span className='move' />

    return <div className='move-list'>
        {rows.map(row => <div className='move-row' key={row.number}>
            <span className='move-number'>{row.number}.</span>
            {row.white || !row.black ? cell(row.white) : <span className='move'>…</span>}
            {cell(row.black)}
        </div>)}
    </div>
}

export default function Analysis({ record, onNewGame }: Props) {
    const positions = useMemo(() => buildPositions(record.startFen, record.moves), [record])
    const { evaluations, error } = useGameAnalysis(positions)
    const reviews = reviewMoves(positions, evaluations)

    const last = positions.length - 1
    const [ply, setPly] = useState(last) // which position is shown; 0 is the start
    const clamp = (target: number) => Math.min(last, Math.max(0, target))
    const go = (target: number) => setPly(clamp(target))

    // Arrow keys step through the game, Home and End jump to either end
    useEffect(() => {
        const steps: Record<string, (current: number) => number> = {
            ArrowLeft: current => current - 1,
            ArrowRight: current => current + 1,
            Home: () => 0,
            End: () => last,
        }
        function onKeyDown(e: KeyboardEvent) {
            const step = steps[e.key]
            if (!step) return
            e.preventDefault()
            setPly(current => Math.min(last, Math.max(0, step(current))))
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [last])

    const view = useMemo(() => {
        const game = new Chess(record.startFen)
        record.moves.slice(0, ply).forEach(move => game.move(move))
        return viewOf(game)
    }, [record, ply])

    const review = ply > 0 ? reviews[ply - 1] : undefined
    const flagged = review?.kind && moveSymbols[review.kind]
    const analyzed = evaluations.filter(Boolean).length
    const done = analyzed === positions.length
    const status = error ??
        (done ? `Game review${record.result ? ` — ${record.result}` : ''}` : `Analyzing… ${analyzed} of ${positions.length} positions`)

    return <div className='analysis'>
        <output className='status'>{status}</output>
        {!done && !error && <progress value={analyzed} max={positions.length} aria-label='Analysis progress' />}
        <div className='analysis-main'>
            <div className='analysis-board'>
                <EvalBar evaluation={evaluations[ply]} flipped={record.flipped} />
                <Chessboard game={view} flipped={record.flipped} hint={flagged ? review.best : undefined} />
            </div>
            <aside className='analysis-panel'>
                <Summary reviews={reviews} />
                <MoveDetail review={review} evaluation={evaluations[ply]} />
                <MoveList reviews={reviews} ply={ply} onSelect={go} />
                <nav className='analysis-nav' aria-label='Move navigation'>
                    <button className='text-button secondary' aria-label='First move' disabled={ply === 0} onClick={() => go(0)}>⏮</button>
                    <button className='text-button secondary' aria-label='Previous move' disabled={ply === 0} onClick={() => go(ply - 1)}>◀</button>
                    <button className='text-button secondary' aria-label='Next move' disabled={ply === last} onClick={() => go(ply + 1)}>▶</button>
                    <button className='text-button secondary' aria-label='Last move' disabled={ply === last} onClick={() => go(last)}>⏭</button>
                </nav>
                <button className='text-button' onClick={onNewGame}>New game</button>
            </aside>
        </div>
    </div>
}
