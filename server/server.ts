import express from 'express';
import http from 'http';
import socket from 'socket.io';
const app = express();
const server = new http.Server(app);
const io = socket(server);

class User {
  socket: socket.Socket
  color: string;
  name: string;
  roomId: string;
  constructor(socket: socket.Socket) {
    this.socket = socket;
    this.name = 'Anonymous';
    this.color = "#000000".replace(/0/g, () => (~~(Math.random()*16)).toString(16));
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

interface ITheme {
  primary: string;
  secondary: string;
  image: string;
}

interface IPermissions {
  play: boolean;
  admin: boolean;
}

interface IRoom {
  id: string;
  name: string;
  likes: number;
  permissions: Map<string, IPermissions>; 
  users: Set<string>;
  theme: ITheme;
}


const users = new Map<string, User>();
class RoomManager {
  rooms: Map<string, IRoom>;
  constructor() {
    this.rooms = new Map();
  }

  emitRoomList() {
    io.emit('roomList', Array.from(this.rooms.values()).map(room => this.getRoomListItem(room)));
  }

  updateRoom(room: IRoom) {
    for (const id of room.users.values()) {
      const user = users.get(id);
      if (user !== undefined) {
        user.socket.emit('roomUpdate', this.getRoomData(room, user));
      }
    }
  }

  getRoomGroup(room: IRoom, permission: keyof IPermissions) {
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

  getRoomListItem(room: IRoom) {
    return {
      id: room.id,
      name: room.name,
      likes: room.likes,
      users: room.users.size,
      admins: this.getRoomGroup(room, 'admin'),
    }
  }

  getRoomData(room: IRoom, user: User) {
    return {
      id: room.id,
      permissions: this.getPermissions(user),
      name: room.name,
      theme: room.theme,
      players: this.getRoomGroup(room, 'play'),
    };
  }

  getRoom<T>(id: string, callback: (room: IRoom) => T, error?: () => void): T|undefined {
    const room = this.rooms.get(id);
    if (room === undefined) {
      if (error !== undefined) {
        error();
      }
    } else {
      return callback(room);
    }
  }

  hasPermission<T extends keyof IPermissions>(permission: T, user: User) {
    const hasPermission = this.getRoom(user.roomId, room => {
      const permissions = room.permissions.get(user.socket.id);
      return permissions !== undefined && permissions[permission];
    });
    return hasPermission === undefined ? false : hasPermission;
  }

  setPermissions(user: User, id: string, permissions: IPermissions) {
    this.getRoom(user.roomId, room => {
      if (this.hasPermission('admin', user)) {
        room.permissions.set(id, permissions);
        this.updateRoom(room);
      }
    });
  }
  
  getPermissions(user: User): IPermissions {
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

  // TODO: handle the case when two rooms are submitting at the same time with the same name
  createRoom(name: string, theme: ITheme, user: User) {
    this.leaveRoom(user);
    if (!this.rooms.has(name)) {
      const room = {
        id: name, 
        name,
        likes: 0,
        permissions: new Map([[user.getId(), { play: true, admin: true }]]),
        users: new Set<string>(),
        theme: theme,
      };
      this.rooms.set(name, room);
      this.emitRoomList();
      return this.getRoomData(room, user).name;
    }
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

  socket.on('init', e => {
    socket.emit('init', {
      name: user.name,
      color: user.color,
    });
    roomManager.emitRoomList();
  });

  socket.on('settings', e => {
    user.name = e.name === '' ? user.name : e.name;
    user.color = e.color;
    socket.emit('init', {
      name: user.name,
      color: user.color,
    });
  });

  socket.on('createRoom', (e, callback) => {
    callback(roomManager.createRoom(e.name, e.theme, user));
  });

  socket.on('joinRoom', (e, callback) => {
    callback(roomManager.joinRoom(e.id, user));
  });

  socket.on('likeRoom', e => {
    roomManager.likeRoom(user.roomId);
  });

  socket.on('permissionsUpdate', e => {
    roomManager.setPermissions(user, e.id, e.permissions);
  });

  socket.on('noteon', e => {
    if (roomManager.hasPermission('play', user)) {
      socket.to(user.roomId).broadcast.emit('noteon', {
        ...e,
        id: user.getId(),
        color: user.color,
      });
    }
  });

  socket.on('noteoff', e => {
    if (roomManager.hasPermission('play', user)) {
      socket.to(user.roomId).broadcast.emit('noteoff', {
        ...e,
        id: user.getId(),
      });
    }
  });

  socket.on('chat', e => {
    io.to(user.roomId).emit('chat', {
      ...e,
      user: user.getSharedData(),
    });
  });
  
  socket.on('disconnect', e => {
    roomManager.leaveRoom(user);
    users.delete(user.getId());
  });
});


app.get('/api', (req, res) => {
  res.json({ hello: "world"});
});


const port = process.env.PORT || 3001;
server.listen(port, () => console.log(`Listening on port ${port}`));
