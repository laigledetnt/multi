const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let players = {};

// Middleware pour parser du JSON (utile pour l'éditeur)
app.use(express.json());

// Fonction pour charger la grille depuis un fichier JSON
function loadMap() {
  const mapPath = path.join(__dirname, 'map.json');
  if (fs.existsSync(mapPath)) {
    return JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  } 
}

// Génère les blocs 3D depuis une grille
function generateWorldFromGrid(grid) {
  const blocks = [];

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const type = grid[y][x];
      if (type !== ' ') {
        blocks.push({
          type,
          position: [x * 2, 0, y * 2] // Chaque bloc fait 2x2
        });
      }
    }
  }

  return blocks;
}

// Charge la grille (peut venir de map.json)
const worldData = generateWorldFromGrid(loadMap());

// API pour sauvegarder depuis l’éditeur
app.post('/save-map', (req, res) => {
  const { map } = req.body;
  fs.writeFileSync(path.join(__dirname, 'map.json'), JSON.stringify(map, null, 2));
  res.sendStatus(200);
});

// Socket.io
io.on('connection', (socket) => {
  console.log('Un joueur est connecté :', socket.id);

  players[socket.id] = {
    id: socket.id,
    name: 'Joueur ' + socket.id,
    position: { x: 0, y: 0, z: 0 },
    rotationY: 0
  };

  // Envoie la map + joueurs
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

// Sert les fichiers statiques (client, éditeur, etc.)
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
