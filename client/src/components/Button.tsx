import React, { InputHTMLAttributes, DetailedHTMLProps } from "react";
import { IAppContext, withContext } from '../App';

interface IButtonProps {

  
}

interface IButton {
}

type IProps = IButtonProps & IAppContext & DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
class Button extends React.PureComponent<IProps, IButton> {
  render() {
    return (
      <input {...this.props} style={{backgroundColor: this.props.theme.primary}} />
    );
  }
}

export default withContext(Button);
