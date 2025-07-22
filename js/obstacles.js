class Obstacle {
    constructor(scene, type, lane) {
        this.scene = scene;
        this.type = type;
        this.lane = lane;

        // Track dimensions (matching game.js)
        this.laneCount = 3;
        this.trackWidth = 10;
        this.laneWidth = this.trackWidth / this.laneCount;
        
        // Set dimensions and properties based on type
        this.setupObstacleProperties();
        
        // Position in center of lane (except yellow barrier which is centered on track)
        if (this.type === OBSTACLE_TYPES.OVERHEAD_BARRIER) {
            this.x = 0; // Center of entire track for multi-lane barrier
        } else {
            this.x = -this.trackWidth / 2 + (lane + 0.5) * this.laneWidth; // Center of specific lane
        }
        this.y = this.height / 2;
        this.z = -50;

        // Create 3D mesh
        this.createMesh();
    }

    setupObstacleProperties() {
        switch (this.type) {
            case OBSTACLE_TYPES.TALL_HURDLE:
                this.width = this.laneWidth * 0.6; // Narrower crossbar
                this.height = 2.5;
                this.crossbarHeight = 1.5; // Lowered from 1.5 to 1.2
                this.crossbarThickness = 0.2;
                this.color = 0xd32f2f; // Red crossbar
                this.postColor = 0x000000; // Black posts
                break;
            case OBSTACLE_TYPES.SMALL_HURDLE:
                this.width = this.laneWidth * 0.6;
                this.height = 1.5;
                this.crossbarHeight = 0.4;
                this.crossbarThickness = 0.2; // Increased from 0.2 to 0.3
                this.color = 0x1976d2; // Blue crossbar
                this.postColor = 0x000000; // Black posts
                break;
            case OBSTACLE_TYPES.OVERHEAD_BARRIER:
                this.width = this.trackWidth * 0.9; // Spans all lanes
                this.height = 0.8;
                this.barrierHeight = 0.4;
                this.color = 0xffeb3b; // Yellow
                this.postColor = 0x000000; // Black posts
                break;
        }
    }

    createMesh() {
        this.mesh = new THREE.Group();
        
        if (this.type === OBSTACLE_TYPES.TALL_HURDLE || this.type === OBSTACLE_TYPES.SMALL_HURDLE) {
            this.createHurdleMesh();
        } else if (this.type === OBSTACLE_TYPES.OVERHEAD_BARRIER) {
            this.createBarrierMesh();
        }
        
        this.mesh.position.set(this.x, this.y, this.z);
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);
    }

    createHurdleMesh() {
        // Create posts - positioned on the white lane lines within this lane
        const postWidth = 0.08;
        const postHeight = this.height - 0.1;
        const postGeometry = new THREE.BoxGeometry(postWidth, postHeight, postWidth);
        const postMaterial = new THREE.MeshLambertMaterial({ color: this.postColor });
        
        const leftPost = new THREE.Mesh(postGeometry, postMaterial);
        const rightPost = new THREE.Mesh(postGeometry, postMaterial);
        
        // Position posts on the lane lines within this specific lane
        // For side lanes, we need to ensure posts stay within lane boundaries
        const laneLeftEdge = -this.laneWidth / 2;
        const laneRightEdge = this.laneWidth / 2;
        
        // Adjust post positions to stay within lane boundaries
        leftPost.position.set(laneLeftEdge + postWidth / 2, 0, 0);
        rightPost.position.set(laneRightEdge - postWidth / 2, 0, 0);
        
        this.mesh.add(leftPost);
        this.mesh.add(rightPost);
        
        // Create crossbar - spans between the posts within this lane
        const crossbarWidth = this.laneWidth - postWidth;
        const barGeometry = new THREE.BoxGeometry(crossbarWidth, this.crossbarThickness, 0.2);
        const barMaterial = new THREE.MeshLambertMaterial({ color: this.color });
        const crossbar = new THREE.Mesh(barGeometry, barMaterial);
        crossbar.position.set(0, this.crossbarHeight - this.height / 2, 0);
        this.mesh.add(crossbar);
        
        // Create base - spans the full lane width
        const baseGeometry = new THREE.BoxGeometry(this.laneWidth, 0.1, 0.2);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(0, -this.height / 2 + 0.05, 0);
        this.mesh.add(base);
    }

    createBarrierMesh() {
        // Create a line of boxes across all three lanes
        const boxCount = 5; // Number of boxes across the width
        const boxWidth = this.width / boxCount;
        const boxHeight = this.barrierHeight;
        
        for (let i = 0; i < boxCount; i++) {
            const boxGeometry = new THREE.BoxGeometry(boxWidth * 0.9, boxHeight, 0.3);
            const boxMaterial = new THREE.MeshLambertMaterial({ color: this.color });
            const box = new THREE.Mesh(boxGeometry, boxMaterial);
            
            const x = (i - boxCount / 2 + 0.5) * boxWidth;
            box.position.set(x, 0, 0);
            
            this.mesh.add(box);
        }
        
        // Add black posts at the edges
        const postGeometry = new THREE.BoxGeometry(0.12, boxHeight + 0.1, 0.12);
        const postMaterial = new THREE.MeshLambertMaterial({ color: this.postColor });
        
        const leftPost = new THREE.Mesh(postGeometry, postMaterial);
        const rightPost = new THREE.Mesh(postGeometry, postMaterial);
        
        leftPost.position.set(-this.width / 2 + 0.06, 0, 0);
        rightPost.position.set(this.width / 2 - 0.06, 0, 0);
        
        this.mesh.add(leftPost);
        this.mesh.add(rightPost);
    }

    update(gameSpeed) {
        this.z += gameSpeed * 0.1;
        this.mesh.position.z = this.z;
    }

    getHitbox() {
        // Return hitbox that matches the crossbar/barrier exactly
        if (this.type === OBSTACLE_TYPES.TALL_HURDLE || this.type === OBSTACLE_TYPES.SMALL_HURDLE) {
            // Make crossbar hitbox match the visual crossbar exactly
            const crossbarWidth = this.laneWidth - 0.08; // Exact width between posts
            
            return {
                x: this.x - crossbarWidth / 2,
                y: this.crossbarHeight, // Crossbar is at exact height
                width: crossbarWidth,
                height: this.crossbarThickness // Exact height of crossbar
            };
        } else if (this.type === OBSTACLE_TYPES.OVERHEAD_BARRIER) {
            // The entire barrier spanning all lanes
            return {
                x: this.x - this.width / 2,
                y: this.barrierHeight, // Barrier is at exact height
                width: this.width,
                height: this.barrierHeight // Exact height of barrier
            };
        }
        
        // Fallback
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    isOffScreen() {
        return this.z > 10;
    }

    remove() {
        this.scene.remove(this.mesh);
    }
}

class ObstacleManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.obstacles = [];
        this.baseSpawnDistance = 400; // Starting interval
        this.minSpawnDistance = 200;  // Minimum interval (max difficulty)
        this.difficultyIncrease = 0.5; // Rate of difficulty increase
        this.nextSpawnDistance = this.baseSpawnDistance;
        this.spawnZ = -50;
    }

    update(gameSpeed, deltaTime) {
        // Update existing obstacles
        this.obstacles.forEach(obstacle => obstacle.update(gameSpeed));

        // Remove off-screen obstacles
        this.obstacles = this.obstacles.filter(obstacle => {
            if (obstacle.isOffScreen()) {
                obstacle.remove();
                return false;
            }
            return true;
        });

        // Spawn new obstacles
        this.nextSpawnDistance -= gameSpeed;
        if (this.nextSpawnDistance <= 0) {
            this.spawnObstacle();
            // Progressive difficulty: reduce spawn distance over time
            this.baseSpawnDistance = Math.max(this.baseSpawnDistance, 70); // Never below 70
            const currentDifficulty = Math.max(
                this.minSpawnDistance,
                this.baseSpawnDistance - (gameSpeed * this.difficultyIncrease)
            );
            this.nextSpawnDistance = currentDifficulty + getRandomInt(0, 50);
        }
    }

    spawnObstacle() {
        const type = getRandomObstacleType();
        let lane;
        // Debug logging
        console.log(`Spawning obstacle type: ${type}`);
        // Yellow barrier must spawn in middle lane to span all lanes
        if (type === OBSTACLE_TYPES.OVERHEAD_BARRIER) {
            lane = 1; // Middle lane
        } else {
            lane = getRandomLane(); // Random lane for other obstacles
        }
        const obstacle = new Obstacle(this.scene, type, lane);
        // Debug: log hitbox right after creation
        const hitbox = obstacle.getHitbox();
        console.log(`Obstacle hitbox for type ${type}:`, hitbox);
        this.obstacles.push(obstacle);
    }

    checkCollision(playerHitbox) {
        for (const obstacle of this.obstacles) {
            // Check obstacles that are very close to the player (precise collision)
            // Player is at z=0, check obstacles in range -0.3 to 0.3
            if (obstacle.z > -0.3 && obstacle.z < 0.3) {
                const obstacleHitbox = obstacle.getHitbox();
                if (checkCollision(playerHitbox, obstacleHitbox)) {
                    let reason = "Hit an obstacle";
                    switch (obstacle.type) {
                        case OBSTACLE_TYPES.TALL_HURDLE:
                            reason = "Tall hurdle - should have slid under it";
                            break;
                        case OBSTACLE_TYPES.SMALL_HURDLE:
                            reason = "Small hurdle - should have jumped over it";
                            break;
                        case OBSTACLE_TYPES.OVERHEAD_BARRIER:
                            reason = "Overhead barrier - should have slid under it";
                            break;
                    }
                    return { collision: true, reason: reason };
                }
            }
        }
        return { collision: false, reason: "" };
    }

    reset() {
        this.obstacles.forEach(obstacle => obstacle.remove());
        this.obstacles = [];
        this.nextSpawnDistance = this.minSpawnDistance;
    }
} 