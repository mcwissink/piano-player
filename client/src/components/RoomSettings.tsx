import React from "react";
import update from 'immutability-helper';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { ITheme, IAppContext, withContext, SafeSocket } from '../App';
import { Events as E } from '../../../server/interfaces/IEvents';
import Button from "./Button";

interface IRoomSettingsState {
  name: string;

  theme: ITheme;
}

type IProps = {
  roomName?: string;
} & IAppContext & RouteComponentProps;
class RoomSettings extends React.PureComponent<IProps, IRoomSettingsState> {
  constructor(props: IProps) {
    super(props);
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
    return this.props.modifier.noRoom() ? (name !== '' && this.props.rooms.find(room => room.name === name) === undefined) : true;
  }

  onRoomSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const {
      color,
      modifier,
      socket,
    } = this.props;
    const {
      name,
      theme,
    } = this.state;
    const parsedName = name.trim();
    if (this.canSubmit()) {
      if (this.props.modifier.noRoom()) {
        socket.emit<E.Room.Create, string|undefined>('createRoom', {
          name: parsedName,
          theme,
        }, (roomName) => {
          if (roomName !== undefined) {
            this.props.history.push(`/room/${encodeURIComponent(roomName)}`);
          }
        }); 
      } else {
        socket.emit('updateRoom', {
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
      modifier,
    } = this.props;
    const {
      name,
      theme,
    } = this.state;
    const noRoom = this.props.modifier.noRoom();
    return (
      <div>
        <form onSubmit={this.onRoomSubmit} style={{ display: 'flex', alignItems: 'center' }}>
          {noRoom ? <input placeholder="Room Name" type="text" value={name} onChange={this.onNameChange} /> : null}
          <input onFocus={modifier.disablePiano} onBlur={modifier.enablePiano} placeholder="Image URL" type="text" style={{ marginRight: '1em' }} value={theme.image} onChange={this.onImageChange} />
          <Button type="submit" value={`${noRoom ? 'Create' : 'Update'} Room`} disabled={!this.canSubmit()} />
        </form>
      </div>
    )
  }
}

export default withRouter(withContext(RoomSettings));
