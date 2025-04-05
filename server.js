const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const players = {};

io.on('connection', (socket) => {
  console.log(`🟢 ${socket.id} connected`);

  players[socket.id] = { x: 0, y: 0, z: 0 };

  socket.emit('init', players);
  socket.broadcast.emit('newPlayer', { id: socket.id, pos: players[socket.id] });

  socket.on('move', (pos) => {
    if (players[socket.id]) {
      players[socket.id] = pos;
      socket.broadcast.emit('playerMoved', { id: socket.id, pos });
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔴 ${socket.id} disconnected`);
    delete players[socket.id];
    socket.broadcast.emit('removePlayer', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Server on http://localhost:3000');
});
