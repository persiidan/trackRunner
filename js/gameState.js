class GameState {
    constructor() {
        this.state = GAME_STATES.MENU;
        this.score = 0;
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.gameSpeed = 5;
        this.isPaused = false;

        // Bind event listeners
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    // State management
    setState(newState) {
        this.state = newState;
        this.updateUI();
        if (newState === GAME_STATES.MENU) {
            this.updateHighScoreDisplay();
        }
    }

    updateUI() {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });

        // Hide all overlays
        document.querySelectorAll('.overlay').forEach(overlay => {
            overlay.classList.add('hidden');
        });

        // Show appropriate screen based on state
        switch (this.state) {
            case GAME_STATES.MENU:
                document.getElementById('menuScreen').classList.remove('hidden');
                break;
            case GAME_STATES.PLAYING:
            case GAME_STATES.PAUSED:
                document.getElementById('gameScreen').classList.remove('hidden');
                if (this.state === GAME_STATES.PAUSED) {
                    document.getElementById('pauseOverlay').classList.remove('hidden');
                }
                break;
            case GAME_STATES.COUNTDOWN:
                document.getElementById('gameScreen').classList.remove('hidden');
                document.getElementById('countdownOverlay').classList.remove('hidden');
                break;
        }
    }

    // Input handling
    handleKeyDown(event) {
        if (this.state !== GAME_STATES.PLAYING) return;

        switch (event.key.toLowerCase()) {
            case 'p':
                this.togglePause();
                break;
        }
    }

    handleKeyUp(event) {
        // Handle key up events if needed
    }

    // Game loop timing
    updateDeltaTime(currentTime) {
        this.deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;
        return this.deltaTime;
    }

    // Pause handling
    togglePause() {
        if (this.state === GAME_STATES.PLAYING) {
            this.setState(GAME_STATES.PAUSED);
            this.isPaused = true;
        } else if (this.state === GAME_STATES.PAUSED) {
            this.setState(GAME_STATES.PLAYING);
            this.isPaused = false;
        }
    }

    // Score management
    updateScore(newScore) {
        this.score = newScore;
        document.getElementById('currentScore').textContent = formatScore(this.score);
    }

    saveScore(score, playerName) {
        let scores = this.getScores();
        // Find existing player or create new entry
        let playerEntry = scores.find(entry => entry.name === playerName);
        if (playerEntry) {
            // Update if this is a better score
            if (score > playerEntry.score) {
                playerEntry.score = score;
            }
        } else {
            // Add new player
            scores.push({ name: playerName, score: score });
        }
        // Sort by score and keep top 5 unique names
        scores.sort((a, b) => b.score - a.score);
        // Remove duplicate names, keep only best score per name
        const uniqueScores = [];
        const seenNames = new Set();
        for (const entry of scores) {
            if (!seenNames.has(entry.name)) {
                uniqueScores.push(entry);
                seenNames.add(entry.name);
            }
            if (uniqueScores.length >= 5) break;
        }
        localStorage.setItem('trackRunnerScores', JSON.stringify(uniqueScores));
    }

    getScores() {
        return JSON.parse(localStorage.getItem('trackRunnerScores')) || [];
    }

    showGameOverScreen(finalScore) {
        // Always show name input, not just for high scores
        this.showNameInput(finalScore);
    }

    showNameInput(finalScore) {
        document.getElementById('playerNameModal').classList.add('show');
        document.getElementById('submitScore').onclick = () => {
            const playerName = document.getElementById('playerNameInput').value.trim();
            if (playerName) {
                this.saveScore(finalScore, playerName);
                document.getElementById('playerNameModal').classList.remove('show');
                this.updateHighScoreDisplay();
                document.getElementById('scoreboardModal').classList.add('show');
            }
        };
        document.getElementById('dontSaveScore').onclick = () => {
            document.getElementById('playerNameModal').classList.remove('show');
        };
    }

    updateHighScoreDisplay() {
        const scores = this.getScores();
        const highScoreValue = document.getElementById('highScoreValue');
        const highScorePlayer = document.getElementById('highScorePlayer');
        if (scores.length > 0) {
            const topScore = scores[0];
            highScoreValue.textContent = formatScore(topScore.score);
            highScorePlayer.textContent = topScore.name;
        } else {
            highScoreValue.textContent = '0';
            highScorePlayer.textContent = '-';
        }
        // Update scoreboard modal
        const scoresList = document.getElementById('scoresList');
        if (scoresList) {
            scoresList.innerHTML = '';
            scores.forEach((entry, i) => {
                scoresList.innerHTML += `<div><span>${i+1}. ${entry.name}</span><span>${formatScore(entry.score)}</span></div>`;
            });
        }
    }

    // Game speed
    updateGameSpeed() {
        this.gameSpeed = calculateGameSpeed(this.score);
    }

    reset() {
        this.score = 0;
        this.gameSpeed = 5;
        this.isPaused = false;
        this.updateScore(0);
    }

    // Get current score without resetting
    getCurrentScore() {
        return this.score;
    }
} 