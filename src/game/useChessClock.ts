import type { Color } from 'chess.js'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { TimeControl } from './clock'

const other = (color: Color): Color => color === 'w' ? 'b' : 'w'

interface ClockState {
    remaining: Record<Color, number>; // ms left; for the running side, as of `since`
    running: Color | null;
    since: number; // Date.now() when the running side's time started
}

// A chess clock. Nothing runs until the first move; after that, pressing it when a move is made
// stops the mover's time, adds the increment, and starts the opponent's.
// `active` is false once the game is over, which freezes both clocks.
export function useChessClock(control: TimeControl | null, active: boolean, onFlag: (color: Color) => void) {
    const [state, setState] = useState<ClockState>(() => {
        const start = (control?.initial ?? 0) * 1000
        return { remaining: { w: start, b: start }, running: null, since: 0 }
    })

    const latestOnFlag = useRef(onFlag)
    useEffect(() => {
        latestOnFlag.current = onFlag
    })

    const press = useCallback((mover: Color) => {
        if (!control) return
        setState(({ remaining, running, since }) => {
            const now = Date.now()
            const left = running === mover
                ? remaining[mover] - (now - since) + control.increment * 1000
                : remaining[mover] // the first move, made before any clock was running
            return { remaining: { ...remaining, [mover]: left }, running: other(mover), since: now }
        })
    }, [control])

    // Freezes the clocks part-way through a turn, e.g. on resignation
    const stop = useCallback(() => {
        setState(s => s.running
            ? { remaining: { ...s.remaining, [s.running]: s.remaining[s.running] - (Date.now() - s.since) }, running: null, since: 0 }
            : s)
    }, [])

    const running = active ? state.running : null

    // Flag the running side the moment its time runs out
    useEffect(() => {
        if (!running) return
        const timer = setTimeout(() => {
            setState(s => ({ remaining: { ...s.remaining, [running]: 0 }, running: null, since: 0 }))
            latestOnFlag.current(running)
        }, state.remaining[running] - (Date.now() - state.since))
        return () => clearTimeout(timer)
    }, [running, state])

    return { remaining: state.remaining, since: state.since, running, press, stop }
}
