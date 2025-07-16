class PowerUp extends Entity {
    constructor(x, y, type) {
        super(x, y, 20, 20, '#ffff00');
        this.type = type;
        this.vy = 2;
        this.rotationSpeed = 0.1;
        this.rotation = 0;
        this.setupByType();
    }

    setupByType() {
        switch (this.type) {
            case 'shield':
                this.color = '#00ffff';
                this.icon = '🛡️';
                break;
            case 'speed':
                this.color = '#00ff00';
                this.icon = '⚡';
                break;
            case 'multiShot':
                this.color = '#ffff00';
                this.icon = '🔫';
                break;
        }
    }

    update() {
        super.update();
        this.rotation += this.rotationSpeed;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.rotation);
        
        // Draw power-up with glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Draw inner core
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-this.width/4, -this.height/4, this.width/2, this.height/2);
        
        ctx.restore();
    }

    static getRandomType() {
        const types = ['shield', 'speed', 'multiShot'];
        return types[Math.floor(Math.random() * types.length)];
    }
}

class PowerUpManager {
    constructor() {
        this.powerUps = [];
        this.spawnChance = 0.1; // 10% chance per enemy kill
    }

    update() {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUp.update();
            
            // Remove power-ups that have moved off screen
            if (powerUp.y > 800) {
                this.powerUps.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (const powerUp of this.powerUps) {
            powerUp.draw(ctx);
        }
    }

    trySpawnPowerUp(x, y) {
        if (Math.random() < this.spawnChance) {
            const type = PowerUp.getRandomType();
            this.powerUps.push(new PowerUp(x, y, type));
        }
    }

    checkCollisions(player) {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (powerUp.collidesWith(player)) {
                player.applyPowerUp(powerUp.type);
                this.powerUps.splice(i, 1);
                return powerUp.type;
            }
        }
        return null;
    }

    clear() {
        this.powerUps = [];
    }
}
