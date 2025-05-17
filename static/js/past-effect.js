/**
 * PastEffect - Creates the Vitruvian Man-inspired deconstruction effect 
 * for the Past panel with monochrome point cloud styling
 */
class PastEffect {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Canvas dimensions
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Point cloud data
        this.points = [];
        this.connections = [];
        this.maxPoints = 3000;
        this.pointSize = 2;
        this.connectionThreshold = 25;
        
        // Vitruvian elements
        this.vitruvianElements = [];
        
        // Z-depth particles
        this.depthParticles = [];
        this.maxDepthParticles = 150;
        
        // Animation
        this.time = 0;
        
        // Initialize
        this.initialize();
        this.colorPalette = [
            [255, 200, 150],  // Warm light
            [230, 180, 130],  // Sepia
            [210, 170, 120],  // Vintage gold
            [190, 150, 110],  // Antique
            [170, 130, 90]    // Aged sepia
        ];

        this.prismaticOverlay = [
            [200, 100, 50],   // Vintage red
            [180, 120, 40],   // Amber
            [170, 150, 30],   // Vintage yellow
            [100, 150, 70],   // Muted green
            [70, 130, 110],   // Teal with sepia
            [60, 100, 140],   // Vintage blue
            [100, 80, 120]    // Muted purple
        ];

        this.ctx.fillStyle = 'rgb(44, 25, 6)';
    }
    
    // Set canvas dimensions
    setDimensions(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
    }
    
    // Initialize the effect
    initialize() {
        // Initialize depth particles
        this.initDepthParticles();
    }
    
    // Initialize z-depth particles
    initDepthParticles() {
        console.log("Initializing depth particles");
        this.depthParticles = [];
        
        for (let i = 0; i < this.maxDepthParticles; i++) {
            // Create particles with meaningful initial velocity
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.003 + Math.random() * 0.004; // Higher initial speed
            
            this.depthParticles.push({
                x: Math.random(),
                y: Math.random(),
                z: Math.random() * 0.9 + 0.1, // z-depth (0.1-1.0)
                size: Math.random() * 2 + 1,
                color: 'white',
                vx: Math.cos(angle) * speed, // Direction-based velocity
                vy: Math.sin(angle) * speed, // Direction-based velocity
                vz: (Math.random() - 0.5) * 0.005 // Increased z velocity
            });
        }
    }
    
    
    // Update particles with audio reactivity
    // 4. Update depth particles
updateDepthParticles(audioLevel, deltaTime, mask, centerX, centerY) {
    // Ensure proper time scaling
    const timeScale = Math.min(1.0, deltaTime / 16.67);
    
    // Calculate cyclic contraction effect
    const contractionCycle = Math.sin(this.time * 0.2) * 0.5 + 0.5; // Value between 0-1
    const contractionForce = Math.max(0, 0.3 * contractionCycle);
    
    for (let particle of this.depthParticles) {
        // Always add some movement to ensure particles aren't static
        particle.x += (Math.random() - 0.5) * 0.0015; // Reduced from 0.005
        particle.y += (Math.random() - 0.5) * 0.0015; // Reduced from 0.005
        particle.x += particle.vx * timeScale * 0.5;  // Reduced from 2.0
        particle.y += particle.vy * timeScale * 0.5;  // Reduced from 2.0

        particle.z += particle.vz * timeScale;
        
        // Apply contraction force toward center
        if (contractionForce > 0.05) {
            // Calculate vector to center of screen
            const toCenterX = 0.5 - particle.x;
            const toCenterY = 0.5 - particle.y;
            const distToCenter = Math.sqrt(toCenterX*toCenterX + toCenterY*toCenterY);
            
            if (distToCenter > 0) {
                // Normalize and apply contraction
                const normX = toCenterX / distToCenter;
                const normY = toCenterY / distToCenter;
                
                // Apply force, stronger for particles further from center
                const force = contractionForce * distToCenter * 0.01; // Increased from 0.01
                particle.vx += normX * force;
                particle.vy += normY * force;
            }
        }
        
        // If we have mask and center point, add attraction
        if (mask && mask.length > 0 && centerX && centerY) {
            // Calculate attraction toward body center
            const dx = centerX - particle.x;
            const dy = centerY - particle.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist > 0) {
                // Normalize and apply attraction
                const ndx = dx / dist;
                const ndy = dy / dist;
                
                // Stronger attraction for closer particles (higher z)
                const attraction = 0.003 * particle.z * particle.z; // Increased from 0.0001
                particle.vx += ndx * attraction;
                particle.vy += ndy * attraction;
            }
        }
        
        // Apply audio-reactive forces
        if (audioLevel > 0.4) {
            // Add outward explosion when audio is loud
            const fromCenterX = particle.x - 0.5;
            const fromCenterY = particle.y - 0.5;
            const distFromCenter = Math.sqrt(fromCenterX*fromCenterX + fromCenterY*fromCenterY);
            
            if (distFromCenter > 0) {
                const normX = fromCenterX / distFromCenter;
                const normY = fromCenterY / distFromCenter;
                const audioReactivity = (audioLevel - 0.4) * 0.015;
                particle.vx += normX * audioReactivity;
                particle.vy += normY * audioReactivity;
            }
            
            // Pulse the z-value with audio
            const pulse = (audioLevel - 0.4) * 0.02;
            particle.vz += (Math.random() - 0.5) * pulse;
        }
        
        // Occasionally randomize velocity to prevent stagnation
        if (Math.random() < 0.005) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.005 + Math.random() * 0.003;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
        }
        
        // Boundary check and wrap around
        if (particle.x < 0) particle.x = 1;
        if (particle.x > 1) particle.x = 0;
        if (particle.y < 0) particle.y = 1;
        if (particle.y > 1) particle.y = 0;
        
        // Keep z within range
        if (particle.z < 0.1) {
            particle.z = 0.1;
            particle.vz = Math.abs(particle.vz) * 0.8;
        }
        if (particle.z > 1.0) {
            particle.z = 1.0;
            particle.vz = -Math.abs(particle.vz) * 0.8;
        }
        
        // Apply light damping (reduced from previous version for more movement)
        particle.vx *= 0.99;
        particle.vy *= 0.99;
        particle.vz *= 0.99;
    }
}

// 5. Draw depth particles with debugging
drawDepthParticles() {
    console.log("Drawing depth particles: count =", this.depthParticles.length);
    
    for (let particle of this.depthParticles) {
        // Calculate display position
        const x = Math.floor(particle.x * this.width);
        const y = Math.floor(particle.y * this.height);
        
        // Size based on z-depth (closer = larger)
        const size = Math.max(1, Math.floor(particle.size * particle.z * 2));
        
        // Mix in prismatic colors with vintage feel
        const useVintageColor = Math.random() > 0.3; // 70% chance of using vintage colors
        const colorArray = useVintageColor ? this.colorPalette : this.prismaticOverlay;
        const colorIndex = Math.floor(Math.random() * colorArray.length);
        const color = colorArray[colorIndex];
        
        // Apply sepia tone overlay to all colors
        const r = Math.min(255, color[0] * 1.1);
        const g = Math.min(255, color[1] * 0.9);
        const b = Math.min(255, color[2] * 0.7);
        
        // Calculate opacity based on z-depth
        const alpha = 0.3 + 0.7 * particle.z;
        
        // Draw the particle
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();
    }
}
    
    // Generate point cloud from body mask
    generatePointCloud(imageData, mask, audioLevel, bodyData) {
        // Clear points
        this.points = [];
        
        if (!mask || !mask.length) return;
        
        // Extract body points
        const indices = [];
        for (let y = 0; y < this.height; y += 3) { // Sample fewer points
            for (let x = 0; x < this.width; x += 3) { // Sample fewer points
                const i = y * this.width + x;
                if (mask[i]) {
                    indices.push([x, y]);
                }
            }
        }
        
        // Sample points if too many
        const sampleSize = Math.min(this.maxPoints, indices.length);
        const sampledIndices = sampleSize < indices.length ? 
            this.sampleArray(indices, sampleSize) : indices;
        
        // Calculate center of person
        let centerX = 0, centerY = 0;
        sampledIndices.forEach(([x, y]) => {
            centerX += x;
            centerY += y;
        });
        centerX /= sampledIndices.length;
        centerY /= sampledIndices.length;
        
        // Calculate movement factor from body landmarks if available
        let movementFactor = 0.03; // Default minimal value
        
        if (bodyData && bodyData.landmarks) {
            // Check for hand movements
            const leftHand = bodyData.landmarks.find(lm => lm.index === 19 || lm.index === 17);
            const rightHand = bodyData.landmarks.find(lm => lm.index === 20 || lm.index === 18);
            
            // Calculate fast-moving parts to increase reactivity
            let maxSpeed = 0;
            
            // Only use landmarks with good visibility
            const visibleLandmarks = bodyData.landmarks.filter(lm => lm.visibility > 0.5);
            
            // Landmarks from consecutive frames could be used to calculate velocity
            // but for this approach, we'll use audio reactivity as a proxy for activity
            if (audioLevel > 0.5) {
                maxSpeed = (audioLevel - 0.5) * 0.3;
            }
            
            // Hand presence increases movement factor
            if (leftHand && leftHand.visibility > 0.7 || rightHand && rightHand.visibility > 0.7) {
                maxSpeed += 0.1;
            }
            
            // Update movement factor based on activity
            movementFactor = Math.max(0.03, Math.min(0.15, maxSpeed));
        }
        
        // Create phase for animation cycle (0-1)
        const phaseSpeed = 0.05; // Medium animation speed
        const phase = (0.5 + 0.5 * Math.sin(this.time * phaseSpeed));
        
        // Generate points
        sampledIndices.forEach(([x, y]) => {
            // Original position
            const origX = x, origY = y;
            
            // Calculate brightness based on position
            const brightness = 180 + Math.random() * 75;
            
            // Calculate displacement vector from center
            const dx = origX - centerX;
            const dy = origY - centerY;
            const distance = Math.sqrt(dx*dx + dy*dy);
            const angle = Math.atan2(dy, dx);
            
            // Apply movement factor to displacement
            const dispFactor = movementFactor * (1 + distance / 300); // Greater movement for further particles
            
            // Calculate destination with movement factor
            const destX = origX + Math.cos(angle) * distance * dispFactor;
            const destY = origY + Math.sin(angle) * distance * dispFactor;
            
            // Animation progress
            const progress = Math.min(1, Math.max(0, phase));
            
            // Apply easing function for smoother animation
            const easedProgress = 0.5 - 0.5 * Math.cos(progress * Math.PI);
            
            // Interpolate between original and destination positions
            const currentX = origX * (1 - easedProgress) + destX * easedProgress;
            const currentY = origY * (1 - easedProgress) + destY * easedProgress;
            
            // Current brightness adjusted by animation
            const currentBrightness = brightness * (1 - 0.3 * easedProgress);
            
            // Add to points array
            if (currentX >= 0 && currentX < this.width && currentY >= 0 && currentY < this.height) {
                this.points.push({
                    x: currentX,
                    y: currentY,
                    brightness: currentBrightness,
                    isBodyPoint: true
                });
            }
        });
        
        // Create connections between points
        this.generateConnections();
    }
    
    // Generate connections between points
    generateConnections() {
        this.connections = [];
        
        // Use a spatial grid for efficiency
        const gridSize = 15;
        const grid = {};
        
        // Add points to grid
        this.points.forEach((point, i) => {
            const cellX = Math.floor(point.x / gridSize);
            const cellY = Math.floor(point.y / gridSize);
            const cellKey = `${cellX},${cellY}`;
            
            if (!grid[cellKey]) {
                grid[cellKey] = [];
            }
            
            grid[cellKey].push({ index: i, x: point.x, y: point.y });
        });
        
        // Connect nearby points
        this.points.forEach((point, i) => {
            const cellX = Math.floor(point.x / gridSize);
            const cellY = Math.floor(point.y / gridSize);
            
            // Check neighboring cells
            for (let nx = cellX - 1; nx <= cellX + 1; nx++) {
                for (let ny = cellY - 1; ny <= cellY + 1; ny++) {
                    const cellKey = `${nx},${ny}`;
                    if (grid[cellKey]) {
                        // Connect to points in this cell
                        grid[cellKey].forEach(neighbor => {
                            if (i !== neighbor.index) {
                                const dx = point.x - neighbor.x;
                                const dy = point.y - neighbor.y;
                                const distance = Math.sqrt(dx*dx + dy*dy);
                                
                                // Only connect if close enough
                                if (distance < 30) {
                                    // Calculate line brightness
                                    const alpha = (1 - distance/30) * 0.9;
                                    const brightness = Math.floor(alpha * 255);
                                    
                                    this.connections.push({
                                        from: i,
                                        to: neighbor.index,
                                        brightness: brightness
                                    });
                                }
                            }
                        });
                    }
                }
            }
        });
    }
    
    // Draw Vitruvian elements
    drawVitruvianElements(bodyData) {
        if (!bodyData || !bodyData.is_person_detected) return;
        
        let centerX = this.width / 2, centerY = this.height / 2;
        
        // Find center point from landmarks if available
        if (bodyData.landmarks && bodyData.landmarks.length > 0) {
            // Calculate average of torso landmarks (shoulders and hips)
            const torsoIndices = [11, 12, 23, 24];
            const torsoPoints = bodyData.landmarks.filter(lm => 
                torsoIndices.includes(lm.index));
            
            if (torsoPoints.length > 0) {
                centerX = 0;
                centerY = 0;
                torsoPoints.forEach(lm => {
                    centerX += lm.x * this.width;
                    centerY += lm.y * this.height;
                });
                centerX /= torsoPoints.length;
                centerY /= torsoPoints.length;
            }
        }
        
        // Calculate body radius
        let bodyRadius = Math.min(this.width, this.height) * 0.3;
        
        // Draw large circle with prismatic overlay color
        const circleColor = this.prismaticOverlay[2]; // Vintage yellow
        this.ctx.strokeStyle = `rgba(${circleColor[0]}, ${circleColor[1]}, ${circleColor[2]}, 0.5)`;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, bodyRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw square with color palette
        const squareColor = this.colorPalette[0]; // Warm light
        this.ctx.strokeStyle = `rgba(${squareColor[0]}, ${squareColor[1]}, ${squareColor[2]}, 0.5)`;
        const squareSize = bodyRadius * 0.9;
        this.ctx.beginPath();
        this.ctx.rect(
            centerX - squareSize, 
            centerY - squareSize, 
            squareSize * 2, 
            squareSize * 2
        );
        this.ctx.stroke();
        
        // Draw horizontal and vertical lines through center
        const lineColor = this.prismaticOverlay[5]; // Vintage blue
        this.ctx.strokeStyle = `rgba(${lineColor[0]}, ${lineColor[1]}, ${lineColor[2]}, 0.4)`;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - bodyRadius, centerY);
        this.ctx.lineTo(centerX + bodyRadius, centerY);
        this.ctx.moveTo(centerX, centerY - bodyRadius);
        this.ctx.lineTo(centerX, centerY + bodyRadius);
        this.ctx.stroke();
        
        // Draw head circle if head position is available
        if (bodyData.landmarks) {
            const head = bodyData.landmarks.find(lm => lm.index === 0);
            if (head) {
                const headX = head.x * this.width;
                const headY = head.y * this.height;
                const headRadius = bodyRadius * 0.15;
                
                const headColor = this.prismaticOverlay[0]; // Vintage red
                this.ctx.strokeStyle = `rgba(${headColor[0]}, ${headColor[1]}, ${headColor[2]}, 0.6)`;
                this.ctx.beginPath();
                this.ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        }
        
        // Add additional diagonal lines for Da Vinci look
        const diagColor = this.colorPalette[2]; // Vintage gold
        this.ctx.strokeStyle = `rgba(${diagColor[0]}, ${diagColor[1]}, ${diagColor[2]}, 0.35)`;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - squareSize, centerY - squareSize);
        this.ctx.lineTo(centerX + squareSize, centerY + squareSize);
        this.ctx.moveTo(centerX + squareSize, centerY - squareSize);
        this.ctx.lineTo(centerX - squareSize, centerY + squareSize);
        this.ctx.stroke();
    }
    
    
    // Draw light rays effect
    drawLightRays() {
        const numRays = 15;
        const rayOriginY = -this.height / 6;
        
        this.ctx.strokeStyle = 'rgba(137, 106, 64, 0.35)';
        this.ctx.lineWidth = 1;
        
        const timeFactor = this.time * 0.1;

        for (let i = 0; i < numRays; i++) {

            const offset = Math.sin(timeFactor + i * 0.1) * 0.2;

             // Randomize ray position and angle with subtle movement
            const rayOriginX = this.width / 2 + (Math.random() - 0.5 + offset) * this.width / 2;
            const rayLength = Math.random() * 0.7 * this.height + this.height * 0.8;
            const rayAngle = (Math.random() - 0.5 + offset * 0.3) * 60; // -30 to 30 degrees with slight movement
            
            // Calculate ray end point
            const radAngle = rayAngle * Math.PI / 180;
            const rayEndX = rayOriginX + rayLength * Math.sin(radAngle);
            const rayEndY = rayOriginY + rayLength * Math.cos(radAngle);
            
            // Draw the ray
            this.ctx.beginPath();
            this.ctx.moveTo(rayOriginX, rayOriginY);
            this.ctx.lineTo(rayEndX, rayEndY);
            this.ctx.stroke()
        }
    }
    
    // Draw points
    drawPoints() {
        for (let point of this.points) {
            // Use color palettes instead of grayscale
            const useVintageColor = Math.random() > 0.3;
            const colorArray = useVintageColor ? this.colorPalette : this.prismaticOverlay;
            const colorIndex = Math.floor(Math.random() * colorArray.length);
            const color = colorArray[colorIndex];
            
            // Apply sepia tone overlay
            const r = Math.min(255, color[0] * 1.1);
            const g = Math.min(255, color[1] * 0.9);
            const b = Math.min(255, color[2] * 0.7);
            
            // Scale alpha by the original brightness
            const alpha = point.brightness / 255 * 0.8;
            
            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, this.pointSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    // Draw connections between points
    // 1. First, update the drawPoints method to use the color palettes instead of grayscale:
drawPoints() {
    for (let point of this.points) {
        // Use color palettes instead of grayscale
        const useVintageColor = Math.random() > 0.3;
        const colorArray = useVintageColor ? this.colorPalette : this.prismaticOverlay;
        const colorIndex = Math.floor(Math.random() * colorArray.length);
        const color = colorArray[colorIndex];
        
        // Apply sepia tone overlay
        const r = Math.min(255, color[0] * 1.1);
        const g = Math.min(255, color[1] * 0.9);
        const b = Math.min(255, color[2] * 0.7);
        
        // Scale alpha by the original brightness
        const alpha = point.brightness / 255 * 0.8;
        
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, this.pointSize, 0, Math.PI * 2);
        this.ctx.fill();
    }
}

// 2. Similarly, update the drawConnections method to use the color palette:
drawConnections() {
    for (let connection of this.connections) {
        const fromPoint = this.points[connection.from];
        const toPoint = this.points[connection.to];
        
        if (fromPoint && toPoint) {
            // Use color from palette instead of grayscale
            const colorIndex = Math.floor(Math.random() * this.colorPalette.length);
            const color = this.colorPalette[colorIndex];
            
            // Calculate alpha based on original brightness
            const alpha = connection.brightness / 255 * 0.6;
            
            this.ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(fromPoint.x, fromPoint.y);
            this.ctx.lineTo(toPoint.x, toPoint.y);
            this.ctx.stroke();
        }
    }
}

drawPersonContour(bodyData) {
    if (!bodyData || !bodyData.is_person_detected || !bodyData.landmarks) return;
    
    // Only proceed if we have landmarks
    const landmarks = bodyData.landmarks.filter(lm => lm.visibility > 0.5);
    if (landmarks.length < 5) return;
    
    // Create a path to fill for the body contour
    this.ctx.save();
    
    // Set style for filled contour - more subtle and Vitruvian-like
    this.ctx.fillStyle = 'rgba(255, 220, 160, 0.05)';  // Very subtle warm color
    this.ctx.strokeStyle = 'rgba(255, 220, 160, 0.8)'; // Brighter outline
    this.ctx.lineWidth = 1.5;
    this.ctx.lineJoin = 'round';
    
    // Start drawing the body shape
    this.ctx.beginPath();
    
    // Get key points to form the contour
    const keyPoints = {};
    landmarks.forEach(lm => {
        keyPoints[lm.index] = { x: lm.x * this.width, y: lm.y * this.height };
    });
    
    // Draw the head outline if we have the points
    if (keyPoints[0] && keyPoints[1] && keyPoints[4]) {
        const headCenter = keyPoints[0];
        // Calculate head radius
        const headRadius = Math.max(
            this.distance(keyPoints[0], keyPoints[1]),
            this.distance(keyPoints[0], keyPoints[4])
        ) * 1.2; // Make head slightly larger
        
        // Draw head circle
        this.ctx.moveTo(headCenter.x + headRadius, headCenter.y);
        this.ctx.arc(headCenter.x, headCenter.y, headRadius, 0, Math.PI * 2);
    }
    
    // Draw body shape using key landmarks
    // Check if we have torso points
    if (keyPoints[11] && keyPoints[12] && keyPoints[23] && keyPoints[24]) {
        // Draw shoulders and torso
        this.ctx.moveTo(keyPoints[11].x, keyPoints[11].y); // Left shoulder
        this.ctx.lineTo(keyPoints[12].x, keyPoints[12].y); // Right shoulder
        this.ctx.lineTo(keyPoints[24].x, keyPoints[24].y); // Right hip
        this.ctx.lineTo(keyPoints[23].x, keyPoints[23].y); // Left hip
        this.ctx.closePath();
        
        // Draw left arm if points exist
        if (keyPoints[11] && keyPoints[13] && keyPoints[15]) {
            this.ctx.moveTo(keyPoints[11].x, keyPoints[11].y); // Shoulder
            this.ctx.lineTo(keyPoints[13].x, keyPoints[13].y); // Elbow
            this.ctx.lineTo(keyPoints[15].x, keyPoints[15].y); // Wrist
            
            // Add hand blob if hand points exist
            if (keyPoints[17] && keyPoints[19] && keyPoints[21]) {
                const handCenter = {
                    x: (keyPoints[17].x + keyPoints[19].x + keyPoints[21].x) / 3,
                    y: (keyPoints[17].y + keyPoints[19].y + keyPoints[21].y) / 3
                };
                const handRadius = 8; // Smaller size for hand
                this.ctx.arc(handCenter.x, handCenter.y, handRadius, 0, Math.PI * 2);
            }
        }
        
        // Draw right arm if points exist
        if (keyPoints[12] && keyPoints[14] && keyPoints[16]) {
            this.ctx.moveTo(keyPoints[12].x, keyPoints[12].y); // Shoulder
            this.ctx.lineTo(keyPoints[14].x, keyPoints[14].y); // Elbow
            this.ctx.lineTo(keyPoints[16].x, keyPoints[16].y); // Wrist
            
            // Add hand blob if hand points exist
            if (keyPoints[18] && keyPoints[20] && keyPoints[22]) {
                const handCenter = {
                    x: (keyPoints[18].x + keyPoints[20].x + keyPoints[22].x) / 3,
                    y: (keyPoints[18].y + keyPoints[20].y + keyPoints[22].y) / 3
                };
                const handRadius = 8; // Smaller size for hand
                this.ctx.arc(handCenter.x, handCenter.y, handRadius, 0, Math.PI * 2);
            }
        }
        
        // Draw left leg if points exist
        if (keyPoints[23] && keyPoints[25] && keyPoints[27]) {
            this.ctx.moveTo(keyPoints[23].x, keyPoints[23].y); // Hip
            this.ctx.lineTo(keyPoints[25].x, keyPoints[25].y); // Knee
            this.ctx.lineTo(keyPoints[27].x, keyPoints[27].y); // Ankle
            
            // Add foot if points exist
            if (keyPoints[29] && keyPoints[31]) {
                const footCenter = {
                    x: (keyPoints[29].x + keyPoints[31].x) / 2,
                    y: (keyPoints[29].y + keyPoints[31].y) / 2
                };
                this.ctx.lineTo(footCenter.x, footCenter.y);
            }
        }
        
        // Draw right leg if points exist
        if (keyPoints[24] && keyPoints[26] && keyPoints[28]) {
            this.ctx.moveTo(keyPoints[24].x, keyPoints[24].y); // Hip
            this.ctx.lineTo(keyPoints[26].x, keyPoints[26].y); // Knee
            this.ctx.lineTo(keyPoints[28].x, keyPoints[28].y); // Ankle
            
            // Add foot if points exist
            if (keyPoints[30] && keyPoints[32]) {
                const footCenter = {
                    x: (keyPoints[30].x + keyPoints[32].x) / 2,
                    y: (keyPoints[30].y + keyPoints[32].y) / 2
                };
                this.ctx.lineTo(footCenter.x, footCenter.y);
            }
        }
    }
    
    // Fill the path with very subtle color
    this.ctx.fill();
    
    // Stroke the outline with glow
    this.ctx.shadowColor = 'rgba(255, 220, 160, 0.8)';
    this.ctx.shadowBlur = 3;
    this.ctx.stroke();
    
    // Reset shadow
    this.ctx.shadowBlur = 0;
    this.ctx.restore();
}

// Add this helper function if it doesn't exist in your PastEffect class
distance(point1, point2) {
    return Math.sqrt(
        Math.pow(point2.x - point1.x, 2) + 
        Math.pow(point2.y - point1.y, 2)
    );
}
    addDynamicShadow(bodyData, audioLevel) {
        if (!bodyData || !bodyData.is_person_detected || !bodyData.landmarks) return;
        
        // Calculate shadow direction based on body position
        let centerX = this.width / 2, centerY = this.height / 2;
        
        // Find torso center for more stable shadow direction
        if (bodyData.landmarks && bodyData.landmarks.length > 0) {
            const torsoIndices = [11, 12, 23, 24]; // shoulders and hips
            const torsoPoints = bodyData.landmarks.filter(lm => 
                torsoIndices.includes(lm.index) && lm.visibility > 0.5);
            
            if (torsoPoints.length > 0) {
                let sumX = 0, sumY = 0;
                torsoPoints.forEach(lm => {
                    sumX += lm.x * this.width;
                    sumY += lm.y * this.height;
                });
                centerX = sumX / torsoPoints.length;
                centerY = sumY / torsoPoints.length;
            }
        }
        
        // Calculate shadow angle (direction from center of canvas to person)
        const shadowOffsetX = (this.width / 2 - centerX) * 0.15;
        const shadowOffsetY = (this.height / 2 - centerY) * 0.15;
        
        // Make shadow more dynamic with audio reactivity
        const shadowIntensity = 0.4 + audioLevel * 0.3;
        
        // Apply shadow to points
        if (this.points && this.points.length > 0) {
            // First draw shadow points
            this.ctx.save();
            
            // Adjust shadow opacity based on audio level
            const shadowOpacity = Math.min(0.5, 0.2 + audioLevel * 0.3);
            
            for (let point of this.points) {
                // Skip some points randomly to create more scattered shadow
                if (Math.random() < 0.7) {
                    const brightness = Math.floor(point.brightness * 0.3); // Darker for shadow
                    
                    this.ctx.fillStyle = `rgba(${brightness/2}, ${brightness/3}, ${brightness/4}, ${shadowOpacity})`;
                    this.ctx.beginPath();
                    
                    // Draw shadow with offset
                    this.ctx.arc(
                        point.x + shadowOffsetX,
                        point.y + shadowOffsetY,
                        this.pointSize * 1.2, // Slightly larger for shadow
                        0, Math.PI * 2
                    );
                    this.ctx.fill();
                }
            }
            
            this.ctx.restore();
        }
        
        // Also add shadow to Vitruvian elements
        this.drawVitruvianElementsShadow(centerX, centerY, shadowOffsetX, shadowOffsetY, shadowIntensity);
    }

    drawPersonSilhouette(bodyData, imageData) {
        if (!bodyData || !bodyData.is_person_detected || !imageData) return;
        
        // Create a temporary canvas for silhouette processing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.width;
        tempCanvas.height = this.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw the original image to detect the silhouette
        const imgData = new ImageData(
            new Uint8ClampedArray(imageData.data),
            imageData.width,
            imageData.height
        );
        tempCtx.putImageData(imgData, 0, 0);
        
        // Extract body mask using landmarks as a guide
        let mask = null;
        if (bodyData.landmarks && bodyData.landmarks.length > 0) {
            mask = this.landmarksToMask(bodyData.landmarks);
        } else {
            return; // Can't create silhouette without landmarks
        }
        
        // Apply the mask to the temporary canvas
        const maskImageData = tempCtx.getImageData(0, 0, this.width, this.height);
        const maskData = maskImageData.data;
        
        // Apply threshold to create silhouette
        for (let i = 0; i < this.width * this.height; i++) {
            const idx = i * 4;
            if (!mask[i]) {
                // Outside silhouette - make transparent
                maskData[idx + 3] = 0;
            } else {
                // Inside silhouette - make black
                maskData[idx] = 0;
                maskData[idx + 1] = 0;
                maskData[idx + 2] = 0;
                maskData[idx + 3] = 255;
            }
        }
        
        // Put masked data back to temp canvas
        tempCtx.putImageData(maskImageData, 0, 0);
        
        // Find edges using a temporary canvas
        const edgeCanvas = document.createElement('canvas');
        edgeCanvas.width = this.width;
        edgeCanvas.height = this.height;
        const edgeCtx = edgeCanvas.getContext('2d');
        
        // Draw the silhouette
        edgeCtx.drawImage(tempCanvas, 0, 0);
        
        // Apply edge detection
        edgeCtx.globalCompositeOperation = 'difference';
        edgeCtx.drawImage(tempCanvas, 1, 1);
        
        // Threshold the result to get clean edges
        const edgeData = edgeCtx.getImageData(0, 0, this.width, this.height);
        const edgePixels = edgeData.data;
        
        for (let i = 0; i < edgePixels.length; i += 4) {
            // If it's an edge pixel, make it glow amber
            if (edgePixels[i] > 10 || edgePixels[i+1] > 10 || edgePixels[i+2] > 10) {
                edgePixels[i] = 255;     // R
                edgePixels[i+1] = 220;   // G
                edgePixels[i+2] = 160;   // B
                edgePixels[i+3] = 200;   // Alpha
            } else {
                // Otherwise transparent
                edgePixels[i+3] = 0;
            }
        }
        
        edgeCtx.putImageData(edgeData, 0, 0);
        
        // Draw the edge outline to the main canvas
        this.ctx.save();
        
        // Set composite mode for better blending
        this.ctx.globalCompositeOperation = 'screen';
        
        // Draw with glow
        this.ctx.shadowColor = 'rgba(255, 220, 160, 0.8)';
        this.ctx.shadowBlur = 5;
        this.ctx.drawImage(edgeCanvas, 0, 0);
        
        this.ctx.restore();
    }
    // Draw shadows for Vitruvian elements
    drawVitruvianElementsShadow(centerX, centerY, offsetX, offsetY, intensity) {
        // Calculate body radius same as in drawVitruvianElements
        let bodyRadius = Math.min(this.width, this.height) * 0.3;
        
        // Apply shadow with offset
        this.ctx.strokeStyle = `rgba(30, 20, 15, ${intensity * 0.1})`;
        this.ctx.lineWidth = 2;
        
        // Draw shadow for circle
        this.ctx.beginPath();
        this.ctx.arc(centerX + offsetX, centerY + offsetY, bodyRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw shadow for square
        const squareSize = bodyRadius * 0.9;
        this.ctx.beginPath();
        this.ctx.rect(
            centerX + offsetX - squareSize, 
            centerY + offsetY - squareSize, 
            squareSize * 2, 
            squareSize * 2
        );
        this.ctx.stroke();
    }

    // Draw horizontal plane/floor with shadow
    drawFloorPlane(bodyData, audioLevel) {
        // Create a floor plane in the lower third of the canvas
        const floorY = this.height * 0.8;
        
        // Calculate dynamic vanishing point based on body position
        let vanishingX = this.width / 2;
        
        if (bodyData && bodyData.landmarks && bodyData.landmarks.length > 0) {
            // Use torso center for more stable vanishing point
            const torsoIndices = [11, 12, 23, 24];
            const torsoPoints = bodyData.landmarks.filter(lm => 
                torsoIndices.includes(lm.index) && lm.visibility > 0.5);
            
            if (torsoPoints.length > 0) {
                let sumX = 0;
                torsoPoints.forEach(lm => {
                    sumX += lm.x * this.width;
                });
                // Subtle shift in vanishing point
                vanishingX = this.width / 2 + (sumX / torsoPoints.length - this.width / 2) * 0.3;
            }
        }
        
        // Draw floor grid lines
        this.ctx.strokeStyle = 'rgba(64, 37, 10, 0.83)';
        this.ctx.lineWidth = 1;
        
        // Horizontal lines (parallel to viewer)
        for (let i = 0; i < 4; i++) {
            const y = floorY + i * 20;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
        
        // Vanishing lines (perspective)
        const numLines = 9;
        for (let i = 0; i < numLines; i++) {
            const startX = (i / (numLines - 1)) * this.width;
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, floorY);
            this.ctx.lineTo(vanishingX, this.height * 0.35);
            this.ctx.stroke();
        }
        
        // Draw atmospheric perspective gradient
        const gradient = this.ctx.createLinearGradient(0, floorY, 0, this.height);
        gradient.addColorStop(0, 'rgba(57, 32, 7, 0.9)');
        gradient.addColorStop(1, 'rgba(33, 21, 8, 0.82)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, floorY, this.width, this.height - floorY);
    }

    drawSilhouetteOutline(mask) {
        if (!mask) return;
        
        // Create a thick, solid outline
        this.ctx.save();
        
        // Use a stronger outline style
        this.ctx.strokeStyle = 'rgba(255, 220, 160, 0.95)'; // Brighter amber color
        this.ctx.lineWidth = 4; // Thicker line
        this.ctx.shadowColor = 'rgba(255, 220, 160, 0.9)';
        this.ctx.shadowBlur = 12; // Stronger blur for more visibility
        
        // Create silhouette outline by scanning the mask
        this.ctx.beginPath();
        
        // Scan horizontally and vertically to find edges
        const step = 2; // Sample every 2 pixels for better performance
        
        // Horizontal scan
        for (let y = 0; y < this.height; y += step) {
            let lastValue = false;
            for (let x = 0; x < this.width; x += step) {
                const idx = y * this.width + x;
                const currentValue = !!mask[idx];
                
                // If we found an edge (transition from 0 to 1 or 1 to 0)
                if (currentValue !== lastValue) {
                    this.ctx.lineTo(x, y);
                    lastValue = currentValue;
                }
            }
        }
        
        // Vertical scan
        for (let x = 0; x < this.width; x += step) {
            let lastValue = false;
            for (let y = 0; y < this.height; y += step) {
                const idx = y * this.width + x;
                const currentValue = !!mask[idx];
                
                // If we found an edge
                if (currentValue !== lastValue) {
                    this.ctx.lineTo(x, y);
                    lastValue = currentValue;
                }
            }
        }
        
        // Draw the outline with glow effect
        this.ctx.stroke();
        
        // Draw a second, brighter pass
        this.ctx.strokeStyle = 'rgba(255, 255, 200, 0.8)';
        this.ctx.lineWidth = 1.5;
        this.ctx.shadowBlur = 15;
        this.ctx.stroke();
        
        // Fill with very subtle color
        this.ctx.fillStyle = 'rgba(100, 80, 40, 0.15)'; // More visible fill
        this.ctx.fill();
        
        this.ctx.restore();
    }

    // Add this to create a shadow effect for the silhouette
drawShadowSilhouette(mask) {
    if (!mask) return;
    
    // Create a dark shadow of the silhouette
    this.ctx.save();
    
    // Fill every pixel in the mask with a shadow color
    const shadowColor = 'rgba(30, 20, 10, 0.3)'; // Dark shadow
    this.ctx.fillStyle = shadowColor;
    
    for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
            const idx = y * this.width + x;
            if (mask[idx]) {
                // Draw a filled pixel for each point in the mask
                this.ctx.fillRect(x, y, 1, 1);
            }
        }
    }
    
    this.ctx.restore();
}
moveParticlesWithUser(moveX, moveY) {
    // Skip if movement is too small
    if (Math.abs(moveX) < 0.001 && Math.abs(moveY) < 0.001) return;
    
    console.log("User movement detected:", moveX.toFixed(4), moveY.toFixed(4));
    
    const moveMagnitude = Math.sqrt(moveX*moveX + moveY*moveY);
    
    // Move all particles based on user movement
    for (let particle of this.depthParticles) {
        // Direct position change based on movement
        particle.x += moveX * 0.8;  // Reduced from 3.0
        particle.y += moveY * 0.8;  // Reduced from 3.0
        particle.vx += moveX * 0.1; // Reduced from 0.5
        particle.vy += moveY * 0.1; // Reduced from 0.5

        
        // Add some random variation
        particle.x += (Math.random() - 0.5) * 0.01 * moveMagnitude;
        particle.y += (Math.random() - 0.5) * 0.01 * moveMagnitude;
        
        // Boundary check
        if (particle.x < 0) particle.x = 1;
        if (particle.x > 1) particle.x = 0;
        if (particle.y < 0) particle.y = 1;
        if (particle.y > 1) particle.y = 0;
    }
    
    // Apply a similar effect to points if they exist
    if (this.points && this.points.length > 0) {
        for (let point of this.points) {
            point.x += moveX * this.width * 2; // Large value for visibility
            point.y += moveY * this.height * 2; // Large value for visibility
            
            // Keep within canvas bounds
            point.x = Math.max(0, Math.min(this.width, point.x));
            point.y = Math.max(0, Math.min(this.height, point.y));
        }
    }
}

    // Add Z-depth shadow effect
    addZDepthShadow() {
        // Only shadow some particles to create scattered shadow effect
        for (let particle of this.depthParticles) {
            if (Math.random() < 0.3) { // Only 30% of particles cast shadows
                // Calculate display position
                const x = Math.floor(particle.x * this.width);
                const y = Math.floor(particle.y * this.height);
                
                // Calculate shadow position based on z-depth
                const shadowOffsetX = (0.5 - particle.z) * 20; // Further away = more offset
                const shadowOffsetY = (0.5 - particle.z) * 20;
                
                // Size based on z-depth (closer = larger)
                const size = Math.max(1, Math.floor(particle.size * particle.z));
                
                // Shadow opacity based on z-depth (closer = darker shadow)
                const shadowOpacity = (1 - particle.z) * 0.3;
                
                // Draw shadow
                this.ctx.fillStyle = `rgba(140, 64, 39, ${shadowOpacity})`;
                this.ctx.beginPath();
                this.ctx.arc(x + shadowOffsetX, y + shadowOffsetY, size * 1.5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    // Apply glowing effect
    applyGlow() {
        // Create a temporary canvas for the glow effect
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.width;
        tempCanvas.height = this.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Copy the current canvas content
        tempCtx.drawImage(this.canvas, 0, 0);
        
        // Apply blur
        this.ctx.filter = 'blur(6px)';
        this.ctx.globalAlpha = 0.4;
        this.ctx.drawImage(tempCanvas, 0, 0);
        
        // Reset
        this.ctx.filter = 'none';
        this.ctx.globalAlpha = 1.0;
    }
    
    // Update the effect
    update(imageData, bodyData, audioLevel, deltaTime) {
        // Force time increment
        this.time += 0.016; // Fixed time increment (approximately 60fps)
        
        // Clear canvas with rich sepia tone background
        this.ctx.fillStyle = 'rgb(60, 40, 20)'; // Deep, rich sepia
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Apply a warm sepia overlay gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, 'rgba(255, 220, 160, 0.1)');
        gradient.addColorStop(0.7, 'rgba(200, 150, 100, 0.15)');
        gradient.addColorStop(1, 'rgba(150, 100, 60, 0.2)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Force movement for particles based on body data
        if (bodyData && bodyData.landmarks && bodyData.landmarks.length > 0) {
            // Calculate current position
            let currentCenterX = 0;
            let currentCenterY = 0;
            let count = 0;
            
            // Use all visible landmarks to calculate average position
            bodyData.landmarks.forEach(lm => {
                if (lm.visibility > 0.5) {
                    currentCenterX += lm.x;
                    currentCenterY += lm.y;
                    count++;
                }
            });
            
            if (count > 0) {
                currentCenterX /= count;
                currentCenterY /= count;
                
                // Calculate movement vector from previous frame
                if (!this.prevCenterX) {
                    this.prevCenterX = currentCenterX;
                    this.prevCenterY = currentCenterY;
                }
                
                const moveX = (currentCenterX - this.prevCenterX) * 5; // Amplify movement
                const moveY = (currentCenterY - this.prevCenterY) * 5; // Amplify movement
                
                // Directly force particles to move based on your movement
                this.moveParticlesWithUser(moveX, moveY);
                
                // Store current position for next frame
                this.prevCenterX = currentCenterX;
                this.prevCenterY = currentCenterY;
            }
        }
        
        // Draw light rays in background
        this.drawLightRays();
        
        // Draw floor plane with perspective
        this.drawFloorPlane(bodyData, audioLevel);
        
        // Process body data and generate points if available
        if (bodyData && bodyData.is_person_detected) {
            // Convert landmarks to mask if available
            let mask = null;
            if (bodyData.landmarks && bodyData.landmarks.length > 0) {
                mask = this.landmarksToMask(bodyData.landmarks);
            }
            
            // Draw silhouette with increased visibility
            if (mask) {
                this.ctx.save();
                this.drawSilhouetteOutline(mask);
                this.drawPersonSilhouette(bodyData, imageData);
                this.ctx.restore();
            }
            
            // Generate point cloud
            this.generatePointCloud(imageData, mask, audioLevel, bodyData);
            
            // Get center point
            let centerX = 0.5, centerY = 0.5;
            if (bodyData.landmarks && bodyData.landmarks.length > 0) {
                // Find torso center
                const torsoIndices = [11, 12, 23, 24];
                const torsoPoints = bodyData.landmarks.filter(lm => 
                    torsoIndices.includes(lm.index));
                
                if (torsoPoints.length > 0) {
                    centerX = 0;
                    centerY = 0;
                    torsoPoints.forEach(lm => {
                        centerX += lm.x;
                        centerY += lm.y;
                    });
                    centerX /= torsoPoints.length;
                    centerY /= torsoPoints.length;
                }
            }
            
            // Update depth particles
            this.updateDepthParticles(audioLevel, deltaTime, mask, centerX, centerY);
        } else {
            // Still update particles even without body data
            this.updateDepthParticles(audioLevel, deltaTime, null, 0.5, 0.5);
        }
        
        // Add Z-depth shadows to particles
        this.addZDepthShadow();
        
        // Draw depth particles
        this.drawDepthParticles();
        
        // Draw connections with prismatic colors
        this.drawConnections();
        
        // Draw points with prismatic colors
        this.drawPoints();
        
        // Draw Vitruvian elements
        this.drawVitruvianElements(bodyData);
        
        // Draw person contour with increased visibility
        this.ctx.save();
        this.ctx.lineWidth = 3; // Thicker lines
        this.ctx.strokeStyle = 'rgba(255, 220, 160, 0.9)'; // Higher opacity
        this.drawPersonContour(bodyData);
        this.ctx.restore();
        
        // Add dynamic shadows that follow movement
        this.addDynamicShadow(bodyData, audioLevel);
        
        // Apply sepia tone to final render
        this.applySepiaEffect(0.35);
        
        // Apply a vignette effect for vintage look
        this.applyVignetteEffect(0.35);
        
        // Apply glow effect
        this.applyGlow();
    }
    
    
    applySepiaEffect(intensity) {
        try {
            // Get image data
            const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
            const data = imageData.data;
            
            // Apply sepia filter
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                // Sepia conversion (common formula)
                const sepiaR = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                const sepiaG = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                const sepiaB = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
                
                // Mix original and sepia based on intensity
                data[i] = r * (1 - intensity) + sepiaR * intensity;
                data[i + 1] = g * (1 - intensity) + sepiaG * intensity;
                data[i + 2] = b * (1 - intensity) + sepiaB * intensity;
            }
            
            // Put modified data back
            this.ctx.putImageData(imageData, 0, 0);
        } catch (error) {
            console.error('Error applying sepia effect:', error);
        }
    }

    applyVignetteEffect(intensity) {
        try {
            // Create gradient for vignette
            const gradient = this.ctx.createRadialGradient(
                this.width / 2, this.height / 2, this.height * 0.3,
                this.width / 2, this.height / 2, this.height
            );
            
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity})`);
            
            // Apply vignette
            this.ctx.fillStyle = gradient;
            this.ctx.globalCompositeOperation = 'multiply';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.globalCompositeOperation = 'source-over';
        } catch (error) {
            console.error('Error applying vignette effect:', error);
        }
    }
    // Convert landmarks to mask
    landmarksToMask(landmarks) {
        // Create empty mask
        const mask = new Uint8Array(this.width * this.height);
        
        // Skip if no landmarks
        if (!landmarks || landmarks.length === 0) return mask;
        
        // Find valid landmarks
        const validPoints = landmarks.filter(lm => lm.visibility > 0.5)
            .map(lm => ({ x: Math.floor(lm.x * this.width), y: Math.floor(lm.y * this.height) }));
        
        // Skip if not enough points
        if (validPoints.length < 5) return mask;
        
        // Create a simple convex hull
        const hull = this.createSimpleHull(validPoints);
        
        // Expand the hull slightly to create a more visible outline
        const expandedHull = [];
        const center = {x: 0, y: 0};
        
        // Calculate hull center
        hull.forEach(p => {
            center.x += p.x;
            center.y += p.y;
        });
        center.x /= hull.length;
        center.y /= hull.length;
        
        // Expand points outward from center
        hull.forEach(p => {
            const dx = p.x - center.x;
            const dy = p.y - center.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            // Calculate expanded point
            if (dist > 0) {
                const expandAmount = 5; // Expand by 5 pixels
                const expandedX = p.x + (dx / dist) * expandAmount;
                const expandedY = p.y + (dy / dist) * expandAmount;
                expandedHull.push({
                    x: Math.max(0, Math.min(this.width - 1, expandedX)),
                    y: Math.max(0, Math.min(this.height - 1, expandedY))
                });
            } else {
                expandedHull.push({x: p.x, y: p.y});
            }
        });
        
        // Fill the expanded hull
        this.fillHull(expandedHull, mask);
        
        return mask;
    }
    
    // Helper method to expand hull points outward
    expandHull(hull, expandPixels) {
        if (!hull || hull.length < 3) return hull;
        
        // Find centroid
        let cx = 0, cy = 0;
        hull.forEach(p => {
            cx += p.x;
            cy += p.y;
        });
        cx /= hull.length;
        cy /= hull.length;
        
        // Expand points outward from centroid
        return hull.map(p => {
            const dx = p.x - cx;
            const dy = p.y - cy;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            // Calculate expanded position
            let expandX, expandY;
            if (dist > 0) {
                const factor = (dist + expandPixels) / dist;
                expandX = cx + dx * factor;
                expandY = cy + dy * factor;
            } else {
                expandX = p.x;
                expandY = p.y;
            }
            
            // Clamp to canvas bounds
            expandX = Math.max(0, Math.min(this.width - 1, expandX));
            expandY = Math.max(0, Math.min(this.height - 1, expandY));
            
            return { x: expandX, y: expandY, angle: p.angle };
        });
    }
    
    // Create a simple hull around points
    createSimpleHull(points) {
        // Find centroid
        let cx = 0, cy = 0;
        points.forEach(p => {
            cx += p.x;
            cy += p.y;
        });
        cx /= points.length;
        cy /= points.length;
        
        // Sort points by angle from centroid
        const sorted = points.map(p => {
            const angle = Math.atan2(p.y - cy, p.x - cx);
            return { x: p.x, y: p.y, angle: angle };
        }).sort((a, b) => a.angle - b.angle);
        
        // Return sorted points (convex hull)
        return sorted.map(p => ({ x: p.x, y: p.y }));
    }
    
    // Fill a hull in the mask
    fillHull(hull, mask) {
        // Skip if no hull
        if (!hull || hull.length < 3) return;
        
        // Find bounding box
        let minX = this.width, minY = this.height, maxX = 0, maxY = 0;
        hull.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        });
        
        // Clip bounds
        minX = Math.max(0, minX);
        minY = Math.max(0, minY);
        maxX = Math.min(this.width - 1, maxX);
        maxY = Math.min(this.height - 1, maxY);
        
        // For each pixel in bounding box, check if it's inside the hull
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                if (this.isPointInPolygon(x, y, hull)) {
                    mask[y * this.width + x] = 1;
                }
            }
        }
    }
    
    // Check if a point is inside a polygon
    isPointInPolygon(x, y, polygon) {
        let inside = false;
        
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
            
            const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        
        return inside;
    }
    
    // Utility: Sample from array
    sampleArray(array, sampleSize) {
        const result = [];
        const arrayCopy = array.slice();
        
        for (let i = 0; i < sampleSize; i++) {
            const index = Math.floor(Math.random() * arrayCopy.length);
            result.push(arrayCopy[index]);
            arrayCopy.splice(index, 1);
            if (arrayCopy.length === 0) break;
        }
        
        return result;
    }
}