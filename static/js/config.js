/**
 * Configuration settings for the Prisma application
 */

const PrismaConfig = {
    // Server settings
    server: {
        url: window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin,
        reconnectInterval: 5000,
        frameInterval: 2,
        imageQuality: 0.7,
        regenerationInterval: 30
    },
    
    // Visual settings for each panel
    past: {
        pointCloud: {
            maxPoints: 8000,
            pointSize: 2,
            connectionThreshold: 30,
            maxConnections: 3000
        },
        depthParticles: {
            count: 150,
            sizeRange: [1, 3],
            speedRange: [0.001, 0.002]
        },
        vitruvianElements: {
            circleColor: 'rgba(255, 255, 255, 0.4)',
            squareColor: 'rgba(255, 255, 255, 0.3)',
            lineColor: 'rgba(255, 255, 255, 0.25)'
        },
        colorPalette: [
            [220, 230, 255],  // Light blue
            [180, 200, 255],  // Pale blue
            [200, 220, 255],  // Sky blue
            [160, 190, 255],  // Azure
            [140, 170, 240]   // Ice blue
        ],
        glowIntensity: 0.4
    },
    
    present: {
        motionTrails: {
            maxHistory: 6,
            handTrailColor: '#00FFE0',
            armTrailColor: '#00DCC0',
            headTrailColor: '#00C0A0',
            otherTrailColor: '#008C80',
            handSize: 15,
            armSize: 10,
            headSize: 12,
            otherSize: 7
        },
        textRain: {
            message: "Are we Human?",
            maxChars: 200,
            sizeRange: [0.7, 1.0],
            speedRange: [2, 6],
            collisionRadius: 15
        },
        colorPalette: [
            [0, 255, 220],    // Bright cyan
            [0, 220, 200],    // Medium cyan
            [0, 190, 180],    // Teal
            [0, 160, 160],    // Dark cyan
            [0, 130, 140]     // Deep teal
        ],
        blurIntensity: 0.6
    },
    
    future: {
        particles: {
            count: 300,
            sizeRange: [1, 4],
            speedRange: [0.1, 0.6]
        },
        parallaxLayers: {
            layerCount: 3,
            parallaxFactor: 0.1,
            speeds: [0.03, 0.02, 0.01]
        },
        patterns: {
            changeDuration: 30,
            gridSize: 40,
            circleCount: 5,
            radialLineCount: 16,
            scanLineSpacing: 30
        },
        colorPalette: [
            [255, 0, 180],    // Magenta
            [220, 0, 200],    // Purple
            [200, 0, 255],    // Violet
            [180, 0, 210],    // Purple-violet
            [150, 0, 240]     // Indigo
        ],
        transition: {
            duration: 0.8,
            glitchIntensity: 0.8
        },
        glowIntensity: 0.5
    },
    
    // Animation and performance settings
    animation: {
        targetFPS: 60,
        minimumFPS: 24,
        adaptiveQuality: true,
        skipFramesOnLowFPS: true,
        skipThreshold: 30
    },
    
    // Audio settings
    audio: {
        useSimulation: true,
        simulationFrequency: 50,  // ms
        simulationBaseLevel: 0.3,
        simulationVariation: 0.2,
        simulationSpikeFrequency: 0.05,
        simulationSpikeIntensity: 0.5
    },
    
    // User interface settings
    ui: {
        statusMessageDuration: 5000,
        controlsOpacity: 0.8,
        showFPS: false,
        keyboardShortcuts: {
            transform: 't',
            toggleAuto: 'a',
            saveImage: 's',
            toggleFocus: 'f',
            focusPast: '1',
            focusPresent: '2',
            focusFuture: '3',
            togglePause: 'p'
        }
    },
    
    // Debug settings (only for development)
    debug: {
        showBodyTracking: false,
        logSocketEvents: false,
        showPerformanceStats: false
    }
};

// Make config available globally
window.PrismaConfig = PrismaConfig;