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
  owner: string;
  theme: ITheme;
}


const users: {[key: string]: User} = {};
class RoomManager {
  rooms: Map<string, IRoom>;
  constructor() {
    this.rooms = new Map();
  }

  emitRoomList() {
    io.emit('roomList', Array.from(this.rooms.values()).map(room => this.getRoomListItem(room)));
  }

  getRoomListItem(room: IRoom) {
    return {
      id: room.id,
      name: room.name,
      likes: room.likes,
      users: room.users.size,
      owner: room.owner,
    }
  }

  getRoom(id: string, callback: (room: IRoom) => void) {
    const room = this.rooms.get(id);
    if (room !== undefined) {
      return callback(room);
    }
  }

  getPermission<T extends keyof IPermissions>(permission: T, user: User) {
    let hasPermission = false;
    this.getRoom(user.roomId, room => {
      const permissions = room.permissions.get(user.socket.id);
      hasPermission = permissions !== undefined && permissions[permission];
    });
    return hasPermission;
  }
  

  likeRoom(id: string) {
  }

  // TODO: handle the case when two rooms are submitting at the same time with the same name
  createRoom(name: string, theme: ITheme, user: User) {
    this.leaveRoom(user);
    if (!this.rooms.has(name)) {
      this.rooms.set(name, {
        id: name, 
        name,
        likes: 0,
        permissions: new Map([[user.getId(), { play: true, admin: true }]]),
        users: new Set(),
        owner: user.name,
        theme: theme,
      });
      this.emitRoomList();
    }
    return this.rooms.get(name);
  }

  deleteRoom(id: string) {
    this.rooms.delete(id);
    this.emitRoomList();
  }

  joinRoom(id: string, user: User) {
    this.leaveRoom(user);
    this.getRoom(id, room => {
      if (!room.permissions.has(user.getId())) {
        room.permissions.set(user.getId(), {
          play: false,
          admin: false,
        });
      }
      room.users.add(user.getId());

      user.joinRoom(room.id);
      user.socket.emit('room', {
        permissions: room.permissions.get(user.getId()),
        name: room.name,
        theme: room.theme,
        users: [], // Array.from(room.users).map(userId => users[userId].getSharedData()),
      });
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
  users[user.getId()] = user;

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

  socket.on('createRoom', e => {
    roomManager.createRoom(e.name, e.theme, user);
  });

  socket.on('joinRoom', e => {
    roomManager.joinRoom(e.id, user);
  });

  socket.on('likeRoom', e => {
    roomManager.likeRoom(user.roomId);
  })

  socket.on('noteon', e => {
    if (roomManager.getPermission('play', user)) {
      socket.to(user.roomId).broadcast.emit('noteon', {
        ...e,
        id: user.getId(),
        color: user.color,
      });
    }
  });

  socket.on('noteoff', e => {
    if (roomManager.getPermission('play', user)) {
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
    delete users[user.getId()];
  });
});


app.get('/api', (req, res) => {
  res.json({ hello: "world"});
});


const port = process.env.PORT || 3001;
server.listen(port, () => console.log(`Listening on port ${port}`));
