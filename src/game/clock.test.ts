import { describeTimeControl, formatClock, parseTimeControl } from './clock'

test('reads time controls', () => {
    expect(parseTimeControl('none')).toBeNull()
    expect(parseTimeControl('3+2')).toEqual({ initial: 180, increment: 2 })
    expect(describeTimeControl('none')).toBe('No clock')
    expect(describeTimeControl('5+0')).toBe('5 min')
    expect(describeTimeControl('15+10')).toBe('15 min + 10 s per move')
})

test('formats the time left', () => {
    expect(formatClock(5 * 60_000)).toBe('5:00')
    expect(formatClock(61_500)).toBe('1:02')
    expect(formatClock(3_723_000)).toBe('1:02:03')
    expect(formatClock(10_000)).toBe('0:10')
    expect(formatClock(9_480)).toBe('0:09.4')
    expect(formatClock(9_999)).toBe('0:09.9')
    expect(formatClock(0)).toBe('0:00.0')
})
