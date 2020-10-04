import React from "react";
import { IAppContext, withContext } from '../App';
import UserSettings from '../components/UserSettings';
import { IEvents as E } from '../../../server/interfaces/IEvents';
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
        id: name,
        theme: {
          primary: '#ffffff',
          secondary: '#000000',
          image: '',
        },
        scope: 'public'
      }, (roomId) => {
        if (roomId !== undefined) {
          history.push(`/room/${encodeURIComponent(roomId)}`);
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
      id: '',
      theme: {
        primary: '#ffffff',
        secondary: '#000000',
        image: '',
      },
      scope: 'private'
    }, (roomId) => {
      if (roomId !== undefined) {
        history.push(`/room/${encodeURIComponent(roomId)}`);
      }
    });
  }

  render() {
    const {
      name,
    } = this.state;
    return (
      <div>
        <h2>user</h2>
        <UserSettings />
        <form onSubmit={this.onPublicRoomCreate}>
          <h2>public room</h2>
          <input placeholder="name" type="text" value={name} onChange={this.onNameChange} />
          <input type="submit" value="create" disabled={!this.canSubmit()} />
        </form>
        <form onSubmit={this.onPrivateRoomCreate}>
          <h2>private room</h2>
          <input type="submit" value="create" />
        </form>
      </div>
    )
  }
}

export default withRouter(withContext(Home));
