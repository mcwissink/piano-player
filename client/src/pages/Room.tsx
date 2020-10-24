import React from "react";
import { IAppContext, withContext } from '../App';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import Chat from '../components/Chat';
import Piano from "../components/Piano";
import { IEvents as E } from '../../../server/interfaces/IEvents';
import { IApp as A } from '../interfaces/IApp';
import { isMobile } from 'react-device-detect';

interface IRoomProps {
  id: string;
}

interface IRoomState {
}
type IProps = IRoomProps & IAppContext & RouteComponentProps;
class Room extends React.PureComponent<IProps, IRoomState> {
  componentDidMount() {
    const {
      id,
      user,
      socket
    } = this.props;
    socket.emit<E.Room.Join, A.Room|null>('joinRoom', {
      id,
      user,
    }, (room) => {
      this.props.modifier.roomUpdate(room);
    });
  }

  componentWillUnmount() {
    this.props.modifier.onLeaveRoom();
  }

  componentDidUpdate(prevProps: IProps) {
    const {
      id,
      user,
      socket,
    } = this.props;
    if (id !== prevProps.id) {
      socket.emit<E.Room.Join, A.Room|null>('joinRoom', {
        id,
        user,
      }, (room: A.Room|null) => {
        this.props.modifier.roomUpdate(room);
      });
    }
  }

  /* onLikeRoom = (e: number) => {
   *   this.socket.emit('likeRoom', {
   *     id: this.props.id,
   *   });
   * }
   */
  
  renderUser = (user: A.User) => {
    const {
      room,
      modifier,
      socket,
    } = this.props;
    return (
      <span key={user.id} style={{ backgroundColor: user.color }}>
        {user.name}
        {room.permissions.admin && user.id !== socket.raw.id ? (
          <button onClick={modifier.onPermissionsUpdate(user.id, { admin: false, play: false})}>Remove Player</button>
        ) : null}
      </span>
    );
  }    

  render() {
    const {
      modifier,
    } = this.props;
    if (modifier.noRoom()){
      return <div>loading...</div>;
    }
    return (
      <div style={{ flex: 1 }}>
        {isMobile ? (
          <div id="room" style={{ display: 'flex', flex: 1, height: '100%', flexDirection: 'column', alignItems: 'center' }}>
            <Piano />
            <div/>
            <Chat />
          </div>
        ) : (
          <div id="room" style={{ display: 'flex', flex: 1, height: '100%', justifyContent: 'space-between' }}>
            <Piano />
            <Chat />
          </div>
        )}
      </div>
    );
  }
}

export default withRouter(withContext(Room));
