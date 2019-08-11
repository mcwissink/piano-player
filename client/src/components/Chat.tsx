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

  onMessageSubmit = () => {
    this.socket.emit('chat', {
      message: this.state.message,
    });
    this.setState({ message: '' });
  };

  onMessageChange = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    this.setState({ message: e.currentTarget.value });
  }

  render() {
    const {
      chat,
    } = this.props;
    return (
      <div>
        <span>Chat</span>
        {chat.map((c, i) => <div key={i}>{c.name}: {c.message}</div>)}
        <input type="text" value={this.state.message} onChange={this.onMessageChange} />
        <button onClick={this.onMessageSubmit}>Send</button>
      </div>
    )
  }
}

export default withContext(Chat);
