import React from "react";
import { IAppContext, withContext } from '../App';
import update from 'immutability-helper';

interface IChatEvent {
  id: string;
  message: string;
}

interface IChatProps {

}

interface IChatState {
  message: string;
  chat: IChatEvent[];
}

type IProps = IChatProps & IAppContext;
class Chat extends React.PureComponent<IProps, IChatState> {
  socket: SocketIOClient.Socket;
  constructor(props: IProps) {
    super(props);
    this.socket = props.socket;
    this.socket.on('chat', this.chatEventHandler);
    this.state = {
      message: '',
      chat: [],
    };
  }

  chatEventHandler = (data: IChatEvent) => {
    console.log(data);
    this.setState(oldState => update(oldState, {
      chat: { $push: [data] },
    }));
  }

  onMessageSubmit = () => {
    this.socket.emit('chat', {
      id: this.socket.id,
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
    } = this.state;
    return (
      <div>
        {chat.map((c, i) => <div key={i}>{c.id}: {c.message}</div>)}
          <input type="text" value={this.state.message} onChange={this.onMessageChange} />
          <button onClick={this.onMessageSubmit}>Send</button>
      </div>
    )
  }
}

export default withContext(Chat);
