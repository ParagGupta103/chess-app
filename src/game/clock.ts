export interface TimeControl {
    initial: number; // seconds each side starts with
    increment: number; // seconds added after each move
}

// "minutes+increment", e.g. "3+2"
export const timeControls = ['none', '1+0', '3+2', '5+0', '10+0', '15+10', '30+0']

export function parseTimeControl(key: string): TimeControl | null {
    if (key === 'none') return null
    const [minutes, increment] = key.split('+').map(Number)
    return { initial: minutes * 60, increment }
}

export function describeTimeControl(key: string) {
    const control = parseTimeControl(key)
    if (!control) return 'No clock'
    const minutes = `${control.initial / 60} min`
    return control.increment ? `${minutes} + ${control.increment} s per move` : minutes
}

const pad = (n: number) => String(n).padStart(2, '0')

// "5:00", "1:02:03", and tenths of a second under ten seconds: "0:09.4"
export function formatClock(ms: number) {
    const seconds = ms / 1000
    if (seconds < 10) return `0:${(Math.floor(seconds * 10) / 10).toFixed(1).padStart(4, '0')}`
    const whole = Math.ceil(seconds)
    const hours = Math.floor(whole / 3600)
    const minutes = Math.floor(whole % 3600 / 60)
    return hours ? `${hours}:${pad(minutes)}:${pad(whole % 60)}` : `${minutes}:${pad(whole % 60)}`
}
