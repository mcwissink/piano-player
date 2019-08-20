import React from "react";
import { IAppContext, withContext, IRoom } from '../App';

interface IRoomEvent {
  name: string;
}

interface IRoomProps {

}

interface IRoomState {
  name: string;
}

type IProps = IRoomProps & IAppContext;
class RoomList extends React.PureComponent<IProps, IRoomState> {
  socket: SocketIOClient.Socket;
  constructor(props: IProps) {
    super(props);
    this.socket = props.socket;
    this.state = {
      name: '',
    };
  }

  onRoomSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const {
      name
    } = this.state;
    if (name === '') {
      return;
    }
    this.socket.emit('createRoom', {
      name,
    });
    this.setState({ name: '' });
  };

  onNameChange = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    this.setState({ name: e.currentTarget.value });
  }

  onRoomJoin = (roomId: string) => (e: React.MouseEvent<HTMLButtonElement>) => {
    this.socket.emit('joinRoom', {
      roomId,
    });
  }

  renderRoomItem = (room: IRoom) => {
    return (
      <button key={room.id} onClick={this.onRoomJoin(room.id)}>
        <div>
          <span>{room.name}</span>
          <div>
            {room.owner}
          </div>
        </div>
      </button>
    )
  }

  render() {
    const {
      name,
    } = this.state;
    const {
      rooms,
    } = this.props;
    return (
      <div>
        <span>Rooms</span>
        {rooms.map(r => this.renderRoomItem(r))}
        <form onSubmit={this.onRoomSubmit}>
          <input type="text" value={name} onChange={this.onNameChange} />
          <input type="submit" value="Create Room" />
        </form>
      </div>
    )
  }
}

export default withContext(RoomList);
