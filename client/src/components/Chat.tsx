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
  
  componentDidMount() {
    // Scrolly the bar to the bottom on an interval.
    // https://stackoverflow.com/a/21067431/2930176
    const out = document.getElementById("scrolly");
    if (out !== null) {
      setInterval(function() {
        // allow 1px inaccuracy by adding 1
        const isScrolledToBottom = out.scrollHeight - out.clientHeight <= out.scrollTop + 1
        // scroll to bottom if isScrolledToBottom is true
        if (!isScrolledToBottom) {
          out.scrollTop = out.scrollHeight - out.clientHeight
        }
      }, 500);
    }
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
      <div id="scrolly" style={{display: 'flex', flex: 1, overflow: 'auto', flexDirection: 'column'}}>
        {/* Making scrolling work with flexbox, flexbox spec author, "this is a bug."  https://stackoverflow.com/a/21541021/2930176 */}
        <div style={{display: 'flex', minHeight: 'min-content', alignItems: 'flex-end', flexDirection: 'column', marginTop: 'auto'}}>
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
