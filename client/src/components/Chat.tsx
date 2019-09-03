import React from "react";
<<<<<<< HEAD
import { IChat, IAppContext, IUser, withContext } from '../App';
import Button from './Button';
=======
import { IChat, IAppContext, withContext } from '../App';

>>>>>>> ec2f697f61e3484540c3175ea0267736e2e8e4bf

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
<<<<<<< HEAD
      <div key={i} style={{background: 'black', color: 'white', padding: '0.25em', borderRadius: 3}}>
        <span style={{ color: chat.user.color }}>{chat.user.name}</span>: {chat.message}
=======
      <div key={i}>
        <span><span style={{ color: chat.user.color }}>{chat.user.name}</span>: {chat.message}</span>
        {actionButton}
>>>>>>> ec2f697f61e3484540c3175ea0267736e2e8e4bf
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
        {room.chat.map((c, i) => this.renderChatMessage(c, i))}
        <form onSubmit={this.onMessageSubmit}>
          <input style={{marginRight: '1em'}} type="text" value={message} onChange={this.onMessageChange} />
          <Button type="submit" value="Send" />
        </form>
      </div>
    )
  }
}

export default withContext(Chat);
