import React from "react";
import { IChat, IAppContext, withContext } from '../App';
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
      <div key={i} style={{background: '#000000d6', color: 'white', padding: '1em', marginBottom: '0.5em', borderRadius: 6, display: 'inline-block'}}>
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
      <div id="chat-container" style={{display: 'flex', flex: 1, overflow: 'auto', flexDirection: 'column'}}>
      <div style={{display: 'flex', flex: 1, overflow: 'auto', flexDirection: 'column', justifyContent: 'flex-end'}}>
        {/* Making scrolling work with flexbox https://stackoverflow.com/a/21541021/2930176 */}
        <div style={{display: 'flex', minHeight: 'min-content', alignItems: 'flex-end', flexDirection: 'column'}}>
          {room.chat.map((c, i) => this.renderChatMessage(c, i))}
        </div>
        </div>
        <form onSubmit={this.onMessageSubmit}>
          <input placeholder="Send a message" style={{marginRight: '1em'}} type="text" value={message} onChange={this.onMessageChange} />
          <Button style={{backgroundColor: this.props.theme.primary}} type="submit" value="Send" />
        </form>
      </div>
    )
  }
}

export default withContext(Chat);
