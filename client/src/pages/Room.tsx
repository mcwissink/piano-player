import React from "react";
import { IUser, IRoom, IAppContext, withContext } from '../App';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import RoomSettings from '../components/RoomSettings';
import Chat from '../components/Chat';
import Piano from "../components/Piano";
import { Events as E } from '../../../server/interfaces/IEvents';

interface IRoomProps {
  id: string;
}

interface IRoomState {
}
type IProps = IRoomProps & IAppContext & RouteComponentProps;
class Room extends React.PureComponent<IProps, IRoomState> {
  constructor(props: IProps) {
    super(props);
  }

  componentDidMount() {
    const {
      id,
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
    if (this.props.id !== prevProps.id) {
      this.props.socket.emit('joinRoom', {
        id: this.props.id,
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
      <>
        {/* <div id="room-header">
            <button onClick={() => history.push('/')}>Leave Room</button>
            <div>Room: {room.name}</div>
            <div>Players</div>
            <div>
            {room.players.map(this.renderUser)}
            </div> 
            </div> */}
        <div id="room" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
          <Piano />
          {room.permissions.admin ? <RoomSettings roomName={room.name} /> : null}
        </div>
        <Chat />
      </>
    )
  }
}

export default withRouter(withContext(Room));
