// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// ⚠️ Autoriser CORS
const io = require('socket.io')(server, {
    cors: {
        origin: '*', // Accepter les requêtes depuis n'importe quelle origine
        methods: ['GET', 'POST'],
    }
});

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

// ✅ Port dynamique pour Render
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur Socket.io lancé sur http://localhost:${PORT}`);
});
