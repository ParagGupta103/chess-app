import { fireEvent, render, screen } from '@testing-library/react'
import type { EngineAnalysis } from './engine/engine'
import App from './App'

// The review screen asks the engine about each position; these tests only check the hand-off
vi.mock('./engine/engine', () => ({
  getEngine: () => ({ analyse: () => new Promise<EngineAnalysis>(() => {}) }),
  stopEngine: () => {},
}))

const click = (name: string) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${name}(,|$)`) }))

test('starts a game from the setup screen', () => {
  const { container } = render(<App />)
  expect(screen.getByLabelText('Level')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('radio', { name: 'Friend on this device' }))
  expect(screen.queryByLabelText('Level')).not.toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Start game' }))
  expect(container.querySelectorAll('.tile')).toHaveLength(64)
  expect(screen.getAllByRole('img')).toHaveLength(32)
  expect(screen.getByAltText('white king')).toBeInTheDocument()
})

test('new game returns to the setup screen with the last choices', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('radio', { name: 'Friend on this device' }))
  fireEvent.click(screen.getByRole('button', { name: 'Start game' }))
  click('e2')
  click('e4')

  fireEvent.click(screen.getByRole('button', { name: 'New game' }))
  expect(screen.getByRole('radio', { name: 'Friend on this device' })).toBeChecked()

  fireEvent.click(screen.getByRole('button', { name: 'Start game' }))
  expect(screen.getByRole('button', { name: 'e2, white pawn' })).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('White to move')
})

test('a finished game opens in the review screen', async () => {
  render(<App />)
  fireEvent.click(screen.getByRole('radio', { name: 'Friend on this device' }))
  fireEvent.click(screen.getByRole('button', { name: 'Start game' }))
  for (const square of ['f2', 'f3', 'e7', 'e5', 'g2', 'g4', 'd8', 'h4']) click(square)

  fireEvent.click(screen.getByRole('button', { name: 'Analyze game' }))
  expect(screen.getByRole('status')).toHaveTextContent('Analyzing…')
  expect(screen.getByRole('button', { name: 'g4' })).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'New game' }))
  expect(screen.getByRole('button', { name: 'Start game' })).toBeInTheDocument()
})
