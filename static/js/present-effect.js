/**
 * PresentEffect - Creates the motion trails and text rain effect for the Present panel
 */
class PresentEffect {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Canvas dimensions
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Frame history for trails
        this.frameHistory = [];
        this.maxHistory = 24;
        
        // Motion trails
        this.trailPoints = [];
        this.maxTrailPoints = 800;
        
        // Prism distortion
        this.prisms = [];
        this.maxPrisms = 8;
        this.prismChangeTime = 0;
        this.prismChangeDuration = 5000;
        
        // Text rain
        this.textRainChars = [];
        this.textMessage = "Are we Human?";
        this.maxTextChars = 100;
        
        // Animation timing
        this.time = 0;
        this.lastFrameTime = 0;
        
        // Color palettes for trails
        this.trailColors = [
            '#FF2D00', '#FF9500', '#FFFF00', 
            '#00FF00', '#00FFFF', '#0066FF', 
            '#CC00FF', '#FF00FF', '#FF0066'
        ];
        
        // Exact prism colors based on the reference image
        this.prismColors = [
            [255, 105, 180],  // Hot pink
            [210, 60, 150],   // Pink/magenta
            [130, 60, 200],   // Purple
            [70, 90, 210],    // Deep blue
            [30, 170, 200],   // Light blue/cyan
            [0, 200, 170],    // Teal/turquoise
            [100, 200, 80],   // Green
            [230, 230, 30],   // Yellow
            [255, 150, 0],    // Orange
            [255, 50, 50],    // Red
            [180, 120, 240],  // Lavender
            [20, 230, 150],   // Mint
            [0, 130, 255],    // Azure
            [70, 240, 240],   // Electric blue
            [255, 80, 80]     // Coral
        ];
        
        // Initialize
        this.initialize();
    }
    
    // Set canvas dimensions
    setDimensions(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Reinitialize text rain with new dimensions
        this.initTextRain();
    }
    
    // Initialize the effect
    initialize() {
        // Initialize text rain
        this.initTextRain();
        this.initPrismDistortion();
        this.trailColors = [
            '#FF0000', '#FF6600', '#FFCC00', // Red to yellow
            '#00FF00', '#00FFCC', '#00CCFF', // Green to blue
            '#0066FF', '#CC00FF', '#FF00CC'  // Blue to magenta
        ];
    }
    
    initPrismDistortion() {
        this.prisms = [];
        
        // Create a grid of triangles that covers the entire canvas with better top coverage
        const rows = 8;
        const cols = 8;
        
        // Calculate triangle dimensions to evenly cover the canvas
        const cellWidth = this.width / cols;
        const cellHeight = this.height / rows;
        
        // Create the grid of triangles
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Create center coordinates for this cell
                const centerX = col * cellWidth + cellWidth / 2;
                const centerY = row * cellHeight + cellHeight / 2;
                
                // Add extra triangles near the top of the canvas
                const isTopRegion = row < 2;
                const extraTriangles = isTopRegion ? 2 : 1; // Add more triangles at the top
                
                for (let extra = 0; extra < extraTriangles; extra++) {
                    // Create two triangles per cell position
                    // 1. Upward facing triangle
                    const upTriangle = this.createPrism();
                    
                    // Add slight variation to position for more natural distribution
                    const offsetX = (Math.random() - 0.5) * cellWidth * 0.3;
                    const offsetY = (Math.random() - 0.5) * cellHeight * 0.3;
                    
                    upTriangle.x = centerX + offsetX;
                    upTriangle.y = centerY + offsetY;
                    upTriangle.width = cellWidth * 1.3; // Larger to ensure overlap
                    upTriangle.height = cellHeight * 1.3;
                    
                    // Define vertices for upward triangle
                    upTriangle.vertices = [
                        { x: 0, y: -upTriangle.height/2 },                // Top
                        { x: -upTriangle.width/2, y: upTriangle.height/2 }, // Bottom left
                        { x: upTriangle.width/2, y: upTriangle.height/2 }   // Bottom right
                    ];
                    
                    // Add slight rotation variation
                    upTriangle.rotation = (Math.random() - 0.5) * 0.2; // Small random rotation
                    upTriangle.depth = 10 + (row + col) % 3 * 5; // Varied depth by position
                    
                    // 2. Downward facing triangle
                    const downTriangle = this.createPrism();
                    
                    // Add different variation to position
                    const offsetX2 = (Math.random() - 0.5) * cellWidth * 0.3;
                    const offsetY2 = (Math.random() - 0.5) * cellHeight * 0.3;
                    
                    downTriangle.x = centerX + cellWidth / 2 + offsetX2;
                    downTriangle.y = centerY + cellHeight / 2 + offsetY2;
                    downTriangle.width = cellWidth * 1.3;
                    downTriangle.height = cellHeight * 1.3;
                    
                    // Define vertices for downward triangle
                    downTriangle.vertices = [
                        { x: 0, y: downTriangle.height/2 },                  // Bottom
                        { x: -downTriangle.width/2, y: -downTriangle.height/2 }, // Top left
                        { x: downTriangle.width/2, y: -downTriangle.height/2 }   // Top right
                    ];
                    
                    downTriangle.rotation = Math.PI + (Math.random() - 0.5) * 0.2; // ~ 180° with variation
                    downTriangle.depth = 15 + (row + col) % 3 * 5; // Different depth pattern
                    
                    // Add both triangles to the prisms array
                    this.prisms.push(upTriangle);
                    this.prisms.push(downTriangle);
                }
            }
        }
        
        // Randomize color offsets to create varied color patterns
        this.prisms.forEach(prism => {
            prism.colorOffset = Math.random() * this.prismColors.length;
            prism.opacity = 0.35 + Math.random() * 0.2;
            prism.targetOpacity = 0.4 + Math.random() * 0.2;
        });
        
        this.prismChangeTime = Date.now();
        this.prismChangeDuration = 5000; // 5 seconds between color effect changes
    }
    
    
      
    createPrism() {
        // Base size for the triangle
        const size = Math.min(this.width, this.height) * (0.2 + Math.random() * 0.2);
        
        return {
            x: 0, // Will be set in initPrismDistortion
            y: 0, // Will be set in initPrismDistortion
            width: size,
            height: size,
            rotation: Math.random() * Math.PI * 2, // Random rotation
            distortion: 0.2 + Math.random() * 0.3,
            refraction: 1.5 + Math.random() * 0.5,
            dispersion: 1.0 + Math.random() * 2.0,
            animSpeed: 0.1 + Math.random() * 0.3, // Increased animation speed
            movementFactor: 0, // No movement
            opacity: 0.5,
            targetOpacity: 0.6 + Math.random() * 0.3,
            colorOffset: Math.random() * 6,
            age: 0,
            isTriangular: true, // Always triangular
            depth: 10 + Math.random() * 25, // 3D depth factor
            // Triangle vertices will be set when size is finalized
            vertices: [],
            // New distortion properties
            waveAmplitude: Math.random() * 0.04, // Wave distortion amplitude
            waveFrequency: 1 + Math.random() * 2, // Wave frequency
            chromaticAberration: 0.5 + Math.random() * 1.5, // Color separation
            edgeGlow: 0.3 + Math.random() * 0.7 // Edge glow intensity
        };
    }
      
      // Update prism distortion
      updatePrismDistortion(audioLevel, deltaTime) {
        const now = Date.now();
        
        // Occasionally update color effects (no position changes)
        if (now - this.prismChangeTime > this.prismChangeDuration) {
            // Update color and distortion properties only
            this.prisms.forEach(prism => {
                // New visual properties
                prism.distortion = 0.1 + Math.random() * 0.5; // Increased range
                prism.refraction = 1.2 + Math.random() * 0.8; // Increased range
                prism.dispersion = 0.8 + Math.random() * 2.0; // Increased range
                
                // Ensure colors rotate by shifting the offset
                prism.colorOffset = (prism.colorOffset + 3 + Math.random() * 4) % this.prismColors.length;
                
                prism.waveAmplitude = Math.random() * 0.06; // Randomize wave distortion
                prism.waveFrequency = 1 + Math.random() * 3; // Randomize wave frequency
                prism.chromaticAberration = 0.5 + Math.random() * 2.0; // Randomize color separation
                
                // Set color rotation speed
                prism.colorRotationSpeed = 0.01 + Math.random() * 0.03;
            });
            
            this.prismChangeTime = now;
        }
        
        // Update animation of all prisms
        for (const prism of this.prisms) {
            prism.age += deltaTime / 1000;
            
            // Continuously rotate color offset for dynamic effect
            prism.colorOffset = (prism.colorOffset + prism.colorRotationSpeed * (deltaTime / 16.67)) % this.prismColors.length;
            
            // More pronounced wave-based distortion
            const timeEffect = Math.sin(prism.age * prism.animSpeed) * 0.08; // Increased amplitude
            prism.distortion = Math.max(0.05, prism.distortion + timeEffect);
            
            // Add secondary oscillation for more complex movement
            const secondaryWave = Math.cos(prism.age * prism.animSpeed * 1.7) * 0.05;
            
            // Apply to refraction for visual effect
            prism.refraction = Math.max(1.1, prism.refraction + secondaryWave);
            
            // Subtle depth oscillation
            const depthBase = prism.depth > 15 ? 15 : 10; // Preserve the base depth
            const depthVariation = Math.sin(prism.age * 0.3) * 3; // Increased variation
            prism.depth = depthBase + depthVariation;
            
            // Oscillate edge glow for more dynamic effect
            prism.edgeGlow = 0.3 + 0.4 * Math.sin(prism.age * 0.5);
            
            // Apply audio reactivity to distortion properties
            if (audioLevel > 0.3) { // Lower threshold to be more responsive
                const audioBoost = (audioLevel - 0.3) * 1.4; // Normalized to 0-1 range
                
                // Amplify distortion based on audio
                prism.distortion *= (1 + audioBoost * 0.6);
                prism.dispersion *= (1 + audioBoost * 0.5);
                prism.depth += audioBoost * 7; // More pronounced depth change
                prism.waveAmplitude += audioBoost * 0.04; // Increased wave distortion
                prism.chromaticAberration += audioBoost * 1.0; // Increased color separation
                prism.edgeGlow += audioBoost * 0.5; // Increase edge glow with audio
                
                // Speed up color rotation with audio
                prism.colorOffset += audioBoost * 0.2;
            }
        }
    }
      
      // Apply prism distortion to the image
      applyPrismDistortion(imageData) {
        // Exit early if no image data
        if (!imageData || !imageData.data) return;
        
        // Create temporary canvas for the original image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.width;
        tempCanvas.height = this.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw original image to temporary canvas
        const imgData = new ImageData(
            new Uint8ClampedArray(imageData.data),
            imageData.width,
            imageData.height
        );
        tempCtx.putImageData(imgData, 0, 0);
        
        // Draw the base image
        this.ctx.drawImage(tempCanvas, 0, 0);
        
        // Apply each triangular prism effect
        for (const prism of this.prisms) {
            try {
                this.ctx.save();
                
                // Set blending mode for light effect
                this.ctx.globalCompositeOperation = 'screen';
                this.ctx.globalAlpha = prism.opacity;
                
                // Move to center of prism
                this.ctx.translate(prism.x, prism.y);
                this.ctx.rotate(prism.rotation);
                
                // Get prism vertices
                const vertices = prism.vertices;
                
                // Create a gradient background for the prism - this creates the spectral effect
                const gradient = this.ctx.createLinearGradient(
                    -prism.width/2, 0,
                    prism.width/2, 0
                );
                
                // Add all colors from the palette for a rainbow effect
                for (let i = 0; i < this.prismColors.length; i++) {
                    const color = this.prismColors[i];
                    const position = i / (this.prismColors.length - 1);
                    gradient.addColorStop(position, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.7)`);
                }
                
                // Update this part of the applyPrismDistortion method in present-effect.js
                // Replace the chromaticAberration code block with this:

                // Replace the chromaticAberration code block with this safer version:
                if (prism.chromaticAberration > 0.1) {
                    // Draw RGB shifted versions with lower opacity
                    const shiftAmount = prism.chromaticAberration * 3; // Pixel shift amount
                    
                    // Make sure we have valid colors to work with
                    let r = 180, g = 80, b = 255; // Default magenta-ish if no color available
                    
                    // Safely get a color from the prism colors array
                    if (this.prismColors && this.prismColors.length > 0) {
                        // Get color index based on prism's current colorOffset
                        const colorIndex = Math.floor(prism.colorOffset) % this.prismColors.length;
                        const color = this.prismColors[colorIndex];
                        
                        // Check if the color array is valid and has expected components
                        if (color && Array.isArray(color) && color.length >= 3) {
                            r = color[0];
                            g = color[1];
                            b = color[2];
                        }
                    }
                    
                    // Red channel shifted left
                    this.ctx.save();
                    this.ctx.globalAlpha = 0.5;
                    this.ctx.globalCompositeOperation = 'screen';
                    this.ctx.fillStyle = `rgba(${r}, ${g * 0.3}, ${b * 0.3}, 0.4)`;
                    this.ctx.translate(-shiftAmount, 0);
                    this.ctx.beginPath();
                    this.ctx.moveTo(vertices[0].x, vertices[0].y);
                    this.ctx.lineTo(vertices[1].x, vertices[1].y);
                    this.ctx.lineTo(vertices[2].x, vertices[2].y);
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.restore();
                    
                    // Green channel in center
                    this.ctx.save();
                    this.ctx.globalAlpha = 0.5;
                    this.ctx.globalCompositeOperation = 'screen';
                    this.ctx.fillStyle = `rgba(${r * 0.3}, ${g}, ${b * 0.3}, 0.4)`;
                    this.ctx.beginPath();
                    this.ctx.moveTo(vertices[0].x, vertices[0].y);
                    this.ctx.lineTo(vertices[1].x, vertices[1].y);
                    this.ctx.lineTo(vertices[2].x, vertices[2].y);
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.restore();
                    
                    // Blue channel shifted right
                    this.ctx.save();
                    this.ctx.globalAlpha = 0.5;
                    this.ctx.globalCompositeOperation = 'screen';
                    this.ctx.fillStyle = `rgba(${r * 0.3}, ${g * 0.3}, ${b}, 0.4)`;
                    this.ctx.translate(shiftAmount, 0);
                    this.ctx.beginPath();
                    this.ctx.moveTo(vertices[0].x, vertices[0].y);
                    this.ctx.lineTo(vertices[1].x, vertices[1].y);
                    this.ctx.lineTo(vertices[2].x, vertices[2].y);
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.restore();
                }
                
                // Apply wave distortion to edges
                if (prism.waveAmplitude > 0.01) {
                    const time = prism.age * prism.waveFrequency;
                    const waveOffset = prism.waveAmplitude * Math.sin(time) * prism.width;
                    
                    this.ctx.save();
                    this.ctx.globalCompositeOperation = 'screen';
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    
                    // Draw wavy path along each edge
                    for (let i = 0; i < 3; i++) {
                        const start = vertices[i];
                        const end = vertices[(i + 1) % 3];
                        const steps = 10; // Segments for the wavy line
                        
                        this.ctx.moveTo(start.x, start.y);
                        
                        for (let step = 1; step <= steps; step++) {
                            const t = step / steps;
                            const x = start.x * (1 - t) + end.x * t;
                            const y = start.y * (1 - t) + end.y * t;
                            
                            // Add perpendicular wave displacement
                            const dx = end.x - start.x;
                            const dy = end.y - start.y;
                            const length = Math.sqrt(dx*dx + dy*dy);
                            
                            if (length > 0) {
                                // Calculate perpendicular direction
                                const nx = -dy / length;
                                const ny = dx / length;
                                
                                // Apply wave
                                const wave = waveOffset * Math.sin(t * Math.PI * 3 + time);
                                this.ctx.lineTo(x + nx * wave, y + ny * wave);
                            } else {
                                this.ctx.lineTo(x, y);
                            }
                        }
                    }
                    
                    this.ctx.closePath();
                    this.ctx.stroke();
                    this.ctx.restore();
                }
                
                // Enhance edge glow based on edgeGlow property
                if (prism.edgeGlow > 0.1) {
                    this.ctx.save();
                    this.ctx.globalCompositeOperation = 'screen';
                    this.ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
                    this.ctx.shadowBlur = prism.edgeGlow * 15;
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                    this.ctx.lineWidth = 1.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(vertices[0].x, vertices[0].y);
                    this.ctx.lineTo(vertices[1].x, vertices[1].y);
                    this.ctx.lineTo(vertices[2].x, vertices[2].y);
                    this.ctx.closePath();
                    this.ctx.stroke();
                    this.ctx.restore();
                }
                
                this.ctx.restore();
            } catch (error) {
                console.error("Error drawing triangular prism:", error);
            }
        }
    }
    
    distortWebcamFeed(imageData) {
        if (!imageData || !imageData.data) return null;
        
        // Create a temporary canvas for manipulation
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.width;
        tempCanvas.height = this.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw original image to temporary canvas
        const imgData = new ImageData(
            new Uint8ClampedArray(imageData.data),
            imageData.width,
            imageData.height
        );
        tempCtx.putImageData(imgData, 0, 0);
        
        // Create a distorted version
        const distortedCanvas = document.createElement('canvas');
        distortedCanvas.width = this.width;
        distortedCanvas.height = this.height;
        const distortedCtx = distortedCanvas.getContext('2d');
        
        // First, draw the original image
        distortedCtx.drawImage(tempCanvas, 0, 0);
        
        // Apply prism-based lens distortion effects
        for (const prism of this.prisms) {
            // Skip if prism is not very visible
            if (prism.opacity < 0.2) continue;
            
            // Calculate prism properties
            const centerX = prism.x;
            const centerY = prism.y;
            const radius = Math.max(prism.width, prism.height) / 2;
            
            // Adjust area to process (add margin for distortion effects)
            const margin = radius * 0.5;
            const x = Math.floor(centerX - radius - margin);
            const y = Math.floor(centerY - radius - margin);
            const width = Math.ceil(radius * 2 + margin * 2);
            const height = Math.ceil(radius * 2 + margin * 2);
            
            // Skip if outside canvas
            if (x < 0 || y < 0 || x + width > this.width || y + height > this.height) {
                continue;
            }
            
            try {
                // Get the area to distort
                const areaData = tempCtx.getImageData(x, y, width, height);
                const data = areaData.data;
                const distortedData = new Uint8ClampedArray(data.length);
                
                // Process each pixel
                for (let py = 0; py < height; py++) {
                    for (let px = 0; px < width; px++) {
                        // Calculate position relative to prism center
                        const dx = (px + x) - centerX;
                        const dy = (py + y) - centerY;
                        
                        // Calculate distance and angle from center
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const angle = Math.atan2(dy, dx);
                        
                        // Apply lens distortion effects
                        if (distance <= radius * 1.2) {
                            // Calculate distortion strength (barrel or pincushion)
                            // Use sine wave based on prism age for subtle animation
                            const timeWave = Math.sin(prism.age * prism.animSpeed * 0.5);
                            const distortionStrength = prism.distortion * (1 + timeWave * 0.3);
                            
                            // Calculate lens effect (barrel distortion)
                            // Varies with distance from center - stronger toward edges
                            let distortionFactor;
                            if (distance < radius * 0.2) {
                                // Less distortion near center
                                distortionFactor = distance * distortionStrength * 0.2;
                            } else {
                                // Stronger distortion near edges with smooth transition
                                const normalized = (distance - radius * 0.2) / (radius - radius * 0.2);
                                distortionFactor = distance * distortionStrength * (0.2 + normalized * 1.5);
                            }
                            
                            // Calculate new position with distortion
                            // For convex lens (magnification at center, compression at edges)
                            const distanceFactor = 1.0 + distortionFactor * (1.0 - distance / radius);
                            
                            // Apply distorted position
                            const srcX = Math.floor(centerX + dx * distanceFactor) - x;
                            const srcY = Math.floor(centerY + dy * distanceFactor) - y;
                            
                            // Get indices for pixel mapping
                            const i = (py * width + px) * 4;
                            
                            // Check if source coordinates are within bounds
                            if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
                                const srcIdx = (srcY * width + srcX) * 4;
                                
                                // Copy pixel data
                                distortedData[i] = data[srcIdx];
                                distortedData[i + 1] = data[srcIdx + 1];
                                distortedData[i + 2] = data[srcIdx + 2];
                                distortedData[i + 3] = data[srcIdx + 3];
                            } else {
                                // For out-of-bounds pixels, use original data
                                distortedData[i] = data[i];
                                distortedData[i + 1] = data[i + 1];
                                distortedData[i + 2] = data[i + 2];
                                distortedData[i + 3] = data[i + 3];
                            }
                        } else {
                            // Outside lens area - just copy original data
                            const idx = (py * width + px) * 4;
                            distortedData[idx] = data[idx];
                            distortedData[idx + 1] = data[idx + 1];
                            distortedData[idx + 2] = data[idx + 2];
                            distortedData[idx + 3] = data[idx + 3];
                        }
                    }
                }
                
                // Put the distorted image data back
                const distortedImageData = new ImageData(distortedData, width, height);
                distortedCtx.putImageData(distortedImageData, x, y);
                
                // Add subtle highlight to show prism edge
                distortedCtx.save();
                distortedCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                distortedCtx.lineWidth = 2;
                distortedCtx.beginPath();
                
                // Draw outline based on prism type
                if (prism.isTriangular) {
                    // Draw triangle
                    const vertices = prism.vertices || [
                        { x: centerX, y: centerY - radius },
                        { x: centerX - radius, y: centerY + radius },
                        { x: centerX + radius, y: centerY + radius }
                    ];
                    
                    distortedCtx.moveTo(vertices[0].x, vertices[0].y);
                    distortedCtx.lineTo(vertices[1].x, vertices[1].y);
                    distortedCtx.lineTo(vertices[2].x, vertices[2].y);
                    distortedCtx.closePath();
                } else {
                    // Draw circle
                    distortedCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                }
                
                distortedCtx.stroke();
                distortedCtx.restore();
                
            } catch (error) {
                console.error("Error in lens distortion:", error);
            }
        }
        
        return distortedCanvas;
    }
      
      
    // Initialize text rain characters
    initTextRain() {
        this.textRainChars = [];
        
        // Generate characters from text message
        const chars = this.textMessage.split('');
        
        // Create multiple copies to reach max chars
        while (this.textRainChars.length < this.maxTextChars) {
            chars.forEach(char => {
                if (this.textRainChars.length < this.maxTextChars) {
                    this.textRainChars.push({
                        char: char,
                        x: Math.random() * this.width,
                        y: Math.random() * -this.height, // Start above the canvas
                        speed: Math.random() * 4 + 2,
                        size: Math.random() * 0.3 + 0.7,
                        angle: 0,
                        velocityX: 0,
                        lastCollision: 0,
                        color: '#000000', // Changed to black from cyan
                        trickling: false
                    });
                }
            });
        }
    }
    
    // Add a frame to the history
    addFrameToHistory(imageData, bodyData) {
        // Create a frame data object
        const frameData = {
            timestamp: Date.now(),
            landmarks: bodyData && bodyData.landmarks ? bodyData.landmarks : [],
            mask: null
        };
        
        // Add to history
        this.frameHistory.push(frameData);
        
        // Keep only recent frames
        while (this.frameHistory.length > this.maxHistory) {
            this.frameHistory.shift();
        }
        
        // Process landmark motion for trails
        this.processMotionTrails(bodyData);
    }
    
    // Process motion trails from landmarks
    processMotionTrails(bodyData) {
        if (!bodyData || !bodyData.landmarks) return;
        
        const now = Date.now();
        
        // Keep a reasonable number of points
        this.maxTrailPoints = 1000;
        
        // Track hands and key points
        bodyData.landmarks.forEach(landmark => {
            if (landmark && landmark.visibility > 0.3) { // Only visible landmarks
                // Define point type
                let pointType;
                if ([15, 16, 17, 18, 19, 20, 21, 22].includes(landmark.index)) {
                    pointType = 'hands'; // Hands and wrists
                } else if ([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(landmark.index)) {
                    pointType = 'head'; // Head
                } else {
                    pointType = 'body'; // Body
                }
                
                const x = landmark.x * this.width;
                const y = landmark.y * this.height;
                
                // Add point for trail, but NO visible circles
                this.trailPoints.push({
                    x,
                    y,
                    timestamp: now,
                    index: landmark.index,
                    type: pointType,
                    opacity: 0.7 // Lower opacity
                });
            }
        });
        
        // Limit the number of trail points
        if (this.trailPoints.length > this.maxTrailPoints) {
            this.trailPoints.sort((a, b) => a.timestamp - b.timestamp);
            this.trailPoints = this.trailPoints.slice(this.trailPoints.length - this.maxTrailPoints);
        }
    }
    
    // Get a random color for trails
    getRandomTrailColor() {
        return this.trailColors[Math.floor(Math.random() * this.trailColors.length)];
    }
    
    // Draw motion trails with glow effect
    drawMotionTrails() {
        const now = Date.now();
        
        // Only consider recent points for trails
        const recentPoints = this.trailPoints.filter(point => 
            (now - point.timestamp) < 800 // Only show last 0.8 seconds
        );
        
        // Group points by landmark index
        const groupedPoints = {};
        
        recentPoints.forEach(point => {
            if (!groupedPoints[point.index]) {
                groupedPoints[point.index] = [];
            }
            groupedPoints[point.index].push(point);
        });
        
        // Sort each group by timestamp
        Object.keys(groupedPoints).forEach(key => {
            groupedPoints[key].sort((a, b) => a.timestamp - b.timestamp);
        });
        
        // Draw trails for each group
        Object.values(groupedPoints).forEach(points => {
            if (points.length < 3) return;
            
            // Create gradient trail
            const startPoint = points[0];
            const endPoint = points[points.length-1];
            const pointType = points[0].type || 'body';
            
            try {
                // Create gradient for the trail
                const gradient = this.ctx.createLinearGradient(
                    startPoint.x, startPoint.y,
                    endPoint.x, endPoint.y
                );
                
                // Colors that contrast with prism colors for better visibility
                let trailBaseColor;
                switch(pointType) {
                    case 'hands':
                        // Use bright yellow (contrast to most prism colors)
                        trailBaseColor = [255, 255, 0];
                        break;
                    case 'head':
                        // Use bright white/blue (contrast to magenta/pink prisms)
                        trailBaseColor = [200, 255, 255];
                        break;
                    default:
                        // Use bright green (contrast to purple/blue prisms)
                        trailBaseColor = [0, 255, 150];
                }
                
                // Create gradient with contrasting colors
                gradient.addColorStop(0, `rgba(${trailBaseColor[0]}, ${trailBaseColor[1]}, ${trailBaseColor[2]}, 0.1)`);
                gradient.addColorStop(0.5, `rgba(${trailBaseColor[0]}, ${trailBaseColor[1]}, ${trailBaseColor[2]}, 0.4)`);
                gradient.addColorStop(1, `rgba(${trailBaseColor[0]}, ${trailBaseColor[1]}, ${trailBaseColor[2]}, 0.7)`);
                
                // Set up drawing style
                this.ctx.strokeStyle = gradient;
                this.ctx.lineWidth = 12; // Wide line for blur effect
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                
                // Draw path
                this.ctx.beginPath();
                this.ctx.moveTo(points[0].x, points[0].y);
                
                // Curve through points
                for (let i = 1; i < points.length - 1; i++) {
                    const xc = (points[i].x + points[i+1].x) / 2;
                    const yc = (points[i].y + points[i+1].y) / 2;
                    this.ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
                }
                
                // Add last point
                this.ctx.lineTo(points[points.length-1].x, points[points.length-1].y);
                
                // Draw with blur for glow effect
                this.ctx.save();
                this.ctx.filter = 'blur(8px)';
                this.ctx.globalAlpha = 0.6;
                this.ctx.stroke();
                this.ctx.restore();
                
                // Draw the main stroke (thinner)
                this.ctx.lineWidth = 3;
                this.ctx.globalAlpha = 0.7;
                this.ctx.stroke();
                this.ctx.globalAlpha = 1.0;
                
            } catch (error) {
                console.error('Error drawing motion trail:', error);
            }
        });
    }
    
    // Update text rain characters
    // In present-effect.js, replace the updateTextRain method:
    updateTextRain(bodyData, audioLevel, deltaTime) {
        const updatedChars = [];
        const currentTime = Date.now();
        
        // Add new characters at the top if we need more
        while (this.textRainChars.length < this.maxTextChars) {
          this.textRainChars.push({
            char: this.textMessage[Math.floor(Math.random() * this.textMessage.length)],
            x: Math.random() * this.width,
            y: -Math.random() * 50, // Start above the screen
            speed: 2 + Math.random() * 3,
            size: 0.7 + Math.random() * 0.3,
            angle: 0,
            velocityX: 0,
            lastCollision: 0,
            color: '#FFFFFF', // Start with white
            prismaticColor: false, // Flag for prismatic coloring
            trickling: false
          });
        }
        
        // Get landmarks for collision detection
        let landmarks = [];
        if (bodyData && bodyData.is_person_detected && bodyData.landmarks) {
          landmarks = bodyData.landmarks.filter(lm => lm.visibility > 0.5);
        }
        
        for (const charData of this.textRainChars) {
          // Get properties
          const { char, x, y, size, speed, velocityX, lastCollision, trickling, color, prismaticColor } = charData;
          
          // Move downward at consistent rate regardless of framerate
          const timeScale = deltaTime / 16.67; // Normalize to 60fps
          const newY = y + speed * timeScale;
          const newX = x + (velocityX * timeScale);
          
          // Check if character hits person
          let collision = false;
          let finalY = newY;
          let finalX = newX;
          let newSpeed = speed;
          let newVelocityX = velocityX;
          let newTrickling = trickling;
          let newColor = color;
          let newPrismaticColor = prismaticColor;
          
          // Check if character intersects with a prism
          let prismIntersection = false;
          for (const prism of this.prisms) {
            // Skip if not visible
            if (prism.opacity <= 0) continue;
            
            // Convert char position to prism coordinates
            const prismCenterX = prism.x + prism.width/2;
            const prismCenterY = prism.y + prism.height/2;
            const relX = x - prismCenterX;
            const relY = newY - prismCenterY;
            
            // Apply rotation to check intersection
            const cosRot = Math.cos(-prism.rotation);
            const sinRot = Math.sin(-prism.rotation);
            const rotX = relX * cosRot - relY * sinRot;
            const rotY = relX * sinRot + relY * cosRot;
            
            // Check if point is inside prism
            const isInside = prism.isTriangular ? 
              (Math.abs(rotX) < prism.width/2 && rotY > -prism.height/2 && rotY < prism.height/2 && 
               Math.abs(rotX) < (prism.height/2 - rotY) * (prism.width/prism.height)) :
              (Math.abs(rotX) < prism.width/2 && Math.abs(rotY) < prism.height/2);
            
            if (isInside) {
              prismIntersection = true;
              
              // Calculate color based on position within prism
              const colorIndex = Math.floor((rotX + prism.width/2) / prism.width * this.prismColors.length);
              const clampedIndex = Math.max(0, Math.min(this.prismColors.length-1, colorIndex));
              const prismColor = this.prismColors[clampedIndex];
              
              // Set color based on prism
              newColor = `rgb(${prismColor[0]}, ${prismColor[1]}, ${prismColor[2]})`;
              newPrismaticColor = true;
              break;
            }
          }
          
          // Check for collision with the person (using landmarks)
          if (landmarks.length > 0) {
            // For each character, check against landmarks
            for (const lm of landmarks) {
              const lmX = lm.x * this.width;
              const lmY = lm.y * this.height;
              
              const collisionRadius = 40;
              const dist = Math.sqrt((x - lmX) ** 2 + (newY - lmY) ** 2);
              
              if (dist < collisionRadius) {
                collision = true;
                
                // Calculate trickle direction
                const dx = x - lmX;
                const dy = newY - lmY;
                const angle = Math.atan2(dy, dx);
                
                // Set velocities
                newVelocityX = Math.cos(angle) * (2 + audioLevel * 2);
                newSpeed = Math.max(0.5, Math.sin(angle) * (1 + audioLevel));
                
                // Set to trickling state
                newTrickling = true;
                
                // UPDATED: Change to YELLOW when hitting person (from the reference image)
                newColor = '#FFE000'; // Bright yellow
                newPrismaticColor = false;
                
                break;
              }
            }
          }
          
          // If not intersecting with prism or body and not trickling, use white
          if (!prismIntersection && !collision && !newTrickling && !newPrismaticColor) {
            newColor = '#FFFFFF';
          }
          
          // If character is trickling
          if (newTrickling) {
            finalX = newX;
            finalY = newY;
            
            // Gradually slow down sideways movement
            newVelocityX = velocityX * 0.97;
          }
          
          // Reset if character goes off screen
          if (finalY > this.height || finalX < 0 || finalX > this.width) {
            finalY = -Math.random() * 50;
            finalX = Math.random() * this.width;
            newSpeed = 2 + Math.random() * 3;
            newVelocityX = 0;
            newTrickling = false;
            newColor = '#FFFFFF';
            newPrismaticColor = false;
          }
          
          // Add updated character
          updatedChars.push({
            char,
            x: finalX,
            y: finalY,
            speed: newSpeed,
            size,
            angle: 0,
            velocityX: newVelocityX,
            lastCollision: collision ? currentTime : lastCollision,
            color: newColor,
            prismaticColor: newPrismaticColor,
            trickling: newTrickling
          });
        }
        
        this.textRainChars = updatedChars;
      }

// Also, update the drawTextRain method to enhance trail visibility:
drawTextRain() {
    this.ctx.textAlign = 'center';
    
    for (const charData of this.textRainChars) {
        const { char, x, y, size, color, trickling, velocityX, speed } = charData;
        
        // Skip if outside canvas
        if (y < 0 || y > this.height || x < 0 || x > this.width) continue;
        
        // Set font size
        const fontSize = Math.floor(18 * size);
        this.ctx.font = `bold ${fontSize}px monospace`; // Added bold
        
        // Set color
        this.ctx.fillStyle = color;
        
        // Draw character
        this.ctx.fillText(char, x, y);
        
        // Add trailing effect for trickling characters
        if (trickling && (Math.abs(velocityX) > 0.3 || Math.abs(speed) > 0.5)) {
            // Determine trail length based on speed
            const trailLength = Math.min(10, Math.max(3, Math.abs(Math.floor(velocityX * 2 + speed)))); // Increased from 5
            
            for (let i = 1; i <= trailLength; i++) {
                // Calculate trail position (previous position)
                const trailX = x - velocityX * i * 0.8;
                const trailY = y - speed * i * 0.5;
                
                // Skip if outside frame
                if (trailX < 0 || trailX >= this.width || trailY < 0 || trailY >= this.height) {
                    continue;
                }
                
                // Calculate trail color (fading)
                const fade = (trailLength - i) / trailLength;
                
                // Draw trail character
                this.ctx.globalAlpha = fade * 0.8; // Increased from 0.6
                this.ctx.font = `bold ${Math.floor(fontSize * fade)}px monospace`; // Added bold
                this.ctx.fillStyle = color;
                this.ctx.fillText(char, trailX, trailY);
            }
            
            this.ctx.globalAlpha = 1.0;
        }
    }
}
    
    // Convert image to grayscale
    convertToGrayscale(imageData) {
        // Create a temporary canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.width;
        tempCanvas.height = this.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Create ImageData from the data array
        const imgData = new ImageData(
            new Uint8ClampedArray(imageData.data),
            imageData.width,
            imageData.height
        );
        
        // Apply grayscale effect
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg;     // R
            data[i + 1] = avg; // G
            data[i + 2] = avg; // B
            // Keep alpha (data[i + 3]) as is
        }
        
        // Put the modified image data back
        tempCtx.putImageData(imgData, 0, 0);
        
        return tempCanvas;
    }
    
    // Add timestamp display
    addTimestamp() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour12: false });
        
        // Make timestamp more visible with these changes
        this.ctx.font = '16px monospace'; // Increased from 12px
        this.ctx.fillStyle = '#FFFFFF'; // Pure white
        this.ctx.textAlign = 'center'; // Center alignment
        this.ctx.shadowColor = 'black'; // Add shadow for contrast
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
        
        // Position at bottom center instead of bottom right
        this.ctx.fillText(timeString, this.width / 2, this.height - 20);
        
        // Reset shadow
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }
    // Replace the current mirror shard implementation with this more precise version

    

    // Update the effect
    update(imageData, bodyData, audioLevel, deltaTime) {
        // Clear canvas with black background
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Update prism distortion first
        this.updatePrismDistortion(audioLevel, deltaTime);
        
        // Apply prism-based distortion to the webcam feed
        if (imageData && imageData.data) {
            // Use the distortWebcamFeed method to apply prism distortion effects
            const distortedCanvas = this.distortWebcamFeed(imageData);
            
            if (distortedCanvas) {
                // Draw the distorted canvas to main canvas
                this.ctx.drawImage(distortedCanvas, 10, 10);
            } else {
                // Fallback to original image if distortion fails
                const imgData = new ImageData(
                    new Uint8ClampedArray(imageData.data),
                    imageData.width,
                    imageData.height
                );
                this.ctx.putImageData(imgData, 10, 10);
            }
        }
        
        // Apply prism effects on top
        this.applyPrismDistortion(imageData);
        
        // Continue with other effects
        this.addFrameToHistory(imageData, bodyData);
        this.drawMotionTrails();
        this.updateTextRain(bodyData, audioLevel, deltaTime);
        this.drawTextRain();
        this.addTimestamp();
    }
}