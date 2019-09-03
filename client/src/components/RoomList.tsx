import React from "react";
import { Link, withRouter, RouteComponentProps } from 'react-router-dom';
import { IAppContext, withContext, IRoomListItem } from '../App';
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

  renderRoomItem = (room: IRoomListItem) => {
    return (
      <div key={room.id}>
        <Link to={`/room/${encodeURIComponent(room.id)}`}>
          <span>{room.name}</span>
          <div>{room.admins.length > 0 ? room.admins[0].name : null}</div>
          <span>Likes: {room.likes}, Viewers: {room.viewers}</span>
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
        <h2>Rooms</h2>
        {rooms.sort((a, b) => b.viewers - a.viewers).map(r => this.renderRoomItem(r))}
      </div>
    )
  }
}

export default withRouter(withContext(RoomList));
