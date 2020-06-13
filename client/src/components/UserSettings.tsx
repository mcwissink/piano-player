import React from "react";
import { IAppContext, withContext } from '../App';

interface ISettingsProps {

}

type IProps = ISettingsProps & IAppContext;
class Settings extends React.PureComponent<IProps> {
  render() {
    const {
      name,
      color,
      modifier,
    } = this.props;
    return (
      <div>
        <input type="text" placeholder={'Username'} value={name} onChange={modifier.onNameChange} />
        <input type="color" value={color} onChange={modifier.onColorChange} />
      </div>
    )
  }
}

export default withContext(Settings);
