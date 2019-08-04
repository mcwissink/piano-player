import React from 'react';
import Piano from './components/Piano'
import logo from './logo.svg';
import './App.css';

class App extends React.PureComponent<{}, {}> {
  render() {
    return (
      <div className="App">
        <Piano />
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.tsx</code> and save to reload.
          </p>
        </header>
      </div>
    );
  }
}

export default App;