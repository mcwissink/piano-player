import React from "react";
import { IAppContext, withContext, SafeSocket } from '../App';
import Button from './Button';
import { IEvents as E } from '../../../server/interfaces/IEvents';
import { IApp as A } from '../interfaces/IApp';
import { isMobile } from 'react-device-detect';

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
    this.socket.emit<E.Chat.Create, void>('chat', {
      id: this.socket.raw.id,
      message,
    });
    this.setState({ message: '' });

  };

  onMessageChange = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    this.setState({ message: e.currentTarget.value });
  }


  renderChatMessage = (chat: A.Chat, i: number) => {
    /*
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
    */
    return (
      <div key={i} className='chat-message'>
        <span><span style={{ color: chat.user.color }}>{chat.user.name}</span>: {chat.message}</span>
        {/* {actionButton} */}
      </div>
    );
  }

  render() {
    const {
      room,
      modifier,
    } = this.props;
    const {
      message,
    } = this.state;
    return (
      <div id="chat-container" style={{ height: isMobile ? '50%' : '100%' }}>
        <div style={{ flex: 1, overflow: 'hidden', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          {room.chat.map((c, i) => this.renderChatMessage(c, i))}
        </div>
        <form onSubmit={this.onMessageSubmit} style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
          <input onFocus={modifier.disablePiano} onBlur={modifier.enablePiano} placeholder="type a message" type="text" value={message} onChange={this.onMessageChange} style={{ flex: 1 }} />
          <Button type="submit" value="send" />
        </form>
      </div>
    )
  }
}

export default withContext(Chat);
