import React from 'react';
import Piano from './components/Piano';
import Chat from './components/Chat';
import io from 'socket.io-client';
import './App.css';

export interface IAppContext {
  socket: SocketIOClient.Socket; 
}

export const AppContext = React.createContext<Partial<IAppContext>>({});

class App extends React.PureComponent<{}, {}> {
  socket: SocketIOClient.Socket;
  constructor(props: {}) {
    super(props);
    this.socket = io.connect(window.location.href.replace(/^http/, "ws"));
    this.socket.on('connect_error', () => console.log("error"));
    this.socket.on('connect', () => console.log("connected"));
    this.socket.emit('join', { room: 'default' });
  };
  
  render() {
    return (
      <AppContext.Provider value={{
        socket: this.socket,
      }}>
        <Chat />
        <Piano />
      </AppContext.Provider>
    );
  }
}

export function withContext<P extends object>(WrappedComponent: React.ComponentType<P & IAppContext>): React.ComponentType<P> {
  return class ContextComponent extends React.Component<P> {
    render() {
      return <AppContext.Consumer>
        {value => {
          if (value.socket === undefined) {
            return null;
          } else {
            return <WrappedComponent socket={value.socket} {...this.props}/>;
          }
        }}
      </AppContext.Consumer>
    }
  }
}

export default App;
