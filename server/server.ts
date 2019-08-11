import express from 'express';
import http from 'http';
import socket from 'socket.io';
const app = express();
const server = new http.Server(app);
const io = socket(server);

io.on('connection', socket => {
  socket.on('join', e => {
    console.log(`joining room: ${e.room}`);
    socket.join(e.room);
  });
  socket.on('noteon', e => {
    socket.to('default').broadcast.emit('noteon', e);
  });
  socket.on('noteoff', e => {
    socket.to('default').broadcast.emit('noteoff', e);
  });
  socket.on('chat', e => {
    socket.emit('chat', e);
    console.log('sending chat', e);
    socket.to('default').broadcast.emit('chat', e);
  });
})


app.get('/api', (req, res) => {
  res.json({ hello: "world"});
});


const port = process.env.PORT || 3001;
server.listen(port, () => console.log(`Listening on port ${port}`));
