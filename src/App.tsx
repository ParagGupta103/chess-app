import { useState } from 'react';
import './App.css';
import Game from './components/Game/Game';
import NewGame from './components/NewGame/NewGame';
import { defaultSettings, type GameSettings } from './game/settings';

function App() {
  // Settings are kept between games so the setup screen remembers the last choices
  const [settings, setSettings] = useState(defaultSettings);
  const [playing, setPlaying] = useState(false);

  function start(chosen: GameSettings) {
    setSettings(chosen);
    setPlaying(true);
  }

  return (
    <div id='app'>
      {playing
        ? <Game settings={settings} onNewGame={() => setPlaying(false)}/>
        : <NewGame initial={settings} onStart={start}/>}
    </div>
  );
}

export default App;
