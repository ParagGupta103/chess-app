import { DEFAULT_POSITION, type Square } from 'chess.js'
import { fireEvent, render, screen, within } from '@testing-library/react'
import Analysis from './Analysis'
import type { GameRecord } from '../../analysis/analysis'

const analyse = vi.hoisted(() => vi.fn())
vi.mock('../../engine/engine', () => ({ getEngine: () => ({ analyse }), stopEngine: () => {} }))

const record: GameRecord = {
  startFen: DEFAULT_POSITION,
  moves: ['f3', 'e5', 'g4', 'Qh4#'],
  result: 'Checkmate — Black wins',
  flipped: false,
}

const best = (move: string) => ({ from: move.slice(0, 2) as Square, to: move.slice(2, 4) as Square })

// Engine replies for each position before the final checkmate, from the side to move's point of view
function scriptEngine() {
  analyse
    .mockResolvedValueOnce({ score: { cp: 30 }, best: best('e2e4') })
    .mockResolvedValueOnce({ score: { cp: 50 }, best: best('e7e5') })
    .mockResolvedValueOnce({ score: { cp: -40 }, best: best('d2d4') })
    .mockResolvedValueOnce({ score: { mate: 1 }, best: best('d8h4') })
}

const board = () => within(document.getElementById('Chessboard')!)
const square = (name: string) => board().getByRole('button', { name: new RegExp(`^${name}(,|$)`) })
const button = (name: string) => screen.getByRole('button', { name })
const detail = () => screen.getByRole('region', { name: 'Selected move' })

async function renderReviewed() {
  scriptEngine()
  render(<Analysis record={record} onNewGame={() => {}} />)
  await screen.findByText('Game review — Checkmate — Black wins')
}

beforeEach(() => {
  analyse.mockReset()
})

test('analyses every position and labels the moves', async () => {
  await renderReviewed()
  expect(analyse).toHaveBeenCalledTimes(4) // the final checkmate needs no engine
  expect(button('f3?!')).toHaveClass('inaccuracy')
  expect(button('e5')).toHaveClass('best')
  expect(button('g4??')).toHaveClass('blunder')
  expect(button('Qh4#')).toHaveClass('best')
  expect(screen.getByText('1 inaccuracy · 0 mistakes · 1 blunder')).toBeInTheDocument()
  expect(screen.getByText('0 inaccuracies · 0 mistakes · 0 blunders')).toBeInTheDocument()
})

test('shows the better move for a blunder', async () => {
  await renderReviewed()
  fireEvent.click(button('g4??'))
  expect(detail()).toHaveTextContent('2. g4 Blunder')
  expect(detail()).toHaveTextContent('Best was d4')
  expect(detail()).toHaveTextContent('Evaluation: -M1')
  expect(square('d2')).toHaveClass('hint')
  expect(square('d4')).toHaveClass('hint')

  fireEvent.click(button('e5'))
  expect(detail()).toHaveTextContent('1... e5 Best move')
  expect(detail()).not.toHaveTextContent('Best was')
  expect(square('d4')).not.toHaveClass('hint')
})

test('steps through the game', async () => {
  await renderReviewed()
  expect(square('h4')).toHaveAccessibleName('h4, black queen')
  expect(detail()).toHaveTextContent('Evaluation: 0-1')

  fireEvent.click(button('First move'))
  expect(detail()).toHaveTextContent('Starting position')
  expect(square('f2')).toHaveAccessibleName('f2, white pawn')
  expect(button('Previous move')).toBeDisabled()

  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(square('f3')).toHaveAccessibleName('f3, white pawn')
  expect(detail()).toHaveTextContent('1. f3 Inaccuracy')

  fireEvent.click(button('Next move'))
  expect(square('e5')).toHaveAccessibleName('e5, black pawn')

  fireEvent.keyDown(window, { key: 'End' })
  expect(square('h4')).toHaveAccessibleName('h4, black queen')
  expect(button('Next move')).toBeDisabled()
})

test('shows progress while analysing', () => {
  analyse.mockReturnValue(new Promise(() => {}))
  render(<Analysis record={record} onNewGame={() => {}} />)
  expect(screen.getByRole('status')).toHaveTextContent('Analyzing… 0 of 5 positions')
  expect(screen.getByRole('progressbar', { name: 'Analysis progress' })).toBeInTheDocument()
})

test('reports an engine that fails to load', async () => {
  analyse.mockRejectedValue(new Error('worker failed'))
  render(<Analysis record={record} onNewGame={() => {}} />)
  expect(await screen.findByText('The engine failed to load, so the game could not be analyzed')).toBeInTheDocument()
})
