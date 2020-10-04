import React from 'react';
import io from 'socket.io-client';
import update from 'immutability-helper';
import { Link, Switch, Route, RouteComponentProps, withRouter, Router, BrowserRouter } from 'react-router-dom';
import './App.css';
import { isMobile, BrowserView } from 'react-device-detect';

import RoomList from './components/RoomList';
import { createBrowserHistory } from "history";

import Room from './pages/Room';
import Home from './pages/Home';

import { IEvents as E } from '../../server/interfaces/IEvents';
import { IApp as A } from './interfaces/IApp'

interface IAppState {
  rooms: A.RoomSummary[];
  room: A.Room;
  user: A.User;
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
  user: {
    id: '',
    name: '',
    color: '#000000'.replace(/0/g, () => (~~(Math.random()*16)).toString(16)),
  },
  room: {
    id: '',
    permissions: { admin: false, play: false },
    chat: [],
    players: [],
    activePiano: true,
    theme: {
      primary: '#ffffff',
      secondary: '#000000',
      image: '',
    },
    scope: ''
  }
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
    
    this.socket = new SafeSocket(io(window.location.host, {
      transports: ['websocket']
    }));

    this.socket.on('reconnect_attempt', () => {
      this.socket.raw.io.opts.transports = ['polling', 'websocket'];
    });
    this.socket.on('connect_error', e => console.log(e));
    this.socket.on('connect', () => console.log('connected'));
    this.socket.on('chat', this.modifier.chatEvent);
    this.socket.on('roomList', this.modifier.roomListEvent);
    this.socket.on('roomUpdate', this.modifier.roomUpdate);
    this.socket.emit('roomList');
    this.socket.emit<E.Settings>('settings', {
      name: this.state.user.name,
      color: this.state.user.color,
    });
  };

  sidebar = () => (
    <div id='sidebar'>
      <Link to={`/`} style={{ textDecoration: 'none' }}>
        <h1>keyboard.cafe</h1>
      </Link>
      <RoomList />
    </div>
  );
  
  routeRoom = ({ match }: RouteComponentProps<{ id: string }>) => <Room id={match.params.id} />;
  homePage = () => isMobile ? (
    this.sidebar()
  ) : (
    <Home />
  );
  render() {
    return (
      <AppContext.Provider value={{
        socket: this.socket,
        modifier: this.modifier,
        ...this.state,
      }}>
        <div id='piano-page-background' style={{ opacity: 0.5, backgroundImage: `url(${this.state.room.theme.image})`}} />
        <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
          <BrowserView>
            {this.sidebar()}
          </BrowserView>
          <Switch>
            <Route path='/room/:id' component={this.routeRoom} />
            <Route path='/' exact={true} component={this.homePage} />
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
    return this.app.state.room.id === '';
  }
  
  roomListEvent = (data: E.Room.Summary[]) => {
    this.app.setState({ rooms: data });
  }

  chatEvent = (data: E.Chat.Read) => {
    this.app.setState(oldState => update(oldState, {
      room: {
        chat: { $push: [data] },
      },
    }), () => {
      if (this.app.state.room.chat.length > 50) {
        this.app.setState(oldState => update(oldState, {
          room: {
            chat: { $splice: [[0, 1]] },
          },
        }));
      }
    });
  }

  disablePiano = () => {
    this.app.setState(oldState => update(oldState, {
      room: {
        activePiano: { $set: false }
      },
    }));
  }

  enablePiano = () => {
    this.app.setState(oldState => update(oldState, {
      room: {
        activePiano: { $set: true }
      },
    }));
  }
  
  roomUpdate = (data: E.Room.Read|null) => {
    if (data === null) {
      this.app.props.history.push('/');
      return;
    }
    this.onThemeChange(data.theme);
    this.app.setState(oldState => update(oldState, {
      room: {
        permissions: { $set: data.permissions },
        id: { $set: data.id },
        players: { $set: data.players },
        chat: { $set: [] },
        scope: { $set: data.scope }
      }
    }));
  }

  onLeaveRoom = () => {
    /* this.app.socket.emit<E.Room.Join>('joinRoom', {
     * }, () => {}); */
    this.app.setState(oldState => update(oldState, {
      room: {
        id: { $set: '' },
        chat: { $set: [] },
        theme: { $set: initialState.room.theme },
      },
    }));
  }

  onUserChange = (user: A.User) => {
    this.app.setState(oldState => update(oldState, {
      user: {
        name: { $set: user.name },
        color: { $set: user.color },
      }
    }));
  }

  onThemeChange = (theme: A.Theme) => {
    this.app.setState(oldState => update(oldState, {
      room: {
        theme: { $set: theme }
      }
    }));
  }
  
  onPermissionsUpdate = (id: string, permissions: A.Permissions) => () => {
    this.app.socket.emit<E.Permissions>('updatePermissions', {
      id,
      permissions,
    });
  }

  onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const name = e.currentTarget.value 
    this.app.setState(oldState => update(oldState, {
      user: {
        name: { $set: name }
      }
    }));
  }

  onColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const color = e.currentTarget.value 
    this.app.setState(oldState => update(oldState, {
      user: {
        color: { $set: color }
      }
    }));
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
