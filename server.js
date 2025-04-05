const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // Servir les fichiers statiques depuis le dossier 'public'

io.on('connection', (socket) => {
    console.log('Un utilisateur s\'est connecté : ' + socket.id);

    // Recevoir la position du joueur et la diffuser aux autres
    socket.on('updatePosition', (data) => {
        socket.broadcast.emit('playerMoved', { id: socket.id, position: data.position });
    });

    // Gérer la déconnexion du joueur
    socket.on('disconnect', () => {
        console.log('Utilisateur déconnecté : ' + socket.id);
        socket.broadcast.emit('playerDisconnected', { id: socket.id });
    });
});

server.listen(3000, () => {
    console.log('Serveur en écoute sur le port 3000');
});
