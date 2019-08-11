import React from "react";
import { IAppContext, withContext } from '../App';

interface IChatProps {

}

interface IChatState {
}

type IProps = IChatProps & IAppContext;
class Chat extends React.PureComponent<IProps, IChatState> {
  constructor(props: IProps) {
    super(props);
  }

  render() {
    return (
      <div>
      </div>
    )
  }
}

export default withContext(Chat);
