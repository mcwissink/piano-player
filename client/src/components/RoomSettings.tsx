import React from "react";
import { Link, withRouter, RouteComponentProps } from 'react-router-dom';
import { ITheme, IAppContext, withContext, IRoom } from '../App';


interface IRoomSettingsState extends ITheme {
  name: string;
}

const initialState = {
  name: '',
  primary: '#ffffff',
  secondary: '#000000',
  image: '',
};

type IProps = {} & IAppContext & RouteComponentProps;
class RoomList extends React.PureComponent<IProps, IRoomSettingsState> {
  socket: SocketIOClient.Socket;
  constructor(props: IProps) {
    super(props);
    this.socket = props.socket;
    this.state = initialState;
  }

  canSubmit = () => {
    const {
      name,
    } = this.state;
    return (name !== '' && this.props.rooms.find(room => room.name === name) === undefined);
  }

  onRoomSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const {
      name,
      primary,
      secondary,
      image,
    } = this.state;
    if (this.canSubmit()) {
      this.socket.emit('createRoom', {
        name,
        theme: {
          primary,
          secondary,
          image,
        },
      });
      this.setState(initialState);
      this.props.history.push(`/room/${name}`);
    }
  };

  onNameChange = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    this.setState({ name: e.currentTarget.value });
  }


  onPrimaryChange = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    this.setState({ primary: e.currentTarget.value });
  }

  onSecondaryChange = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    this.setState({ secondary: e.currentTarget.value });
  }
  onImageChange = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    this.setState({ image: e.currentTarget.value });
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
      name,
      primary,
      secondary,
      image,
    } = this.state;
    return (
      <div>
        <form onSubmit={this.onRoomSubmit}>
          <input type="text" value={name} onChange={this.onNameChange} />
          <input type="color" value={primary} onChange={this.onPrimaryChange} />
          <input type="color" value={secondary} onChange={this.onSecondaryChange} />
          <input type="text" value={image} onChange={this.onImageChange} />
          <input type="submit" value="Create Room" disabled={!this.canSubmit()} />
        </form>
      </div>
    )
  }
}

export default withRouter(withContext(RoomList));
