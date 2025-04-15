const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let players = {};

// Créer plusieurs ennemis
let enemies = [
  { id: 'enemy1', position: { x: 0, y: 0, z: 0 }, rotationY: 0, direction: { x: 1, y: 0, z: 0 } },
  { id: 'enemy3', position: { x: -50, y: 0, z: -50 }, rotationY: 0, direction: { x: 1, y: 0, z: 0 } }
];

setInterval(() => {
  const playerIds = Object.keys(players);
  if (playerIds.length === 0) return;

  // Boucle à travers chaque ennemi
  enemies.forEach(enemy => {
    let closestPlayer = null;
    let closestDistance = Infinity;

    // Recherche du joueur le plus proche
    playerIds.forEach(playerId => {
      const player = players[playerId];
      const dx = player.position.x - enemy.position.x;
      const dz = player.position.z - enemy.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestPlayer = player;
      }
    });

    if (closestPlayer) {
      // Calcul de la direction vers le joueur le plus proche
      const dx = closestPlayer.position.x - enemy.position.x;
      const dz = closestPlayer.position.z - enemy.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      const speed = 0.05;
      if (distance > 0.5) {
        // Mise à jour de la direction et déplacement de l'ennemi
        enemy.direction.x = dx / distance;
        enemy.direction.z = dz / distance;
        enemy.position.x += enemy.direction.x * speed;
        enemy.position.z += enemy.direction.z * speed;
        enemy.rotationY = Math.atan2(dx, dz); // Mise à jour de la rotation
      }
    }
  });

  // Envoi de la position de tous les ennemis aux clients
  io.emit('enemiesMoved', enemies);
}, 50);

// Socket.io
io.on('connection', (socket) => {
  console.log('Un joueur est connecté :', socket.id);

  players[socket.id] = {
    id: socket.id,
    name: 'Joueur ' + socket.id,
    position: { x: 0, y: 0, z: 0 },
    rotationY: 0
  };

  // Envoie les ennemis au nouveau joueur
  socket.emit('enemiesData', enemies);

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
