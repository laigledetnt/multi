const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let players = {}; // Garder une trace des joueurs et de leurs positions

// Connexion d'un joueur
io.on('connection', (socket) => {
  console.log('Un joueur est connecté : ' + socket.id);

  // Ajouter un joueur
  players[socket.id] = {
    position: { x: 0, y: 1, z: 0 }, // Position initiale
  };

  // Envoyer la position de tous les autres joueurs au nouveau joueur
  socket.emit('initialPositions', players);

  // Mettre à jour la position d'un joueur
  socket.on('updatePosition', (data) => {
    players[socket.id].position = data.position;

    // Envoyer la position mise à jour à tous les autres joueurs
    socket.broadcast.emit('playerMoved', {
      id: socket.id,
      position: data.position,
    });
  });

  // Lorsqu'un joueur se déconnecte
  socket.on('disconnect', () => {
    console.log('Un joueur est déconnecté : ' + socket.id);
    delete players[socket.id];
    socket.broadcast.emit('playerDisconnected', socket.id);
  });
});

// Démarrer le serveur sur le port 3000
server.listen(3000, () => {
  console.log('Serveur démarré sur http://localhost:3000');
});
