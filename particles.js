class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    createExplosion(x, y, color = '#ff4444', count = 15) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color, 'explosion'));
        }
    }

    createEngineTrail(x, y) {
        this.particles.push(new Particle(x, y, '#00aaff', 'trail'));
    }

    createPowerUpEffect(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push(new Particle(x, y, '#ffff00', 'sparkle'));
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update();
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (const particle of this.particles) {
            particle.draw(ctx);
        }
    }
}

class Particle {
    constructor(x, y, color, type) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
        this.life = 1.0;
        this.maxLife = 1.0;
        
        switch (type) {
            case 'explosion':
                this.vx = (Math.random() - 0.5) * 8;
                this.vy = (Math.random() - 0.5) * 8;
                this.decay = 0.02;
                this.size = Math.random() * 4 + 2;
                break;
            case 'trail':
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = Math.random() * 2 + 1;
                this.decay = 0.05;
                this.size = Math.random() * 2 + 1;
                break;
            case 'sparkle':
                this.vx = (Math.random() - 0.5) * 4;
                this.vy = (Math.random() - 0.5) * 4;
                this.decay = 0.03;
                this.size = Math.random() * 3 + 1;
                break;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        
        if (this.type === 'trail') {
            this.vy += 0.1; // Gravity effect
        }
        
        this.vx *= 0.98; // Air resistance
        this.vy *= 0.98;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10 * this.life;
        ctx.fill();
        
        ctx.restore();
    }
}