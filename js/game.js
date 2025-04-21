// Configurações do jogo
const config = {
    width: window.innerWidth,
    height: window.innerHeight,
    playerSpeed: 8,
    bulletSpeed: 10,
    enemySpeed: 3,
    meteorSpeed: 4,
    energySpeed: 3,
    spawnRate: 60,
    bossSpawnScore: 150,
    levels: 4,
    levelMultipliers: [1, 1.3, 1.7, 2.2]
};

// Elementos do DOM
const screens = {
    menu: document.getElementById('menu-screen'),
    instructions: document.getElementById('instructions-screen'),
    credits: document.getElementById('credits-screen'),
    game: document.getElementById('game-screen'),
    gameOver: document.getElementById('game-over-screen'),
    levelComplete: document.getElementById('level-complete-screen'),
    gameComplete: document.getElementById('game-complete-screen')
};

const buttons = {
    play: document.getElementById('play-btn'),
    howToPlay: document.getElementById('how-to-play-btn'),
    credits: document.getElementById('credits-btn'),
    backFromInstructions: document.getElementById('back-from-instructions'),
    backFromCredits: document.getElementById('back-from-credits'),
    restart: document.getElementById('restart-btn'),
    returnToMenu: document.getElementById('return-to-menu-btn'),
    nextLevel: document.getElementById('next-level-btn'),
    playAgain: document.getElementById('play-again-btn'),
    backToMenu: document.getElementById('back-to-menu-btn'),
    moveLeft: document.getElementById('move-left'),
    moveRight: document.getElementById('move-right'),
    shoot: document.getElementById('shoot-btn')
};

const uiElements = {
    score: document.getElementById('score'),
    lives: document.getElementById('lives'),
    level: document.getElementById('level'),
    finalScore: document.getElementById('final-score'),
    totalScore: document.getElementById('total-score')
};

// Estado do jogo
let gameState = {
    running: false,
    score: 0,
    lives: 4,
    level: 1,
    frameCount: 0,
    keys: {},
    player: null,
    bullets: [],
    enemies: [],
    meteors: [],
    energyCapsules: [],
    bosses: [],
    bossActive: false,
    animationId: null
};

// Cores
const colors = {
    player: '#4fc3f7',
    enemy1: '#f44336',
    enemy2: '#ff9800',
    boss1: '#e91e63',
    boss2: '#9c27b0',
    boss3: '#673ab7',
    boss4: '#3f51b5',
    meteor: '#795548',
    energy: '#4caf50',
    bullet: '#ffeb3b',
    background: '#000033'
};

// Inicialização do canvas
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function initCanvas() {
    canvas.width = config.width;
    canvas.height = config.height;
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, config.width, config.height);
}

// Classes do jogo
class GameObject {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.speedX = 0;
        this.speedY = 0;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    collidesWith(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
}

class Player extends GameObject {
    constructor() {
        const x = config.width / 2 - 25;
        const y = config.height - 80;
        super(x, y, 50, 50, colors.player);
        this.speed = config.playerSpeed;
        this.cooldown = 0;
        this.maxCooldown = 10;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        // Cabine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + 20, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        if (gameState.keys.ArrowLeft || gameState.keys.a || buttons.moveLeft.pressed) {
            this.x -= this.speed;
        }
        if (gameState.keys.ArrowRight || gameState.keys.d || buttons.moveRight.pressed) {
            this.x += this.speed;
        }

        this.x = Math.max(0, Math.min(config.width - this.width, this.x));
        
        if (this.cooldown > 0) this.cooldown--;
    }

    shoot() {
        if (this.cooldown === 0) {
            const bullet = new Bullet(this.x + this.width/2 - 3, this.y);
            gameState.bullets.push(bullet);
            this.cooldown = this.maxCooldown;
        }
    }
}

class Bullet extends GameObject {
    constructor(x, y) {
        super(x, y, 6, 20, colors.bullet);
        this.speedY = -config.bulletSpeed;
    }

    update() {
        super.update();
        return this.y + this.height < 0;
    }
}

class Enemy extends GameObject {
    constructor(x, y, type = 1) {
        const size = type === 1 ? 40 : 50;
        super(x, y, size, size, type === 1 ? colors.enemy1 : colors.enemy2);
        this.type = type;
        this.speedY = config.enemySpeed * config.levelMultipliers[gameState.level - 1];
        this.health = gameState.level > 2 ? 2 : 1;
        this.shootCooldown = Math.floor(Math.random() * 100) + 50;
    }

    draw() {
        ctx.fillStyle = this.color;
        
        if (this.type === 1) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height/2);
            ctx.lineTo(this.x, this.y + this.height);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillRect(this.x, this.y + this.height/3, this.width, this.height/3);
        }
    }

    update() {
        if (Math.random() < 0.02) {
            this.speedX = (Math.random() - 0.5) * 3 * config.levelMultipliers[gameState.level - 1];
        }

        if (this.x < 0 || this.x > config.width - this.width) {
            this.speedX *= -1;
        }

        super.update();

        this.shootCooldown--;
        if (this.shootCooldown <= 0 && Math.random() < 0.05) {
            this.shoot();
            this.shootCooldown = Math.floor(Math.random() * 100) + 50;
        }

        return this.y > config.height;
    }

    shoot() {
        const bullet = new Bullet(this.x + this.width/2 - 3, this.y + this.height);
        bullet.speedY = config.bulletSpeed * 0.7 * config.levelMultipliers[gameState.level - 1];
        gameState.enemies.push(bullet);
    }

    hit() {
        this.health--;
        return this.health <= 0;
    }
}

class Boss extends Enemy {
    constructor(level) {
        const width = 100 + level * 20;
        const height = 80 + level * 15;
        const x = config.width / 2 - width / 2;
        const y = 50;
        
        const bossColors = [colors.boss1, colors.boss2, colors.boss3, colors.boss4];
        super(x, y, width, height, bossColors[level - 1]);
        this.speedX = 2 * config.levelMultipliers[level - 1];
        this.maxHealth = level * 3;
        this.health = this.maxHealth;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, Math.PI, Math.PI * 2);
        ctx.fill();
    }

    update() {
        this.x += this.speedX;
        if (this.x < 0 || this.x > config.width - this.width) {
            this.speedX *= -1;
        }

        this.shootCooldown--;
        if (this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = Math.floor(Math.random() * 30) + 20;
        }

        return false;
    }
}

class Meteor extends GameObject {
    constructor() {
        const size = Math.random() * 30 + 20;
        const x = Math.random() * (config.width - size);
        const y = -size;
        super(x, y, size, size, colors.meteor);
        this.speedY = config.meteorSpeed * config.levelMultipliers[gameState.level - 1];
        this.speedX = (Math.random() - 0.5) * 2;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
        ctx.fill();
    }
}

class EnergyCapsule extends GameObject {
    constructor(x, y) {
        const size = 20;
        super(x, y, size, size, colors.energy);
        this.speedY = config.energySpeed;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Funções do jogo
function spawnEnemies() {
    const type = Math.random() > 0.7 ? 2 : 1;
    const enemy = new Enemy(
        Math.random() * (config.width - (type === 1 ? 40 : 50)),
        - (type === 1 ? 40 : 50),
        type
    );
    gameState.enemies.push(enemy);
}

function spawnMeteors() {
    const meteor = new Meteor();
    gameState.meteors.push(meteor);
}

function spawnBoss() {
    const boss = new Boss(gameState.level);
    gameState.bosses.push(boss);
    gameState.bossActive = true;
}

function spawnEnergyCapsule(x, y) {
    const capsule = new EnergyCapsule(x, y);
    gameState.energyCapsules.push(capsule);
}

function checkCollisions() {
    // Balas do jogador com inimigos
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        for (let j = gameState.enemies.length - 1; j >= 0; j--) {
            if (gameState.bullets[i].collidesWith(gameState.enemies[j])) {
                gameState.bullets.splice(i, 1);
                
                if (gameState.enemies[j].hit()) {
                    gameState.score += 10;
                    
                    if (Math.random() < 0.2 && gameState.lives < 4) {
                        spawnEnergyCapsule(
                            gameState.enemies[j].x + gameState.enemies[j].width/2,
                            gameState.enemies[j].y + gameState.enemies[j].height/2
                        );
                    }
                    
                    gameState.enemies.splice(j, 1);
                }
                break;
            }
        }
        
        // Balas do jogador com chefão
        for (let j = gameState.bosses.length - 1; j >= 0; j--) {
            if (gameState.bullets[i].collidesWith(gameState.bosses[j])) {
                gameState.bullets.splice(i, 1);
                
                if (gameState.bosses[j].hit()) {
                    gameState.score += 50;
                }
                break;
            }
        }
    }
    
    // Jogador com inimigos
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        if (gameState.player.collidesWith(gameState.enemies[i])) {
            gameState.enemies.splice(i, 1);
            takeDamage();
        }
    }
    
    // Jogador com meteoros
    for (let i = gameState.meteors.length - 1; i >= 0; i--) {
        if (gameState.player.collidesWith(gameState.meteors[i])) {
            gameState.meteors.splice(i, 1);
            takeDamage();
        }
    }
    
    // Jogador com cápsulas de energia
    for (let i = gameState.energyCapsules.length - 1; i >= 0; i--) {
        if (gameState.player.collidesWith(gameState.energyCapsules[i])) {
            gameState.energyCapsules.splice(i, 1);
            gainLife();
        }
    }
    
    // Balas dos inimigos com jogador
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        if (gameState.enemies[i] instanceof Bullet && 
            gameState.player.collidesWith(gameState.enemies[i])) {
            gameState.enemies.splice(i, 1);
            takeDamage();
        }
    }
}

function takeDamage() {
    gameState.lives--;
    updateUI();
    
    if (gameState.lives <= 0) {
        gameOver();
    }
}

function gainLife() {
    if (gameState.lives < 4) {
        gameState.lives++;
        updateUI();
    }
}

function updateUI() {
    uiElements.score.textContent = gameState.score;
    uiElements.lives.textContent = gameState.lives;
    uiElements.level.textContent = gameState.level;
}

function bossDefeated() {
    gameState.bossActive = false;
    
    if (gameState.level < config.levels) {
        levelComplete();
    } else {
        gameComplete();
    }
}

function levelComplete() {
    gameState.running = false;
    screens.levelComplete.classList.remove('hidden');
}

function nextLevel() {
    gameState.level++;
    gameState.frameCount = 0;
    gameState.bullets = [];
    gameState.enemies = [];
    gameState.meteors = [];
    gameState.energyCapsules = [];
    gameState.bosses = [];
    gameState.bossActive = false;
    screens.levelComplete.classList.add('hidden');
    gameState.running = true;
    gameState.animationId = requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameState.running = false;
    uiElements.finalScore.textContent = gameState.score;
    screens.gameOver.classList.remove('hidden');
}

function gameComplete() {
    gameState.running = false;
    uiElements.totalScore.textContent = gameState.score;
    screens.gameComplete.classList.remove('hidden');
}

// Loop principal
function gameLoop() {
    if (!gameState.running) return;
    
    // Limpar canvas
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, config.width, config.height);
    
    // Desenhar estrelas de fundo
    if (gameState.frameCount % 10 === 0) {
        ctx.fillStyle = 'white';
        for (let i = 0; i < 3; i++) {
            const x = Math.random() * config.width;
            const y = Math.random() * config.height;
            const size = Math.random() * 2 + 1;
            ctx.fillRect(x, y, size, size);
        }
    }
    
    // Atualizar estado do jogo
    gameState.frameCount++;
    gameState.player.update();
    
    // Atualizar balas
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        if (gameState.bullets[i].update()) {
            gameState.bullets.splice(i, 1);
        }
    }
    
    // Atualizar inimigos
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        if (gameState.enemies[i].update()) {
            gameState.enemies.splice(i, 1);
        }
    }
    
    // Atualizar meteoros
    for (let i = gameState.meteors.length - 1; i >= 0; i--) {
        if (gameState.meteors[i].update()) {
            gameState.meteors.splice(i, 1);
        }
    }
    
    // Atualizar cápsulas de energia
    for (let i = gameState.energyCapsules.length - 1; i >= 0; i--) {
        if (gameState.energyCapsules[i].update()) {
            gameState.energyCapsules.splice(i, 1);
        }
    }
    
    // Atualizar chefões
    for (let i = gameState.bosses.length - 1; i >= 0; i--) {
        if (gameState.bosses[i].update()) {
            gameState.bosses.splice(i, 1);
        }
    }
    
    // Verificar colisões
    checkCollisions();
    
    // Spawn de inimigos e meteoros
    if (gameState.frameCount % Math.floor(config.spawnRate / config.levelMultipliers[gameState.level - 1]) === 0 && 
        !gameState.bossActive) {
        spawnEnemies();
        spawnMeteors();
    }
    
    // Verificar se deve spawnar o chefão
    if (gameState.score >= config.bossSpawnScore * gameState.level && 
        !gameState.bossActive && 
        gameState.bosses.length === 0) {
        spawnBoss();
    }
    
    // Verificar se derrotou o chefão
    if (gameState.bossActive && gameState.bosses.length === 0) {
        bossDefeated();
    }
    
    // Desenhar elementos
    gameState.player.draw();
    gameState.bullets.forEach(bullet => bullet.draw());
    gameState.enemies.forEach(enemy => enemy.draw());
    gameState.meteors.forEach(meteor => meteor.draw());
    gameState.energyCapsules.forEach(capsule => capsule.draw());
    gameState.bosses.forEach(boss => boss.draw());
    
    // Continuar loop
    gameState.animationId = requestAnimationFrame(gameLoop);
}

// Inicialização do jogo
function initGame() {
    initCanvas();
    
    // Resetar estado do jogo
    gameState = {
        running: true,
        score: 0,
        lives: 4,
        level: 1,
        frameCount: 0,
        keys: {},
        player: new Player(),
        bullets: [],
        enemies: [],
        meteors: [],
        energyCapsules: [],
        bosses: [],
        bossActive: false,
        animationId: null
    };
    
    // Esconder telas
    screens.menu.classList.add('hidden');
    screens.instructions.classList.add('hidden');
    screens.credits.classList.add('hidden');
    screens.gameOver.classList.add('hidden');
    screens.levelComplete.classList.add('hidden');
    screens.gameComplete.classList.add('hidden');
    
    // Mostrar tela do jogo
    screens.game.classList.remove('hidden');
    updateUI();
    
    // Iniciar loop
    gameState.animationId = requestAnimationFrame(gameLoop);
}

// Event listeners
buttons.play.addEventListener('click', initGame);
buttons.howToPlay.addEventListener('click', () => {
    screens.menu.classList.add('hidden');
    screens.instructions.classList.remove('hidden');
});
buttons.credits.addEventListener('click', () => {
    screens.menu.classList.add('hidden');
    screens.credits.classList.remove('hidden');
});
buttons.backFromInstructions.addEventListener('click', () => {
    screens.instructions.classList.add('hidden');
    screens.menu.classList.remove('hidden');
});
buttons.backFromCredits.addEventListener('click', () => {
    screens.credits.classList.add('hidden');
    screens.menu.classList.remove('hidden');
});
buttons.restart.addEventListener('click', initGame);
buttons.returnToMenu.addEventListener('click', () => {
    screens.gameOver.classList.add('hidden');
    screens.game.classList.add('hidden');
    screens.menu.classList.remove('hidden');
});
buttons.nextLevel.addEventListener('click', nextLevel);
buttons.playAgain.addEventListener('click', initGame);
buttons.backToMenu.addEventListener('click', () => {
    screens.gameComplete.classList.add('hidden');
    screens.game.classList.add('hidden');
    screens.menu.classList.remove('hidden');
});

// Controles de teclado
window.addEventListener('keydown', (e) => {
    gameState.keys[e.key] = true;
    
    if (e.key === ' ' && gameState.running) {
        gameState.player.shoot();
    }
});

window.addEventListener('keyup', (e) => {
    gameState.keys[e.key] = false;
});

// Controles mobile
buttons.moveLeft.addEventListener('mousedown', () => {
    buttons.moveLeft.pressed = true;
});
buttons.moveLeft.addEventListener('mouseup', () => {
    buttons.moveLeft.pressed = false;
});
buttons.moveLeft.addEventListener('touchstart', () => {
    buttons.moveLeft.pressed = true;
});
buttons.moveLeft.addEventListener('touchend', () => {
    buttons.moveLeft.pressed = false;
});

buttons.moveRight.addEventListener('mousedown', () => {
    buttons.moveRight.pressed = true;
});
buttons.moveRight.addEventListener('mouseup', () => {
    buttons.moveRight.pressed = false;
});
buttons.moveRight.addEventListener('touchstart', () => {
    buttons.moveRight.pressed = true;
});
buttons.moveRight.addEventListener('touchend', () => {
    buttons.moveRight.pressed = false;
});

buttons.shoot.addEventListener('click', () => {
    if (gameState.running) {
        gameState.player.shoot();
    }
});

// Redimensionamento
window.addEventListener('resize', () => {
    config.width = window.innerWidth;
    config.height = window.innerHeight;
    canvas.width = config.width;
    canvas.height = config.height;
    
    if (gameState.player && gameState.player.x > config.width - gameState.player.width) {
        gameState.player.x = config.width - gameState.player.width;
    }
});

// Inicializar quando a página carregar
window.addEventListener('load', () => {
    initCanvas();
    screens.menu.classList.remove('hidden');
});