/**
 * PanelTransitions - Creates seamless blending effects between panels
 */
class PanelTransitions {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Transition width (in pixels)
        this.transitionWidth = 30; // Wider for better blending
        
        // Particle effects
        this.particles = [];
        this.maxParticles = 40;
        
        // Initialize
        this.initialize();
        
        // Debug flag
        this.debug = false;
    }
    
    // Initialize transition effects
    initialize() {
        console.log(`PanelTransitions initialized with canvas ${this.width}x${this.height}`);
        
        // Initialize particles
        this.initializeParticles();
    }
    
    // Initialize particles
    initializeParticles() {
        this.particles = [];
        
        for (let i = 0; i < this.maxParticles; i++) {
            // Decide which transition area (0 = past-present, 1 = present-future)
            const transitionArea = Math.random() > 0.5 ? 0 : 1;
            
            // Calculate base position
            const panelWidth = this.width / 3;
            const x = transitionArea === 0 ? 
                      panelWidth - this.transitionWidth/2 + Math.random() * this.transitionWidth : 
                      panelWidth * 2 - this.transitionWidth/2 + Math.random() * this.transitionWidth;
            
            // Create the particle
            this.particles.push({
                x: x,
                y: Math.random() * this.height,
                size: 1 + Math.random() * 4,
                speed: 0.2 + Math.random() * 0.8,
                direction: Math.random() > 0.5 ? 1 : -1,
                opacity: 0.2 + Math.random() * 0.4,
                area: transitionArea,
                life: 0,
                maxLife: 100 + Math.random() * 150
            });
        }
    }
    
    // Update transition effects
    update(deltaTime, pastColor, presentColor, futureColor, audioLevel) {
        // Store colors for drawing
        this.pastColor = pastColor || [100, 80, 180];
        this.presentColor = presentColor || [0, 200, 150];
        this.futureColor = futureColor || [200, 50, 150];
        this.audioLevel = audioLevel || 0;
        
        // Make transition width respond to audio for dynamic effect
        const baseWidth = 30;
        this.transitionWidth = baseWidth + (this.audioLevel > 0.5 ? (this.audioLevel - 0.5) * 40 : 0);
        
        // Update particles
        this.updateParticles(deltaTime);
    }
    
    // Update particles
    updateParticles(deltaTime) {
        const normalizedDelta = deltaTime / 16.67; // Normalize to 60fps
        
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            
            // Update position
            particle.y += particle.speed * particle.direction * normalizedDelta;
            
            // Bounce at edges
            if (particle.y < 0 || particle.y > this.height) {
                particle.direction *= -1;
                particle.y = Math.max(0, Math.min(this.height, particle.y));
            }
            
            // Update life
            particle.life += normalizedDelta;
            
            // Reset if expired
            if (particle.life > particle.maxLife) {
                // Reset position but keep same transition area
                const panelWidth = this.width / 3;
                particle.x = particle.area === 0 ? 
                          panelWidth - this.transitionWidth/2 + Math.random() * this.transitionWidth : 
                          panelWidth * 2 - this.transitionWidth/2 + Math.random() * this.transitionWidth;
                particle.y = Math.random() * this.height;
                particle.size = 1 + Math.random() * 4;
                particle.speed = 0.2 + Math.random() * 0.8;
                particle.direction = Math.random() > 0.5 ? 1 : -1;
                particle.opacity = 0.2 + Math.random() * 0.4;
                particle.life = 0;
                particle.maxLife = 100 + Math.random() * 150;
            }
        }
    }
    
    // Draw transitions between panels
    draw(pastCanvas, presentCanvas, futureCanvas) {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Calculate panel width
        const panelWidth = this.width / 3;
        
        // First transition (Past → Present)
        const trans1X = panelWidth - this.transitionWidth/2;
        
        // Second transition (Present → Future)
        const trans2X = panelWidth * 2 - this.transitionWidth/2;
        
        // Draw seamless transition gradients 
        this.drawTransition(trans1X, this.transitionWidth, this.pastColor, this.presentColor, "past-present");
        this.drawTransition(trans2X, this.transitionWidth, this.presentColor, this.futureColor, "present-future");
        
        // Draw particle effects 
        this.drawParticles();
        
        // Add subtle glow effect
        this.addGlowEffect();
        
        // Draw debug info if enabled
        if (this.debug) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.font = '12px monospace';
            this.ctx.fillText(`Canvas: ${this.width}x${this.height}`, 10, 20);
            this.ctx.fillText(`Audio: ${this.audioLevel.toFixed(2)}`, 10, 40);
        }
    }
    
    // Draw a gradient transition
    drawTransition(x, width, color1, color2, type) {
        // Create gradient
        const gradient = this.ctx.createLinearGradient(x, 0, x + width, 0);
        
        // Determine colors based on transition type
        if (type === "past-present") {
            // Past to Present: Sepia/Gold to Cyan/Blue
            gradient.addColorStop(0, `rgba(${color1[0]}, ${color1[1]}, ${color1[2]}, 0.4)`);
            gradient.addColorStop(0.3, `rgba(${color1[0]}, ${color1[1]}, ${color1[2]}, 0.2)`);
            gradient.addColorStop(0.5, `rgba(255, 255, 255, 0.3)`); // Bright middle
            gradient.addColorStop(0.7, `rgba(${color2[0]}, ${color2[1]}, ${color2[2]}, 0.2)`);
            gradient.addColorStop(1, `rgba(${color2[0]}, ${color2[1]}, ${color2[2]}, 0.4)`);
        } else {
            // Present to Future: Cyan/Blue to Magenta/Purple
            gradient.addColorStop(0, `rgba(${color1[0]}, ${color1[1]}, ${color1[2]}, 0.4)`);
            gradient.addColorStop(0.3, `rgba(${color1[0]}, ${color1[1]}, ${color1[2]}, 0.2)`);
            gradient.addColorStop(0.5, `rgba(255, 255, 255, 0.3)`); // Bright middle
            gradient.addColorStop(0.7, `rgba(${color2[0]}, ${color2[1]}, ${color2[2]}, 0.2)`);
            gradient.addColorStop(1, `rgba(${color2[0]}, ${color2[1]}, ${color2[2]}, 0.4)`);
        }
        
        // Draw the gradient with screen blend mode for better blending
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, 0, width, this.height);
        
        // Reset composite operation
        this.ctx.globalCompositeOperation = 'source-over';
    }
    
    // Draw particles
    drawParticles() {
        // Use additive blending for particles
        this.ctx.globalCompositeOperation = 'screen';
        
        // Draw each particle
        for (const particle of this.particles) {
            // Calculate opacity - fade in and out
            let opacity = particle.opacity;
            if (particle.life < 10) {
                opacity *= particle.life / 10; // Fade in
            } else if (particle.life > particle.maxLife - 10) {
                opacity *= (particle.maxLife - particle.life) / 10; // Fade out
            }
            
            // Calculate color based on position
            let color;
            if (particle.area === 0) {
                // Past-Present transition
                const t = (particle.x - (this.width/3 - this.transitionWidth/2)) / this.transitionWidth;
                // Blend past and present colors
                const r = Math.round((1-t) * this.pastColor[0] + t * this.presentColor[0]);
                const g = Math.round((1-t) * this.pastColor[1] + t * this.presentColor[1]);
                const b = Math.round((1-t) * this.pastColor[2] + t * this.presentColor[2]);
                color = `rgba(${r}, ${g}, ${b}, ${opacity})`;
            } else {
                // Present-Future transition
                const t = (particle.x - (this.width*2/3 - this.transitionWidth/2)) / this.transitionWidth;
                // Blend present and future colors
                const r = Math.round((1-t) * this.presentColor[0] + t * this.futureColor[0]);
                const g = Math.round((1-t) * this.presentColor[1] + t * this.futureColor[1]);
                const b = Math.round((1-t) * this.presentColor[2] + t * this.futureColor[2]);
                color = `rgba(${r}, ${g}, ${b}, ${opacity})`;
            }
            
            // Draw with glow
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 5;
            this.ctx.fillStyle = color;
            
            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Reset shadow and blend mode
        this.ctx.shadowBlur = 0;
        this.ctx.globalCompositeOperation = 'source-over';
    }
    
    // Add glow effect to transitions
    addGlowEffect() {
        // Calculate panel width
        const panelWidth = this.width / 3;
        
        // Create semi-transparent glow at each transition
        this.ctx.globalCompositeOperation = 'screen';
        
        // Glow for first transition
        const glow1 = this.ctx.createRadialGradient(
            panelWidth, this.height/2, 0,
            panelWidth, this.height/2, panelWidth/2
        );
        glow1.addColorStop(0, `rgba(255, 255, 255, 0.2)`);
        glow1.addColorStop(0.5, `rgba(255, 255, 255, 0.05)`);
        glow1.addColorStop(1, `rgba(255, 255, 255, 0)`);
        
        this.ctx.fillStyle = glow1;
        this.ctx.fillRect(panelWidth - panelWidth/2, 0, panelWidth, this.height);
        
        // Glow for second transition
        const glow2 = this.ctx.createRadialGradient(
            panelWidth * 2, this.height/2, 0,
            panelWidth * 2, this.height/2, panelWidth/2
        );
        glow2.addColorStop(0, `rgba(255, 255, 255, 0.2)`);
        glow2.addColorStop(0.5, `rgba(255, 255, 255, 0.05)`);
        glow2.addColorStop(1, `rgba(255, 255, 255, 0)`);
        
        this.ctx.fillStyle = glow2;
        this.ctx.fillRect(panelWidth * 2 - panelWidth/2, 0, panelWidth, this.height);
        
        // Reset blend mode
        this.ctx.globalCompositeOperation = 'source-over';
    }
}