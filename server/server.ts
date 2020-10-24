import express from 'express';
import http from 'http';
import socket from 'socket.io';
import path from 'path';
import uid from 'uid';
const app = express();
const server = new http.Server(app);
const io = socket(server);

// Interfaces
import { IEvents as E } from './interfaces/IEvents';
import { IApp as A } from '../client/src/interfaces/IApp';
import { IServer as S } from './interfaces/IServer';


class User {
  socket: socket.Socket
  color: string;
  name: string;
  roomId: string;
  constructor(socket: socket.Socket) {
    this.socket = socket;
    this.name = 'anonymous';
    this.color = "#000000";
    this.roomId = '';
  };

  getId() {
    return this.socket.id;
  }

  getSharedData() {
    return {
      id: this.socket.id,
      name: this.name,
      color: this.color,
    };
  }

  joinRoom(id: string) {
    this.roomId = id;
    this.socket.join(id);
  }

  leaveRoom() {
    this.socket.leave(this.roomId);
    this.roomId = '';
  }
}

const users = new Map<string, User>();
class RoomManager {
  rooms: Map<string, S.Room>;
  constructor() {
    this.rooms = new Map();
  }

  emitRoomList() {
    io.emit('roomList', Array.from(this.rooms.values()).filter(room => room.scope === 'public').map(room => this.getRoomListItem(room)));
  }

  emitRoomUpdate(room: S.Room) {
    for (const id of room.users.values()) {
      const user = users.get(id);
      if (user !== undefined) {
        user.socket.emit('roomUpdate', this.getRoomData(room, user));
      }
    }
  }

  getRoomGroup(room: S.Room, permission: keyof A.Permissions) {
    const group = [];
    for (let entry of Array.from(room.permissions.entries())) {
      if (entry[1][permission]) {
        const user = users.get(entry[0]);
        if (user !== undefined) {
          group.push(user.getSharedData());
        }
      }
    }
    return group;
  }

  getRoomListItem(room: S.Room) {
    return {
      id: room.id,
      likes: room.likes,
      viewers: room.users.size,
      admins: this.getRoomGroup(room, 'admin'),
    }
  }

  getRoomData(room: S.Room, user: User) {
    return {
      id: room.id,
      permissions: this.getPermissions(user),
      theme: room.theme,
      players: this.getRoomGroup(room, 'play'),
      scope: room.scope,
    };
  }

  getRoom<T>(id: string, callback: (room: S.Room) => T, error?: () => void): T|undefined {
    const room = this.rooms.get(id);
    if (room === undefined) {
      if (error !== undefined) {
        error();
      }
    } else {
      return callback(room);
    }
  }

  hasPermission<T extends keyof A.Permissions>(user: User, permission: T, callback: (room: S.Room) => void) {
    this.getRoom(user.roomId, room => {
      const permissions = room.permissions.get(user.socket.id);
      if (permissions !== undefined && permissions[permission]) {
        callback(room);
      }
    });
  }

  updatePermissions(user: User, id: string, permissions: A.Permissions) {
    this.hasPermission(user, 'admin', room => {
      room.permissions.set(id, permissions);
      this.emitRoomUpdate(room);
    });
  }
  
  getPermissions(user: User): A.Permissions {
    const permissions = this.getRoom(user.roomId, room => {
      return room.permissions.get(user.socket.id);
    });
    return permissions === undefined ? { admin: false, play: false } : permissions;
  }

  likeRoom(id: string) {
    this.getRoom(id, room => {
      room.likes++;
    });
  }

  createRoom(user: User, options: E.Room.Create) {
    this.leaveRoom(user);
    const {
      id,
      theme,
      scope,
    } = options;
    if (!this.rooms.has(id)) {
      const room = {
        id: scope === 'private' ? uid(8) : id,
        likes: 0,
        permissions: new Map([[user.getId(), { play: true, admin: true }]]),
        users: new Set<string>(),
        theme: theme === undefined ? { primary: '#ffffff', secondary: '#000000', image: '' } : theme,
        scope,
      };
      this.rooms.set(room.id, room);
      this.emitRoomList();
      return this.getRoomData(room, user).id;
    }
  }

  updateRoom(user: User, update: E.Room.Update) {
    const {
      theme,
      scope
    } = update;
    this.hasPermission(user, 'admin', room => {
      const updatedRoom = {
        ...room,
        theme,
        scope,
      }
      this.rooms.set(room.id, updatedRoom);
      this.emitRoomUpdate(updatedRoom);
    });
  }

  deleteRoom(id: string) {
    this.rooms.delete(id);
    this.emitRoomList();
  }

  joinRoom(id: string, user: User) {
    this.leaveRoom(user);
    return this.getRoom(id, room => {
      room.users.add(user.getId());

      user.joinRoom(room.id);
      this.emitRoomList();
      return this.getRoomData(room, user);
    });
  }

  leaveRoom(user: User) {
    this.getRoom(user.roomId, room => {
      room.users.delete(user.getId());
      user.leaveRoom();
      if (room.users.size === 0) {
        this.deleteRoom(room.id);
      }
    });
  }

}

const roomManager = new RoomManager();

io.on('connection', socket => {
  const user = new User(socket);
  users.set(user.getId(), user);

  socket.on('roomList', () => {
    roomManager.emitRoomList();
  });
  
  socket.on('settings', (e: E.Settings, callback) => {
    user.name = e.name === '' ? user.name : e.name;
    user.color = e.color;
  });

  socket.on('createRoom', (e: E.Room.Create, callback) => {
    callback(roomManager.createRoom(user, e));
  });

  socket.on('joinRoom', (e: E.Room.Join, callback) => {
    user.name = e.user.name === '' ? user.name : e.user.name;
    user.color = e.user.color;
    const room = roomManager.joinRoom(e.id, user);
    callback(room);
  });

  socket.on('updateRoom', (e: E.Room.Update) => {
    roomManager.updateRoom(user, e);
  });

  // socket.on('likeRoom', e => {
  //   roomManager.likeRoom(user.roomId);
  // });

  socket.on('updatePermissions', (e: E.Permissions) => {
    roomManager.updatePermissions(user, e.id, e.permissions);
  });

  socket.on('noteon', (e: E.Piano.NoteOn) => {
    roomManager.hasPermission(user, 'play', room => {
      socket.to(user.roomId).emit('noteon', {
        ...e,
        id: user.getId(),
        color: user.color,
      });
    });
  });

  socket.on('noteoff', (e: E.Piano.NoteOff) => {
    roomManager.hasPermission(user, 'play', room => {
      socket.to(user.roomId).emit('noteoff', {
        ...e,
        id: user.getId(),
      });
    });
  });

  socket.on('controlchange', (e: E.Piano.ControlChange) => {
    roomManager.hasPermission(user, 'play', room => {
      socket.to(user.roomId).emit('controlchange', {
        ...e,
        id: user.getId(),
      });
    });
  });
  
  socket.on('chat', (e: E.Chat.Create) => {
    io.to(user.roomId).emit('chat', {
      ...e,
      user: user.getSharedData(),
    });
  });
  
  socket.on('disconnect', () => {
    roomManager.leaveRoom(user);
    users.delete(user.getId());
  });
});


app.get('/api', (req, res) => {
  res.json({ hello: "world"});
});

app.use(express.static(path.join(__dirname, 'build')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});


const port = process.env.PORT || 3001;
server.listen(port, () => console.log(`Listening on port ${port}`));
