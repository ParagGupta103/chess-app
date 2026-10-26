import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'

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
