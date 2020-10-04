import React from "react";
import { IAppContext, withContext } from '../App';

interface ISettingsProps {

}

type IProps = ISettingsProps & IAppContext;
class Settings extends React.PureComponent<IProps> {
  render() {
    const {
      user,
      modifier,
    } = this.props;
    return (
      <div>
        <input type="text" placeholder={'username'} value={user.name} onChange={modifier.onNameChange} />
        <input type="color" value={user.color} onChange={modifier.onColorChange} />
      </div>
    )
  }
}

export default withContext(Settings);
