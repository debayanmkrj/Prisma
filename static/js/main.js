// Main JavaScript controller for the Prisma application

// Global variables
let socket; // Socket.io connection
let webcam; // HTML video element
let processingCanvas; // Canvas for processing webcam frames
let processingCtx; // Processing canvas context
let isConnected = false; // Connection status
let isPaused = false; // Pause rendering
let isTransforming = false; // Currently running a transformation
let focusMode = false; // Focus mode status
let focusedPanel = 1; // 0=past, 1=present, 2=future
let focusTransition = 0; // Transition progress (0-1)
let autoRegenerate = true; // Auto regeneration status
let nextRegenerationTime = 30; // Countdown timer
let lastRegenerationTime = Date.now(); // Time of last regeneration
let transformedImage = null; // Latest transformed image
let frameRate = 0; // Current frame rate
let frameCount = 0; // Frame counter
let lastFrameTime = 0; // Time of last frame
let bodyData = null; // Latest body tracking data
let audioAnalyser = null; // Web Audio analyser
let audioData = null; // Audio data
let animationFrameId = null;
const targetFrameRate = 30; // Limit to 30fps
const frameInterval = 1000 / targetFrameRate;
// Panel components
let pastEffect, presentEffect, futureEffect;
let panelTransitions;

const prismaGradient = {
    past: {
        colors: [
            [100, 80, 180],   // Deep purple
            [120, 100, 220],  // Soft purple
            [140, 150, 240],  // Periwinkle
            [160, 180, 255]   // Soft blue
        ],
        currentIndex: 0,
        transitionProgress: 0
    },
    present: {
        colors: [
            [40, 180, 120],   // Soft teal
            [80, 220, 100],   // Green
            [160, 230, 60],   // Lime
            [220, 220, 40]    // Yellow-green
        ],
        currentIndex: 0,
        transitionProgress: 0
    },
    future: {
        colors: [
            [200, 50, 150],   // Hot pink
            [230, 30, 100],   // Bright pink
            [255, 60, 60],    // Red
            [255, 120, 40]    // Orange
        ],
        currentIndex: 0,
        transitionProgress: 0
    },
    
    // Update gradients over time
    update: function(deltaTime) {
        const panels = ['past', 'present', 'future'];
        const transitionSpeed = 0.001 * deltaTime; // Slow color cycling
        
        panels.forEach(panel => {
            const gradient = this[panel];
            gradient.transitionProgress += transitionSpeed;
            
            if (gradient.transitionProgress >= 1.0) {
                gradient.transitionProgress = 0;
                gradient.currentIndex = (gradient.currentIndex + 1) % gradient.colors.length;
            }
        });
    },
    
    // Get current color for a panel with smooth transition
    getColor: function(panel, alpha = 1.0) {
        const gradient = this[panel];
        const current = gradient.colors[gradient.currentIndex];
        const next = gradient.colors[(gradient.currentIndex + 1) % gradient.colors.length];
        const t = gradient.transitionProgress;
        
        // Linear interpolation between colors
        const r = Math.floor(current[0] * (1 - t) + next[0] * t);
        const g = Math.floor(current[1] * (1 - t) + next[1] * t);
        const b = Math.floor(current[2] * (1 - t) + next[2] * t);
        
        if (alpha < 1.0) {
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return `rgb(${r}, ${g}, ${b})`;
    },
    
    // Get RGB array for a panel
    getRGBArray: function(panel) {
        const gradient = this[panel];
        const current = gradient.colors[gradient.currentIndex];
        const next = gradient.colors[(gradient.currentIndex + 1) % gradient.colors.length];
        const t = gradient.transitionProgress;
        
        // Linear interpolation between colors
        const r = Math.floor(current[0] * (1 - t) + next[0] * t);
        const g = Math.floor(current[1] * (1 - t) + next[1] * t);
        const b = Math.floor(current[2] * (1 - t) + next[2] * t);
        
        return [r, g, b];
    }
};

let crossPanelParticles = [];
const maxCrossPanelParticles = 40;

// Initialize cross-panel particles
function initCrossPanelParticles() {
    crossPanelParticles = [];
    for (let i = 0; i < maxCrossPanelParticles; i++) {
        crossPanelParticles.push(createCrossPanelParticle());
    }
}

// Create a new cross-panel particle
function updateCrossPanelParticles(deltaTime) {
    for (let i = 0; i < crossPanelParticles.length; i++) {
        const particle = crossPanelParticles[i];
        
        // Update position
        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;
        
        // Update life
        particle.life += deltaTime;
        
        // Handle panel transitions
        if (particle.x < 0) {
            // Move to left panel
            if (particle.panel > 0) {
                particle.panel--;
                particle.x = 1.0; // Enter from right side
            } else {
                // Wrap around to future panel
                particle.panel = 2;
                particle.x = 1.0;
            }
        } else if (particle.x > 1) {
            // Move to right panel
            if (particle.panel < 2) {
                particle.panel++;
                particle.x = 0.0; // Enter from left side
            } else {
                // Wrap around to past panel
                particle.panel = 0;
                particle.x = 0.0;
            }
        }
        
        // Bounce on top/bottom
        if (particle.y < 0 || particle.y > 1) {
            particle.vy = -particle.vy;
            particle.y = Math.max(0, Math.min(1, particle.y));
        }
        
        // Recreate if expired
        if (particle.life > particle.maxLife) {
            crossPanelParticles[i] = createCrossPanelParticle();
        }
    }
}

function drawCrossPanelParticles(ctx, width, height, panelIndex, audioLevel) {
    const panelParticles = crossPanelParticles.filter(p => p.panel === panelIndex);
    
    // Determine panel name for gradient color
    const panelName = panelIndex === 0 ? 'past' : panelIndex === 1 ? 'present' : 'future';
    
    for (const particle of panelParticles) {
        // Calculate position in actual pixels
        const x = Math.floor(particle.x * width);
        const y = Math.floor(particle.y * height);
        
        // Calculate alpha based on life (fade in and out)
        let alpha = particle.alpha;
        if (particle.life < 30) {
            alpha *= particle.life / 30; // Fade in
        } else if (particle.life > particle.maxLife - 30) {
            alpha *= (particle.maxLife - particle.life) / 30; // Fade out
        }
        
        // Calculate size with audio reactivity
        let size = particle.size;
        if (audioLevel > 0.6) {
            size *= 1 + (audioLevel - 0.6) * 2;
        }
        
        // Draw the particle
        ctx.fillStyle = prismaGradient.getColor(panelName, alpha);
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded - starting initialization');
    initElements();
    initSocket();
    initWebcam();
    initAudio();
    
    // Add event listeners
    document.addEventListener('keydown', handleKeydown);
    
    // Button event listeners
    document.getElementById('transform-btn').addEventListener('click', () => requestTransformation());
    document.getElementById('auto-btn').addEventListener('click', () => toggleAutoRegenerate());
    
    // Start the main loop
    console.log('Starting main loop');
    requestAnimationFrame(mainLoop);
});

// Initialize DOM elements
function initElements() {
    console.log('Initializing elements...');
    
    try {
        // Get HTML elements
        webcam = document.getElementById('webcam');
        processingCanvas = document.getElementById('processing-canvas');
        
        if (!processingCanvas) {
            console.error('Processing canvas not found');
            return;
        }
        
        processingCtx = processingCanvas.getContext('2d', { willReadFrequently: true });
        
        // Set processing canvas size (to match webcam later)
        processingCanvas.width = 640;
        processingCanvas.height = 480;
        
        // Initialize panel effects with error handling
        const pastCanvas = document.getElementById('past-canvas');
        const presentCanvas = document.getElementById('present-canvas');
        const futureCanvas = document.getElementById('future-canvas');
        
        console.log('Canvas elements found:', {
            past: pastCanvas ? 'found' : 'missing',
            present: presentCanvas ? 'found' : 'missing',
            future: futureCanvas ? 'found' : 'missing'
        });
        
        if (!pastCanvas || !presentCanvas || !futureCanvas) {
            console.error('One or more panel canvases not found');
            console.log('Past canvas:', pastCanvas);
            console.log('Present canvas:', presentCanvas);
            console.log('Future canvas:', futureCanvas);
            return;
        }
        
        // Initialize canvas dimensions
        pastCanvas.width = 640;
        pastCanvas.height = 480;
        presentCanvas.width = 640;
        presentCanvas.height = 480;
        futureCanvas.width = 640;
        futureCanvas.height = 480;
        
        console.log('Canvas dimensions set');
        
        // Create effect instances
        try {
            console.log('Creating PastEffect');
            pastEffect = new PastEffect(pastCanvas);
            console.log('PastEffect created');
            
            console.log('Creating PresentEffect');
            presentEffect = new PresentEffect(presentCanvas);
            console.log('PresentEffect created');
            
            console.log('Creating FutureEffect');
            futureEffect = new FutureEffect(futureCanvas);
            console.log('FutureEffect created');
        } catch (err) {
            console.error('Error creating effects:', err);
        }
        try {
            console.log('Creating PanelTransitions');
            // Create a new canvas for transitions
            const transitionCanvas = document.createElement('canvas');
            transitionCanvas.id = 'transition-canvas';
            
            // Match dimensions to the actual panel container, not the window
            const panelsContainer = document.getElementById('panels-container');
            const containerRect = panelsContainer.getBoundingClientRect();
            transitionCanvas.width = containerRect.width;
            transitionCanvas.height = containerRect.height;
            
            // Set more precise positioning
            transitionCanvas.style.position = 'absolute';
            transitionCanvas.style.top = '0';
            transitionCanvas.style.left = '0';
            transitionCanvas.style.pointerEvents = 'none';
            transitionCanvas.style.zIndex = '6'; // Make sure it's above panel contents
            
            // Append to panels container
            panelsContainer.appendChild(transitionCanvas);
            
            // Initialize transitions
            panelTransitions = new PanelTransitions(transitionCanvas);
            console.log('PanelTransitions created');
        } catch (err) {
            console.error('Error creating panel transitions:', err);
        }
        autoRegenerate = true; // Make sure it starts enabled
        updateAutoStatusDisplay();
        
        console.log('Elements initialized successfully');
    } catch (error) {
        console.error('Error initializing elements:', error);
    }
}

// Initialize WebSocket connection
function initSocket() {
    console.log('Connecting to server...');
    
    // Update status
    updateStatus('Connecting to server...');
    
    // Connect to Flask SocketIO
    socket = io();
    
    // Connection event
    socket.on('connect', () => {
        console.log('Connected to server');
        isConnected = true;
        updateStatus('Connected');
    });
    
    // Disconnection event
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        isConnected = false;
        updateStatus('Disconnected', 'error');
    });
    
    // Connection error
    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        isConnected = false;
        updateStatus('Connection error', 'error');
    });
    
    // Tracking results from server
    socket.on('tracking_results', (data) => {
        // Update body data
        bodyData = data;
        console.log('Received tracking data:', bodyData ? 'data present' : 'no data');
    });
    
    // Transformation started
    socket.on('transformation_started', () => {
        console.log('Transformation started');
        isTransforming = true;
        updateStatus('Transforming...', 'processing');
    });
    
    // Transformation result
    socket.on('transformation_result', (data) => {
        console.log('Transformation completed');
        isTransforming = false;
        transformedImage = new Image();
        transformedImage.src = data.image;
        lastRegenerationTime = Date.now();
        updateStatus('Transformation complete');
        
        // Add a transition effect with the new image
        console.log('Starting transition with new image');
        futureEffect.startTransition(transformedImage);
    });
    
    // Transformation error
    socket.on('transformation_error', (data) => {
        console.error('Transformation error:', data.error);
        isTransforming = false;
        updateStatus('Transformation error', 'error');
    });
    
    // Request for a frame to regenerate
    socket.on('request_frame_for_regeneration', () => {
        requestTransformation();
    });
    
    // Regeneration started
    socket.on('regeneration_started', () => {
        console.log('Auto-regeneration started');
        updateStatus('Auto-regenerating...', 'processing');
    });
}

// Initialize webcam
function initWebcam() {
    console.log('Initializing webcam...');
    
    updateStatus('Accessing webcam...');
    
    // Get user media
    navigator.mediaDevices.getUserMedia({
        video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
        }
    })
    .then(stream => {
        console.log('Webcam access granted');
        webcam.srcObject = stream;
        webcam.play();
        webcam.style.transform = 'scaleX(-1)';
        
        // Wait for video to be loaded
        webcam.onloadedmetadata = () => {
            // Update canvas dimensions to match webcam
            processingCanvas.width = webcam.videoWidth;
            processingCanvas.height = webcam.videoHeight;
            
            // Initialize panel canvases with the same dimensions
            console.log('Setting panel dimensions to match webcam');
            pastEffect.setDimensions(webcam.videoWidth, webcam.videoHeight);
            presentEffect.setDimensions(webcam.videoWidth, webcam.videoHeight);
            futureEffect.setDimensions(webcam.videoWidth, webcam.videoHeight);
            
            console.log(`Webcam initialized: ${webcam.videoWidth}x${webcam.videoHeight}`);
            updateStatus('Webcam ready');
        };
    })
    .catch(error => {
        console.error('Error accessing webcam:', error);
        updateStatus('Webcam error', 'error');
    });
}

// Initialize audio analysis
function initAudio() {
    try {
        // Create audio context
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        
        // Create analyser
        audioAnalyser = audioContext.createAnalyser();
        audioAnalyser.fftSize = 256;
        
        // Create buffer for data
        audioData = new Uint8Array(audioAnalyser.frequencyBinCount);
        
        // Get audio from microphone
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                const source = audioContext.createMediaStreamSource(stream);
                source.connect(audioAnalyser);
                console.log('Audio analysis initialized');
            })
            .catch(err => {
                console.warn('Audio input unavailable:', err);
                // Fall back to simulated audio data
                simulateAudioData();
            });
    } catch (e) {
        console.warn('Web Audio API not supported:', e);
        // Fall back to simulated audio data
        simulateAudioData();
    }
}

// Simulate audio data if microphone is unavailable
function simulateAudioData() {
    console.log('Using simulated audio data');
    
    // Create simulated audio data
    audioData = new Uint8Array(128);
    
    // Function to update simulated data
    setInterval(() => {
        // Base level with slow oscillation
        const time = Date.now() / 1000;
        const baseLevel = 0.3 + 0.2 * (0.5 + 0.5 * Math.sin(time * 0.5));
        
        // Add random spikes
        const spike = Math.random() < 0.05 ? Math.random() * 0.5 : 0;
        
        // Calculate level (0-1)
        const level = Math.min(1.0, baseLevel + spike);
        
        // Convert to audio data format (0-255)
        const value = Math.floor(level * 255);
        
        // Fill the array with decreasing values
        for (let i = 0; i < audioData.length; i++) {
            audioData[i] = Math.max(0, value - i * 2);
        }
    }, 50);
}

// Get current audio level (0-1)
function getAudioLevel() {
    if (!audioData) return 0;
    
    // Update audio data if using real analyser
    if (audioAnalyser) {
        audioAnalyser.getByteFrequencyData(audioData);
    }
    
    // Calculate average level
    let sum = 0;
    const sampleSize = Math.min(32, audioData.length);
    
    // Use just the lower-frequency portion which is more relevant for speech/music
    for (let i = 0; i < sampleSize; i++) {
        sum += audioData[i];
    }
    
    // Return normalized value (0-1)
    return sum / (sampleSize * 255);
}

// Main rendering loop
function mainLoop(timestamp) {
    console.log('Main loop running');
    console.log('Webcam state:', webcam ? (webcam.readyState || 'initial') : 'not found');
    
    if (timestamp - lastFrameTime < frameInterval) {
        requestAnimationFrame(mainLoop);
        return;
    }

    
    // Calculate delta time and frame rate
    const deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    
    // Update FPS counter
    frameCount++;
    if (frameCount >= 30) {
        frameRate = 1000 / (deltaTime || 1);
        frameCount = 0;
        adaptiveParticleCount(frameRate);
    
    // Adjust effects quality based on performance
    adjustEffectsQuality(frameRate);
    }
    
    const shouldProcessFrame = throttleFrameProcessing();
  
  // Optimize rendering based on focus mode
  optimizeFocusMode();
    // Skip if paused
    if (!isPaused && webcam && webcam.readyState === 4) { // 4 = HAVE_ENOUGH_DATA
        console.log('Processing frame');
        
        // Draw webcam to processing canvas
        try {
            processingCtx.save();
            processingCtx.translate(processingCanvas.width, 0);
            processingCtx.scale(-1, 1);
            processingCtx.drawImage(webcam, 0, 0);
            processingCtx.restore();
            console.log('Webcam drawn to processing canvas (mirrored)');
        } catch (e) {
            console.error('Error drawing webcam to canvas:', e);

            optimizeCanvasRendering();
        }
        
        // Get frame data
        let imageData = null;
        try {
            imageData = processingCtx.getImageData(0, 0, processingCanvas.width, processingCanvas.height);
            console.log('Image data extracted from processing canvas');
        } catch (e) {
            console.error('Error getting image data:', e);
        }
        
        // Send frame to server for body tracking (throttled)
        if (isConnected && frameCount % 2 === 0) {
            try {
                sendFrameToServer();
                console.log('Frame sent to server');
            } catch (e) {
                console.error('Error sending frame to server:', e);
            }
        }
        
        // Get current audio level
        const audioLevel = getAudioLevel();
        console.log('Audio level:', audioLevel);
        
        // Update countdown timer for auto-regeneration
        if (autoRegenerate && !isTransforming) {
            const elapsed = (Date.now() - lastRegenerationTime) / 1000;
            nextRegenerationTime = Math.max(0, 30 - Math.floor(elapsed));
            updateNextTimeDisplay(nextRegenerationTime);
        }
        
        // Update focus transition if in focus mode
        if (focusMode && focusTransition < 1) {
            focusTransition = Math.min(1, focusTransition + 0.05);
            updatePanelSizes();
        } else if (!focusMode && focusTransition > 0) {
            focusTransition = Math.max(0, focusTransition - 0.05);
            updatePanelSizes();
        }
        prismaGradient.update(deltaTime);
        updateCrossPanelParticles(deltaTime);
        // Update panel effects with shared data
        try {
            console.log('Updating past effect');
            pastEffect.update(imageData, bodyData, audioLevel, deltaTime);
            
            console.log('Updating present effect');
            presentEffect.update(imageData, bodyData, audioLevel, deltaTime);
            
            console.log('Updating future effect');
            futureEffect.update(imageData, bodyData, audioLevel, deltaTime, transformedImage);
            
            console.log('All effects updated');
            
            // Now update transitions AFTER the main panels
            if (panelTransitions) {
                const pastColor = prismaGradient.getRGBArray('past');
                const presentColor = prismaGradient.getRGBArray('present');
                const futureColor = prismaGradient.getRGBArray('future');
                
                const currentAudioLevel = typeof audioLevel !== 'undefined' ? audioLevel : 0;
                panelTransitions.update(deltaTime, pastColor, presentColor, futureColor, currentAudioLevel);
                panelTransitions.draw(pastEffect.canvas, presentEffect.canvas, futureEffect.canvas);
            }
        } catch (e) {
            console.error('Error updating effects:', e);
        }
    } else {
        console.log('Skipping frame - paused or not enough data');
        console.log('Paused:', isPaused);
        console.log('Webcam ready state:', webcam ? webcam.readyState : 'no webcam');
    }
    if (frameCount % 60 === 0) { // Do this check every 60 frames
        // Force emergency rendering to make sure panels are visible
        const pastCtx = pastEffect.canvas.getContext('2d');
        const presentCtx = presentEffect.canvas.getContext('2d');
        const futureCtx = futureEffect.canvas.getContext('2d');
        
        // Draw semi-transparent emergency backgrounds
        pastCtx.fillStyle = 'rgba(100, 50, 20, 0.05)';
        pastCtx.fillRect(0, 0, pastEffect.canvas.width, pastEffect.canvas.height);
        
        presentCtx.fillStyle = 'rgba(20, 100, 50, 0.05)';
        presentCtx.fillRect(0, 0, presentEffect.canvas.width, presentEffect.canvas.height);
        
        futureCtx.fillStyle = 'rgba(80, 20, 100, 0.05)';
        futureCtx.fillRect(0, 0, futureEffect.canvas.width, futureEffect.canvas.height);
    }
    // Continue the loop
    animationFrameId = requestAnimationFrame(mainLoop);
}

// Send current frame to server
function sendFrameToServer() {
    // Get frame from processing canvas
    const dataURL = processingCanvas.toDataURL('image/jpeg', 0.7);
    
    // Send to server
    socket.emit('frame', { image: dataURL });
}

// Request transformation from server
function requestTransformation() {
    if (isConnected && !isTransforming) {
        // Get frame from processing canvas
        const dataURL = processingCanvas.toDataURL('image/jpeg', 0.85);
        
        // Send to server
        socket.emit('transform_request', { image: dataURL });
        
        // Update status
        updateStatus('Requesting transformation...', 'processing');
    }
}

// Toggle auto-regeneration
function toggleAutoRegenerate() {
    autoRegenerate = !autoRegenerate;
    
    // Update server
    socket.emit('toggle_auto_regenerate');
    
    // Update button text
    const autoBtn = document.getElementById('auto-btn');
    if (autoBtn) {
        autoBtn.textContent = autoRegenerate ? 'Pause Transform (P)' : 'Resume Transform (P)';
    }
    
    // Update display
    updateAutoStatusDisplay();
    updateStatus(`Transformation: ${autoRegenerate ? 'Running' : 'Paused'}`);
}

// Toggle focus mode
function toggleFocusMode() {
    focusMode = !focusMode;
    
    // Reset transition
    focusTransition = focusMode ? 0 : 1;
    
    // Update display
    updateStatus(`Focus mode: ${focusMode ? 'ON' : 'OFF'}`);
}
function optimizeFocusMode() {
    if (focusMode) {
      // When in focus mode, only render the focused panel at full quality
      // Other panels can be rendered at lower frequency or quality
      const nonFocusedUpdateFrequency = 5; // Update every 5 frames
      
      if (focusedPanel !== 0 && frameCount % nonFocusedUpdateFrequency !== 0) {
        // Skip past panel update
        pastEffect.skipUpdate = true;
      } else {
        pastEffect.skipUpdate = false;
      }
      
      if (focusedPanel !== 1 && frameCount % nonFocusedUpdateFrequency !== 0) {
        // Skip present panel update
        presentEffect.skipUpdate = true;
      } else {
        presentEffect.skipUpdate = false;
      }
      
      if (focusedPanel !== 2 && frameCount % nonFocusedUpdateFrequency !== 0) {
        // Skip future panel update
        futureEffect.skipUpdate = true;
      } else {
        futureEffect.skipUpdate = false;
      }
    } else {
      // In normal mode, update all panels but potentially with adaptive quality
      pastEffect.skipUpdate = false;
      presentEffect.skipUpdate = false;
      futureEffect.skipUpdate = false;
    }
  }
  
// Save the current transformation
function saveCurrentTransformation() {
    if (transformedImage) {
        // Create a temporary link
        const link = document.createElement('a');
        link.href = transformedImage.src;
        link.download = `prisma_${Date.now()}.jpg`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Update status
        updateStatus('Image saved');
    } else {
        updateStatus('No image to save', 'error');
    }
}

// Update panel sizes based on focus mode
function updatePanelSizes() {
    const panels = document.querySelectorAll('.panel');
    
    if (focusMode) {
        // Calculate sizes based on focused panel
        const focusedSize = 1 + focusTransition * 0.5;
        const unfocusedSize = 1 - focusTransition * 0.25;
        
        panels.forEach((panel, index) => {
            if (index === focusedPanel) {
                panel.style.flex = focusedSize;
            } else {
                panel.style.flex = unfocusedSize;
            }
        });
    } else {
        // Reset to equal sizes
        panels.forEach(panel => {
            panel.style.flex = 1;
        });
    }
}

function throttleFrameProcessing() {
    // Only process every N frames to reduce CPU/GPU load
    const processEveryNFrames = 3; // Adjust based on performance
    
    if (frameCount % processEveryNFrames !== 0) {
      return false; // Skip this frame
    }
    return true; // Process this frame
  }

  function adaptiveParticleCount(currentFPS) {
    const targetFPS = 30;
    const minFPS = 15;
    
    if (currentFPS < minFPS) {
      // Drastically reduce particle counts when FPS is very low
      pastEffect.maxPoints = Math.floor(pastEffect.maxPoints * 0.5);
      pastEffect.maxDepthParticles = Math.floor(pastEffect.maxDepthParticles * 0.5);
      presentEffect.maxTextChars = Math.floor(presentEffect.maxTextChars * 0.6);
      futureEffect.maxParticles = Math.floor(futureEffect.maxParticles * 0.5);
      futureEffect.maxFlowLines = Math.floor(futureEffect.maxFlowLines * 0.5);
    } else if (currentFPS < targetFPS) {
      // Gradually reduce particle counts as FPS drops
      const reduction = (targetFPS - currentFPS) / (targetFPS - minFPS);
      pastEffect.maxPoints = Math.floor(pastEffect.maxPoints * (1 - reduction * 0.3));
      presentEffect.maxTextChars = Math.floor(presentEffect.maxTextChars * (1 - reduction * 0.3));
      futureEffect.maxParticles = Math.floor(futureEffect.maxParticles * (1 - reduction * 0.3));
    } else {
      // If FPS is good, gradually restore particle counts to defaults
      const defaultPastPoints = 3000;
      const defaultPresentChars = 100;
      const defaultFutureParticles = 100;
      
      pastEffect.maxPoints = Math.min(defaultPastPoints, pastEffect.maxPoints + 10);
      presentEffect.maxTextChars = Math.min(defaultPresentChars, presentEffect.maxTextChars + 1);
      futureEffect.maxParticles = Math.min(defaultFutureParticles, futureEffect.maxParticles + 1);
    }
  }
  
  // 3. Optimize canvas rendering
  function optimizeCanvasRendering() {
    // Disable image smoothing for better performance
    pastEffect.ctx.imageSmoothingEnabled = false;
    presentEffect.ctx.imageSmoothingEnabled = false;
    futureEffect.ctx.imageSmoothingEnabled = false;
    
    // Lower resolution under heavy load
    if (frameRate < 15) {
      const scaleFactor = 0.75;
      adaptCanvasResolution(pastEffect.canvas, scaleFactor);
      adaptCanvasResolution(presentEffect.canvas, scaleFactor);
      adaptCanvasResolution(futureEffect.canvas, scaleFactor);
    } else if (frameRate > 25) {
      // Restore resolution if performance is good
      adaptCanvasResolution(pastEffect.canvas, 1.0);
      adaptCanvasResolution(presentEffect.canvas, 1.0);
      adaptCanvasResolution(futureEffect.canvas, 1.0);
    }
  }
  
  function adaptCanvasResolution(canvas, scaleFactor) {
    // Store original size if not already stored
    if (!canvas._originalWidth) {
      canvas._originalWidth = canvas.width;
      canvas._originalHeight = canvas.height;
    }
    
    // Apply scale factor to original dimensions
    canvas.width = Math.floor(canvas._originalWidth * scaleFactor);
    canvas.height = Math.floor(canvas._originalHeight * scaleFactor);
    
    // Scale canvas display size to maintain visual size
    canvas.style.width = canvas._originalWidth + 'px';
    canvas.style.height = canvas._originalHeight + 'px';
  }
  function adjustEffectsQuality(fps) {
    const applyFullEffects = fps > 25;
    const applyMinimalEffects = fps < 15;
    
    // Adjust bloom intensity based on performance
    pastEffect.bloomIntensity = applyMinimalEffects ? 0.1 : (applyFullEffects ? 0.4 : 0.2);
    futureEffect.bloomIntensity = applyMinimalEffects ? 0.2 : (applyFullEffects ? 0.5 : 0.3);
    
    // Skip some visual effects when performance is poor
    pastEffect.skipBloom = applyMinimalEffects;
    futureEffect.skipGlitch = !applyFullEffects;
  }
  
// Handle keyboard events
function handleKeydown(event) {
    switch (event.key.toLowerCase()) {
        case 't':
            requestTransformation();
            break;
        case 'p':
            toggleAutoRegenerate();
            break;
        // Remove cases for 's', 'f', '1', '2', '3'
    }
}

// Update status display
function updateStatus(message, type = 'info') {
    const statusEl = document.getElementById('status-message');
    statusEl.textContent = message;
    statusEl.className = 'status-message';
    statusEl.classList.add(`status-${type}`);
    
    // Clear after 5 seconds if it's not an error
    if (type !== 'error' && type !== 'processing') {
        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'status-message';
        }, 5000);
    }
}

// Update status display elements
function updateStatusDisplay() {
    updateAutoStatusDisplay();
    updateNextTimeDisplay(30);
}

// Update auto status display
function updateAutoStatusDisplay() {
    const autoStatusEl = document.getElementById('auto-status-value');
    autoStatusEl.textContent = autoRegenerate ? 'ON' : 'OFF';
    autoStatusEl.className = autoRegenerate ? 'status-on' : 'status-off';
}

// Update next regeneration time display
function updateNextTimeDisplay(seconds) {
    const nextTimeEl = document.getElementById('next-time-value');
    nextTimeEl.textContent = `${seconds}s`;
    
    // Hide if auto is off
    document.getElementById('next-time').style.display = autoRegenerate ? 'block' : 'none';
}