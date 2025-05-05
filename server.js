const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let players = {};


// Socket.io
io.on('connection', (socket) => {
  console.log('Un joueur est connecté :', socket.id);

  players[socket.id] = {
    id: socket.id,
    name: 'Joueur ' + socket.id,
    position: { x: 0, y: 0, z: 0 },
    rotationY: 0
  };

  
  socket.emit('currentPlayers', players);

  socket.on('setPlayerName', (name) => {
    if (name && name.trim() !== '') {
      players[socket.id].name = name;
    }
    socket.broadcast.emit('playerNameUpdated', { id: socket.id, name: players[socket.id].name });
    socket.emit('playerNameUpdated', { id: socket.id, name: players[socket.id].name });
  });

  socket.on('playerMoved', (playerData) => {
    players[socket.id].position = {
      x: playerData.x,
      y: playerData.y,
      z: playerData.z
    };
    players[socket.id].rotationY = playerData.rotationY;

    socket.broadcast.emit('playerMoved', { id: socket.id, playerData });
  });

  socket.on('chat message', (message) => {
    console.log(players[socket.id].name, ':', message);
    io.emit('chat message', { id: socket.id, message, name: players[socket.id].name });
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    socket.broadcast.emit('playerDisconnected', socket.id);
  });
});

// Sert les fichiers statiques (client, éditeur, etc.)
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
