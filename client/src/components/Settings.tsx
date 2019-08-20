import React from "react";
import { IAppContext, withContext } from '../App';

interface ISettingsProps {

}

interface ISettingsState {
  
}

type IProps = ISettingsProps & IAppContext;
class Settings extends React.PureComponent<IProps, ISettingsState> {
  socket: SocketIOClient.Socket;
  constructor(props: IProps) {
    super(props);
    this.socket = props.socket;
  }

  onSettingsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const {
      name,
      color,
    } = this.props;
    this.socket.emit('settings', {
      name,
      color,
    });
  }

  render() {
    const {
      name,
      color,
      modifier,
    } = this.props;
    return (
      <div>
        <form onSubmit={this.onSettingsSubmit}>
          <input type="text" placeholder={name} onChange={modifier.onNameChange} />
          <input type="color" value={color} onChange={modifier.onColorChange} />
          <input type="submit" value="Save"/>
        </form>
      </div>
    )
  }
}

export default withContext(Settings);
