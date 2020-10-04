import { IApp as A } from '../../client/src/interfaces/IApp';

export namespace IEvents {
  export namespace Room {
    export interface Create {
      id: string;
      theme: A.Theme;
      scope: string;
    };
    export interface Read {
      id: string;
      permissions: A.Permissions;
      theme: A.Theme;
      players: A.User[];
      scope: string;
    };
    export interface Update {
      theme: A.Theme;
      scope: string;
    };
    export interface Join {
      id: string;
      user: A.User;
    }
    export interface Summary {
      id: string;
      likes: number;
      viewers: number;
      admins: A.User[];
    }
  }
  export namespace Piano {
    export interface NoteOn {
      id: string;
      color: string;
      note: {
        number: number,
        velocity: number,
        timeStamp: number,
      };
    }
    export interface NoteOff {
      id: string;
      note: {
        number: number,
        timeStamp: number,
      };
    }
    export interface ControlChange {
      id: string;
      control: {
        number: number,
        value: number,
      };
    }
  }
  export namespace Chat {
    export interface Create {
      id: string;
      message: string;
    }
    export interface Read extends Create {
      user: A.User;
    }
  }
  export interface Permissions {
    id: string;
    permissions: any;
  }
  export interface Settings {
    name: string;
    color: string,
  }

}
