class Game {
    constructor() {
        // Get container and set dimensions
        this.container = document.getElementById('gameContainer');
        this.width = 800;
        this.height = 600;
        
        // Initialize 3D scene
        this.initThreeJS();

        // Initialize components
        this.gameState = new GameState();
        this.player = new Player(this.scene, this.camera);
        this.obstacleManager = new ObstacleManager(this.scene, this.camera);

        // Track
        this.trackOffset = 0;
        this.trackSpeed = 2;
        this.laneWidth = this.width / 3;

        // Dev mode
        this.devModeOverlays = [];
        this.debugInfo = null;

        // Bind event listeners
        window.addEventListener('resize', this.resize.bind(this));
        this.setupEventListeners();

        // Start game loop
        this.animate();
    }

    initThreeJS() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background

        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);
        this.camera.position.set(0, 3, 10); // Lower camera to better see the track
        this.camera.lookAt(0, -1, 0); // Look down more to see the lower track

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Add lighting
        this.setupLighting();

        // Create track
        this.createTrack();
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }

    createTrack() {
        // Create track geometry - make it lower
        const trackWidth = 10; // realistic track width for 3 lanes
        const trackLength = 100;
        const laneCount = 3;
        const laneWidth = trackWidth / laneCount;
        const trackGeometry = new THREE.PlaneGeometry(trackWidth, trackLength);
        const trackMaterial = new THREE.MeshLambertMaterial({ color: 0xff8533 });
        this.track = new THREE.Mesh(trackGeometry, trackMaterial);
        this.track.rotation.x = -Math.PI / 2;
        this.track.position.set(0, -1.5, -50); // Lower the track even more
        this.track.receiveShadow = true;
        this.scene.add(this.track);

        // Create 4 lane markers for 3 lanes (left edge, left lane, right lane, right edge)
        for (let i = 0; i <= laneCount; i++) {
            const x = -trackWidth / 2 + i * laneWidth;
            const laneGeometry = new THREE.PlaneGeometry(0.08, trackLength);
            const laneMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
            const lane = new THREE.Mesh(laneGeometry, laneMaterial);
            lane.rotation.x = -Math.PI / 2;
            lane.position.set(x, -1.49, -50); // Slightly above track surface
            this.scene.add(lane);
        }

        // Optionally add lane numbers at the start
        // (not implemented here, but can be added with textures or sprites)
    }

    resize() {
        // Handle window resize if needed
    }

    setupEventListeners() {
        // Menu buttons
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('scoreboardButton').addEventListener('click', () => {
            document.getElementById('scoreboardModal').classList.add('show');
        });

        document.getElementById('closeScoreboard').addEventListener('click', () => {
            document.getElementById('scoreboardModal').classList.remove('show');
        });

        // Pause menu buttons
        document.getElementById('resumeButton').addEventListener('click', () => {
            this.gameState.togglePause();
        });

        document.getElementById('quitButton').addEventListener('click', () => {
            this.resetGame(true);
        });

        document.getElementById('pauseButton').addEventListener('click', () => {
            this.gameState.togglePause();
        });

        // Player name input
        document.getElementById('submitScore').addEventListener('click', () => {
            const playerName = document.getElementById('playerNameInput').value.trim();
            if (playerName) {
                const scoreToSave = this.gameState.tempScore || this.gameState.score;
                this.gameState.addHighScoreWithScore(playerName, scoreToSave);
                document.getElementById('playerNameModal').classList.remove('show');
                document.getElementById('scoreboardModal').classList.add('show');
                this.gameState.tempScore = null;
            }
        });

        // Dev mode toggle
        document.addEventListener('keydown', (event) => {
            if (event.key === 'F1') {
                event.preventDefault();
                DEV_MODE = !DEV_MODE;
                console.log(`Dev mode: ${DEV_MODE ? 'ON' : 'OFF'}`);
                this.toggleDevMode();
            }
        });
    }

    toggleDevMode() {
        const indicator = document.getElementById('devModeIndicator');
        if (DEV_MODE) {
            this.createDebugInfo();
            indicator.classList.remove('hidden');
        } else {
            this.removeDebugInfo();
            this.clearHitboxOverlays();
            indicator.classList.add('hidden');
        }
    }

    createDebugInfo() {
        // Create debug info display
        this.debugInfo = document.createElement('div');
        this.debugInfo.id = 'debugInfo';
        this.debugInfo.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            font-family: monospace;
            font-size: 12px;
            border-radius: 5px;
            z-index: 1000;
            pointer-events: none;
        `;
        this.container.appendChild(this.debugInfo);
    }

    removeDebugInfo() {
        if (this.debugInfo) {
            this.debugInfo.remove();
            this.debugInfo = null;
        }
    }

    updateDebugInfo() {
        if (!DEV_MODE || !this.debugInfo) return;

        const playerHitbox = this.player.getHitbox();
        const playerState = this.player.state;
        const playerPos = { x: this.player.x, y: this.player.y, z: this.player.z };

        let info = `
            <div style="margin-bottom: 10px;"><strong>DEV MODE ACTIVE</strong></div>
            <div><strong>Player State:</strong> ${playerState}</div>
            <div><strong>Player Position:</strong> X: ${playerPos.x.toFixed(2)}, Y: ${playerPos.y.toFixed(2)}, Z: ${playerPos.z.toFixed(2)}</div>
            <div><strong>Player Hitbox:</strong> X: ${playerHitbox.x.toFixed(2)}, Y: ${playerHitbox.y.toFixed(2)}, W: ${playerHitbox.width.toFixed(2)}, H: ${playerHitbox.height.toFixed(2)}</div>
            <div><strong>Obstacles Near Player:</strong> ${this.obstacleManager.obstacles.filter(o => o.z > -10 && o.z < 2).length}</div>
        `;

        // Add obstacle info for nearby obstacles
        const nearbyObstacles = this.obstacleManager.obstacles.filter(o => o.z > -10 && o.z < 2);
        if (nearbyObstacles.length > 0) {
            info += '<div style="margin-top: 10px;"><strong>Nearby Obstacles:</strong></div>';
            nearbyObstacles.forEach((obstacle, index) => {
                const hitbox = obstacle.getHitbox();
                info += `<div style="margin-left: 10px;">${index + 1}. ${obstacle.type} - Z: ${obstacle.z.toFixed(2)}, Hitbox: X: ${hitbox.x.toFixed(2)}, Y: ${hitbox.y.toFixed(2)}, W: ${hitbox.width.toFixed(2)}, H: ${hitbox.height.toFixed(2)}</div>`;
            });
        }

        this.debugInfo.innerHTML = info;
    }

    createHitboxOverlay(hitbox, color, label = '') {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute;
            border: 2px solid ${color};
            background: ${color}20;
            pointer-events: none;
            z-index: 999;
            font-size: 10px;
            color: ${color};
            text-align: center;
            font-weight: bold;
        `;
        
        // Convert 3D world coordinates to screen coordinates using Three.js camera projection
        // This gives us the EXACT position of the real hitbox in screen space
        
        // Create vectors for the four corners of the hitbox
        const topLeft = new THREE.Vector3(hitbox.x, hitbox.y + hitbox.height, 0);
        const topRight = new THREE.Vector3(hitbox.x + hitbox.width, hitbox.y + hitbox.height, 0);
        const bottomLeft = new THREE.Vector3(hitbox.x, hitbox.y, 0);
        const bottomRight = new THREE.Vector3(hitbox.x + hitbox.width, hitbox.y, 0);
        
        // Project all corners to screen coordinates
        topLeft.project(this.camera);
        topRight.project(this.camera);
        bottomLeft.project(this.camera);
        bottomRight.project(this.camera);
        
        // Convert normalized device coordinates to screen coordinates
        const screenTopLeft = {
            x: (topLeft.x * 0.5 + 0.5) * this.width,
            y: (topLeft.y * -0.5 + 0.5) * this.height
        };
        const screenTopRight = {
            x: (topRight.x * 0.5 + 0.5) * this.width,
            y: (topRight.y * -0.5 + 0.5) * this.height
        };
        const screenBottomLeft = {
            x: (bottomLeft.x * 0.5 + 0.5) * this.width,
            y: (bottomLeft.y * -0.5 + 0.5) * this.height
        };
        const screenBottomRight = {
            x: (bottomRight.x * 0.5 + 0.5) * this.width,
            y: (bottomRight.y * -0.5 + 0.5) * this.height
        };
        
        // Calculate the bounding box of the projected hitbox
        const minX = Math.min(screenTopLeft.x, screenTopRight.x, screenBottomLeft.x, screenBottomRight.x);
        const maxX = Math.max(screenTopLeft.x, screenTopRight.x, screenBottomLeft.x, screenBottomRight.x);
        const minY = Math.min(screenTopLeft.y, screenTopRight.y, screenBottomLeft.y, screenBottomRight.y);
        const maxY = Math.max(screenTopLeft.y, screenTopRight.y, screenBottomLeft.y, screenBottomRight.y);
        
        const screenWidth = maxX - minX;
        const screenHeight = maxY - minY;
        
        overlay.style.left = `${minX}px`;
        overlay.style.top = `${minY}px`;
        overlay.style.width = `${screenWidth}px`;
        overlay.style.height = `${screenHeight}px`;
        
        if (label) {
            overlay.textContent = label;
        }
        
        this.container.appendChild(overlay);
        this.devModeOverlays.push(overlay);
    }

    clearHitboxOverlays() {
        this.devModeOverlays.forEach(overlay => overlay.remove());
        this.devModeOverlays = [];
    }

    updateHitboxVisualization() {
        if (!DEV_MODE) return;
        
        this.clearHitboxOverlays();
        
        // Draw player hitbox
        const playerHitbox = this.player.getHitbox();
        this.createHitboxOverlay(playerHitbox, '#00ff00', 'PLAYER');
        
        // Draw obstacle hitboxes for nearby obstacles
        const nearbyObstacles = this.obstacleManager.obstacles.filter(o => o.z > -10 && o.z < 2);
        nearbyObstacles.forEach(obstacle => {
            const hitbox = obstacle.getHitbox();
            let color = '#ff0000';
            let label = obstacle.type.toUpperCase();
            
            if (obstacle.type === OBSTACLE_TYPES.SMALL_HURDLE) {
                color = '#0000ff';
            } else if (obstacle.type === OBSTACLE_TYPES.OVERHEAD_BARRIER) {
                color = '#ffff00';
            }
            
            this.createHitboxOverlay(hitbox, color, label);
        });
    }

    startGame() {
        // Reset game elements but don't change state yet
        this.player.reset();
        this.obstacleManager.reset();
        this.trackOffset = 0;
        this.gameState.score = 0;
        this.gameState.gameSpeed = 5;
        this.gameState.updateScore(0);
        
        // Start countdown
        this.gameState.setState(GAME_STATES.COUNTDOWN);
        const countdownElement = document.getElementById('countdown');
        let count = 3;
        countdownElement.textContent = count;
        
        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownElement.textContent = count;
            } else {
                clearInterval(countdownInterval);
                this.gameState.setState(GAME_STATES.PLAYING);
            }
        }, 1000);
    }

    resetGame(returnToMenu = false) {
        this.player.reset();
        this.obstacleManager.reset();
        this.trackOffset = 0;
        this.gameState.score = 0;
        this.gameState.gameSpeed = 5;
        this.gameState.updateScore(0);
        
        if (returnToMenu) {
            this.gameState.setState(GAME_STATES.MENU);
        }
    }

    update(deltaTime) {
        if (this.gameState.state !== GAME_STATES.PLAYING) return;

        // Update game speed
        this.gameState.updateGameSpeed();

        // Update track animation
        this.trackOffset = (this.trackOffset + this.gameState.gameSpeed) % 80;

        // Update player
        this.player.update(deltaTime);

        // Update obstacles
        this.obstacleManager.update(this.gameState.gameSpeed, deltaTime);

        // Check collisions
        const collisionResult = this.obstacleManager.checkCollision(this.player.getHitbox());
        if (collisionResult.collision) {
            this.handleGameOver(collisionResult.reason);
            return;
        }

        // Update score based on distance
        this.gameState.updateScore(Math.floor(this.gameState.score + (this.gameState.gameSpeed * 0.5)));

        // Update dev mode visualization
        if (DEV_MODE) {
            this.updateDebugInfo();
            this.updateHitboxVisualization();
        }
    }

    handleGameOver(reason) {
        const finalScore = this.gameState.getCurrentScore();
        
        if (this.gameState.isHighScore()) {
            this.gameState.tempScore = finalScore;
            document.getElementById('playerNameModal').classList.add('show');
        } else {
            this.showDeathReason(reason, finalScore);
        }
        
        this.resetGame(true);
    }

    showDeathReason(reason, score) {
        const deathOverlay = document.createElement('div');
        deathOverlay.className = 'overlay';
        deathOverlay.innerHTML = `
            <div class="death-menu">
                <h2>Game Over!</h2>
                <p>Reason: ${reason}</p>
                <p>Final Score: ${formatScore(score)}</p>
                <button class="btn" onclick="this.parentElement.parentElement.remove(); location.reload();">Play Again</button>
            </div>
        `;
        document.querySelector('.game-container').appendChild(deathOverlay);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const deltaTime = this.gameState.updateDeltaTime(performance.now());

        // Update and render
        if (!this.gameState.isPaused) {
            this.update(deltaTime);
        }
        
        this.renderer.render(this.scene, this.camera);
    }
} 