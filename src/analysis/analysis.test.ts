import { DEFAULT_POSITION } from 'chess.js'
import {
    MATE, buildPositions, formatEvaluation, reviewMoves, summarize, toEvaluation, winPercent,
    type Evaluation,
} from './analysis'

const foolsMate = ['f3', 'e5', 'g4', 'Qh4#']

test('replays the game into positions, marking how it ended', () => {
    const positions = buildPositions(DEFAULT_POSITION, foolsMate)
    expect(positions).toHaveLength(5)
    expect(positions[0]).toMatchObject({ fen: DEFAULT_POSITION, turn: 'w', moveNumber: 1 })
    expect(positions[0].move).toBeUndefined()
    expect(positions[3]).toMatchObject({ turn: 'b', moveNumber: 2, move: { san: 'g4', from: 'g2', to: 'g4' } })
    expect(positions[4].final).toEqual({ cp: -MATE, mate: 0 })
    expect(positions.slice(0, 4).every(p => !p.final)).toBe(true)
})

test('marks draws as level', () => {
    const [, stalemate] = buildPositions('7k/8/6Q1/8/8/8/8/K7 w - - 0 1', ['Qf7'])
    expect(stalemate.final).toEqual({ cp: 0 })
})

test('turns engine scores into White\'s point of view', () => {
    const [, blackToMove] = buildPositions(DEFAULT_POSITION, ['e4'])
    expect(toEvaluation(blackToMove, { score: { cp: 50 }, best: { from: 'e7', to: 'e5' } }))
        .toEqual({ cp: -50, best: { from: 'e7', to: 'e5', san: 'e5' } })
    expect(toEvaluation(blackToMove, { score: { mate: 2 }, best: null }))
        .toEqual({ cp: -MATE, mate: -2 })
    expect(toEvaluation(blackToMove, { score: { mate: -3 }, best: null }))
        .toEqual({ cp: MATE, mate: 3 })
})

test('converts centipawns to a chance of winning', () => {
    expect(winPercent(0)).toBe(50)
    expect(winPercent(100)).toBeCloseTo(59.1, 1)
    expect(winPercent(-100)).toBeCloseTo(40.9, 1)
    expect(winPercent(MATE)).toBeCloseTo(100)
})

describe('reviewing moves', () => {
    const positions = buildPositions(DEFAULT_POSITION, foolsMate)
    const evaluations: Evaluation[] = [
        { cp: 30, best: { from: 'e2', to: 'e4', san: 'e4' } },
        { cp: -50, best: { from: 'e7', to: 'e5', san: 'e5' } }, // f3 cost White about 7 points
        { cp: -40, best: { from: 'd2', to: 'd4', san: 'd4' } },
        { cp: -MATE, mate: -1, best: { from: 'd8', to: 'h4', san: 'Qh4#' } }, // g4 allows mate
        { cp: -MATE, mate: 0 },
    ]

    test('labels each move', () => {
        const reviews = reviewMoves(positions, evaluations)
        expect(reviews.map(r => [r.move.san, r.color, r.moveNumber, r.kind])).toEqual([
            ['f3', 'w', 1, 'inaccuracy'],
            ['e5', 'b', 1, 'best'],
            ['g4', 'w', 2, 'blunder'],
            ['Qh4#', 'b', 2, 'best'],
        ])
        expect(reviews[2].best?.san).toBe('d4')
    })

    test('uses the mistake band between inaccuracies and blunders', () => {
        const [first] = reviewMoves(positions, [{ cp: 0 }, { cp: -130 }])
        expect(first.loss).toBeGreaterThanOrEqual(10)
        expect(first.loss).toBeLessThan(15)
        expect(first.kind).toBe('mistake')
    })

    test('leaves moves unlabelled until both sides of them are evaluated', () => {
        const reviews = reviewMoves(positions, evaluations.slice(0, 2))
        expect(reviews[0].kind).toBe('inaccuracy')
        expect(reviews[1].kind).toBeUndefined()
    })

    test('summarizes each side once every move is reviewed', () => {
        const reviews = reviewMoves(positions, evaluations)
        expect(summarize(reviews, 'w')).toMatchObject({ inaccuracies: 1, mistakes: 0, blunders: 1 })
        expect(summarize(reviews, 'b')).toMatchObject({ inaccuracies: 0, mistakes: 0, blunders: 0 })
        expect(summarize(reviews, 'b')!.accuracy).toBeGreaterThan(summarize(reviews, 'w')!.accuracy)
        expect(summarize(reviewMoves(positions, evaluations.slice(0, 3)), 'w')).toBeNull()
    })
})

test('formats evaluations', () => {
    expect(formatEvaluation({ cp: 34 })).toBe('+0.3')
    expect(formatEvaluation({ cp: -120 })).toBe('-1.2')
    expect(formatEvaluation({ cp: MATE, mate: 3 })).toBe('M3')
    expect(formatEvaluation({ cp: -MATE, mate: -2 })).toBe('-M2')
    expect(formatEvaluation({ cp: -MATE, mate: 0 })).toBe('0-1')
})
