export namespace Events {
  export namespace Room {
    export interface Create {
      name: string;
      theme: any;
    };
    export interface Update extends Create {};
    export interface Join {
      id: string;
      user: {
        name: string;
        color: string;
      }
    }
  }
  export namespace Piano {
    export interface NoteOn {
      id: string;
      color: string;
      note: {
        number: number,
        velocity: number,
      };
    }
    export interface NoteOff {
      id: string;
      note: {
        number: number,
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
  export interface Chat {
    id: string;
    message: string;
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
