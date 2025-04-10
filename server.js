const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const seedrandom = require('seedrandom');  // Nécessite d'être installé via npm install seedrandom

// Fonction de génération procédurale du monde
function generateProceduralWorld(seed) {
  const rng = seedrandom(seed);  // Générateur basé sur le seed

  const worldData = [];
  
  // Rotation fixe pour toutes les pièces (par exemple, 0)
  const fixedRotationY = 0;  // Remplace par la rotation que tu souhaites pour toutes les pièces

  // Exemple de génération avec des coordonnées procédurales mais rotation fixe
  for (let i = 0; i < 5; i++) {
    const posX = rng() * 50;  // Valeurs différentes mais consistantes selon le seed
    const posY = 3;
    const posZ = rng() * 50;

    worldData.push({
      piece: `P${i + 1}.glb`,
      entry: `PX${i + 1}`,
      exit: i < 4 ? `PX${i + 2}` : null,
      position: [posX, posY, posZ],
      rotationY: fixedRotationY  // Rotation fixe pour toutes les pièces
    });
  }

  return worldData;
}

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
let firstPlayerJoined = false;  // Variable pour vérifier si c'est le premier joueur

// Fonction pour générer un seed unique basé sur l'heure
function generateUniqueSeed() {
  const currentDate = new Date();
  const seed = currentDate.getTime().toString();  // Utilise le timestamp actuel comme seed
  return seed;
}

// Génération d'un nouveau seed à chaque lancement du serveur
const sharedSeed = generateUniqueSeed();  // Un seed basé sur l'heure du lancement

console.log(`Le monde sera généré avec le seed : ${sharedSeed}`);

io.on('connection', (socket) => {
    console.log('Un joueur est connecté :', socket.id);
  
    // Génération du monde procédural et envoi aux joueurs
    const worldData = generateProceduralWorld(sharedSeed);  // Utilisation du seed généré pour le monde
  
    // Envoi des données du monde à tous les joueurs (y compris le nouveau joueur)
    io.emit('worldData', worldData);
  
    // Envoi des joueurs existants et autres informations
    socket.emit('currentPlayers', players);
    
    // Lorsque le joueur se déplace, mettez à jour les informations et envoyez-les
    socket.on('playerMoved', (playerData) => {
      players[socket.id] = playerData;
      io.emit('playerMoved', { id: socket.id, playerData });
    });
  
    // Gérer les déconnexions
    socket.on('disconnect', () => {
      console.log('Un joueur est déconnecté :', socket.id);
      delete players[socket.id];
      io.emit('playerDisconnected', socket.id);
    });
});

// Lancement du serveur
server.listen(3000, () => {
    console.log('Serveur Socket.io lancé sur http://localhost:3000');
});
