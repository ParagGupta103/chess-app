import type { PieceSymbol, Square } from 'chess.js'
import engineUrl from 'stockfish/bin/stockfish-19-lite-single.js?url'
import wasmUrl from 'stockfish/bin/stockfish-19-lite-single.wasm?url'

export interface EngineMove {
    from: Square;
    to: Square;
    promotion?: PieceSymbol;
}

export interface SearchLimits {
    skill: number; // Stockfish "Skill Level", 0-20
    depth: number;
    movetime: number; // milliseconds
}

// Centipawns, or moves until mate (negative when getting mated), for the side to move
export type EngineScore = { cp: number } | { mate: number }

export interface EngineAnalysis {
    score: EngineScore;
    best: EngineMove | null; // null when the side to move has no legal moves
}

interface Waiter {
    prefix: string;
    resolve: (line: string) => void;
    reject: (error: Error) => void;
    onLine?: (line: string) => void; // sees the lines that arrive before the awaited one
}

// "e7e8q" -> { from: 'e7', to: 'e8', promotion: 'q' }
function parseMove(move: string): EngineMove | null {
    if (move === '(none)') return null
    return {
        from: move.slice(0, 2) as Square,
        to: move.slice(2, 4) as Square,
        promotion: (move[4] as PieceSymbol | undefined) || undefined,
    }
}

// Stockfish running in a Web Worker, spoken to over the UCI protocol
export class Engine {
    failed = false
    private worker: Worker
    private waiters: Waiter[] = []
    private queue: Promise<unknown>

    // The .wasm file's URL goes after the "#", which is where the worker script looks for it
    constructor(worker = new Worker(`${engineUrl}#${encodeURIComponent(wasmUrl)}`)) {
        this.worker = worker
        worker.onmessage = (e: MessageEvent<string>) => {
            const done = this.waiters.filter(w => e.data.startsWith(w.prefix))
            this.waiters = this.waiters.filter(w => !done.includes(w))
            this.waiters.forEach(w => w.onLine?.(e.data))
            done.forEach(w => w.resolve(e.data))
        }
        worker.onerror = () => {
            this.failed = true
            this.waiters.forEach(w => w.reject(new Error('Stockfish failed to load')))
            this.waiters = []
        }
        // If this fails, `failed` is set and every later command rejects
        this.queue = this.send('uci', 'uciok').catch(() => {})
    }

    // Send a command, resolving with the first reply line that starts with `until`
    private send(command: string, until?: string, onLine?: (line: string) => void) {
        return new Promise<string>((resolve, reject) => {
            if (this.failed) return reject(new Error('Stockfish failed to load'))
            if (until) this.waiters.push({ prefix: until, resolve, reject, onLine })
            this.worker.postMessage(command)
            if (!until) resolve('')
        })
    }

    // Searches run one at a time so each "bestmove" reply matches its own request
    private search(fen: string, { skill, depth, movetime }: SearchLimits): Promise<EngineAnalysis> {
        const search = this.queue.then(async () => {
            await this.send(`setoption name Skill Level value ${skill}`)
            await this.send('isready', 'readyok')
            await this.send(`position fen ${fen}`)
            let score: EngineScore = { cp: 0 }
            // "bestmove e7e8q ponder e1d1", preceded by "info depth 12 ... score cp 35 ... pv ..." lines
            const reply = await this.send(`go depth ${depth} movetime ${movetime}`, 'bestmove', line => {
                const match = line.match(/ score (cp|mate) (-?\d+)/)
                if (match) score = match[1] === 'cp' ? { cp: Number(match[2]) } : { mate: Number(match[2]) }
            })
            return { score, best: parseMove(reply.split(' ')[1]) }
        })
        this.queue = search.catch(() => {})
        return search
    }

    async bestMove(fen: string, limits: SearchLimits): Promise<EngineMove> {
        const { best } = await this.search(fen, limits)
        if (!best) throw new Error('No legal moves')
        return best
    }

    // Full-strength evaluation of a position
    analyse(fen: string, limits: Omit<SearchLimits, 'skill'>) {
        return this.search(fen, { ...limits, skill: 20 })
    }

    // Ends the current search early; its result still arrives and is discarded by the caller
    stop() {
        this.worker.postMessage('stop')
    }
}

// One engine for the whole app, so the WebAssembly only loads once
let engine: Engine | undefined

export function getEngine() {
    if (!engine || engine.failed) engine = new Engine()
    return engine
}

export function stopEngine() {
    engine?.stop()
}
