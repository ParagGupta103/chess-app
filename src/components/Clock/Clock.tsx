import { useEffect, useState } from 'react'
import './Clock.css'
import { formatClock } from '../../game/clock'

interface Props {
    label: string;
    remaining: number; // ms left, as of `since` when running
    since: number;
    running: boolean;
}

export default function Clock({ label, remaining, since, running }: Props) {
    // Update ten times a second while running, so the tenths show under ten seconds
    const [now, setNow] = useState(() => Date.now())
    useEffect(() => {
        if (!running) return
        const id = setInterval(() => setNow(Date.now()), 100)
        return () => clearInterval(id)
    }, [running])

    // `now` can be slightly older than `since` until the first tick after a turn starts
    const left = Math.max(0, running ? remaining - Math.max(0, now - since) : remaining)
    const className = ['clock', running && 'running', left < 20000 && 'low'].filter(Boolean).join(' ')

    return <div className={className} role='timer' aria-label={label}>
        <span>{label}</span>
        <span className='time'>{formatClock(left)}</span>
    </div>
}
