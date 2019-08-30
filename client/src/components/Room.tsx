import React from "react";
import { IUser, IRoom, IAppContext, withContext } from '../App';
import RoomSettings from './RoomSettings';
import Piano from './Piano';
import Chat from './Chat';

interface IRoomProps {
  id: string;
}

interface IRoomState {
  loading: boolean;
}
type IProps = IRoomProps & IAppContext;
class Room extends React.PureComponent<IProps, IRoomState> {
  socket: SocketIOClient.Socket;
  constructor(props: IProps) {
    super(props);
    this.socket = props.socket;
    this.state = {
      loading: true,
    };
  }

  componentDidMount() {
    this.socket.emit('joinRoom', {
      id: this.props.id,
    }, (room: IRoom|null) => {
      this.setState({ loading: false });
      this.props.modifier.roomEvent(room);
    });
  }

  componentDidUpdate(prevProps: IProps) {
    if (this.props.id !== prevProps.id) {
      this.socket.emit('joinRoom', {
        id: this.props.id,
      }, (room: IRoom|null) => {
        this.setState({ loading: false });
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
    } = this.props;
    return (
      <span key={user.id} style={{ backgroundColor: user.color }}>
        {user.name}
        {room.permissions.admin ? (
          <button>Admin Button</button>
        ) : null}
      </span>
    );
  }    

  render() {
    const {
      loading,
    } = this.state;
    const {
      room,
    } = this.props;
    if (loading) {
      return <div>loading...</div>;
    }
    return (
      <div>
        <div>Room: {room.name}</div>
        <div>Permissions: {room.permissions.admin.toString()} {room.permissions.play.toString()}</div>
        <div>Players</div>
        <div>
          {room.players.map(this.renderUser)}
        </div>
        <RoomSettings roomName={room.name} />
        <Chat />
      </div>
    )
  }
}

export default withContext(Room);
