class Player {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        // Position and dimensions
        this.width = 1;
        this.height = 2;
        this.lane = LANES.MIDDLE;
        this.laneCount = 3;
        this.trackWidth = 10;
        this.laneWidth = this.trackWidth / this.laneCount;
        this.x = -this.trackWidth / 2 + (this.lane + 0.5) * this.laneWidth; // Center of lane
        this.y = -0.5; // Height above ground (adjusted for lower track)
        this.z = 0; // Z position (player stays at origin)
        this.baseY = this.y;

        // Movement
        this.targetX = this.x;
        this.moveSpeed = 0.15;
        this.maxJumpHeight = 3;
        this.jumpHeight = 0;
        this.jumpProgress = 0;
        this.slideProgress = 0;
        this.jumpChargeTime = 0;
        this.maxJumpChargeTime = 0.3;
        this.jumpVelocity = 0;

        // State
        this.state = PLAYER_STATES.RUNNING;
        this.isMoving = false;
        
        // Animation
        this.runFrame = 0;
        this.runAnimationSpeed = 0.2;
        this.lastRunFrame = 0;

        // Input handling
        this.keys = {
            a: false,
            d: false,
            w: false,
            s: false
        };

        // Create 3D player object
        this.createPlayerMesh();

        // Bind event listeners
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    createPlayerMesh() {
        // Create player geometry
        const geometry = new THREE.BoxGeometry(this.width, this.height, 0.5);
        const material = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.x, this.y, this.z);
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);

        // Create head
        const headGeometry = new THREE.BoxGeometry(0.8, 1, 0.5);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xecf0f1 });
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.set(0, this.height / 2 + 0.5, 0);
        this.mesh.add(this.head);

        // Create arms
        const armGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.3);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
        this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
        this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
        this.leftArm.position.set(-0.8, 0.5, 0);
        this.rightArm.position.set(0.8, 0.5, 0);
        this.mesh.add(this.leftArm);
        this.mesh.add(this.rightArm);

        // Create legs
        const legGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.3);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x34495e });
        this.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.leftLeg.position.set(-0.3, -this.height / 2 - 0.4, 0);
        this.rightLeg.position.set(0.3, -this.height / 2 - 0.4, 0);
        this.mesh.add(this.leftLeg);
        this.mesh.add(this.rightLeg);

        // Add shadow under the runner
        const shadowGeometry = new THREE.CircleGeometry(0.6, 8);
        const shadowMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x000000, 
            transparent: true, 
            opacity: 0.3 
        });
        this.shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
        this.shadow.rotation.x = -Math.PI / 2;
        this.shadow.position.set(this.x, -1.48, this.z);
        this.scene.add(this.shadow);
    }

    handleKeyDown(event) {
        if (event.repeat) return;

        switch (event.key.toLowerCase()) {
            case 'a':
                if (!this.keys.a && this.lane > 0) {
                    this.lane--;
                    this.targetX = -this.trackWidth / 2 + (this.lane + 0.5) * this.laneWidth;
                }
                this.keys.a = true;
                break;
            case 'd':
                if (!this.keys.d && this.lane < 2) {
                    this.lane++;
                    this.targetX = -this.trackWidth / 2 + (this.lane + 0.5) * this.laneWidth;
                }
                this.keys.d = true;
                break;
            case 'w':
                if (!this.keys.w && this.state === PLAYER_STATES.RUNNING) {
                    this.state = PLAYER_STATES.JUMPING;
                    this.jumpProgress = 0;
                    this.jumpChargeTime = 0;
                    this.jumpVelocity = 300; // Simpler jump velocity
                    this.jumpHeight = 3.0; // Fixed jump height
                }
                this.keys.w = true;
                break;
            case 's':
                if (!this.keys.s && this.state === PLAYER_STATES.RUNNING) {
                    this.state = PLAYER_STATES.SLIDING;
                    this.slideProgress = 0;
                }
                this.keys.s = true;
                break;
        }
    }

    handleKeyUp(event) {
        switch (event.key.toLowerCase()) {
            case 'a':
                this.keys.a = false;
                break;
            case 'd':
                this.keys.d = false;
                break;
            case 'w':
                this.keys.w = false;
                break;
            case 's':
                this.keys.s = false;
                break;
        }
    }

    update(deltaTime) {
        // Handle lane movement
        this.x = lerp(this.x, this.targetX, this.moveSpeed);
        this.mesh.position.x = this.x;
        this.shadow.position.x = this.x; // Update shadow position

        // Handle jumping with physics
        if (this.state === PLAYER_STATES.JUMPING) {
            // Simple jump with fixed duration
            this.jumpProgress += deltaTime * 2; // 2 seconds total jump time
            
            if (this.jumpProgress < 1) {
                // Going up - use sine wave for smooth arc
                const jumpArc = Math.sin(this.jumpProgress * Math.PI);
                this.y = this.baseY + this.jumpHeight * jumpArc;
                this.mesh.position.y = this.y;
                
                // Simple jump animation
                this.leftArm.rotation.z = -0.3;
                this.rightArm.rotation.z = 0.3;
            } else {
                // Jump complete - return to running
                this.y = this.baseY;
                this.mesh.position.y = this.y;
                this.state = PLAYER_STATES.RUNNING;
                this.jumpProgress = 0;
                this.jumpChargeTime = 0;
                this.jumpVelocity = 0;
                
                // Reset arm positions
                this.leftArm.rotation.z = 0;
                this.rightArm.rotation.z = 0;
            }
        }

        // Handle sliding
        if (this.state === PLAYER_STATES.SLIDING) {
            this.slideProgress += deltaTime * 1.5;
            if (this.slideProgress >= 1) {
                this.state = PLAYER_STATES.RUNNING;
                this.mesh.scale.y = 1;
                // Reset arm and leg positions
                this.leftArm.rotation.z = 0;
                this.rightArm.rotation.z = 0;
                this.leftLeg.rotation.z = 0;
                this.rightLeg.rotation.z = 0;
            } else {
                // Sliding animation - crouch down and extend arms forward
                this.mesh.scale.y = 0.6; // Crouch down
                this.leftArm.rotation.z = -1.2; // Extend arms forward
                this.rightArm.rotation.z = 1.2;
                this.leftLeg.rotation.z = 0.3; // Bend legs
                this.rightLeg.rotation.z = -0.3;
            }
        }

        // Update running animation
        if (this.state === PLAYER_STATES.RUNNING) {
            this.lastRunFrame += deltaTime * this.runAnimationSpeed;
            this.runFrame = Math.floor(this.lastRunFrame % 2);
            
            // Animate arms and legs with more natural movement
            const armOffset = this.runFrame === 0 ? -0.3 : 0.3;
            const legOffset = this.runFrame === 0 ? -0.3 : 0.3;
            
            this.leftArm.rotation.z = armOffset;
            this.rightArm.rotation.z = -armOffset;
            this.leftLeg.rotation.z = legOffset;
            this.rightLeg.rotation.z = -legOffset;
        }
    }

    getHitbox() {
        // Use constants if available, else fallback
        const standingHeight = 3.8;
        const slidingHeight = 2.0;
        let hitboxWidth = 1.0;
        let hitboxHeight = standingHeight;

        if (this.state === PLAYER_STATES.SLIDING) {
            hitboxHeight = slidingHeight;
        } else if (this.state === PLAYER_STATES.JUMPING) {
            hitboxHeight = standingHeight;
        }

        // Visual alignment: y = this.y - 0.2 (previous logic)
        const hitbox = {
            x: this.x - hitboxWidth / 2,
            y: this.y - 1.2,
            width: hitboxWidth,
            height: hitboxHeight
        };

        return hitbox;
    }

    reset() {
        this.lane = LANES.MIDDLE;
        this.x = -this.trackWidth / 2 + (this.lane + 0.5) * this.laneWidth;
        this.targetX = this.x;
        this.y = this.baseY;
        this.z = 0;
        this.state = PLAYER_STATES.RUNNING;
        this.jumpHeight = 0;
        this.jumpChargeTime = 0;
        this.jumpVelocity = 0;
        this.keys = { a: false, d: false, w: false, s: false };
        
        // Reset mesh position and scale
        this.mesh.position.set(this.x, this.y, this.z);
        this.mesh.scale.set(1, 1, 1);
        this.shadow.position.set(this.x, -1.48, this.z);
    }
} 