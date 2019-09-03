import React from "react";
import { IUser, ITheme, IAppContext, withContext } from '../App';
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
    this.socket.emit('joinRoom', {
      id: props.id,
    });
    this.state = {
      loading: false,
    };
  }

  componentDidUpdate(prevProps: IProps) {
    if (this.props.id !== prevProps.id) {
      this.socket.emit('joinRoom', {
        id: this.props.id,
      });
    }
  }


  renderUser(user: IUser) {
    return (
      <span style={{ backgroundColor: user.color }}>
        {user.name}
        <button>Mute</button>
      </span>
    );
  }    

  render() {
    const {
      room,
    } = this.props;
    return (
      <>
      <div>
        {/* <div>Permissions: {room.permissions.admin.toString()} {room.permissions.play.toString()}</div> */}
        <div>
          {room.users.map(this.renderUser)}
        </div>
        <Piano />
        <span style={{padding: '0.5em', borderRadius: 3, background: 'black', color: 'white'}}>{room.name}</span>
        </div>
        <div id="chat-container">
          <Chat />
        </div>
     </>
    )
  }
}

export default withContext(Room);
