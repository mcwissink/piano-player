import React from 'react';
import Piano from './components/Piano'
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
        <Piano />
      </AppContext.Provider>
    );
  }
}

export const withContext = <P extends object>(WrappedComponent: React.ComponentType<P & IAppContext>) =>
  class ContextComponent extends React.Component<P> {
    static contextType = AppContext;
    context!: React.ContextType<typeof AppContext>;
    render() {
      if (this.context.socket !== undefined) {
        return <WrappedComponent socket={this.context.socket} {...this.props}/>;
      } else {
        return null;
      }
    }
  }

export default App;
