const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Politique CSP
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdn.socket.io; " +
        "style-src 'self' 'unsafe-inline' http://localhost:3000; " +
        "img-src 'self' data:; " +
        "connect-src 'self' http://localhost:3000 blob:;"
    );
    next();
});

// Fichiers statiques
app.use(express.static('public'));

const players = {};

io.on('connection', (socket) => {
    console.log('Un joueur connecté :', socket.id);

    // Envoi de la liste actuelle des joueurs
    socket.emit('currentPlayers', players);

    // Ajout du joueur
    players[socket.id] = { x: 0, y: 10, z: 0 };
    socket.broadcast.emit('playerMoved', { id: socket.id, playerData: players[socket.id] });

    // Réception d'un mouvement
    socket.on('playerMoved', (playerData) => {
        players[socket.id] = playerData;
        socket.broadcast.emit('playerMoved', { id: socket.id, playerData });
    });

    // Réception d'un message de chat
    socket.on('chat message', (msg) => {
        io.emit('chat message', { id: socket.id.slice(0, 5), message: msg });
    });

    // Déconnexion
    socket.on('disconnect', () => {
        console.log('Déconnecté :', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

// Lancement du serveur
server.listen(3000, () => {
    console.log('Serveur Socket.io lancé sur http://localhost:3000');
});
