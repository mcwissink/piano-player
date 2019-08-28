import React from "react";
import { Link, withRouter, RouteComponentProps } from 'react-router-dom';
import { IAppContext, withContext, IRoom } from '../App';
import RoomSettings from './RoomSettings';

interface IRoomProps {

}

interface IRoomState {
}

type IProps = IRoomProps & IAppContext & RouteComponentProps;
class RoomList extends React.PureComponent<IProps, IRoomState> {
  socket: SocketIOClient.Socket;
  constructor(props: IProps) {
    super(props);
    this.socket = props.socket;
  }

  renderRoomItem = (room: IRoom) => {
    return (
      <div key={room.id}>
        <Link to={`/room/${room.id}`}>
          <span>{room.name}</span>
          <div>{room.owner}</div>
          <span>Likes: {room.likes}, Viewers: {room.users}</span>
        </Link>
      </div>
    )
  }

  render() {
    const {
      rooms,
    } = this.props;
    return (
      <div>
        <span>Rooms</span>
        {rooms.map(r => this.renderRoomItem(r))}
        <RoomSettings />
      </div>
    )
  }
}

export default withRouter(withContext(RoomList));
