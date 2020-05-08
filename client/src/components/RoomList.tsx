import React from "react";
import { Link, withRouter, RouteComponentProps } from 'react-router-dom';
import { IAppContext, withContext, IRoomListItem } from '../App';
import playImg from './../img/play.png';

interface IRoomProps {

}

interface IRoomState {
}

type IProps = IRoomProps & IAppContext & RouteComponentProps;
class RoomList extends React.PureComponent<IProps, IRoomState> {
  constructor(props: IProps) {
    super(props);
  }

  renderRoomItem = (room: IRoomListItem) => {
    return (
      <div key={room.id} style={{display: 'flex', alignItems: 'center', marginBottom: '0.5em'}}>
        <Link to={`/room/${encodeURIComponent(room.id)}`}>
          <div className="icon-container">
            <div className="icon-outer">
              <div className="icon-inner" />
            </div>
            <img alt="play" src={playImg} className="icon-image" />
            <div className="tooltip-container">
              <div className="tooltip">
                <div className="tooltip-text">
                  <div>Listen to {room.admins.length > 0 ? room.admins[0].name : "nobody"} play the piano?</div>
                </div>

                <svg className="tooltip-triangle" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 49.97 12.57">
                  <path className="triangle-path"  d="M49.97,0c0,0-10.55,1.69-15.7,5.29c-2.06,1.43-3.95,3.6-5.48,5.68c-1.56,2.13-6.05,2.13-7.61,0
                  c-1.53-2.08-3.42-4.24-5.48-5.68C10.54,1.69,0,0,0,0H49.97z"/>
                </svg>
	            </div>
            </div>
          </div>
        </Link>
        <div style={{display: 'flex', marginLeft: '1em', flexDirection: 'column', color: 'white'}}>
          <span>{room.name}</span>
          <div>{room.admins.length > 0 ? room.admins[0].name : null}</div>
          <span>Viewers: {room.viewers}</span>
        </div>
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
