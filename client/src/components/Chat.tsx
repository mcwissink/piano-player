import React from "react";
import { IAppContext, withContext } from '../App';

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

  render() {
    const {
      message,
    } = this.state;
    const {
      chat,
    } = this.props;
    return (
      <div>
        <span>Chat</span>
        {chat.map((c, i) => <div key={i}>{c.name}: {c.message}</div>)}
        <form onSubmit={this.onMessageSubmit}>
          <input type="text" value={message} onChange={this.onMessageChange} />
          <input type="submit" value="Send" />
        </form>
      </div>
    )
  }
}

export default withContext(Chat);
