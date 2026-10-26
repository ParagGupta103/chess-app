import type { Color } from 'chess.js'

export interface GameSettings {
    opponent: 'computer' | 'friend';
    color: Color | 'random'; // your side when playing the computer
    level: number; // 1 to levels.length
}

export const defaultSettings: GameSettings = { opponent: 'computer', color: 'w', level: 1 }
