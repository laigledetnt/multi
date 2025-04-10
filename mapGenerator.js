// mapGenerator.js

// Exemple de génération de carte basée sur un seed
function generateMap(seed) {
    // Utilisation du seed pour générer des éléments de la carte de manière déterministe
    const map = [];
    const random = new Math.seedrandom(seed);  // Utilisation de Math.seedrandom pour un générateur de nombres déterministes basé sur le seed

    // Exemple : générer des pièces de manière aléatoire
    for (let i = 0; i < 5; i++) {
        map.push({
            piece: `piece_${i}`,
            position: [
                random() * 100,  // Position X
                random() * 100,  // Position Y
                random() * 100   // Position Z
            ],
            rotationY: random() * 2 * Math.PI  // Rotation Y
        });
    }

    return map;
}

module.exports = { generateMap };
