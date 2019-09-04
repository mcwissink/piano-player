import React from 'react';
import io from 'socket.io-client';
import update from 'immutability-helper';
import { Switch, Route, RouteComponentProps, withRouter, Router, BrowserRouter } from 'react-router-dom';
import './App.css';

import RoomList from './components/RoomList';
import UserSettings from './components/UserSettings';
import Room from './components/Room';
import RoomSettings from './components/RoomSettings';
import { createBrowserHistory } from "history";

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
  socket?: SocketIOClient.Socket; 
  modifier?: AppModifier;
}

export interface IAppContext extends IAppPartialContext {
  socket: SocketIOClient.Socket;
  modifier: AppModifier;
}

const initialState = {
  rooms: [],
  name: 'Anonymous',
  color: "#000000".replace(/0/g, () => (~~(Math.random()*16)).toString(16)),
  room: {
    permissions: { admin: false, play: false },
    name: '',
    chat: [],
    players: [],
  },
  theme: {
    primary: '#DD51DD',
    secondary: '#000000',
    image: '',
  },
}
export const AppContext = React.createContext<IAppPartialContext>(initialState);

class App extends React.PureComponent<RouteComponentProps, IAppState> {
  modifier: AppModifier;
  socket: SocketIOClient.Socket;
  constructor(props: RouteComponentProps) {
    super(props);
    this.state = initialState;
    this.modifier = new AppModifier(this);
    
    this.socket = io('localhost:3001', {
      transports: ['websocket']
    });
    this.socket.on('reconnect_attempt', () => {
      this.socket.io.opts.transports = ['polling', 'websocket'];
    });
    this.socket.on('connect_error', () => console.log("error"));
    this.socket.on('connect', () => console.log("connected"));
    this.socket.on('chat', this.modifier.chatEvent);
    this.socket.on('roomList', this.modifier.roomListEvent);
    this.socket.on('roomUpdate', this.modifier.roomEvent);
    this.socket.emit('roomList');
    this.socket.emit('settings', {
      name: this.state.name,
      color: this.state.color,
    }, this.modifier.onUserChange);
  };

  
  routeRoom = ({ match }: RouteComponentProps<{ id: string }>) => <Room id={match.params.id} />;
  routeCreateRoom = () => <RoomSettings />;
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
            <h1>Pianooo</h1>
          </div>
          {this.modifier.noRoom() ? <UserSettings /> : null}
          <div />
          <div />
          <div id="roomlist-container">
            <RoomList />
          </div>
          <Switch>
            <Route path="/room/:id" component={this.routeRoom} />
            <Route path="/" exact={true} component={this.routeCreateRoom} />
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
    this.app.socket.emit('joinRoom', { id: '' }, () => {});
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

  onColorChange = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    this.app.setState({ color: e.currentTarget.value });

    // Find a way to make this more React-like.
    // This is a work around to get a better styling on the color picker without using unofficial CSS selectors
    // Copy from https://stackoverflow.com/a/11471224/2930176
    const color_picker: HTMLInputElement | null = document.getElementById("color-picker") as HTMLInputElement;
    const color_picker_wrapper = document.getElementById("color-picker-wrapper");
    if (color_picker_wrapper !== null && color_picker !== null && color_picker.value !== null) {
      color_picker_wrapper.style.backgroundColor = color_picker.value;
      color_picker_wrapper.style.backgroundColor = color_picker.value;
    }
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
const AppWithRouterComponent = React.memo((Thingy) => {
  return <AppWithRouter />;
});
export default () => (
  <Router history={customHistory}>
    <BrowserRouter>
      <AppWithRouterComponent />
    </BrowserRouter>
  </Router>
);
