import { useState } from 'react';
import './App.css';
import Analysis from './components/Analysis/Analysis';
import Game from './components/Game/Game';
import NewGame from './components/NewGame/NewGame';
import type { GameRecord } from './analysis/analysis';
import { defaultSettings, type GameSettings } from './game/settings';

type Screen =
  | { name: 'setup' }
  | { name: 'game' }
  | { name: 'analysis'; record: GameRecord };

function App() {
  // Settings are kept between games so the setup screen remembers the last choices
  const [settings, setSettings] = useState(defaultSettings);
  const [screen, setScreen] = useState<Screen>({ name: 'setup' });
  const newGame = () => setScreen({ name: 'setup' });

  function start(chosen: GameSettings) {
    setSettings(chosen);
    setScreen({ name: 'game' });
  }

  return (
    <div id='app'>
      {screen.name === 'setup' && <NewGame initial={settings} onStart={start}/>}
      {screen.name === 'game' &&
        <Game settings={settings} onNewGame={newGame} onAnalyze={record => setScreen({ name: 'analysis', record })}/>}
      {screen.name === 'analysis' && <Analysis record={screen.record} onNewGame={newGame}/>}
    </div>
  );
}

export default App;
