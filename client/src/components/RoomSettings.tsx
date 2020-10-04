import React from "react";
import update from 'immutability-helper';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { IAppContext, withContext } from '../App';
import { IEvents as E } from '../../../server/interfaces/IEvents';
import { IApp as A } from '../interfaces/IApp';
import Button from "./Button";

interface IRoomSettingsState {
  theme: A.Theme;
  scope: string;
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
    } : props.room.theme;
    this.state = {
      theme,
      scope: props.room.scope || 'public',
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
      scope,
    } = this.state;
    if (this.canSubmit()) {
      socket.emit<E.Room.Update>('updateRoom', {
        theme,
        scope,
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

  onScopeChange = () => {
    this.setState(oldState => ({
      scope: oldState.scope === 'private' ? 'public' : 'private',
    }));
  }

  render() {
    const {
      modifier,
    } = this.props;
    const {
      theme,
      scope
    } = this.state;
    return (
      <div>
        <form onSubmit={this.onRoomSubmit} style={{ display: 'flex', alignItems: 'center' }}>
          {/* <input onFocus={modifier.disablePiano} onBlur={modifier.enablePiano} placeholder='image url' type='text' value={theme.image} onChange={this.onImageChange} /> */}
          <Button type='button' value={scope} onClick={this.onScopeChange}/>
          <Button type='submit' value='update' disabled={!this.canSubmit()} />
        </form>
      </div>
    )
  }
}

export default withRouter(withContext(RoomSettings));
