import { Chess, DEFAULT_POSITION } from 'chess.js'
import { act, fireEvent, render, screen } from '@testing-library/react'
import Game from './Game'
import { levels } from '../../engine/levels'
import type { GameSettings } from '../../game/settings'

const bestMove = vi.hoisted(() => vi.fn())
vi.mock('../../engine/engine', () => ({ getEngine: () => ({ bestMove }), stopEngine: () => {} }))

const friend: GameSettings = { opponent: 'friend', color: 'w', level: 1, timeControl: 'none' }
// Level 4 is the lowest that never plays random moves
const computer = (color: 'w' | 'b'): GameSettings => ({ opponent: 'computer', color, level: 4, timeControl: 'none' })
const onAnalyze = vi.fn()
const renderGame = (settings = friend, fen?: string) =>
  render(<Game settings={settings} onNewGame={() => {}} onAnalyze={onAnalyze} fen={fen} />)
const button = (name: string) => screen.queryByRole('button', { name })

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

describe('ending the game', () => {
  beforeEach(() => {
    onAnalyze.mockReset()
  })

  test('the side to move can resign', () => {
    renderGame()
    play('e2e4')
    expect(button('Analyze game')).not.toBeInTheDocument()

    fireEvent.click(button('Resign')!)
    expect(status()).toHaveTextContent('Black resigned — White wins')
    expect(button('Resign')).not.toBeInTheDocument()
    click('e7')
    expect(square('e5')).not.toHaveClass('move-target')
  })

  test('you can resign while the computer is thinking', () => {
    bestMove.mockReturnValue(new Promise(() => {}))
    renderGame(computer('b'))
    fireEvent.click(button('Resign')!)
    expect(status()).toHaveTextContent('Black resigned — White wins')
  })

  test('a finished game can be analyzed', () => {
    renderGame()
    play('f2f3', 'e7e5', 'g2g4', 'd8h4')
    fireEvent.click(button('Analyze game')!)
    expect(onAnalyze).toHaveBeenCalledWith({
      startFen: DEFAULT_POSITION,
      moves: ['f3', 'e5', 'g4', 'Qh4#'],
      result: 'Checkmate — Black wins',
      flipped: false,
    })
  })

  test('a game with no moves has nothing to analyze', () => {
    renderGame()
    fireEvent.click(button('Resign')!)
    expect(button('Analyze game')).not.toBeInTheDocument()
  })
})

describe('dragging pieces', () => {
  // jsdom has no layout, so say which square is under the pointer when it's released
  function dropOn(name: string) {
    document.elementFromPoint = () => square(name)
    fireEvent.pointerUp(window, { clientX: 100, clientY: 100 })
  }
  const pickUp = (name: string) => {
    fireEvent.pointerDown(square(name), { button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(window, { clientX: 100, clientY: 100 })
  }

  test('drops a piece on a legal square', () => {
    renderGame()
    pickUp('e2')
    expect(square('e2')).toHaveClass('dragging')
    expect(square('e4')).toHaveClass('move-target')

    dropOn('e4')
    expect(square('e4')).toHaveAccessibleName('e4, white pawn')
    expect(square('e2')).toHaveAccessibleName('e2')
    expect(status()).toHaveTextContent('Black to move')
  })

  test('leaves the piece selected when dropped on an illegal square', async () => {
    renderGame()
    pickUp('e2')
    dropOn('e5')
    expect(square('e2')).toHaveAccessibleName('e2, white pawn')
    expect(square('e2')).toHaveClass('highlight')
    expect(square('e4')).toHaveClass('move-target')

    // Clicks are ignored until the release has finished, then click-to-move works from here
    await new Promise(resolve => setTimeout(resolve))
    click('e4')
    expect(square('e4')).toHaveAccessibleName('e4, white pawn')
  })

  test('asks for the promotion piece after a drag', () => {
    renderGame(friend, '4k3/P7/8/8/8/8/8/4K3 w - - 0 1')
    pickUp('a7')
    dropOn('a8')
    fireEvent.click(button('Promote to rook')!)
    expect(square('a8')).toHaveAccessibleName('a8, white rook')
  })

  test('cannot pick up the opponent\'s pieces', () => {
    renderGame()
    pickUp('e7')
    expect(square('e7')).not.toHaveClass('dragging')
    dropOn('e5')
    expect(square('e7')).toHaveAccessibleName('e7, black pawn')
  })
})

describe('the clock', () => {
  const timed = (timeControl: string, settings = friend): GameSettings => ({ ...settings, timeControl })
  const clock = (name: string) => screen.getByRole('timer', { name })
  const wait = (ms: number) => act(() => { vi.advanceTimersByTime(ms) })

  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  test('is hidden without a time control', () => {
    renderGame()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
  })

  test('starts with the first move and adds the increment after each move', () => {
    renderGame(timed('1+2'))
    expect(clock('White')).toHaveTextContent('1:00')
    wait(5000)
    expect(clock('White')).toHaveTextContent('1:00') // nothing runs before the first move

    play('e2e4')
    wait(10000)
    expect(clock('White')).toHaveTextContent('1:00')
    expect(clock('Black')).toHaveTextContent('0:50')
    expect(clock('Black')).toHaveClass('running')

    play('e7e5')
    expect(clock('Black')).toHaveTextContent('0:52')
    wait(3000)
    expect(clock('White')).toHaveTextContent('0:57')
  })

  test('running out of time loses the game', () => {
    renderGame(timed('1+0'))
    play('e2e4')
    wait(60000)
    expect(status()).toHaveTextContent('Black ran out of time — White wins')
    expect(clock('Black')).toHaveTextContent('0:00.0')
    click('e7')
    expect(square('e5')).not.toHaveClass('move-target')
  })

  test('running out of time is a draw if the opponent cannot checkmate', () => {
    renderGame(timed('1+0'), '4k3/8/8/8/8/8/4P3/4K3 b - - 0 1')
    play('e8d7')
    wait(60000)
    expect(status()).toHaveTextContent('Draw — White ran out of time, but Black cannot checkmate')
  })

  test('stops when the game ends', () => {
    renderGame(timed('5+0'))
    play('e2e4')
    wait(4000)
    fireEvent.click(button('Resign')!)
    wait(10000)
    expect(clock('Black')).toHaveTextContent('4:56')
    expect(clock('Black')).not.toHaveClass('running')
  })

  test('labels the clocks and puts yours at the bottom against the computer', () => {
    bestMove.mockReturnValue(new Promise(() => {}))
    renderGame(timed('5+0', computer('b')))
    const [top, bottom] = screen.getAllByRole('timer')
    expect(top).toHaveAccessibleName('Computer')
    expect(bottom).toHaveAccessibleName('You')
  })

  test('the computer thinks faster when it is short of time', async () => {
    let reply: (move: { from: string; to: string }) => void = () => {}
    bestMove.mockReset()
    bestMove
      .mockReturnValueOnce(new Promise(resolve => { reply = resolve }))
      .mockReturnValue(new Promise(() => {}))
    renderGame(timed('1+0', { ...computer('w'), level: 8 }))
    const movetime = () => bestMove.mock.lastCall![1].movetime

    // With a minute left it may use a thirtieth of it, 2 s, which is level 8's own limit anyway
    play('e2e4')
    expect(movetime()).toBe(2000)

    // After spending 45 s on that move it has 15 s left, so a thirtieth is 0.5 s
    wait(45000)
    await act(async () => reply({ from: 'e7', to: 'e5' }))
    play('d2d4')
    expect(movetime()).toBe(500)
  })
})
