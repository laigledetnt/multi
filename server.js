const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Liste des joueurs connectés
let players = {};

// Gestion de la connexion d'un joueur
io.on('connection', (socket) => {
  console.log('Un joueur est connecté :', socket.id);

  // Créer un joueur et l'ajouter à la liste
  players[socket.id] = { id: socket.id, position: { x: 0, y: 0, z: 0 }, rotationY: 0 };

  // Envoyer la liste des joueurs actuels à un joueur qui vient de se connecter
  socket.emit('currentPlayers', players);

  // Lorsqu'un joueur se déplace, on met à jour sa position
  socket.on('playerMoved', (playerData) => {
    players[socket.id] = { ...players[socket.id], ...playerData };
    // On envoie la nouvelle position de ce joueur aux autres
    socket.broadcast.emit('playerMoved', { id: socket.id, playerData });
  });

  // Lorsqu'un message de chat est envoyé
  socket.on('chat message', (message) => {
    console.log('Message reçu:', message); // Pour vérifier que le message arrive
    // Diffuse le message à tous les autres joueurs
    io.emit('chat message', { id: socket.id, message: message });
  });

  // Lorsqu'un joueur se déconnecte
  socket.on('disconnect', () => {
    console.log('Un joueur s\'est déconnecté :', socket.id);
    delete players[socket.id];
    // On informe les autres joueurs de la déconnexion
    socket.broadcast.emit('playerDisconnected', socket.id);
  });
});

// Configurer l'application pour servir des fichiers statiques (par exemple, ton jeu Three.js)
app.use(express.static('public'));

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
});
