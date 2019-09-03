import React from "react";
import { Link, withRouter, RouteComponentProps } from 'react-router-dom';
import { ITheme, IAppContext, withContext, IRoom } from '../App';
import Button from "./Button";


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
class RoomSettings extends React.PureComponent<IProps, IRoomSettingsState> {
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
    const color_picker: HTMLInputElement | null = document.getElementById("color-picker-2") as HTMLInputElement;
    const color_picker_wrapper = document.getElementById("color-picker-wrapper-2");
    if (color_picker_wrapper !== null && color_picker !== null && color_picker.value !== null) {
      color_picker_wrapper.style.backgroundColor = color_picker.value;
      color_picker_wrapper.style.backgroundColor = color_picker.value;
    }
    this.setState({ primary: e.currentTarget.value });
  }

  onSecondaryChange = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    const color_picker: HTMLInputElement | null = document.getElementById("color-picker-3") as HTMLInputElement;
    const color_picker_wrapper = document.getElementById("color-picker-wrapper-3");
    if (color_picker_wrapper !== null && color_picker !== null && color_picker.value !== null) {
      color_picker_wrapper.style.backgroundColor = color_picker.value;
      color_picker_wrapper.style.backgroundColor = color_picker.value;
    }
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
        <h1>New Room</h1>
        <form onSubmit={this.onRoomSubmit}>
          <input type="text" value={name} placeholder="Room Name" onChange={this.onNameChange} />
          <div id="color-picker-wrapper-2">
              <input id="color-picker-2" type="color" value={primary} onChange={this.onPrimaryChange} />
            </div>
            <div id="color-picker-wrapper-3">
              <input id="color-picker-3" type="color" value={secondary} onChange={this.onSecondaryChange} />
            </div>
            <input type="text" value={image} placeholder="Paste background image" onChange={this.onImageChange} />

          <Button type="submit" value="Create Room" disabled={!this.canSubmit()} />
        </form>
      </div>
    )
  }
}

export default withRouter(withContext(RoomSettings));
