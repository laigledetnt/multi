const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Liste des joueurs connectés avec leurs noms et positions
let players = {};

// Gestion de la connexion d'un joueur
io.on('connection', (socket) => {
  console.log('Un joueur est connecté :', socket.id);

  // Créer un joueur et l'ajouter à la liste avec un nom par défaut
  players[socket.id] = { 
    id: socket.id, 
    name: 'Joueur ' + socket.id,  // Nom par défaut
    position: { x: 0, y: 0, z: 0 }, 
    rotationY: 0 
  };

  // Envoyer la liste des joueurs actuels à un joueur qui vient de se connecter
  socket.emit('currentPlayers', players);

  // Permettre aux joueurs de changer leur nom
  socket.on('setPlayerName', (name) => {
    if (name && name.trim() !== '') {
      players[socket.id].name = name;  // Mettre à jour le nom du joueur
    }
    // Envoyer la mise à jour du nom à tous les autres joueurs
    socket.broadcast.emit('playerNameUpdated', { id: socket.id, name: players[socket.id].name });
    // Envoie le nom au joueur lui-même (pour confirmation)
    socket.emit('playerNameUpdated', { id: socket.id, name: players[socket.id].name });
  });

  // Lorsqu'un joueur se déplace, on met à jour sa position
  socket.on('playerMoved', (playerData) => {
    players[socket.id] = { ...players[socket.id], ...playerData };
    // On envoie la nouvelle position de ce joueur aux autres
    socket.broadcast.emit('playerMoved', { id: socket.id, playerData });
  });

  // Lorsqu'un message de chat est envoyé
  socket.on('chat message', (message) => {
    console.log(players[socket.id].name,':', message); 
    // Diffuse le message à tous les autres joueurs
    io.emit('chat message', { id: socket.id, message: message, name: players[socket.id].name });
  });

  // Lorsqu'un joueur se déconnecte
  socket.on('disconnect', () => {
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
