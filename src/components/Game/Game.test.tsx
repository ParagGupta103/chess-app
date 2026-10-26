import { Chess } from 'chess.js'
import { fireEvent, render, screen } from '@testing-library/react'
import Game from './Game'
import { levels } from '../../engine/levels'
import type { GameSettings } from '../../game/settings'

const bestMove = vi.hoisted(() => vi.fn())
vi.mock('../../engine/engine', () => ({ getEngine: () => ({ bestMove }), stopEngine: () => {} }))

const friend: GameSettings = { opponent: 'friend', color: 'w', level: 1 }
// Level 4 is the lowest that never plays random moves
const computer = (color: 'w' | 'b'): GameSettings => ({ opponent: 'computer', color, level: 4 })
const renderGame = (settings = friend, fen?: string) =>
  render(<Game settings={settings} onNewGame={() => {}} fen={fen} />)

// Squares are buttons labelled "e4" when empty or "e4, white pawn" when occupied
const square = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}(,|$)`) })
const click = (name: string) => fireEvent.click(square(name))
const play = (...moves: string[]) => moves.forEach(m => {
  click(m.slice(0, 2))
  click(m.slice(2, 4))
})
const status = () => screen.getByRole('status')

test('moves a piece and passes the turn', () => {
  renderGame()
  expect(status()).toHaveTextContent('White to move')
  play('e2e4')
  expect(square('e4')).toHaveAccessibleName('e4, white pawn')
  expect(square('e2')).toHaveAccessibleName('e2')
  expect(square('e2')).toHaveClass('highlight')
  expect(status()).toHaveTextContent('Black to move')
})

test('shows the legal moves of the selected piece', () => {
  renderGame()
  click('g1')
  expect(square('g1')).toHaveClass('highlight')
  expect(square('f3')).toHaveClass('move-target')
  expect(square('h3')).toHaveClass('move-target')
  expect(square('g3')).not.toHaveClass('move-target')

  click('g1')
  expect(square('f3')).not.toHaveClass('move-target')
})

test('marks captures differently from moves', () => {
  renderGame()
  play('e2e4', 'd7d5')
  click('e4')
  expect(square('d5')).toHaveClass('capture-target')
  expect(square('e5')).toHaveClass('move-target')
})

test('ignores illegal moves and the opponent\'s pieces', () => {
  renderGame()
  play('e2e5')
  expect(square('e2')).toHaveAccessibleName('e2, white pawn')
  expect(square('e5')).toHaveAccessibleName('e5')

  play('e7e5')
  expect(square('e7')).toHaveAccessibleName('e7, black pawn')
  expect(status()).toHaveTextContent('White to move')
})

test('castling moves the rook as well', () => {
  renderGame(friend, 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1')
  play('e1g1')
  expect(square('g1')).toHaveAccessibleName('g1, white king')
  expect(square('f1')).toHaveAccessibleName('f1, white rook')
  expect(square('h1')).toHaveAccessibleName('h1')
})

test('en passant removes the passed pawn', () => {
  renderGame()
  play('e2e4', 'a7a6', 'e4e5', 'd7d5', 'e5d6')
  expect(square('d6')).toHaveAccessibleName('d6, white pawn')
  expect(square('d5')).toHaveAccessibleName('d5')
})

test('promotion lets you choose the piece', () => {
  renderGame(friend, '4k3/P7/8/8/8/8/8/4K3 w - - 0 1')
  play('a7a8')
  fireEvent.click(screen.getByRole('button', { name: 'Promote to knight' }))
  expect(square('a8')).toHaveAccessibleName('a8, white knight')
  expect(screen.queryByRole('button', { name: 'Promote to queen' })).not.toBeInTheDocument()
})

test('cancelling promotion keeps the pawn where it was', () => {
  renderGame(friend, '4k3/P7/8/8/8/8/8/4K3 w - - 0 1')
  play('a7a8')
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(square('a7')).toHaveAccessibleName('a7, white pawn')
  expect(status()).toHaveTextContent('White to move')
})

test('shows check', () => {
  renderGame()
  play('e2e4', 'f7f6', 'd1h5')
  expect(status()).toHaveTextContent('Black to move — check!')
  expect(square('e8')).toHaveClass('in-check')
})

test('detects checkmate and stops play', () => {
  renderGame()
  play('f2f3', 'e7e5', 'g2g4', 'd8h4')
  expect(status()).toHaveTextContent('Checkmate — Black wins')

  click('a2')
  expect(square('a3')).not.toHaveClass('move-target')
})

test('detects stalemate', () => {
  renderGame(friend, '7k/8/6Q1/8/8/8/8/K7 w - - 0 1')
  play('g6f7')
  expect(status()).toHaveTextContent('Draw by stalemate')
})

test('detects insufficient material', () => {
  renderGame(friend, '4k3/8/8/8/8/8/8/4K3 w - - 0 1')
  expect(status()).toHaveTextContent('Draw by insufficient material')
})

describe('against the computer', () => {
  // Stands in for Stockfish by playing the first legal move
  const firstLegalMove = async (fen: string) => {
    const { from, to } = new Chess(fen).moves({ verbose: true })[0]
    return { from, to }
  }

  beforeEach(() => {
    bestMove.mockReset()
  })

  test('replies after your move', async () => {
    bestMove.mockImplementation(firstLegalMove)
    renderGame(computer('w'))
    expect(status()).toHaveTextContent('Your move')

    play('e2e4')
    expect(status()).toHaveTextContent('Computer is thinking…')
    expect(await screen.findByText('Your move')).toBeInTheDocument()

    const afterE4 = new Chess()
    afterE4.move('e4')
    expect(bestMove).toHaveBeenCalledWith(afterE4.fen(), levels[3])
  })

  test('moves first and flips the board when you play black', async () => {
    bestMove.mockImplementation(firstLegalMove)
    renderGame(computer('b'))
    expect(screen.getAllByRole('button')[0]).toHaveAccessibleName('h1, white rook')
    expect(await screen.findByText('Your move')).toBeInTheDocument()
    expect(bestMove).toHaveBeenCalledWith(new Chess().fen(), levels[3])
  })

  test('ignores clicks while the computer is thinking', () => {
    bestMove.mockReturnValue(new Promise(() => {}))
    renderGame(computer('b'))
    expect(status()).toHaveTextContent('Computer is thinking…')
    play('e2e4')
    expect(square('e2')).toHaveAccessibleName('e2, white pawn')
  })

  test('plays the promotion the engine chooses', async () => {
    bestMove.mockResolvedValue({ from: 'a2', to: 'a1', promotion: 'n' })
    renderGame(computer('w'), '4k3/8/8/8/8/8/p7/4K3 b - - 0 1')
    expect(await screen.findByRole('button', { name: 'a1, black knight' })).toBeInTheDocument()
  })

  test('reports an engine that fails to load', async () => {
    bestMove.mockRejectedValue(new Error('worker failed'))
    renderGame(computer('b'))
    expect(await screen.findByText('The computer opponent failed to load')).toBeInTheDocument()
  })
})
