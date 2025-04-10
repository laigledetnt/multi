
      
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@latest/build/three.module.js';
import { io } from 'https://cdn.socket.io/4.7.2/socket.io.esm.min.js';
// import Stats from 'three/addons/libs/stats.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Octree } from 'three/addons/math/Octree.js';
// import { OctreeHelper } from 'three/addons/helpers/OctreeHelper.js';
import { Capsule } from 'three/addons/math/Capsule.js';
// import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

const socket = io(); // Utilisé pour le jeu et le chat

// Ajoute ce code chat ici aussi :
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && chatInput.value.trim() !== '') {
    const message = chatInput.value.trim();
    socket.emit('chat message', message);
    chatInput.value = '';
  }
});

socket.on('chat message', ({ id, message }) => {
  const msgElement = document.createElement('div');
  msgElement.textContent = `[${id}] ${message}`;
  if (id === socket.id) return;
  
  chatMessages.appendChild(msgElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

let players = {}; 
let scene = new THREE.Scene(); 

// Crée un modèle de joueur
function createPlayerModel(id) {
  if (id === socket.id) return;

  const loader = new GLTFLoader();
  loader.load('player.glb', (gltf) => {

    const playerModel = gltf.scene;

    playerModel.scale.set(0.5, 0.5, 0.5);  
    
   playerModel.userData.initialPosition = playerModel.position.clone();
    scene.add(playerModel);
    players[id] = playerModel;
  });
}

function updatePlayerPosition(id, playerData) {
  const playerModel = players[id];
  if (playerModel) {
  
    playerModel.position.set(playerData.x, playerData.y - 1, playerData.z);
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
  for (const id in players) {
    removePlayerModel(id);
  }
  for (const playerId in existingPlayers) {
    createPlayerModel(playerId, existingPlayers[playerId]);
  }
});

socket.on('playerMoved', (data) => {
  const { id, playerData } = data;
  if (id === socket.id) return;
  if (players[id]) {
    updatePlayerPosition(id, playerData);
  } else {
    createPlayerModel(id);
  }
});

socket.on('playerDisconnected', (playerId) => {
  removePlayerModel(playerId);
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
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(sky);
});
      const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.rotation.order = 'YXZ';

      const fillLight1 = new THREE.HemisphereLight(0x8dc1de, 0x00668d, 1.5);
      fillLight1.position.set(0, 0, 0);
      scene.add(fillLight1);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
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

      
     

      const GRAVITY = 25;

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

      const keyStates = {};

      const vector1 = new THREE.Vector3();
      const vector2 = new THREE.Vector3();
      const vector3 = new THREE.Vector3();

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
        let damping = -0.07; 



  if (playerOnFloor) {
 
    const friction = -0.04; 
    playerVelocity.x *= (1 - friction);
    playerVelocity.z *= (1 - friction);
  } else {
    playerVelocity.y -= GRAVITY * deltaTime;
    damping *= 0.1; 
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
        
        const speedDelta = deltaTime * (playerOnFloor ? 30 : 8);

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
            playerVelocity.y = 17;
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

const loader = new GLTFLoader();

      let jumpersG = []; 
      let jumpers = [];
      let checkpoints = [];
      let lastCheckpoint = new THREE.Vector3(0, 10, 0); 
loader.load('world.glb', (gltf) => {
    scene.add(gltf.scene);
    gltf.scene.position.set(0, 3, 0);
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
        
    });
       
});
function teleportPlayerIfOob() {
    if (camera.position.y <= 1) {
        playerCollider.start.copy(lastCheckpoint).add(new THREE.Vector3(0, 0.35, 0));
        playerCollider.end.copy(lastCheckpoint).add(new THREE.Vector3(0, 1, 0));
        camera.position.copy(playerCollider.end);
    }
}

// const stats = new Stats();
// document.body.appendChild(stats.dom);

      function animate() {
        // stats.begin();
    const deltaTime = Math.min(0.05, clock.getDelta()) / STEPS_PER_FRAME;

    for (let i = 0; i < STEPS_PER_FRAME; i++) {
      updateSpheres(deltaTime);
      updatePlayer(deltaTime);
        controls(deltaTime);
       
        teleportPlayerIfOob();
        JumperCollision();
        JumperCollisionG();
        Checkpoint();     
    }
    renderer.render(scene, camera);
    // stats.end();
}
  
 