import { IEvents as E } from '../../../server/interfaces/IEvents'

export declare namespace IApp {
  export interface User {
    id: string;
    name: string;
    color: string;
  }
  export interface Permissions {
    admin: boolean;
    play: boolean;
  }
  export interface Theme {
    primary: string;
    secondary: string;
    image: string;
  }
  export interface Room {
    id: string;
    permissions: Permissions;
    theme: Theme;
    players: User[];
    chat: Chat[];
    activePiano: boolean;
    scope: string;
  }
  export interface Chat {
    user: User;
    message: string;
  }
  export interface RoomSummary extends E.Room.Summary {
  }
}

