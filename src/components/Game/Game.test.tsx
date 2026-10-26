import { fireEvent, render, screen } from '@testing-library/react'
import Game from './Game'

// Squares are buttons labelled "e4" when empty or "e4, white pawn" when occupied
const square = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}(,|$)`) })
const click = (name: string) => fireEvent.click(square(name))
const play = (...moves: string[]) => moves.forEach(m => {
  click(m.slice(0, 2))
  click(m.slice(2, 4))
})
const status = () => screen.getByRole('status')

test('moves a piece and passes the turn', () => {
  render(<Game />)
  expect(status()).toHaveTextContent('White to move')
  play('e2e4')
  expect(square('e4')).toHaveAccessibleName('e4, white pawn')
  expect(square('e2')).toHaveAccessibleName('e2')
  expect(square('e2')).toHaveClass('highlight')
  expect(status()).toHaveTextContent('Black to move')
})

test('shows the legal moves of the selected piece', () => {
  render(<Game />)
  click('g1')
  expect(square('g1')).toHaveClass('highlight')
  expect(square('f3')).toHaveClass('move-target')
  expect(square('h3')).toHaveClass('move-target')
  expect(square('g3')).not.toHaveClass('move-target')

  click('g1')
  expect(square('f3')).not.toHaveClass('move-target')
})

test('marks captures differently from moves', () => {
  render(<Game />)
  play('e2e4', 'd7d5')
  click('e4')
  expect(square('d5')).toHaveClass('capture-target')
  expect(square('e5')).toHaveClass('move-target')
})

test('ignores illegal moves and the opponent\'s pieces', () => {
  render(<Game />)
  play('e2e5')
  expect(square('e2')).toHaveAccessibleName('e2, white pawn')
  expect(square('e5')).toHaveAccessibleName('e5')

  play('e7e5')
  expect(square('e7')).toHaveAccessibleName('e7, black pawn')
  expect(status()).toHaveTextContent('White to move')
})

test('castling moves the rook as well', () => {
  render(<Game fen='r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1' />)
  play('e1g1')
  expect(square('g1')).toHaveAccessibleName('g1, white king')
  expect(square('f1')).toHaveAccessibleName('f1, white rook')
  expect(square('h1')).toHaveAccessibleName('h1')
})

test('en passant removes the passed pawn', () => {
  render(<Game />)
  play('e2e4', 'a7a6', 'e4e5', 'd7d5', 'e5d6')
  expect(square('d6')).toHaveAccessibleName('d6, white pawn')
  expect(square('d5')).toHaveAccessibleName('d5')
})

test('promotion lets you choose the piece', () => {
  render(<Game fen='4k3/P7/8/8/8/8/8/4K3 w - - 0 1' />)
  play('a7a8')
  fireEvent.click(screen.getByRole('button', { name: 'Promote to knight' }))
  expect(square('a8')).toHaveAccessibleName('a8, white knight')
  expect(screen.queryByRole('button', { name: 'Promote to queen' })).not.toBeInTheDocument()
})

test('cancelling promotion keeps the pawn where it was', () => {
  render(<Game fen='4k3/P7/8/8/8/8/8/4K3 w - - 0 1' />)
  play('a7a8')
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(square('a7')).toHaveAccessibleName('a7, white pawn')
  expect(status()).toHaveTextContent('White to move')
})

test('shows check', () => {
  render(<Game />)
  play('e2e4', 'f7f6', 'd1h5')
  expect(status()).toHaveTextContent('Black to move — check!')
  expect(square('e8')).toHaveClass('in-check')
})

test('detects checkmate and stops play', () => {
  render(<Game />)
  play('f2f3', 'e7e5', 'g2g4', 'd8h4')
  expect(status()).toHaveTextContent('Checkmate — Black wins')

  click('a2')
  expect(square('a3')).not.toHaveClass('move-target')
})

test('detects stalemate', () => {
  render(<Game fen='7k/8/6Q1/8/8/8/8/K7 w - - 0 1' />)
  play('g6f7')
  expect(status()).toHaveTextContent('Draw by stalemate')
})

test('detects insufficient material', () => {
  render(<Game fen='4k3/8/8/8/8/8/8/4K3 w - - 0 1' />)
  expect(status()).toHaveTextContent('Draw by insufficient material')
})

test('new game resets the board', () => {
  render(<Game />)
  play('e2e4')
  click('e7')
  fireEvent.click(screen.getByRole('button', { name: 'New game' }))
  expect(square('e2')).toHaveAccessibleName('e2, white pawn')
  expect(square('e4')).toHaveAccessibleName('e4')
  expect(square('e7')).not.toHaveClass('highlight')
  expect(status()).toHaveTextContent('White to move')
})
