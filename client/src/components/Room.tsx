import React from "react";
import { IUser, IRoom, IAppContext, withContext } from '../App';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import RoomSettings from './RoomSettings';
import Piano from './Piano';
import Chat from './Chat';

interface IRoomProps {
  id: string;
}

interface IRoomState {
}
type IProps = IRoomProps & IAppContext & RouteComponentProps;
class Room extends React.PureComponent<IProps, IRoomState> {
  socket: SocketIOClient.Socket;
  constructor(props: IProps) {
    super(props);
    this.socket = props.socket;
  }

  componentDidMount() {
    this.socket.emit('joinRoom', {
      id: this.props.id,
    }, (room: IRoom|null) => {
      this.props.modifier.roomEvent(room);
    });
  }

  componentWillUnmount() {
    this.props.modifier.onLeaveRoom();
  }

  componentDidUpdate(prevProps: IProps) {
    if (this.props.id !== prevProps.id) {
      this.socket.emit('joinRoom', {
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
    } = this.props;
    return (
      <span key={user.id} style={{ backgroundColor: user.color }}>
        {user.name}
        {room.permissions.admin && user.id !== this.socket.id ? (
          <button onClick={modifier.onPermissionsUpdate(user.id, { admin: false, play: false})}>Remove Player</button>
        ) : null}
      </span>
    );
  }    

  render() {
    const {
      room,
      modifier,
      history,
    } = this.props;
    if (modifier.noRoom()){
      return <div>loading...</div>;
    }
    return (
      <>
      <div>
        <button onClick={() => history.push('/')}>Leave Room</button>
        <div>Room: {room.name}</div>
        <div>Players</div>
        <div>
          {room.players.map(this.renderUser)}
        </div>
        {room.permissions.admin ? <RoomSettings roomName={room.name} /> : null}
        <Chat />
      </div>
    )
  }
}

export default withRouter(withContext(Room));
