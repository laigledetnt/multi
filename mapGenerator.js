// mapGenerator.js
const noise = require('perlin-noise');  // Utilise un module de bruit de Perlin

// Générer une map à partir d'un seed
function generateMap(seed) {
    const generator = noise.generatePerlinNoise(100, 100, { octaveCount: 4, persistence: 0.5, lacunarity: 2.0, seed: seed });
    
    // Exemple simple de terrain où l'on mappe les valeurs de bruit à un terrain de type '0' ou '1'
    const map = generator.map(value => value > 0.2 ? 1 : 0);  // '1' représente une zone solide, '0' une zone vide
    
    return map;
}

module.exports = { generateMap };
