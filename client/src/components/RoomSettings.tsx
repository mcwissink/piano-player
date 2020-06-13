import React from "react";
import update from 'immutability-helper';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { ITheme, IAppContext, withContext } from '../App';
import { Events as E } from '../../../server/interfaces/IEvents';
import Button from "./Button";

interface IRoomSettingsState {
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
      theme,
    };

  }

  canSubmit = () => {
    return true;
  }

  onRoomSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const {
      socket,
    } = this.props;
    const {
      theme,
    } = this.state;
    if (this.canSubmit()) {
      socket.emit<E.Room.Update>('updateRoom', {
        theme,
      });
    }
  };

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
      theme,
    } = this.state;
    return (
      <div>
        <form onSubmit={this.onRoomSubmit} style={{ display: 'flex', alignItems: 'center' }}>
          <input onFocus={modifier.disablePiano} onBlur={modifier.enablePiano} placeholder="Image URL" type="text" value={theme.image} onChange={this.onImageChange} />
          <Button type="submit" value="Update" disabled={!this.canSubmit()} />
        </form>
      </div>
    )
  }
}

export default withRouter(withContext(RoomSettings));
