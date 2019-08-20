import express from 'express';
import http from 'http';
import socket from 'socket.io';
const app = express();
const server = new http.Server(app);
const io = socket(server);

interface IRoom {
  id: string,
  name: string,
  likes: number,
  owner: string,
}

class User {
  id: string;
  color: string;
  name: string;
  room?: IRoom;
  constructor(id: string) {
    this.id = id;
    this.name = 'Anonymous';
    this.color = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
  };

  getRoomId() {
    return this.room === undefined ? '' : this.room.id;
  }
}


const users: {[key: string]: User} = {};
class RoomManager {
  rooms: {[key: string]: IRoom};
  constructor() {
    this.rooms = {};
  }

  getRooms() {
    return Object.values(this.rooms);
  }

  getRoom(id: string) {
    return this.rooms[id];
  }

  createRoom(user: User, name: string) {
    this.rooms[user.id] = {
      id: user.id,
      name,
      likes: 0,
      owner: user.name,
    }
    return this.rooms[user.id];
  }

  deleteRoom(user: User) {
    delete this.rooms[user.id];
  }
}

const roomManager = new RoomManager();

io.on('connection', socket => {
  const user = new User(socket.id);
  users[user.id] = user;

  socket.on('init', e => {
    socket.emit('init', {
      rooms: roomManager.getRooms(),
      name: user.name,
      color: user.color,
    });
  });

  socket.on('settings', e => {
    console.log('yo');
    user.name = e.name;
    user.color = e.color;
  });

  socket.on('createRoom', e => {
    // Leave the current room
    socket.leave(user.getRoomId());
    // Create and join a new room
    user.room = roomManager.createRoom(user, e.name);
    socket.join(user.getRoomId());
    socket.emit('addRoom', user.room);
    socket.broadcast.emit('addRoom', user.room); 
  });

  socket.on('joinRoom', e => {
    roomManager.deleteRoom(user);
    socket.leave(user.getRoomId());
    user.room = roomManager.getRoom(e.roomId);
    socket.join(user.getRoomId());
  });

  socket.on('noteon', e => {
    socket.to(user.getRoomId()).broadcast.emit('noteon', {
      ...e,
      id: socket.id,
      color: user.color,
    });
  });

  socket.on('noteoff', e => {
    socket.to(user.getRoomId()).broadcast.emit('noteoff', {
      ...e,
      id: socket.id,
    });
  });

  socket.on('chat', e => {
    socket.emit('chat', {
      ...e,
      name: user.name,
      id: socket.id,
    });
    socket.to(user.getRoomId()).broadcast.emit('chat', {
      ...e,
      name: user.name,
      id: socket.id,
    });
  });
  
  socket.on('disconnect', e => {
    roomManager.deleteRoom(user);
    delete users[user.id];
  });
});


app.get('/api', (req, res) => {
  res.json({ hello: "world"});
});


const port = process.env.PORT || 3001;
server.listen(port, () => console.log(`Listening on port ${port}`));
