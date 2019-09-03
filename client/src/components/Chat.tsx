import React from "react";
import { IChat, IAppContext, IUser, withContext } from '../App';
import Button from './Button';

interface IChatProps {

}

interface IChatState {
  message: string;
}

type IProps = IChatProps & IAppContext;
class Chat extends React.PureComponent<IProps, IChatState> {
  socket: SocketIOClient.Socket;
  constructor(props: IProps) {
    super(props);
    this.socket = props.socket;
    this.state = {
      message: '',
    };
  }

  
  onMessageSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const {
      message,
    } = this.state;
    if (message === '') {
      return;
    } 
    this.socket.emit('chat', {
      message
    });
    this.setState({ message: '' });
  };

  onMessageChange = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    this.setState({ message: e.currentTarget.value });
  }

  renderChatMessage = (chat: IChat, i: number) => {
    return (
      <div key={i}>
        <span style={{ color: chat.user.color }}>{chat.user.name}</span>: {chat.message}
      </div>
    );
  }

  render() {
    const {
      room,
    } = this.props;
    const {
      message,
    } = this.state;
    return (
      <div>
        <span>Chat</span>
        {room.chat.map((c, i) => this.renderChatMessage(c, i))}
        <form onSubmit={this.onMessageSubmit}>
          <input type="text" value={message} onChange={this.onMessageChange} />
          <Button type="submit" value="Send" />
        </form>
      </div>
    )
  }
}

export default withContext(Chat);
