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
    <div key={room.id} className="room-list-item-container">
      <Link to={`/room/${room.id}`}>
        <div className="icon-container">
        <div className="icon-outer">
          <div className="icon-inner">
          </div>
        </div>
        <img src={require('../img/play.png')} className="icon-image" />
        </div>
      </Link>
      <Link to={`/room/${room.id}`}>
        <div className="icon-container">
        <div className="icon-outer">
          <div className="icon-inner">
          </div>
        </div>
        <img src={require('../img/audio.png')} className="icon-image" />
        </div>
      </Link>
      <Link to={`/room/${room.id}`} style={{textDecoration: 'none'}}>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <h4 className="room-list-item-room-name">{room.name.substr(0, 30)}</h4>
          <span className="room-list-item-metadata">{room.owner} {room.likes} {room.users}</span>
        </div>
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
        {rooms.map(r => this.renderRoomItem(r))}
      </div>
    )
  }
}

export default withRouter(withContext(RoomList));
