import express from 'express';
import http from 'http';
import socket from 'socket.io';
const app = express();
const server = new http.Server(app);
const io = socket(server);

io.on('connection', socket => {
  console.log(socket);
  socket.on('join', e => {
    console.log(`joining room: ${e.room}`);
    socket.join(e.room);
  });
  socket.on('noteon', e => {
    socket.to('default').broadcast.emit('noteon', e);
  });
})


app.get('/api', (req, res) => {
  res.json({ hello: "world"});
});


const port = process.env.PORT || 3001;
server.listen(port, () => console.log(`Listening on port ${port}`));
