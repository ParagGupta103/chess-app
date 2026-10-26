import { useState } from 'react'
import './NewGame.css'
import { levels } from '../../engine/levels'
import { describeTimeControl, timeControls } from '../../game/clock'
import type { GameSettings } from '../../game/settings'

interface Props {
    initial: GameSettings;
    onStart: (settings: GameSettings) => void;
}

interface ChoiceProps<T extends string> {
    legend: string;
    value: T;
    options: [T, string][];
    onChange: (value: T) => void;
}

// A row of radio buttons styled as toggle buttons
function Choice<T extends string>({ legend, value, options, onChange }: ChoiceProps<T>) {
    return <fieldset>
        <legend>{legend}</legend>
        <div className='choice'>
            {options.map(([option, label]) =>
                <label key={option}>
                    <input type='radio' name={legend} checked={value === option} onChange={() => onChange(option)} />
                    {label}
                </label>
            )}
        </div>
    </fieldset>
}

export default function NewGame({ initial, onStart }: Props) {
    const [settings, setSettings] = useState(initial)
    const update = (changes: Partial<GameSettings>) => setSettings({ ...settings, ...changes })

    return <form className='new-game' onSubmit={e => { e.preventDefault(); onStart(settings) }}>
        <h1>New game</h1>
        <Choice
            legend='Opponent'
            value={settings.opponent}
            options={[['computer', 'Computer'], ['friend', 'Friend on this device']]}
            onChange={opponent => update({ opponent })}
        />
        {settings.opponent === 'computer' && <>
            <Choice
                legend='Play as'
                value={settings.color}
                options={[['w', 'White'], ['b', 'Black'], ['random', 'Random']]}
                onChange={color => update({ color })}
            />
            <label className='field'>
                Level
                <select value={settings.level} onChange={e => update({ level: Number(e.target.value) })}>
                    {levels.map((level, i) =>
                        <option key={level.name} value={i + 1}>{i + 1} — {level.name}</option>
                    )}
                </select>
            </label>
        </>}
        <label className='field'>
            Time control
            <select value={settings.timeControl} onChange={e => update({ timeControl: e.target.value })}>
                {timeControls.map(key =>
                    <option key={key} value={key}>{describeTimeControl(key)}</option>
                )}
            </select>
        </label>
        <button type='submit' className='text-button'>Start game</button>
    </form>
}
