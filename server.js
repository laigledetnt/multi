const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Liste des joueurs connectés
let players = {};

// Génération procédurale du monde (appelée une seule fois au lancement)
function generateProceduralWorld() {
  const rooms = [];

  // Room de départ
  rooms.push({
    piece: 'spawn.glb',
    position: [0, 3, 0],
    rotationY: 0,
    connectedTo: ['PX2']
  });

  // Exemple de 2 pièces connectées
  rooms.push({
    piece: 'P1.glb',
    position: [10, 3, 0],
    rotationY: 0,
    connectedTo: ['PX2']
  });

  rooms.push({
    piece: 'P4.glb',
    position: [20, 3, 0],
    rotationY: Math.PI,
    connectedTo: []
  });

  return rooms;
}

// Le monde généré (sera envoyé à tous les clients)
const worldData = generateProceduralWorld();

io.on('connection', (socket) => {
  console.log('Un joueur est connecté :', socket.id);

  players[socket.id] = { 
    id: socket.id, 
    name: 'Joueur ' + socket.id,
    position: { x: 0, y: 0, z: 0 }, 
    rotationY: 0 
  };

  // Envoyer le monde généré au nouveau joueur
  socket.emit('worldData', worldData);

  socket.emit('currentPlayers', players);

  socket.on('setPlayerName', (name) => {
    if (name && name.trim() !== '') {
      players[socket.id].name = name;
    }
    socket.broadcast.emit('playerNameUpdated', { id: socket.id, name: players[socket.id].name });
    socket.emit('playerNameUpdated', { id: socket.id, name: players[socket.id].name });
  });

  socket.on('playerMoved', (playerData) => {
    players[socket.id] = { ...players[socket.id], ...playerData };
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

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
