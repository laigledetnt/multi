const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Permet les connexions depuis n'importe quel domaine
    methods: ["GET", "POST"],
  }
});

app.use(express.static('public')); // Sert ton dossier 'public' (où se trouvent ton HTML, JS, etc.)

io.on('connection', (socket) => {
  console.log('Un joueur est connecté : ' + socket.id);
  
  // Gère les événements de mouvement des joueurs, etc.
  socket.on('updatePosition', (data) => {
    console.log('Position mise à jour', data);
    socket.broadcast.emit('playerMoved', data); // Envoie la position aux autres joueurs
  });

  socket.on('disconnect', () => {
    console.log('Un joueur s\'est déconnecté : ' + socket.id);
  });
});

server.listen(3000, () => {
  console.log('Serveur démarré sur http://localhost:3000');
});
