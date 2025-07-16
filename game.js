class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = 1000;
        this.height = 800;
        
        // Game state
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.score = 0;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.lives = 3;
        this.level = 1;
        
        // Game objects
        this.player = null;
        this.bullets = [];
        this.enemies = [];
        this.powerUpManager = new PowerUpManager();
        this.particleSystem = new ParticleSystem();
        this.audioManager = new AudioManager();
        
        // Spawn timers
        this.enemySpawnTimer = 0;
        this.enemySpawnRate = 120; // frames between spawns
        this.lastFrameTime = 0;
        
        // High scores
        this.highScores = this.loadHighScores();
        
        // Input handling
        this.keys = {};
        this.setupEventListeners();
        
        // Initialize UI
        this.setupUI();
        
        // Start game loop
        this.gameLoop();
    }

    setupEventListeners() {
        // Keyboard input
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code] = true;
            
            if (e.key === 'p' || e.key === 'P') {
                this.togglePause();
            }
            
            if (e.key === ' ') {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.handleShooting();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
        });

        // Mouse clicks for UI
        document.addEventListener('click', (e) => {
            this.audioManager.resumeContext();
        });
    }

    setupUI() {
        // Menu buttons
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('highScoreButton').addEventListener('click', () => {
            this.showHighScores();
        });

        document.getElementById('controlsButton').addEventListener('click', () => {
            this.showControls();
        });

        document.getElementById('restartButton').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('menuButton').addEventListener('click', () => {
            this.showMainMenu();
        });

        document.getElementById('backButton').addEventListener('click', () => {
            this.showMainMenu();
        });

        document.getElementById('backFromControlsButton').addEventListener('click', () => {
            this.showMainMenu();
        });

        document.getElementById('resumeButton').addEventListener('click', () => {
            this.resumeGame();
        });

        document.getElementById('pauseMenuButton').addEventListener('click', () => {
            this.showMainMenu();
        });
    }

    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.startTime = Date.now();
        this.elapsedTime = 0;
        
        // Reset game objects
        this.player = new Player(this.width / 2 - 20, this.height - 80);
        this.bullets = [];
        this.enemies = [];
        this.powerUpManager.clear();
        this.particleSystem.particles = [];
        
        // Reset spawn rate
        this.enemySpawnRate = 120;
        this.enemySpawnTimer = 0;
        
        // Hide menu screens and show HUD
        this.hideAllScreens();
        document.getElementById('hud').classList.remove('hidden');
        
        this.updateHUD();
    }

    showMainMenu() {
        this.gameState = 'menu';
        this.hideAllScreens();
        document.getElementById('mainMenu').classList.remove('hidden');
    }

    showGameOver() {
        this.gameState = 'gameOver';
        this.audioManager.playGameOver();
        
        // Check for high score
        this.checkHighScore();
        
        // Update game over screen
        document.getElementById('finalScore').textContent = `Score: ${this.score}`;
        document.getElementById('finalTime').textContent = `Time: ${Math.floor(this.elapsedTime)}s`;
        
        // Show game over screen
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }

    showHighScores() {
        this.hideAllScreens();
        
        const scoresList = document.getElementById('highScoresList');
        scoresList.innerHTML = '';
        
        if (this.highScores.length === 0) {
            scoresList.innerHTML = '<div class="score-item">No high scores yet!</div>';
        } else {
            this.highScores.forEach((score, index) => {
                const scoreItem = document.createElement('div');
                scoreItem.className = 'score-item';
                scoreItem.innerHTML = `
                    <span>#${index + 1}</span>
                    <span>${score.score} pts (${score.time}s)</span>
                `;
                scoresList.appendChild(scoreItem);
            });
        }
        
        document.getElementById('highScoresScreen').classList.remove('hidden');
    }

    showControls() {
        this.hideAllScreens();
        document.getElementById('controlsScreen').classList.remove('hidden');
    }

    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pauseScreen').classList.remove('hidden');
        } else if (this.gameState === 'paused') {
            this.resumeGame();
        }
    }

    resumeGame() {
        this.gameState = 'playing';
        document.getElementById('pauseScreen').classList.add('hidden');
    }

    hideAllScreens() {
        const screens = ['mainMenu', 'gameOverScreen', 'highScoresScreen', 'controlsScreen', 'pauseScreen'];
        screens.forEach(screen => {
            document.getElementById(screen).classList.add('hidden');
        });
    }

    handleInput() {
        if (this.gameState !== 'playing') return;
        
        const speed = this.player.getSpeed();
        
        // Movement
        if ((this.keys['a'] || this.keys['ArrowLeft']) && this.player.x > 0) {
            this.player.x -= speed;
        }
        if ((this.keys['d'] || this.keys['ArrowRight']) && this.player.x < this.width - this.player.width) {
            this.player.x += speed;
        }
    }

    handleShooting() {
        if (this.player && this.player.canShoot()) {
            const newBullets = this.player.shoot();
            this.bullets.push(...newBullets);
            this.audioManager.playShoot();
        }
    }

    spawnEnemies() {
        if (this.gameState !== 'playing') return;
        
        this.enemySpawnTimer++;
        
        if (this.enemySpawnTimer >= this.enemySpawnRate) {
            this.enemySpawnTimer = 0;
            
            // Spawn multiple enemies based on level
            const enemyCount = Math.min(1 + Math.floor(this.level / 3), 4);
            
            for (let i = 0; i < enemyCount; i++) {
                const x = Math.random() * (this.width - 30);
                const enemyType = this.getRandomEnemyType();
                this.enemies.push(new Enemy(x, -30, enemyType));
            }
            
            // Increase difficulty over time
            this.enemySpawnRate = Math.max(30, this.enemySpawnRate - 1);
        }
    }

    getRandomEnemyType() {
        const types = ['basic', 'fast', 'tank', 'zigzag'];
        const weights = [40, 25, 20, 15]; // Percentage chances
        
        let random = Math.random() * 100;
        let cumulativeWeight = 0;
        
        for (let i = 0; i < types.length; i++) {
            cumulativeWeight += weights[i];
            if (random <= cumulativeWeight) {
                return types[i];
            }
        }
        
        return 'basic';
    }

    updateGame() {
        if (this.gameState !== 'playing') return;
        
        // Update elapsed time
        this.elapsedTime = (Date.now() - this.startTime) / 1000;
        this.level = Math.floor(this.elapsedTime / 20) + 1; // New level every 20 seconds
        
        // Update player
        this.player.update();
        
        // Generate engine trail particles
        if (Math.random() < 0.3) {
            this.particleSystem.createEngineTrail(
                this.player.x + this.player.width/2,
                this.player.y + this.player.height
            );
        }
        
        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update();
            
            // Remove bullets that are off screen
            if (bullet.y < -10) {
                this.bullets.splice(i, 1);
            }
        }
        
        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update();
            
            // Remove enemies that are off screen
            if (enemy.y > this.height + 50) {
                this.enemies.splice(i, 1);
            }
        }
        
        // Check collisions
        this.checkCollisions();
        
        // Update power-ups
        this.powerUpManager.update();
        
        // Check power-up collisions
        const powerUpType = this.powerUpManager.checkCollisions(this.player);
        if (powerUpType) {
            this.audioManager.playPowerUp();
            this.particleSystem.createPowerUpEffect(
                this.player.x + this.player.width/2,
                this.player.y + this.player.height/2
            );
        }
        
        // Update particles
        this.particleSystem.update();
        
        // Spawn enemies
        this.spawnEnemies();
        
        // Update HUD
        this.updateHUD();
    }

    checkCollisions() {
        // Bullet-Enemy collisions
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (bullet.collidesWith(enemy)) {
                    // Remove bullet
                    this.bullets.splice(i, 1);
                    
                    // Damage enemy
                    const destroyed = enemy.takeDamage();
                    if (destroyed) {
                        // Remove enemy and add score
                        this.enemies.splice(j, 1);
                        this.score += enemy.points;
                        
                        // Create explosion effect
                        this.particleSystem.createExplosion(
                            enemy.x + enemy.width/2,
                            enemy.y + enemy.height/2
                        );
                        
                        // Try to spawn power-up
                        this.powerUpManager.trySpawnPowerUp(enemy.x, enemy.y);
                        
                        this.audioManager.playExplosion();
                    }
                    break;
                }
            }
        }
        
        // Player-Enemy collisions
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            if (enemy.collidesWith(this.player)) {
                // Remove enemy
                this.enemies.splice(i, 1);
                
                // Damage player
                const damaged = this.player.takeDamage();
                if (damaged) {
                    this.lives--;
                    this.audioManager.playHit();
                    
                    // Create explosion effect
                    this.particleSystem.createExplosion(
                        this.player.x + this.player.width/2,
                        this.player.y + this.player.height/2,
                        '#ff4444'
                    );
                    
                    // Check game over
                    if (this.lives <= 0) {
                        this.showGameOver();
                        return;
                    }
                }
            }
        }
    }

    updateHUD() {
        document.getElementById('scoreValue').textContent = this.score;
        document.getElementById('timeValue').textContent = `${Math.floor(this.elapsedTime)}s`;
        document.getElementById('livesValue').textContent = this.lives;
        
        // Update power-up status
        const powerUpStatus = document.getElementById('powerUpStatus');
        powerUpStatus.innerHTML = '';
        
        if (this.player) {
            if (this.player.powerUps.shield > 0) {
                powerUpStatus.innerHTML += '<div class="power-up-icon"><i class="fas fa-shield-alt"></i></div>';
            }
            if (this.player.powerUps.speed > 0) {
                powerUpStatus.innerHTML += '<div class="power-up-icon"><i class="fas fa-bolt"></i></div>';
            }
            if (this.player.powerUps.multiShot > 0) {
                powerUpStatus.innerHTML += '<div class="power-up-icon"><i class="fas fa-crosshairs"></i></div>';
            }
        }
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw stars background
        this.drawStarField();
        
        if (this.gameState === 'playing' || this.gameState === 'paused') {
            // Draw game objects
            if (this.player) {
                this.player.draw(this.ctx);
            }
            
            for (const bullet of this.bullets) {
                bullet.draw(this.ctx);
            }
            
            for (const enemy of this.enemies) {
                enemy.draw(this.ctx);
            }
            
            this.powerUpManager.draw(this.ctx);
            this.particleSystem.draw(this.ctx);
        }
        
        // Draw pause overlay
        if (this.gameState === 'paused') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
    }

    drawStarField() {
        // Simple star field effect
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 100; i++) {
            const x = (i * 137.5) % this.width;
            const y = ((i * 137.5 + Date.now() * 0.1) % this.height);
            const size = Math.sin(i) * 1.5 + 1.5;
            this.ctx.fillRect(x, y, size, size);
        }
    }

    checkHighScore() {
        const newScore = {
            score: this.score,
            time: Math.floor(this.elapsedTime)
        };
        
        this.highScores.push(newScore);
        this.highScores.sort((a, b) => b.score - a.score);
        this.highScores = this.highScores.slice(0, 10); // Keep top 10
        
        this.saveHighScores();
    }

    loadHighScores() {
        try {
            const saved = localStorage.getItem('spaceGameHighScores');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }

    saveHighScores() {
        try {
            localStorage.setItem('spaceGameHighScores', JSON.stringify(this.highScores));
        } catch (e) {
            console.warn('Could not save high scores');
        }
    }

    gameLoop() {
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // Handle input
        this.handleInput();
        
        // Update game
        this.updateGame();
        
        // Render
        this.render();
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
