import { useEffect, useState } from 'react'
import { getEngine, stopEngine } from '../engine/engine'
import { toEvaluation, type Evaluation, type Position } from './analysis'

// Deep enough to spot most tactical errors while keeping a long game to under a minute
const limits = { depth: 12, movetime: 600 }

// Evaluates each position in turn; results appear as they come in
export function useGameAnalysis(positions: Position[]) {
    const [evaluations, setEvaluations] = useState<(Evaluation | undefined)[]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false // set when leaving the review screen
        async function run() {
            for (const [i, position] of positions.entries()) {
                const evaluation = position.final ??
                    toEvaluation(position, await getEngine().analyse(position.fen, limits))
                if (cancelled) return
                setEvaluations(previous => {
                    const next = [...previous]
                    next[i] = evaluation
                    return next
                })
            }
        }
        run().catch(() => {
            if (!cancelled) setError('The engine failed to load, so the game could not be analyzed')
        })
        return () => {
            cancelled = true
            stopEngine()
        }
    }, [positions])

    return { evaluations, error }
}
