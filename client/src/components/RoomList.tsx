import React from "react";
import { IAppContext, withContext } from '../App';

interface IRoomEvent {
  name: string;
}

interface IRoomProps {

}

interface IRoomState {
}

type IProps = IRoomProps & IAppContext;
class RoomList extends React.PureComponent<IProps, IRoomState> {
  socket: SocketIOClient.Socket;
  constructor(props: IProps) {
    super(props);
    this.socket = props.socket;
  }

  render() {
    const {
      rooms,
    } = this.props;
    return (
      <div>
        <span>Rooms</span>
        {rooms.map((r, i) => <div key={i}>{r.id}: {r.name}</div>)}
      </div>
    )
  }
}

export default withContext(RoomList);
