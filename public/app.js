
      
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@latest/build/three.module.js';
import { io } from 'https://cdn.socket.io/4.7.2/socket.io.esm.min.js';
// import Stats from 'three/addons/libs/stats.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Octree } from 'three/addons/math/Octree.js';
// import { OctreeHelper } from 'three/addons/helpers/OctreeHelper.js';
import { Capsule } from 'three/addons/math/Capsule.js';
// import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

const socket = io();

socket.on('connect', () => {
const nameEntryContainer = document.getElementById('name-entry-container');
const playerNameInput = document.getElementById('player-name');
const submitNameButton = document.getElementById('submit-name');

nameEntryContainer.style.display = 'block';

submitNameButton.addEventListener('click', () => {
  const playerName = playerNameInput.value.trim();
  
  if (playerName) {
    // Masquer le formulaire de saisie et envoyer le nom au serveur
    nameEntryContainer.style.display = 'none';
    socket.emit('setPlayerName', playerName);
  } 
});

// Optionnel : gérer la touche "Entrée" pour valider le nom
playerNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    submitNameButton.click();
  }
});
});

// Lorsqu'un message est reçu du serveur
socket.on('chat message', ({ name, message }) => {
 

  const msgElement = document.createElement('div');
  msgElement.textContent = `${name}: ${message}`;
  
  document.getElementById('chat-messages').appendChild(msgElement);
});



const chatInput = document.getElementById('chat-input');

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && chatInput.value.trim() !== '') {
    const message = chatInput.value.trim();
    socket.emit('chat message', message);
    chatInput.value = '';
  }
});
socket.on('achievementUnlocked', ({ id, description }) => {
  console.log(`Succès débloqué : ${description}`);
  showAchievementPopup(description); 
});

let players = {}; 
let scene = new THREE.Scene(); 



function updatePlayerPosition(id, playerData) {
  const playerModel = players[id];
  if (playerModel) {
  
    playerModel.position.set(playerData.x, playerData.y -2.8, playerData.z);
    if (typeof playerData.rotationY === 'number') {
      playerModel.rotation.y = playerData.rotationY + Math.PI;
    }
  }
}


function removePlayerModel(playerId) {
  const playerModel = players[playerId];
  if (playerModel) {
    scene.remove(playerModel); 
    playerModel.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose(); 
        }
    });
    delete players[playerId]; 
  }
}



socket.on('currentPlayers', (existingPlayers) => {
  for (const id in existingPlayers) {
    createPlayerModel(id, existingPlayers[id]);
  }
});

socket.on('playerMoved', ({ id, playerData }) => {
  if (id === socket.id) return;
  if (!players[id]) {
    createPlayerModel(id, playerData);
  } else {
    updatePlayerPosition(id, playerData);
  }
});


socket.on('playerDisconnected', (playerId) => {
  removePlayerModel(playerId);
});


socket.on('achievementUnlocked', ({ id, description }) => {
  showAchievementPopup(description);
});

const clock = new THREE.Clock();

const loaderp = new THREE.TextureLoader();
loaderp.load('sky.jpg', (texture) => {
  const skyGeometry = new THREE.SphereGeometry(500, 30, 30);
  skyGeometry.scale(-1, 1, 1); 
  const skyMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    toneMapped: false
  });
  sky = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(sky);
});
      const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.rotation.order = 'YXZ';

      const fillLight1 = new THREE.HemisphereLight(0x8dc1de, 0x00668d, 1.5);
      fillLight1.position.set(0, 0, 0);
      scene.add(fillLight1);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
      directionalLight.position.set(-5, 25, -1);
      directionalLight.castShadow = false;
       scene.add(directionalLight);
      

      const container = document.getElementById('container');

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      renderer.shadowMap.enabled = false;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      container.appendChild(renderer.domElement);

      
     


function createSmoke(position) {
  const particleCount = 5000;
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const velocities = [];

for (let i = 0; i < particleCount; i++) {
  positions.push(position.x, position.y, position.z);

  // Distribution sphérique uniforme
  const u = Math.random();
  const v = Math.random();
  const theta = u * 2.0 * Math.PI;
  const phi = Math.acos(2.0 * v - 1.0);
  const r = Math.cbrt(Math.random()); // cube root = densité sphérique

  const sinPhi = Math.sin(phi);
  const vx = r * sinPhi * Math.cos(theta);
  const vy = r * Math.cos(phi);
  const vz = r * sinPhi * Math.sin(theta);

  const spread = 1.5;
  velocities.push(vx * spread, vy * spread, vz * spread);
}


  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.userData.velocities = velocities;

  const material = new THREE.PointsMaterial({
    size: 0.9,
    transparent: true,
    opacity: 10,
    depthWrite: false,
    color: 0x333333
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  const lifespan = 1000; 
  const start = performance.now();

  function animateSmoke() {
    const now = performance.now();
    const elapsed = now - start;
    const positions = geometry.attributes.position.array;
    const velocities = geometry.userData.velocities;
    const speedf = 0.4; // + petit = + lent

    for (let i = 0; i < velocities.length; i += 3) {
      positions[i] += velocities[i] * speedf;
      positions[i + 1] += velocities[i + 1] * speedf;
      positions[i + 2] += velocities[i + 2] * speedf;
    }

    geometry.attributes.position.needsUpdate = true;
    material.opacity = 1.2 - (elapsed / lifespan); // fondu lent

    if (elapsed < lifespan) {
      requestAnimationFrame(animateSmoke);
    } else {
      setTimeout(() => {
        scene.remove(particles);
        geometry.dispose();
        material.dispose();
      }, 8000); // garde les particules mortes encore un moment si besoin
    }
  }

  animateSmoke();
}




      const GRAVITY = 40;

      const NUM_SPHERES = 1;
      const SPHERE_RADIUS = 0.2;

      const STEPS_PER_FRAME = 2;

      const sphereGeometry = new THREE.IcosahedronGeometry(SPHERE_RADIUS, 5);
      const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xdede8d });

     


      const spheres = [];
      let sphereIdx = 0;

      for (let i = 0; i < NUM_SPHERES; i++) {
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.castShadow = false;
        sphere.receiveShadow = false;

        scene.add(sphere);

        spheres.push({
          mesh: sphere,
          collider: new THREE.Sphere(new THREE.Vector3(0, -100, 0), SPHERE_RADIUS),
          velocity: new THREE.Vector3(),
        });
      }

      const worldOctree = new Octree();

      const playerCollider = new Capsule(new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 1, 0), 0.35);

      const playerVelocity = new THREE.Vector3();
      const playerDirection = new THREE.Vector3();

      let playerOnFloor = false;
      let mouseTime = 0;

      let sky;

      const keyStates = {};

      const vector1 = new THREE.Vector3();
      const vector2 = new THREE.Vector3();
      const vector3 = new THREE.Vector3();


      const mineSound = new Audio('explosion.mp3');
      mineSound.volume = 1;

      let lastMineHitTime = 0;

      document.addEventListener('keydown', (event) => {
        keyStates[event.code] = true;
      });

      document.addEventListener('keyup', (event) => {
        keyStates[event.code] = false;
      });

      container.addEventListener('mousedown', () => {
        document.body.requestPointerLock();
        mouseTime = performance.now();
      });

      

      document.body.addEventListener('mousemove', (event) => {
        if (document.pointerLockElement === document.body) {
          camera.rotation.y -= event.movementX / 500;
          camera.rotation.x -= event.movementY / 500;
        }
      });

      window.addEventListener('resize', onWindowResize);

      function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }

      

      function playerCollisions() {
        const result = worldOctree.capsuleIntersect(playerCollider);

        playerOnFloor = false;

        if (result) {
          playerOnFloor = result.normal.y > 0;

          if (!playerOnFloor) {
            playerVelocity.addScaledVector(result.normal, -result.normal.dot(playerVelocity));
          }

          if (result.depth >= 1e-10) {
            playerCollider.translate(result.normal.multiplyScalar(result.depth));
          }
        }
      }

      function updatePlayer(deltaTime) {
        let damping = -0.08; 



  if (playerOnFloor) {
 
    const friction = -0.04; 
    playerVelocity.x *= (1 - friction);
    playerVelocity.z *= (1 - friction);
  } else {
    playerVelocity.y -= GRAVITY * deltaTime;
    damping *= 0.2; 
  }
  playerVelocity.addScaledVector(playerVelocity, damping);

  const deltaPosition = playerVelocity.clone().multiplyScalar(deltaTime);
  playerCollider.translate(deltaPosition);

  playerCollisions();

  camera.position.copy(playerCollider.end);
  socket.emit('playerMoved', {
    x: playerCollider.end.x,
    y: playerCollider.end.y,
    z: playerCollider.end.z,
    rotationY: +camera.rotation.y,
    
});

}


      function playerSphereCollision(sphere) {
        const center = vector1.addVectors(playerCollider.start, playerCollider.end).multiplyScalar(0.5);
        const sphere_center = sphere.collider.center;
        const r = playerCollider.radius + sphere.collider.radius;
        const r2 = r * r;

       
        for (const point of [playerCollider.start, playerCollider.end, center]) {
          const d2 = point.distanceToSquared(sphere_center);
          if (d2 < r2) {
            const normal = vector1.subVectors(point, sphere_center).normalize();
            const v1 = vector2.copy(normal).multiplyScalar(normal.dot(playerVelocity));
            const v2 = vector3.copy(normal).multiplyScalar(normal.dot(sphere.velocity));

            playerVelocity.add(v2).sub(v1);
            sphere.velocity.add(v1).sub(v2);

            const d = (r - Math.sqrt(d2)) / 2;
            sphere_center.addScaledVector(normal, -d);
          }
        }
      }

      function spheresCollisions() {
        for (let i = 0, length = spheres.length; i < length; i++) {
          const s1 = spheres[i];
          for (let j = i + 1; j < length; j++) {
            const s2 = spheres[j];
            const d2 = s1.collider.center.distanceToSquared(s2.collider.center);
            const r = s1.collider.radius + s2.collider.radius;
            const r2 = r * r;
            if (d2 < r2) {
              const normal = vector1.subVectors(s1.collider.center, s2.collider.center).normalize();
              const v1 = vector2.copy(normal).multiplyScalar(normal.dot(s1.velocity));
              const v2 = vector3.copy(normal).multiplyScalar(normal.dot(s2.velocity));
              s1.velocity.add(v2).sub(v1);
              s2.velocity.add(v1).sub(v2);
              const d = (r - Math.sqrt(d2)) / 2;
              s1.collider.center.addScaledVector(normal, d);
              s2.collider.center.addScaledVector(normal, -d);
            }
          }
        }
      }

      function updateSpheres(deltaTime) {
        spheres.forEach((sphere) => {
          sphere.collider.center.addScaledVector(sphere.velocity, deltaTime);
          const result = worldOctree.sphereIntersect(sphere.collider);

          if (result) {
            sphere.velocity.addScaledVector(result.normal, -result.normal.dot(sphere.velocity) * 1.5);
            sphere.collider.center.add(result.normal.multiplyScalar(result.depth));
          } else {
            sphere.velocity.y -= GRAVITY * deltaTime;
          }

          const damping = Math.exp(-1.5 * deltaTime) - 1;
          sphere.velocity.addScaledVector(sphere.velocity, damping);

          playerSphereCollision(sphere);
        });

        spheresCollisions();

        for (const sphere of spheres) {
          sphere.mesh.position.copy(sphere.collider.center);
        }
      }

      function getForwardVector() {
        camera.getWorldDirection(playerDirection);
        playerDirection.y = 0;
        playerDirection.normalize();

        return playerDirection;
      }
      function getSideVector() {
        camera.getWorldDirection(playerDirection);
        playerDirection.y = 0;
        playerDirection.normalize();
        playerDirection.cross(camera.up);

        return playerDirection;
      }

      function controls(deltaTime) {
        
        const speedDelta = deltaTime * (playerOnFloor ? 20: 15);

        if (keyStates['KeyW']) {
          playerVelocity.add(getForwardVector().multiplyScalar(speedDelta));
        }
        if (keyStates['KeyS']) {
          playerVelocity.add(getForwardVector().multiplyScalar(-speedDelta));
        }
        if (keyStates['KeyA']) {
          playerVelocity.add(getSideVector().multiplyScalar(-speedDelta));
        }
        if (keyStates['KeyD']) {
          playerVelocity.add(getSideVector().multiplyScalar(speedDelta));
        }
        if (playerOnFloor) {
          if (keyStates['Space']) {
            playerVelocity.y = 23;
            socket.emit('playerJumped');
          }
        }
      }
      
      function Checkpoint() {
        for (const checkpoint of checkpoints) {
            const distance = playerCollider.end.distanceTo(checkpoint);
            if (distance < 20) { 
                lastCheckpoint.copy(checkpoint);
            }
        }
    }
    
    function JumperCollision() {
        jumpers.forEach((jumperBox) => {
            const result = playerCollider.intersectsBox(jumperBox);
    
            if (result) {
                playerVelocity.y = 40; 
            }
        });
    }

    function JumperCollisionG() {
        jumpersG.forEach((jumperGBox) => {
            const result = playerCollider.intersectsBox(jumperGBox);
    
            if (result) {
                playerVelocity.y = 100; 
            }
        });
    }

  function Evr() {
        evr.forEach((evrBox) => {
            const result = playerCollider.intersectsBox(evrBox);
    
            if (result) {
                 socket.emit('Evr');
            }
        });
    }

    let cameraShakeTime = 0;
let cameraShakeIntensity = 0;
function shakeCamera() {
  const startTime = performance.now();

function startCameraShake(intensity = 0.005, duration = 300) {
  cameraShakeTime = duration;
  cameraShakeIntensity = intensity;
}

  startCameraShake(0.1, 300);
}

function MineCollision() {
  const now = performance.now();

  mines.forEach((mineBox) => {
    if (playerCollider.intersectsBox(mineBox)) {

      shakeCamera(100, 40000);
      if (now - lastMineHitTime < 1000) return;
      lastMineHitTime = now;

     
      mineSound.currentTime = 0;
      mineSound.play();

     

      createSmoke(playerCollider.end.clone());
      playerVelocity.y = 100;
      
      setTimeout(() => {
        playerVelocity.y = 0;
    playerCollider.start.copy(lastCheckpoint).add(new THREE.Vector3(0, 0.35, 0));
    playerCollider.end.copy(lastCheckpoint).add(new THREE.Vector3(0, 3, 0));
    camera.position.copy(playerCollider.end);
  }, 2500);
       
    }
  });
}

    function TeleporterCollision() {
        for (const { box, target } of teleporters) {
            if (playerCollider.intersectsBox(box)) {
                playerCollider.start.copy(target).add(new THREE.Vector3(0, 0.35, 0));
                playerCollider.end.copy(target).add(new THREE.Vector3(0, 3, 0));
                camera.position.copy(playerCollider.end);
                break; 
            }
        }
    }

    function showAchievementPopup(text) {
      const popup = document.createElement('div');
      popup.textContent = `⭐Succès débloqué⭐: ${text}`;
      popup.style.position = 'absolute';
      popup.style.top = '20px';
      popup.style.right = '20px';
      popup.style.background = '#2cd1c0';
      popup.style.padding = '10px';
      popup.style.borderRadius = '8px';
      popup.style.zIndex = 1000;
      popup.style.fontFamily = 'sans-serif';
      document.body.appendChild(popup);
      setTimeout(() => popup.remove(), 3000);
    }
    
    const loader = new GLTFLoader();
        let jumpersG = []; 
        let jumpers = [];
        let checkpoints = [];
        let teleporters = [];
        let lastCheckpoint = new THREE.Vector3(0, 10, 0); 
        let mines = [];
        let evr = [];

loader.load('world.glb', (gltf) => {
  scene.add(gltf.scene);
  gltf.scene.position.set(0, 2, 0);
  gltf.scene.updateMatrixWorld(true);
  worldOctree.fromGraphNode(gltf.scene); 

  gltf.scene.traverse((child) => {
      if (child.isMesh && child.name.includes("Checkpoint")) {
          checkpoints.push(child.position.clone());
      }
      if (child.isMesh && child.name.includes("Jumper")) {
          const box = new THREE.Box3().setFromObject(child);
          jumpers.push(box);  
      }
      if (child.isMesh && child.name.includes("JumperG")) {            
          const box = new THREE.Box3().setFromObject(child);
          jumpersG.push(box);  
      }
      if (child.isMesh && child.name.startsWith("TeleporterTo_")) {
          const parts = child.name.split("_");
      if (parts.length === 4) {
          const toNumber = (str) => parseFloat(str.replace("m", "-"));

          const x = toNumber(parts[1]);
          const y = toNumber(parts[2]);
          const z = toNumber(parts[3]);

          const box = new THREE.Box3().setFromObject(child);
          const target = new THREE.Vector3(x, y, z);

          teleporters.push({ box, target });
          }
            }
      
       
      if (child.isMesh && child.name.includes("Mine")) {
        const box = new THREE.Box3().setFromObject(child);
        mines.push(box);
      }
      if (child.isMesh && child.name.includes("Evr")) {            
          const box = new THREE.Box3().setFromObject(child);
          evr.push(box);  
      }
      

       });
});

function createPlayerModel(id) {
  if (id === socket.id) return;

  const loader = new GLTFLoader();
  loader.load('player.glb', (gltf) => {
    const playerModel = gltf.scene;
    playerModel.scale.set(0.6, 0.6, 0.6);  
   playerModel.userData.initialPosition = playerModel.position.clone();
    scene.add(playerModel);
    players[id] = playerModel;
  });
  
}

function teleportPlayerIfOob() {
    if (camera.position.y <= 1) {
        playerCollider.start.copy(lastCheckpoint).add(new THREE.Vector3(0, 0.35, 0));
        playerCollider.end.copy(lastCheckpoint).add(new THREE.Vector3(0, 3, 0));
        camera.position.copy(playerCollider.end)
    }
}


// const stats = new Stats();
// document.body.appendChild(stats.dom);



function animate()  {
  // stats.begin();
const deltaTime = Math.min(0.05, clock.getDelta());

if (sky) {
sky.position.set(camera.position.x, 0, camera.position.z);
}
 
controls(deltaTime);
updatePlayer(deltaTime);
updateSpheres(deltaTime);

Checkpoint();
JumperCollision();
JumperCollisionG();
TeleporterCollision();
MineCollision();
Evr();
teleportPlayerIfOob();
if (cameraShakeTime > 0) {
  cameraShakeTime -= clock.getDelta() * 1000;

  const shakeX = (Math.random() - 0.5) * cameraShakeIntensity;
  const shakeY = (Math.random() - 0.5) * cameraShakeIntensity;

  camera.rotation.x += shakeX;
  camera.rotation.y += shakeY;
}
renderer.render(scene, camera);
// stats.end();
}
 
