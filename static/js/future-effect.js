/**
 * FutureEffect - Creates the future visualization with transformed image and prismatic effects
 */
class FutureEffect {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Canvas dimensions
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Transformed image
        this.transformedImage = null;
        this.previousImage = null;
        
        // Transition effects
        this.isTransitioning = false;
        this.transitionStartTime = 0;
        this.transitionDuration = 0.8; // seconds
        
        // Particle system
        this.particles = [];
        this.maxParticles = 100;
        
        // Flow line system
        this.flowLines = [];
        this.maxFlowLines = 120; // More lines but thinner
        this.lastFlowLineTime = 0;
        this.flowLineInterval = 50; // ms between new lines
        
        // Parallax layers
        this.parallaxLayers = [];
        
        // Geometric patterns
        this.patternType = 0;
        this.patternChangeTime = 0;
        this.patternDuration = 30; // Seconds between pattern changes
        
        // Color scheme - magenta/purple palette for future - CRITICAL: Must be defined BEFORE init
        this.colorPalette = [
            [255, 100, 255],  // Pink
            [180, 80, 255],   // Purple
            [140, 200, 255],  // Cyan
            [100, 220, 180],  // Teal
            [200, 120, 255]   // Lavender
        ];
        
        // Animation
        this.time = 0;
        
        // Body data
        this.bodyMask = null;
        this.bodyCenter = { x: this.width / 2, y: this.height / 2 };
        this.lastBodyUpdate = 0;
        
        // Initialize
        this.initialize();
    }
    
    // Set canvas dimensions
    setDimensions(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Reinitialize parallax layers
        this.initParallaxLayers();
    }
    
    // Initialize
    initialize() {
        // Initialize particle system
        this.initParticles();
        
        // Initialize flow lines
        this.initFlowLines();
        
        // Initialize parallax layers - ensure this happens AFTER colorPalette is defined
        this.initParallaxLayers();
    }
    
    // Initialize particles
    initParticles() {
        this.particles = [];
        
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push(this.createParticle());
        }
    }
    
    // Initialize flow lines
    initFlowLines() {
        this.flowLines = [];
        
        // Create initial flow lines
        for (let i = 0; i < this.maxFlowLines / 3; i++) {  // Start with fewer lines
            this.flowLines.push(this.createFlowLine());
        }
    }
    
    // Create a new flow line
    createFlowLine(x, y) {
        // Center coordinates if not specified
        const centerX = this.bodyCenter ? this.bodyCenter.x : this.width / 2;
        const centerY = this.bodyCenter ? this.bodyCenter.y : this.height / 2;
        
        // Random angle from center
        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 100;
        
        // Starting position
        const posX = x !== undefined ? x : centerX + Math.cos(angle) * distance;
        const posY = y !== undefined ? y : centerY + Math.sin(angle) * distance;
        
        // Choose color from palette (safely)
        const colorIndex = Math.floor(Math.random() * this.colorPalette.length);
        const color = this.colorPalette[colorIndex] || [180, 80, 255]; // Default if undefined
        
        // Create flow line
        return {
            startX: posX,
            startY: posY,
            currentX: posX,
            currentY: posY,
            angle: angle,
            length: 0,
            maxLength: 50 + Math.random() * 150,
            segments: [{x: posX, y: posY}], // Track path
            maxSegments: 100,
            width: 0.5 + Math.random() * 1.0, // Thinner lines
            color: color,
            alpha: 0.2 + Math.random() * 0.4, // Lower base opacity
            speed: 0.5 + Math.random() * 1.5,
            curvature: Math.random() * 0.2 - 0.1, // How much it curves
            complete: false,
            createTime: Date.now()
        };
    }
    
    // Create a new particle
    createParticle(x, y) {
        // Random position if not specified
        const posX = x !== undefined ? x : Math.random() * this.width;
        const posY = y !== undefined ? y : Math.random() * this.height;
        
        // Safely choose color from palette
        const colorIndex = Math.floor(Math.random() * this.colorPalette.length);
        const color = this.colorPalette[colorIndex] || [180, 80, 255]; // Default if undefined
        
        return {
            x: posX,
            y: posY,
            size: Math.random() * 2 + 0.5, // Smaller particles
            color: color,
            speed: Math.random() * 0.3 + 0.1,
            angle: Math.random() * Math.PI * 2,
            alpha: Math.random() * 0.3 + 0.1, // Lower opacity
            pulse: Math.random() * 5
        };
    }
    
    // Initialize parallax layers with additional safety checks
    initParallaxLayers() {
        // Clear existing layers
        this.parallaxLayers = [];
        
        // Check if colorPalette is defined before proceeding
        if (!this.colorPalette || !Array.isArray(this.colorPalette) || this.colorPalette.length === 0) {
            // Define a default palette if missing
            this.colorPalette = [
                [255, 100, 255],  // Pink
                [180, 80, 255],   // Purple
                [140, 200, 255],  // Cyan
                [100, 220, 180],  // Teal
                [200, 120, 255]   // Lavender
            ];
            console.log("Using default color palette because none was defined");
        }
        
        // Create 3 layers with different densities
        for (let layer = 0; layer < 3; layer++) {
            const particles = [];
            const count = layer === 0 ? 40 : layer === 1 ? 60 : 100;
            
            for (let i = 0; i < count; i++) {
                // Safely choose a color
                const colorIndex = Math.floor(Math.random() * this.colorPalette.length);
                const color = this.colorPalette[colorIndex] || [180, 80, 255]; // Default color if undefined
                
                particles.push({
                    x: Math.random(),
                    y: Math.random(),
                    size: layer === 0 ? Math.random() * 2 + 0.5 : Math.random() * 1 + 0.3, // Smaller sizes
                    speed: 0.01 * (3 - layer),
                    color: color,
                    alpha: layer === 0 ? Math.random() * 0.5 + 0.2 : Math.random() * 0.3 + 0.1, // Lower opacity
                    origX: 0,
                    origY: 0,
                    dispX: 0,
                    dispY: 0
                });
            }
            
            this.parallaxLayers.push(particles);
        }
    }
    
    // Update flow lines
    updateFlowLines(deltaTime, audioLevel) {
        const currentTime = Date.now();
        
        // Add new flow lines periodically
        if (currentTime - this.lastFlowLineTime > this.flowLineInterval) {
            if (this.flowLines.filter(line => !line.complete).length < this.maxFlowLines) {
                this.flowLines.push(this.createFlowLine());
                this.lastFlowLineTime = currentTime;
            }
        }
        
        // Update existing flow lines
        for (let i = 0; i < this.flowLines.length; i++) {
            const line = this.flowLines[i];
            
            if (!line.complete) {
                // Update angle with slight curve
                line.angle += line.curvature * (deltaTime / 16.67);
                
                // Move the line
                const moveDistance = line.speed * (deltaTime / 16.67);
                line.currentX += Math.cos(line.angle) * moveDistance;
                line.currentY += Math.sin(line.angle) * moveDistance;
                
                // Add new segment if the line has moved enough
                const lastSegment = line.segments[line.segments.length - 1];
                if (lastSegment) { // Safety check
                    const distanceFromLast = Math.sqrt(
                        Math.pow(line.currentX - lastSegment.x, 2) + 
                        Math.pow(line.currentY - lastSegment.y, 2)
                    );
                    
                    if (distanceFromLast > 3) {
                        line.segments.push({x: line.currentX, y: line.currentY});
                        
                        // Limit number of segments
                        if (line.segments.length > line.maxSegments) {
                            line.segments.shift();
                        }
                    }
                }
                
                // Calculate length
                line.length += moveDistance;
                
                // Mark as complete if maxLength reached
                if (line.length >= line.maxLength) {
                    line.complete = true;
                }
            }
        }
        
        // Remove old completed lines
        const maxAge = 10000; // 10 seconds
        this.flowLines = this.flowLines.filter(line => 
            !line.complete || (currentTime - line.createTime < maxAge)
        );
    }
    
    // Draw flow lines with additional safety checks
    drawFlowLines() {
        for (const line of this.flowLines) {
            if (!line.segments || line.segments.length < 2) continue;
            
            // Calculate age-based alpha
            let alpha = line.alpha;
            
            if (line.complete) {
                const age = (Date.now() - line.createTime) / 1000;
                alpha *= Math.max(0, 1 - (age / 10)); // Fade out over 10 seconds
            }
            
            try {
                // Create gradient for the line
                const gradient = this.ctx.createLinearGradient(
                    line.startX, line.startY, 
                    line.segments[line.segments.length-1].x, line.segments[line.segments.length-1].y
                );
                
                // Safety check on color values
                const color = line.color || [180, 80, 255]; // Default if undefined
                const r = color[0] !== undefined ? color[0] : 180;
                const g = color[1] !== undefined ? color[1] : 80;
                const b = color[2] !== undefined ? color[2] : 255;
                
                gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.5})`);
                gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha})`);
                gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${alpha * 0.5})`);
                
                // Draw the line
                this.ctx.beginPath();
                this.ctx.moveTo(line.segments[0].x, line.segments[0].y);
                
                // Use a curve for smoother lines
                for (let i = 1; i < line.segments.length - 1; i++) {
                    const xc = (line.segments[i].x + line.segments[i+1].x) / 2;
                    const yc = (line.segments[i].y + line.segments[i+1].y) / 2;
                    this.ctx.quadraticCurveTo(line.segments[i].x, line.segments[i].y, xc, yc);
                }
                
                // Add the last segment
                if (line.segments.length > 1) {
                    const lastIdx = line.segments.length - 1;
                    this.ctx.lineTo(line.segments[lastIdx].x, line.segments[lastIdx].y);
                }
                
                // Set line style
                this.ctx.strokeStyle = gradient;
                this.ctx.lineWidth = line.width;
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                
                // Draw line
                this.ctx.stroke();
                
                // Add subtle glow to the line
                this.ctx.save();
                this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`;
                this.ctx.lineWidth = line.width + 2;
                this.ctx.filter = 'blur(2px)';
                this.ctx.stroke();
                this.ctx.restore();
            } catch (error) {
                console.error("Error drawing flow line:", error);
                // Continue with next line
            }
        }
    }
    
    // Update parallax layers with mouse/body movement
    updateParallaxLayers(mouseX, mouseY) {
        if (!this.parallaxLayers || !Array.isArray(this.parallaxLayers)) {
            return; // Safety check
        }
        
        for (let i = 0; i < this.parallaxLayers.length; i++) {
            const layer = this.parallaxLayers[i];
            if (!layer || !Array.isArray(layer)) continue; // Safety check
            
            for (const particle of layer) {
                // Move based on layer speed
                particle.x += particle.speed;
                
                // Wrap around
                if (particle.x > 1.0) {
                    particle.x = 0.0;
                    particle.y = Math.random();
                }
                
                // Apply parallax effect based on mouse/body position
                // Layer 0 moves most, layer 2 moves least
                const parallaxFactor = 0.1 * (2 - i);
                
                // Adjust position based on mouse/body but keep within bounds
                const offsetX = (mouseX - 0.5) * parallaxFactor;
                const offsetY = (mouseY - 0.5) * parallaxFactor;
                
                // Store original and parallax-adjusted positions
                particle.origX = particle.x;
                particle.origY = particle.y;
                particle.dispX = particle.x + offsetX;
                particle.dispY = particle.y + offsetY;
            }
        }
    }
    
    // Draw parallax layers with safety checks
    drawParallaxLayers(mouseX, mouseY, audioLevel) {
        if (!this.parallaxLayers || !Array.isArray(this.parallaxLayers)) {
            return; // Safety check
        }
        
        for (let i = 0; i < this.parallaxLayers.length; i++) {
            const layer = this.parallaxLayers[i];
            if (!layer || !Array.isArray(layer)) continue; // Safety check
            
            for (const particle of layer) {
                // Calculate display position with parallax
                const x = Math.floor(particle.dispX * this.width);
                const y = Math.floor(particle.dispY * this.height);
                
                // Skip if outside canvas
                if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
                    continue;
                }
                
                // Size and alpha based on layer
                let size = Math.floor(particle.size * (3 - i));
                const alpha = particle.alpha * (i === 0 ? 1.0 : i === 1 ? 0.7 : 0.4);
                
                // Apply audio reactivity to size
                if (audioLevel > 0.5) {
                    const sizeBoost = (audioLevel - 0.5) * 2;
                    size = Math.floor(size * (1 + sizeBoost * 0.3)); // Smaller boost
                }
                
                // Safely handle color values
                const color = particle.color || [180, 80, 255]; // Default if undefined
                const r = color[0] !== undefined ? color[0] : 180;
                const g = color[1] !== undefined ? color[1] : 80;
                const b = color[2] !== undefined ? color[2] : 255;
                
                // Adjust color based on layer and alpha
                const colorStr = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                
                // Draw the particle
                this.ctx.fillStyle = colorStr;
                this.ctx.beginPath();
                this.ctx.arc(x, y, size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    
    // Start a transition to a new image
    startTransition(newImage) {
        if (newImage) {
            this.previousImage = this.transformedImage;
            this.transformedImage = newImage;
            this.isTransitioning = true;
            this.transitionStartTime = Date.now() / 1000;
        }
    }
    
    // Handle transition between images
    updateTransition() {
        if (!this.isTransitioning) return;
        
        const currentTime = Date.now() / 1000;
        const elapsed = currentTime - this.transitionStartTime;
        
        // Transition has ended
        if (elapsed >= this.transitionDuration) {
            this.isTransitioning = false;
            return;
        }
        
        // Calculate transition progress (0-1)
        const progress = elapsed / this.transitionDuration;
        
        // Draw the transition
        if (this.previousImage && this.transformedImage) {
            // Clear canvas first
            this.ctx.fillStyle = 'rgb(10, 5, 15)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            // Simple crossfade
            this.ctx.globalAlpha = 1 - progress;
            this.ctx.drawImage(this.previousImage, 0, 0, this.width, this.height);
            this.ctx.globalAlpha = progress;
            this.ctx.drawImage(this.transformedImage, 0, 0, this.width, this.height);
            this.ctx.globalAlpha = 1.0;
            
            // Apply glitch effect during transition (stronger at start)
            const glitchIntensity = Math.max(0, 1.0 - progress * 1.5);
            if (glitchIntensity > 0.1) {
                this.applyTVGlitch(glitchIntensity);
            }
        }
    }
    
    
    // Update particles
    updateParticles(audioLevel, deltaTime) {
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            
            // Update position
            particle.x += Math.cos(particle.angle) * particle.speed * deltaTime / 16;
            particle.y += Math.sin(particle.angle) * particle.speed * deltaTime / 16;
            
            // Update pulse
            particle.pulse += 0.1 * deltaTime / 16;
            
            // Apply audio reactivity to size and speed
            if (audioLevel > 0.6) {
                const audioBoost = (audioLevel - 0.6) * 2.5;
                particle.size *= 1 + audioBoost * 0.2;
                particle.speed *= 1 + audioBoost * 0.1;
            }
            
            // Reset if particle goes offscreen
            if (particle.x < -10 || particle.x > this.width + 10 || 
                particle.y < -10 || particle.y > this.height + 10) {
                this.particles[i] = this.createParticle();
            }
        }
    }
    
    // Draw particles with safety checks
    drawParticles() {
        if (!this.particles || !Array.isArray(this.particles)) return;
        
        for (const particle of this.particles) {
            // Calculate pulsing size
            const size = particle.size * (0.8 + 0.4 * Math.sin(particle.pulse));
            
            // Safety check on color values
            const color = particle.color || [180, 80, 255]; // Default if undefined
            const r = color[0] !== undefined ? color[0] : 180;
            const g = color[1] !== undefined ? color[1] : 80;
            const b = color[2] !== undefined ? color[2] : 255;
            
            // Draw particle
            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${particle.alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    // Apply bloom post-processing effect
    applyBloom(intensity = 0.3) {
        try {
            // Create a temporary canvas for the bloom effect
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.width;
            tempCanvas.height = this.height;
            const tempCtx = tempCanvas.getContext('2d');
            
            // Copy the current canvas content
            tempCtx.drawImage(this.canvas, 0, 0);
            
            // Extract bright areas
            const imageData = tempCtx.getImageData(0, 0, this.width, this.height);
            const data = imageData.data;
            
            for (let i = 0; i < data.length; i += 4) {
                // Check if this is a bright pixel (mainly looking for magenta/purple)
                if ((data[i] > 200 && data[i+2] > 180) || // Bright magenta
                    (data[i+1] < 50 && data[i+2] > 200)) { // Purple
                    // Keep it bright
                    data[i] = Math.min(255, data[i] * 1.2);
                    data[i+1] = Math.min(255, data[i+1] * 1.2);
                    data[i+2] = Math.min(255, data[i+2] * 1.2);
                } else {
                    // Make other pixels black for the bloom
                    data[i] = 0;
                    data[i+1] = 0;
                    data[i+2] = 0;
                    data[i+3] = 0;
                }
            }
            
            tempCtx.putImageData(imageData, 0, 0);
            
            // Apply blur to create the bloom
            tempCtx.filter = 'blur(12px)';
            tempCtx.globalAlpha = 0.7;
            tempCtx.drawImage(tempCanvas, 0, 0);
            
            // Add the bloom to the original image
            this.ctx.globalAlpha = intensity;
            this.ctx.drawImage(tempCanvas, 0, 0);
            this.ctx.globalAlpha = 1.0;
        } catch (error) {
            console.error("Error applying bloom effect:", error);
            // Continue without bloom
        }
    }
    
    // Update body data and calculate center
    updateBodyPosition(bodyData) {
        if (!bodyData || !bodyData.is_person_detected || !bodyData.landmarks) {
            return;
        }

        // Update only if we have new body data
        const now = Date.now();
        if (now - this.lastBodyUpdate < 50) {
            return; // Don't update too frequently
        }
        this.lastBodyUpdate = now;

        // Calculate body center from landmarks
        let centerX = 0, centerY = 0, count = 0;
        
        bodyData.landmarks.forEach(lm => {
            if (lm.visibility > 0.5) {
                centerX += lm.x * this.width;
                centerY += lm.y * this.height;
                count++;
            }
        });
        
        if (count > 0) {
            // Get actual coordinates
            centerX /= count;
            centerY /= count;
            
            // Update body center with smooth transition
            this.bodyCenter.x = this.bodyCenter.x * 0.8 + centerX * 0.2;
            this.bodyCenter.y = this.bodyCenter.y * 0.8 + centerY * 0.2;
            
            // Also spawn some new flow lines at significant body points (hands, head)
            const keyPoints = [0, 9, 10, 15, 16]; // Head, left/right wrists and hands
            bodyData.landmarks.forEach(lm => {
                if (keyPoints.includes(lm.index) && lm.visibility > 0.6 && Math.random() < 0.2) {
                    const x = lm.x * this.width;
                    const y = lm.y * this.height;
                    if (this.flowLines.length < this.maxFlowLines * 1.2) {
                        this.flowLines.push(this.createFlowLine(x, y));
                    }
                }
            });
        }
    }

    // Add these methods to the FutureEffect class in future-effect.js

// Apply TV glitch effect (similar to your Python code)
    applyTVGlitch(intensity = 0.5) {
        try {
            // Create a temporary canvas
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.width;
            tempCanvas.height = this.height;
            const tempCtx = tempCanvas.getContext('2d');
            
            // Copy current canvas content
            tempCtx.drawImage(this.canvas, 0, 0);
            
            // Get image data
            const imageData = tempCtx.getImageData(0, 0, this.width, this.height);
            const data = imageData.data;
            
            // 1. RGB channel shift
            const shiftAmount = Math.floor(intensity * 10);
            for (let y = 0; y < this.height; y++) {
                const rowOffset = y * this.width * 4;
                for (let x = 0; x < this.width; x++) {
                    const i = rowOffset + x * 4;
                    const shiftedX = (x + shiftAmount) % this.width;
                    const shiftedI = rowOffset + shiftedX * 4;
                    
                    if (i < data.length - 4 && shiftedI < data.length - 4) {
                        // Shift red channel
                        data[i] = data[shiftedI]; 
                    }
                }
            }
            
            // 2. Horizontal scanlines
            const scanlineSpacing = Math.max(2, Math.floor(10 * (1 - intensity)));
            for (let y = 0; y < this.height; y += scanlineSpacing) {
                const rowOffset = y * this.width * 4;
                const opacity = Math.random() * 0.8 + 0.2;
                
                for (let x = 0; x < this.width; x++) {
                    const i = rowOffset + x * 4;
                    if (i < data.length - 4) {
                        // Darken scanline
                        data[i] = Math.floor(data[i] * opacity);
                        data[i+1] = Math.floor(data[i+1] * opacity);
                        data[i+2] = Math.floor(data[i+2] * opacity);
                    }
                }
            }
            
            // 3. Digital distortion blocks
            const blocks = Math.floor(intensity * 5) + 1;
            for (let b = 0; b < blocks; b++) {
                const blockHeight = Math.floor(Math.random() * 20) + 5;
                const startY = Math.floor(Math.random() * (this.height - blockHeight));
                const shiftX = Math.floor((Math.random() - 0.5) * intensity * 30);
                
                for (let y = startY; y < startY + blockHeight; y++) {
                    const rowOffset = y * this.width * 4;
                    for (let x = 0; x < this.width; x++) {
                        const srcX = (x + shiftX + this.width) % this.width;
                        const i = rowOffset + x * 4;
                        const srcI = rowOffset + srcX * 4;
                        
                        if (i < data.length - 4 && srcI < data.length - 4) {
                            data[i] = data[srcI];
                            data[i+1] = data[srcI+1];
                            data[i+2] = data[srcI+2];
                        }
                    }
                }
            }
            
            // 4. Add magenta scan lines
            if (Math.random() < 0.6) {
                const scanY = Math.floor(Math.random() * this.height);
                const scanHeight = Math.floor(Math.random() * 4) + 2;
                
                for (let y = scanY; y < Math.min(scanY + scanHeight, this.height); y++) {
                    const rowOffset = y * this.width * 4;
                    for (let x = 0; x < this.width; x++) {
                        const i = rowOffset + x * 4;
                        if (i < data.length - 4) {
                            // Set to magenta color
                            data[i] = 255;      // R
                            data[i+1] = 0;      // G 
                            data[i+2] = 255;    // B
                        }
                    }
                }
            }
            
            // Apply the modified image data
            tempCtx.putImageData(imageData, 0, 0);
            
            // Draw back to the main canvas
            this.ctx.drawImage(tempCanvas, 0, 0);
            return true;
        } catch (error) {
            console.error('Error applying TV glitch:', error);
            return false;
        }
    }

    
    // Update the effect with safety checks
    update(imageData, bodyData, audioLevel, deltaTime, transformedImage) {
        try {
            // Handle null/undefined parameters
            deltaTime = deltaTime || 16.67; // Default to 60fps
            audioLevel = audioLevel || 0;
            
            // Update time
            this.time += deltaTime / 1000;
            
            // Update transformed image if provided
            if (transformedImage && transformedImage !== this.transformedImage) {
                this.startTransition(transformedImage);
            }
            
            // Clear canvas with dark background
            this.ctx.fillStyle = 'rgb(10, 5, 15)'; // Very dark background
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            // Update body position - CRITICAL for movement
            if (bodyData && bodyData.is_person_detected && bodyData.landmarks) {
                // Calculate center point more immediately for better responsiveness
                let centerX = 0, centerY = 0, count = 0;
                
                bodyData.landmarks.forEach(lm => {
                    if (lm.visibility > 0.5) {
                        centerX += lm.x * this.width;
                        centerY += lm.y * this.height;
                        count++;
                    }
                });
                
                if (count > 0) {
                    centerX /= count;
                    centerY /= count;
                    
                    // Update body center with less smoothing for more responsiveness
                    this.bodyCenter.x = this.bodyCenter.x * 0.3 + centerX * 0.7; // More weight on new position
                    this.bodyCenter.y = this.bodyCenter.y * 0.3 + centerY * 0.7;
                    
                    // Spawn flow lines from hands and head for more interactivity
                    const keyPoints = [0, 9, 10, 15, 16, 17, 18]; // Head and hands
                    bodyData.landmarks.forEach(lm => {
                        if (keyPoints.includes(lm.index) && lm.visibility > 0.5 && Math.random() < 0.2) {
                            const x = lm.x * this.width;
                            const y = lm.y * this.height;
                            if (this.flowLines.length < this.maxFlowLines * 1.5) {
                                this.flowLines.push(this.createFlowLine(x, y));
                            }
                        }
                    });
                }
            }
            
            // Get normalized body center for parallax effect
            const normalizedX = this.bodyCenter.x / this.width;
            const normalizedY = this.bodyCenter.y / this.height;
            
            // Update parallax layers based on body position
            this.updateParallaxLayers(normalizedX, normalizedY);
            
            // Update flow lines
            this.updateFlowLines(deltaTime, audioLevel);
            
            // Update particles
            this.updateParticles(audioLevel, deltaTime);
            
            // If we're in a transition, handle that
            if (this.isTransitioning) {
                this.updateTransition();
            } 
            // Otherwise draw normally
            else if (this.transformedImage && this.transformedImage.complete) {
                // Apply transformations to make the image follow your movement
                this.ctx.save();
                
                // Calculate offset based on body center vs center of frame
                // INCREASED MOVEMENT FACTOR from 0.05 to 0.15 for more pronounced movement
                const offsetX = (this.bodyCenter.x - this.width/2) * 0.15;
                const offsetY = (this.bodyCenter.y - this.height/2) * 0.15;
                
                // Apply offset when drawing the image
                this.ctx.translate(-offsetX, -offsetY);
                
                // Draw transformed image with high opacity
                this.ctx.globalAlpha = 0.95;
                this.ctx.drawImage(this.transformedImage, 0, 0, this.width, this.height);
                this.ctx.globalAlpha = 1.0;
                
                this.ctx.restore();
                
                // INCREASED GLITCH FREQUENCY from 0.015 (1.5%) to 0.06 (6%) chance per frame
                if (Math.random() < 0.6) {
                    const glitchIntensity = Math.random() * 0.5 + 0.3; // Slightly increased intensity
                    this.applyTVGlitch(glitchIntensity);
                }
            }
            
            // Draw background parallax layers with lower opacity
            this.ctx.globalAlpha = 0.3;
            this.drawParallaxLayers(normalizedX, normalizedY, audioLevel);
            this.ctx.globalAlpha = 1.0;
            
            // Draw flow lines on top with blend mode for better integration
            try {
                this.ctx.globalCompositeOperation = 'screen';
                this.drawFlowLines();
                this.ctx.globalCompositeOperation = 'source-over';
            } catch (error) {
                console.error("Error with composite operation:", error);
                this.ctx.globalCompositeOperation = 'source-over';
                this.drawFlowLines();
            }
            
            // Draw particles
            this.drawParticles();
            
            // Apply bloom effect for glow
            this.applyBloom(0.2 + (audioLevel * 0.2));
            
            return true; // Successfully updated
        } catch (error) {
            console.error("Error in FutureEffect.update:", error);
            
            // Emergency recovery: clear canvas and draw a basic indicator
            try {
                this.ctx.fillStyle = 'rgb(10, 5, 15)';
                this.ctx.fillRect(0, 0, this.width, this.height);
                
                // Draw transformed image if available
                if (this.transformedImage && this.transformedImage.complete) {
                    this.ctx.drawImage(this.transformedImage, 0, 0, this.width, this.height);
                }
                
                // Draw error indicator
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                this.ctx.fillRect(10, 10, 20, 20);
            } catch (e) {
                // Give up silently
            }
            
            return false; // Failed to update
        }
    }
}