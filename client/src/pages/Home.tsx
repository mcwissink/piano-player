import React from "react";
import { IAppContext, withContext } from '../App';
import UserSettings from '../components/UserSettings';
import RoomSettings from '../components/RoomSettings';
import { withRouter, RouteComponentProps } from 'react-router-dom';

type IProps = IAppContext & RouteComponentProps;
class Home extends React.PureComponent<IProps> {
  constructor(props: IProps) {
    super(props);
  }
  
  render() {
    return (
      <div>
        <UserSettings />
        <RoomSettings />
      </div>
    )
  }
}

export default withRouter(withContext(Home));
