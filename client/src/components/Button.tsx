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
      <input {...this.props} />
    );
  }
}

export default withContext(Button);
