const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let players = {};  // Object to store players' positions

// Servir les fichiers statiques de Three.js et du client
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('Un joueur est connecté : ' + socket.id);

    // Envoyer la position des autres joueurs au nouveau joueur
    socket.emit('currentPlayers', players);

    // Gérer le mouvement des joueurs
    socket.on('playerMoved', (playerData) => {
        players[socket.id] = playerData;  // Mettre à jour la position du joueur
        // Envoyer la nouvelle position à tous les autres joueurs
        io.emit('playerMoved', { id: socket.id, playerData });
    });

    // Lorsque le joueur se déconnecte
    socket.on('disconnect', () => {
        console.log('Un joueur s\'est déconnecté : ' + socket.id);
        delete players[socket.id];  // Supprimer le joueur de la liste
        io.emit('playerDisconnected', socket.id);  // Informer les autres joueurs
    });
});

server.listen(3000, () => {
    console.log('Serveur démarré sur http://localhost:3000');
});
