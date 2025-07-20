// Utility functions for the game

// Constants
const GAME_STATES = {
    MENU: 'menu',
    COUNTDOWN: 'countdown',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

const LANES = {
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2
};

const PLAYER_STATES = {
    RUNNING: 'running',
    JUMPING: 'jumping',
    SLIDING: 'sliding'
};

const OBSTACLE_TYPES = {
    TALL_HURDLE: 'tallHurdle',
    SMALL_HURDLE: 'smallHurdle',
    OVERHEAD_BARRIER: 'overheadBarrier'
};

// Dev mode
let DEV_MODE = false;

// Helper functions
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomLane() {
    return getRandomInt(0, 2);
}

function getRandomObstacleType() {
    const types = Object.values(OBSTACLE_TYPES);
    return types[getRandomInt(0, types.length - 1)];
}

// Collision detection between two rectangles
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Convert lane number to x position
function laneToX(lane, canvasWidth) {
    const laneWidth = canvasWidth / 3;
    return lane * laneWidth;
}

// Lerp function for smooth transitions
function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

// Ease in out function for smooth animations
function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Calculate game speed based on score
function calculateGameSpeed(score) {
    const baseSpeed = 5;
    const maxSpeedIncrease = 10;
    const speedIncrease = Math.min(score / 1000, maxSpeedIncrease);
    return baseSpeed + speedIncrease;
}

// Format score with commas
function formatScore(score) {
    return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
} 