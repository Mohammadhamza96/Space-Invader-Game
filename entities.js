class Entity {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.vx = 0;
        this.vy = 0;
        this.health = 1;
        this.maxHealth = 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    collidesWith(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }
}

class Player extends Entity {
    constructor(x, y) {
        super(x, y, 40, 60, '#00ff00');
        this.speed = 5;
        this.health = 3;
        this.maxHealth = 3;
        this.shootCooldown = 0;
        this.powerUps = {
            shield: 0,
            speed: 0,
            multiShot: 0
        };
    }

    update() {
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
        
        // Update power-up timers
        for (const powerUp in this.powerUps) {
            if (this.powerUps[powerUp] > 0) {
                this.powerUps[powerUp]--;
            }
        }
        
        super.update();
    }

    draw(ctx) {
        // Draw player ship with more detail
        ctx.save();
        
        // Shield effect
        if (this.powerUps.shield > 0) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 35, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Main ship body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y + 20, this.width, this.height - 20);
        
        // Ship nose
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2, this.y);
        ctx.lineTo(this.x + 10, this.y + 20);
        ctx.lineTo(this.x + this.width - 10, this.y + 20);
        ctx.closePath();
        ctx.fill();
        
        // Engine exhausts
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(this.x + 5, this.y + this.height, 8, 10);
        ctx.fillRect(this.x + this.width - 13, this.y + this.height, 8, 10);
        
        // Cockpit
        ctx.fillStyle = '#00aaff';
        ctx.fillRect(this.x + 15, this.y + 15, 10, 15);
        
        ctx.restore();
    }

    canShoot() {
        return this.shootCooldown <= 0;
    }

    shoot() {
        if (this.canShoot()) {
            this.shootCooldown = this.powerUps.multiShot > 0 ? 10 : 15;
            
            const bullets = [];
            const centerX = this.x + this.width / 2;
            const startY = this.y;
            
            if (this.powerUps.multiShot > 0) {
                // Multi-shot: 3 bullets
                bullets.push(new Bullet(centerX - 5, startY, 0, -8));
                bullets.push(new Bullet(centerX - 10, startY, -1, -8));
                bullets.push(new Bullet(centerX, startY, 1, -8));
            } else {
                // Single shot
                bullets.push(new Bullet(centerX - 5, startY, 0, -8));
            }
            
            return bullets;
        }
        return [];
    }

    takeDamage() {
        if (this.powerUps.shield > 0) {
            this.powerUps.shield = 0; // Shield absorbs damage
            return false;
        }
        this.health--;
        return true;
    }

    applyPowerUp(type) {
        switch (type) {
            case 'shield':
                this.powerUps.shield = 600; // 10 seconds at 60 FPS
                break;
            case 'speed':
                this.powerUps.speed = 600;
                break;
            case 'multiShot':
                this.powerUps.multiShot = 600;
                break;
        }
    }

    getSpeed() {
        return this.powerUps.speed > 0 ? this.speed * 1.5 : this.speed;
    }
}

class Bullet extends Entity {
    constructor(x, y, vx, vy) {
        super(x, y, 4, 10, '#ffff00');
        this.vx = vx;
        this.vy = vy;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}

class Enemy extends Entity {
    constructor(x, y, type) {
        super(x, y, 30, 30, '#ff0000');
        this.type = type;
        this.points = 10;
        this.setupByType();
    }

    setupByType() {
        switch (this.type) {
            case 'basic':
                this.vy = 2;
                this.points = 10;
                this.color = '#ff4444';
                break;
            case 'fast':
                this.vy = 4;
                this.points = 20;
                this.color = '#ff8844';
                this.width = 25;
                this.height = 25;
                break;
            case 'tank':
                this.vy = 1;
                this.points = 30;
                this.color = '#ff0000';
                this.width = 40;
                this.height = 40;
                this.health = 2;
                break;
            case 'zigzag':
                this.vy = 2;
                this.vx = Math.random() > 0.5 ? 2 : -2;
                this.points = 25;
                this.color = '#ff44ff';
                this.direction = 1;
                break;
        }
    }

    update() {
        if (this.type === 'zigzag') {
            // Zigzag movement
            if (this.x <= 0 || this.x >= 1000 - this.width) {
                this.vx *= -1;
            }
        }
        super.update();
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        
        // Draw enemy ship
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add some detail based on type
        switch (this.type) {
            case 'basic':
                ctx.fillStyle = '#ff8888';
                ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, this.height - 10);
                break;
            case 'fast':
                ctx.fillStyle = '#ffaa88';
                ctx.beginPath();
                ctx.moveTo(this.x + this.width/2, this.y + this.height);
                ctx.lineTo(this.x, this.y);
                ctx.lineTo(this.x + this.width, this.y);
                ctx.closePath();
                ctx.fill();
                break;
            case 'tank':
                ctx.fillStyle = '#ff4444';
                ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, this.height - 10);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(this.x + 15, this.y + 15, 10, 10);
                break;
            case 'zigzag':
                ctx.fillStyle = '#ff88ff';
                ctx.beginPath();
                ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        
        ctx.restore();
    }

    takeDamage() {
        this.health--;
        return this.health <= 0;
    }
}
