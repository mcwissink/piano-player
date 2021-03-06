import React from "react";
import { IAppContext, withContext } from '../App';

interface ISettingsProps {

}

interface ISettingsState {
  name: string;
}

type IProps = ISettingsProps & IAppContext;
class Settings extends React.PureComponent<IProps, ISettingsState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      name: '',
    };
  }


  onSettingsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const {
      user,
      modifier,
      socket,
    } = this.props;
    const {
      name,
    } = this.state;
    socket.emit('settings', {
      name,
      color: user.color,
    }, modifier.onUserChange);
    this.setState({ name: '' });
  }


  onNameChange = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    this.setState({ name: e.currentTarget.value });
  };

  render() {
    const {
      user,
      modifier,
    } = this.props;
    return (
      <div>
        <span>Settings</span>
        <form onSubmit={this.onSettingsSubmit}>
          <input type="text" placeholder={name} value={this.state.name} onChange={this.onNameChange} />
          <input type="color" value={user.color} onChange={modifier.onColorChange} />
          <input type="submit" value="Save"/>
        </form>
      </div>
    )
  }
}

export default withContext(Settings);
