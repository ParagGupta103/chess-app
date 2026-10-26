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

interface Waiter {
    prefix: string;
    resolve: (line: string) => void;
    reject: (error: Error) => void;
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
    private send(command: string, until?: string) {
        return new Promise<string>((resolve, reject) => {
            if (this.failed) return reject(new Error('Stockfish failed to load'))
            if (until) this.waiters.push({ prefix: until, resolve, reject })
            this.worker.postMessage(command)
            if (!until) resolve('')
        })
    }

    // Searches run one at a time so each "bestmove" reply matches its own request
    bestMove(fen: string, { skill, depth, movetime }: SearchLimits): Promise<EngineMove> {
        const search = this.queue.then(async () => {
            await this.send(`setoption name Skill Level value ${skill}`)
            await this.send('isready', 'readyok')
            await this.send(`position fen ${fen}`)
            const reply = await this.send(`go depth ${depth} movetime ${movetime}`, 'bestmove')
            const move = reply.split(' ')[1] // "bestmove e7e8q ponder e1d1"
            return {
                from: move.slice(0, 2) as Square,
                to: move.slice(2, 4) as Square,
                promotion: (move[4] as PieceSymbol | undefined) || undefined,
            }
        })
        this.queue = search.catch(() => {})
        return search
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
