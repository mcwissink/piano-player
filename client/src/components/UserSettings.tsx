import React from "react";
import { IAppContext, withContext } from '../App';
import Button from "./Button";

interface ISettingsProps {

}

interface ISettingsState {
  name: string;
  askUsername?: true;
}

type IProps = ISettingsProps & IAppContext;
class Settings extends React.PureComponent<IProps, ISettingsState> {
  socket: SocketIOClient.Socket;
  constructor(props: IProps) {
    super(props);
    this.socket = props.socket;
    this.state = {
      name: '',
      askUsername: true,
    };
  }

  onSettingsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const {
      color,
    } = this.props;
    const {
      name
    } = this.state;
    this.socket.emit('settings', {
      name,
      color,
    });
    this.setState({ name: '', askUsername: undefined });
  }


  onNameChange = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    this.setState({ name: e.currentTarget.value });
  };

  render() {
    const {
      name,
      color,
      modifier,
    } = this.props;
    return (
      <div style={{position: 'fixed', top: 0, left: 0}}>
        
      {this.state.askUsername !== undefined ? (
        <div className="username-lightbox-cover">
          <div className="username-lightbox-container">
            <h1>Choose Your Username</h1>
            <form onSubmit={this.onSettingsSubmit} style={{display: 'flex', flexDirection: 'column'}}>
              <div style={{display: 'flex', alignItems: 'center', marginBottom: '1em'}}>
                <div id="color-picker-wrapper" style={{backgroundColor: this.props.theme.primary, marginRight: '1em'}}>
                  <input type="color" id="color-picker" value={color} onChange={modifier.onColorChange} />
                </div>
                <input className="input-border" autoFocus={true} type="text" placeholder={name} value={this.state.name} onChange={this.onNameChange} style={{width: '14em'}} />
              </div>
              <Button type="submit" value="Start" />
            </form>
          </div>
        </div>
      ) : null }
        
      </div>
    )
  }
}

export default withContext(Settings);
