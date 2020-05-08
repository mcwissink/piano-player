import React from "react";
import { IChat, IAppContext, withContext, SafeSocket } from '../App';
import Button from './Button';
import { Events as E } from '../../../server/interfaces/IEvents';

interface IChatProps {

}

interface IChatState {
  message: string;
}

type IProps = IChatProps & IAppContext;

class Chat extends React.PureComponent<IProps, IChatState> {
  socket: SafeSocket;
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
    const message = this.state.message.trim();
    if (message === '') {
      return;
    } 
    this.socket.emit<E.Chat, void>('chat', {
      id: this.socket.raw.id,
      message,
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
      if ((words.has('i') || words.has('me')) && words.has('play') && room.permissions.admin && chat.user.id !== this.socket.raw.id) {
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
      <div key={i} style={{background: '#000000d6', color: 'white', padding: '0.5em', marginBottom: '0.5em', borderRadius: 6, display: 'inline-block', maxWidth: '20em'}}>
        <span><span style={{ color: chat.user.color }}>{chat.user.name}</span>: {chat.message}</span>
        {/* {actionButton} */}
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
        <div id="scrolly" style={{display: 'flex', flex: 1, overflow: 'auto', flexDirection: 'column', width: '100%'}}>
          {/* Making scrolling work with flexbox, flexbox spec author, "this is a bug."  https://stackoverflow.com/a/21541021/2930176 */}
          <div style={{display: 'flex', minHeight: 'min-content', alignItems: 'flex-start', flexDirection: 'column', marginTop: 'auto'}}>
            {room.chat.map((c, i) => this.renderChatMessage(c, i))}
          </div>
        </div>
        <form onSubmit={this.onMessageSubmit} style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', width: '100%' }}>
          <input placeholder="Send a message" style={{ marginRight: '1em', flexGrow: 1 }} type="text" value={message} onChange={this.onMessageChange} />
          <Button type="submit" value="Send" />
        </form>
      </div>
    )
  }
}

export default withContext(Chat);
