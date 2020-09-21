import React from "react";
import { IUser, IRoom, IAppContext, withContext } from '../App';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import RoomSettings from '../components/RoomSettings';
import Chat from '../components/Chat';
import Piano from "../components/Piano";
import { Events as E } from '../../../server/interfaces/IEvents';
import { isMobile, BrowserView } from 'react-device-detect';

interface IRoomProps {
  id: string;
}

interface IRoomState {
}
type IProps = IRoomProps & IAppContext & RouteComponentProps;
class Room extends React.PureComponent<IProps, IRoomState> {
  componentDidMount() {
    const {
      name,
      color,
      socket
    } = this.props;
    socket.emit<E.Room.Join, IRoom|null>('joinRoom', {
      id: this.props.id,
      user: {
        name,
        color,
      }
    }, (room) => {
      this.props.modifier.roomEvent(room);
    });
  }

  componentWillUnmount() {
    this.props.modifier.onLeaveRoom();
  }

  componentDidUpdate(prevProps: IProps) {
    const {
      id,
      name,
      color,
      socket,
    } = this.props;
    if (id !== prevProps.id) {
      socket.emit<E.Room.Join, IRoom|null>('joinRoom', {
        id,
        user: {
          name,
          color,
        }
      }, (room: IRoom|null) => {
        this.props.modifier.roomEvent(room);
      });
    }
  }

  /* onLikeRoom = (e: number) => {
   *   this.socket.emit('likeRoom', {
   *     id: this.props.id,
   *   });
   * }
   */
  
  renderUser = (user: IUser) => {
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
      room,
      modifier,
    } = this.props;
    if (modifier.noRoom()){
      return <div>loading...</div>;
    }
    return (
      <div style={{ width: '100%'}}>
        {isMobile ? (
          <div id="room" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div>
              <Piano />
              {room.permissions.admin ? <RoomSettings roomName={room.name} /> : null}
            </div>
            <Chat />
          </div>
        ) : (
          <div id="room" style={{ display: 'flex', width: '100%', height: '100%', justifyContent: 'space-between' }}>
            <div style={{ height: '100%', flex: 1 }}>
              <Piano />
              {room.permissions.admin ? <RoomSettings roomName={room.name} /> : null}
            </div>
            <Chat />
          </div>
        )}
      </div>
    );
  }
}

export default withRouter(withContext(Room));
