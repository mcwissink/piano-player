import React from 'react';
import io from 'socket.io-client';
import update from 'immutability-helper';
import { Switch, Route, RouteComponentProps, withRouter, Router, BrowserRouter } from 'react-router-dom';
import './App.css';

import RoomList from './components/RoomList';
import { createBrowserHistory } from "history";

import Room from './pages/Room';
import Home from './pages/Home';

import { Events as E } from '../../server/interfaces/IEvents';

export interface IChat {
  user: IUser;
  message: string;
}

export interface IRoom {
  id: string;
  permissions: IPermissions;
  name: string;
  theme: ITheme;
  players: IUser[];
}

export interface IRoomListItem {
  id: string;
  name: string;
  likes: number;
  viewers: number;
  admins: IUser[];
}

export interface IUser {
  id: string;
  name: string;
  color: string;
}

export interface ITheme {
  primary: string;
  secondary: string;
  image: string;
}

export interface IPermissions {
  admin: boolean;
  play: boolean;
}

interface IAppState {
  rooms: IRoomListItem[];
  room: {
    permissions: IPermissions;
    name: string;
    chat: IChat[];
    players: IUser[];
  };
  name: string;
  color: string;
  theme: ITheme;
}

interface IAppPartialContext extends IAppState {
  socket?: SafeSocket; 
  modifier?: AppModifier;
}

export interface IAppContext extends IAppPartialContext {
  socket: SafeSocket;
  modifier: AppModifier;
}

const initialState = {
  rooms: [],
  name: '',
  color: "#000000".replace(/0/g, () => (~~(Math.random()*16)).toString(16)),
  room: {
    permissions: { admin: false, play: false },
    name: '',
    chat: [],
    players: [],
  },
  theme: {
    primary: '#ffffff',
    secondary: '#000000',
    image: '',
  },
}
export const AppContext = React.createContext<IAppPartialContext>(initialState);

export class SafeSocket {
  constructor(public raw: SocketIOClient.Socket) {
  }
  emit<T, K = void>(event: string, data?: T, callback?: (data: K) => void) {
    this.raw.emit(event, data, callback);
  }
  on<T>(event: string, callback: (data: T) => void) {
    this.raw.on(event, callback);
  }
}
class App extends React.PureComponent<RouteComponentProps, IAppState> {
  modifier: AppModifier;
  socket: SafeSocket;
  constructor(props: RouteComponentProps) {
    super(props);
    this.state = initialState;
    this.modifier = new AppModifier(this);
    
    this.socket = new SafeSocket(io('localhost:3001', {
      transports: ['websocket']
    }));
    this.socket.on('reconnect_attempt', () => {
      this.socket.raw.io.opts.transports = ['polling', 'websocket'];
    });
    this.socket.on('connect_error', () => console.log("error"));
    this.socket.on('connect', () => console.log("connected"));
    this.socket.on('chat', this.modifier.chatEvent);
    this.socket.on('roomList', this.modifier.roomListEvent);
    this.socket.on('roomUpdate', this.modifier.roomEvent);
    this.socket.emit('roomList');
    this.socket.emit<E.Settings>('settings', {
      name: this.state.name,
      color: this.state.color,
    });
  };

  
  routeRoom = ({ match }: RouteComponentProps<{ id: string }>) => <Room id={match.params.id} />;
  homePage = () => <Home/>;
  render() {
    return (
      <AppContext.Provider value={{
        socket: this.socket,
        modifier: this.modifier,
        ...this.state,
      }}>
        <div id="piano-page-background-mask">
          <div id="piano-page-background" style={{ backgroundImage: `url(${this.state.theme.image})`}} />
          <div id="piano-page-background-2" />
        </div>
        <div id="content">
          <div id="header">
            <h1>Keyboard.Cafe</h1>
          </div>
          <div id="roomlist-container">
            <RoomList />
          </div>
          <Switch>
            <Route path="/room/:id" component={this.routeRoom} />
            <Route path="/" exact={true} component={this.homePage} />
          </Switch>
        </div>
      </AppContext.Provider>
    );
  }
};

// Probably reimplementing redux in a worse way, but as long as there are no performance hits, it's ok
class AppModifier {
  app: App;
  constructor(app: App) {
    this.app = app;
  }

  noRoom(): boolean {
    return this.app.state.room.name === '';
  }
  
  roomListEvent = (data: IRoomListItem[]) => {
    this.app.setState({ rooms: data });
  }

  chatEvent = (data: IChat) => {
    this.app.setState(oldState => update(oldState, {
      room: {
        chat: { $push: [data] },
      },
    }));
  }
  
  roomEvent = (data: IRoom|null) => {
    if (data === null) {
      this.app.props.history.push('/');
      return;
    }
    this.onThemeChange(data.theme);
    this.app.setState(oldState => update(oldState, {
      room: {
        permissions: { $set: data.permissions },
        name: { $set: data.name },
        players: { $set: data.players },
      }
    }));
  }

  onLeaveRoom = () => {
    this.app.socket.emit<E.Room.Join>('joinRoom', { id: '' }, () => {});
    this.app.setState(oldState => update(oldState, {
      room: {
        name: { $set: '' },
      },
    }));
  }

  onUserChange = (user: IUser) => {
    this.app.setState({
      name: user.name,
      color: user.color,
    });
  }

  onThemeChange = (theme: ITheme) => {
    this.app.setState({ theme });
  }
  
  onPermissionsUpdate = (id: string, permissions: IPermissions) => () => {
    this.app.socket.emit('updatePermissions', {
      id,
      permissions,
    });
  }

  onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    this.app.setState({ name: e.currentTarget.value });
  }

  onColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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


const customHistory = createBrowserHistory();
const AppWithRouter = withRouter(App);
const AppWithRouterComponent = React.memo(() => {
  return <AppWithRouter />;
});
export default () => (
  <Router history={customHistory}>
    <BrowserRouter>
      <AppWithRouterComponent />
    </BrowserRouter>
  </Router>
);
