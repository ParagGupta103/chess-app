import { Engine } from './engine'

// Stands in for the Stockfish worker, answering each command with a scripted reply
class FakeWorker {
    sent: string[] = []
    onmessage: ((e: { data: string }) => void) | null = null
    onerror: (() => void) | null = null
    bestMoves = ['e2e4']

    postMessage(command: string) {
        this.sent.push(command)
        const reply =
            command === 'uci' ? 'uciok' :
            command === 'isready' ? 'readyok' :
            command.startsWith('go') ? `bestmove ${this.bestMoves.shift()} ponder a7a6` :
            null
        if (reply) setTimeout(() => this.onmessage?.({ data: reply }))
    }
}

const limits = { skill: 3, depth: 4, movetime: 300 }

function setup() {
    const worker = new FakeWorker()
    return { worker, engine: new Engine(worker as unknown as Worker) }
}

test('asks Stockfish for a move with the given limits', async () => {
    const { worker, engine } = setup()
    const fen = '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1'

    await expect(engine.bestMove(fen, limits)).resolves.toEqual({ from: 'e2', to: 'e4', promotion: undefined })
    expect(worker.sent).toEqual([
        'uci',
        'setoption name Skill Level value 3',
        'isready',
        `position fen ${fen}`,
        'go depth 4 movetime 300',
    ])
})

test('reads promotions', async () => {
    const { worker, engine } = setup()
    worker.bestMoves = ['a7a8q']
    await expect(engine.bestMove('4k3/P7/8/8/8/8/8/4K3 w - - 0 1', limits))
        .resolves.toEqual({ from: 'a7', to: 'a8', promotion: 'q' })
})

test('runs overlapping searches one after another', async () => {
    const { worker, engine } = setup()
    worker.bestMoves = ['e2e4', 'd2d4']
    const [first, second] = await Promise.all([
        engine.bestMove('first', limits),
        engine.bestMove('second', limits),
    ])
    expect(first.to).toBe('e4')
    expect(second.to).toBe('d4')
    expect(worker.sent.filter(c => c.startsWith('position'))).toEqual(['position fen first', 'position fen second'])
})

test('rejects when the worker fails to load', async () => {
    const { worker, engine } = setup()
    worker.onerror?.()
    await expect(engine.bestMove('fen', limits)).rejects.toThrow('Stockfish failed to load')
    expect(engine.failed).toBe(true)
})
