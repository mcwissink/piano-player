import React from "react";
import { IChat, IAppContext, withContext } from '../App';


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
    const {
      room,
      modifier,
    } = this.props;
    const actionButton = (() => {
      const words = new Set(chat.message.split(/\W+/).map(word => word.toLowerCase()));
      // Check if the person wants to play the piano
      if ((words.has('i') || words.has('me')) && words.has('play') && room.permissions.admin && chat.user.id !== this.socket.id) {
        return (
          <button
            onClick={modifier.onPermissionsUpdate(chat.user.id, { admin: false, play: true})}>
            Allow to Play
          </button>
        );
      }
      return null;
    })();
    return (
      <div key={i}>
        <span><span style={{ color: chat.user.color }}>{chat.user.name}</span>: {chat.message}</span>
        {actionButton}
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
          <input type="submit" value="Send" />
        </form>
      </div>
    )
  }
}

export default withContext(Chat);
