// In App.js
import React from 'react';
import './App.css';
import LoreMap from './components/LoreMap/LoreMap';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>LoreKeep</h1>
      </header>
      <main>
        <LoreMap />
      </main>
    </div>
  );
}

export default App;