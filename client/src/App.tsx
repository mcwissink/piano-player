import React from 'react';
import io from 'socket.io-client';
import update from 'immutability-helper';
import './App.css';

import Piano from './components/Piano';
import Chat from './components/Chat';
import RoomList from './components/RoomList';
import Settings from './components/Settings';

export interface IRoom {
  id: string;
  name: string;
  likes: number;
  owner: string;
}

interface IChat {
  id: string;
  name: string;
  message: string;
}

interface IAppState {
  rooms: IRoom[];
  chat: IChat[];
  name: string;
  color: string;
}

interface IAppPartialContext extends IAppState {
  socket?: SocketIOClient.Socket; 
  modifier?: AppModifier;
}

export interface IAppContext extends IAppPartialContext {
  socket: SocketIOClient.Socket;
  modifier: AppModifier;
}

const initialState = {
  rooms: [],
  chat: [],
  name: 'Anonymous',
  color: '#000000',
}
export const AppContext = React.createContext<IAppPartialContext>(initialState);

class App extends React.PureComponent<{}, IAppState> {
  modifier: AppModifier;
  socket: SocketIOClient.Socket;
  constructor(props: {}) {
    super(props);
    this.socket = io('localhost:3001', {
      transports: ['websocket']
    });
    this.socket.on('reconnect_attempt', () => {
      this.socket.io.opts.transports = ['polling', 'websocket'];
    });
    this.socket.on('connect_error', () => console.log("error"));
    this.socket.on('connect', () => console.log("connected"));
    this.socket.on('init', this.initEvent);
    this.socket.on('addRoom', this.addRoomEvent);
    this.socket.on('chat', this.chatEvent);
    this.socket.emit('init');

    this.state = initialState;
    this.modifier = new AppModifier(this);
  };

  addRoomEvent = (data: IRoom) => {
    this.setState(oldState => update(oldState, {
      rooms: { $push: [data] },
    }));
  }

  initEvent = (data: {
    rooms: IRoom[],
    name: string,
    color: string,
  })=> {
    this.setState(data);
  }
  
  chatEvent = (data: IChat) => {
    this.setState(oldState => update(oldState, {
      chat: { $push: [data] },
    }));
  }
  
  render() {
    return (
      <AppContext.Provider value={{
        socket: this.socket,
        modifier: this.modifier,
        ...this.state,
      }}>
        <RoomList />
        <Chat />
        <Settings />
        <Piano />
      </AppContext.Provider>
    );
  }
}

// Probably reimplementing redux in a worse way, but as long as there are no performance hits, it's ok
class AppModifier {
  app: App;
  constructor(app: App) {
    this.app = app;
  }

  onNameChange = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    this.app.setState({ name: e.currentTarget.value });
  };
  
  onColorChange = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    this.app.setState({ color: e.currentTarget.value });
  }
}

export function withContext<P extends object>(WrappedComponent: React.ComponentType<P & IAppContext>): React.ComponentType<P> {
  return class ContextComponent extends React.Component<P> {
    render() {
      return <AppContext.Consumer>
        {value => {
          if (value.socket === undefined || value.modifier === undefined) {
            return null;
          } else {
            return (
              <WrappedComponent
                socket={value.socket}
                modifier={value.modifier}
                {...value}
                {...this.props}/>
            );
          }
        }}
      </AppContext.Consumer>
    }
  }
}

export default App;
