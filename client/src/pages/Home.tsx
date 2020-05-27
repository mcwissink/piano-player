import React from "react";
import { IAppContext, withContext } from '../App';
import UserSettings from '../components/UserSettings';
import { Events as E } from '../../../server/interfaces/IEvents';
import { withRouter, RouteComponentProps } from 'react-router-dom';

interface IHomeState {
  name: string;
}
type IProps = IAppContext & RouteComponentProps;
class Home extends React.PureComponent<IProps, IHomeState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      name: '',
    }
  }
  
  onNameChange = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    this.setState({ name: e.currentTarget.value });
  }

  canSubmit = () => {
    return this.state.name !== "";
  }

  onPublicRoomCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const {
      name
    } = this.state;
    const {
      socket,
      history,
    } = this.props;
    if (this.canSubmit()) {
      socket.emit<E.Room.Create, string|undefined>('createRoom', {
        name,
        theme: {
          primary: '#ffffff',
          secondary: '#000000',
          image: '',
        }
      }, (roomName) => {
        if (roomName !== undefined) {
          history.push(`/room/${encodeURIComponent(roomName)}`);
        }
      });
    }
  };

  onPrivateRoomCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const {
      socket,
      history,
    } = this.props;
    socket.emit<E.Room.Create, string|undefined>('createRoom', {
      name: '',
      theme: {
        primary: '#ffffff',
        secondary: '#000000',
        image: '',
      },
    }, (roomName) => {
      if (roomName !== undefined) {
        history.push(`/room/${encodeURIComponent(roomName)}`);
      }
    });
  }

  render() {
    const {
      name,
    } = this.state;
    return (
      <div>
        <h2>User</h2>
        <UserSettings />
        <form onSubmit={this.onPublicRoomCreate}>
          <h2>Public Room</h2>
          <input placeholder="Name" type="text" value={name} onChange={this.onNameChange} />
          <input type="submit" value="Create" disabled={!this.canSubmit()} />
        </form>
        <form onSubmit={this.onPrivateRoomCreate}>
          <h2>Private Room</h2>
          <input type="submit" value="Create" />
        </form>
      </div>
    )
  }
}

export default withRouter(withContext(Home));
