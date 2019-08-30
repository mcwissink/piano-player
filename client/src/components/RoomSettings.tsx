import React from "react";
import update from 'immutability-helper';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { ITheme, IAppContext, withContext } from '../App';


interface IRoomSettingsState {
  name: string;
  theme: ITheme;
}

type IProps = {
  roomName?: string;
} & IAppContext & RouteComponentProps;
class RoomList extends React.PureComponent<IProps, IRoomSettingsState> {
  socket: SocketIOClient.Socket;
  constructor(props: IProps) {
    super(props);
    this.socket = props.socket;
    const theme = props.roomName === undefined ? {
      primary: '#ffffff',
      secondary: '#000000',
      image: '',
    } : props.theme;
    this.state = {
      name: props.roomName === undefined ? '' : props.roomName,
      theme,
    };

  }

  canSubmit = () => {
    const {
      name,
    } = this.state;
    return this.props.roomName === undefined ? (name !== '' && this.props.rooms.find(room => room.name === name) === undefined) : true;
  }

  onRoomSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const {
      name,
      theme,
    } = this.state;
    const parsedName = name.trim();
    if (this.canSubmit()) {
      if (this.props.roomName === undefined) {
        this.socket.emit('createRoom', {
          name: parsedName,
          theme,
        }, (roomName?: string) => {
          if (roomName !== undefined) {
            this.props.history.push(`/room/${encodeURIComponent(roomName)}`);
          }
        }); 
      } else {
        this.socket.emit('updateRoom', {
          theme,
        });
      }
    }
  };

  onNameChange = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    this.setState({ name: e.currentTarget.value });
  }


  onPrimaryChange = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    const color = e.currentTarget.value;
    this.setState(oldState => update(oldState, {
      theme: {
        primary: { $set: color },
      },
    }));
  }

  onSecondaryChange = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    const color = e.currentTarget.value;
    this.setState(oldState => update(oldState, {
      theme: {
        secondary: { $set: color },
      },
    }));
  }
  onImageChange = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    const color = e.currentTarget.value;
    this.setState(oldState => update(oldState, {
      theme: {
        image: { $set: color },
      },
    }));
  }

  render() {
    const {
      name,
      theme,
    } = this.state;
    const hasRoom = this.props.roomName !== undefined;
    return (
      <div>
        <form onSubmit={this.onRoomSubmit}>
          {hasRoom ? null : <input type="text" value={name} onChange={this.onNameChange} />}
          <input type="color" value={theme.primary} onChange={this.onPrimaryChange} />
          <input type="color" value={theme.secondary} onChange={this.onSecondaryChange} />
          <input type="text" value={theme.image} onChange={this.onImageChange} />
          <input type="submit" value={`${hasRoom ? 'Update' : 'Create'} Room`} disabled={!this.canSubmit()} />
        </form>
      </div>
    )
  }
}

export default withRouter(withContext(RoomList));
