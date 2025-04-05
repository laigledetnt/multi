// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const players = {};

io.on('connection', (socket) => {
    console.log('Un joueur connecté :', socket.id);

    // Envoyer tous les joueurs actuels
    socket.emit('currentPlayers', players);

    // Ajouter ce joueur
    players[socket.id] = { x: 0, y: 10, z: 0 };

    // Informer les autres
    socket.broadcast.emit('playerMoved', { id: socket.id, playerData: players[socket.id] });

    // Mise à jour de position
    socket.on('playerMoved', (playerData) => {
        players[socket.id] = playerData;
        socket.broadcast.emit('playerMoved', { id: socket.id, playerData });
    });

    // Déconnexion
    socket.on('disconnect', () => {
        console.log('Déconnecté :', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

// Démarrer le serveur
server.listen(3000, () => {
    console.log('Serveur Socket.io lancé sur http://localhost:3000');
});
