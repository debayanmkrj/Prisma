/**
 * Utility functions for the Prisma application
 */

// Configuration settings
const config = {
    // Audio settings
    audio: {
        useSimulation: true,    // Use simulated audio if microphone is unavailable
        simulationSpeed: 0.5,   // Speed of simulated audio changes (0-1)
        simulationAmplitude: 0.7 // Maximum amplitude of simulated audio (0-1)
    },
    
    // Visual settings
    visual: {
        enableBloom: true,      // Enable bloom post-processing
        bloomIntensity: 0.4,    // Bloom intensity (0-1)
        particleCount: {
            past: 8000,         // Number of particles in past effect
            present: 200,       // Number of text characters in present effect
            future: 300         // Number of particles in future effect
        },
        colorPalettes: {
            past: [
                [220, 230, 255],  // Light blue
                [180, 200, 255],  // Pale blue
                [200, 220, 255],  // Sky blue
                [160, 190, 255],  // Azure
                [140, 170, 240]   // Ice blue
            ],
            present: [
                [0, 255, 220],    // Bright cyan
                [0, 220, 200],    // Medium cyan
                [0, 190, 180],    // Teal
                [0, 160, 160],    // Dark cyan
                [0, 130, 140]     // Deep teal
            ],
            future: [
                [255, 0, 180],    // Magenta
                [220, 0, 200],    // Purple
                [200, 0, 255],    // Violet
                [180, 0, 210],    // Purple-violet
                [150, 0, 240]     // Indigo
            ]
        }
    },
    
    // Animation settings
    animation: {
        transitionDuration: 0.8,  // Duration of transition effects (seconds)
        patternChangeDuration: 30, // Duration between pattern changes (seconds)
        particleSpeed: 0.2,       // Base speed of particles
        textRainSpeed: 3.0        // Base speed of text rain
    },
    
    // Server settings
    server: {
        reconnectInterval: 5000,  // Milliseconds between reconnection attempts
        frameInterval: 2,         // Send every Nth frame to server (for performance)
        regenerationInterval: 30  // Seconds between auto-regenerations
    },
    
    // UI settings
    ui: {
        statusMessageDuration: 5000,  // Duration of status messages (milliseconds)
        showFPS: false               // Show FPS counter
    }
};

/**
 * Generate an RGB color string
 * @param {Array} color RGB color array [r,g,b]
 * @param {Number} alpha Optional alpha value (0-1)
 * @returns {String} CSS color string
 */
function getRgbColor(color, alpha = 1) {
    if (alpha < 1) {
        return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
    } else {
        return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    }
}

/**
 * Linear interpolation between two values
 * @param {Number} a Start value
 * @param {Number} b End value
 * @param {Number} t Interpolation factor (0-1)
 * @returns {Number} Interpolated value
 */
function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Calculate distance between two points
 * @param {Number} x1 First point x
 * @param {Number} y1 First point y
 * @param {Number} x2 Second point x
 * @param {Number} y2 Second point y
 * @returns {Number} Distance
 */
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

/**
 * Clamp a value between min and max
 * @param {Number} value Value to clamp
 * @param {Number} min Minimum value
 * @param {Number} max Maximum value
 * @returns {Number} Clamped value
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Cubic ease-in-out function
 * @param {Number} t Value between 0 and 1
 * @returns {Number} Eased value
 */


/**
 * Random integer between min and max (inclusive)
 * @param {Number} min Minimum value
 * @param {Number} max Maximum value
 * @returns {Number} Random integer
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Check if a point is inside a polygon
 * @param {Number} x Point x
 * @param {Number} y Point y
 * @param {Array} polygon Array of {x, y} points
 * @returns {Boolean} True if point is inside polygon
 */
function isPointInPolygon(x, y, polygon) {
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    
    return inside;
}

/**
 * Format a time value in seconds to MM:SS format
 * @param {Number} seconds Time in seconds
 * @returns {String} Formatted time
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Create a timestamp string
 * @returns {String} Current timestamp in HH:MM:SS
 */
function createTimestamp() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}