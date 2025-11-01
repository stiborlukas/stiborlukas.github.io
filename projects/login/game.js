const Game = {
    width: 0,
    height: 0,
    paddleSpeed: 8,
    charSpeed: 1,
    spawnInterval: 800,
    maxChars: 50,
    chars: [],
    isRunning: true,
    init() {
        this.canvas = document.getElementById('game-area');
        this.paddle = document.getElementById('paddle');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.loginBtn = document.getElementById('login-btn');
        this.gameContainer = document.querySelector('.game-container');
        this.paddleContainer = document.querySelector('.paddle-container');
        this.fieldController = new FieldController(this.emailInput, this.passwordInput, this.loginBtn);
        this.paddleController = new Paddle(this.paddle, this.paddleSpeed, this);
        this.spawner = new Spawner(this);
        this.resize();
        window.addEventListener('resize', () => this.resize());
        document.addEventListener('keydown', (e) => this.handleKey(e));
        document.addEventListener('keyup', (e) => this.paddleController.handleKeyUp(e));
        this.spawner.start();
        this.loop();
    },
    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.paddleController.updateBounds(this.width);
    },
    handleKey(e) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            this.fieldController.switchField(e.key);
            e.preventDefault();
        } else if (e.key === 'Backspace') {
            this.fieldController.deleteChar();
            e.preventDefault();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            this.paddleController.handleKeyDown(e);
            e.preventDefault();
        } else {
            e.preventDefault();
        }
    },
    loop() {
        if (!this.isRunning) return;
        this.paddleController.update();
        this.chars.forEach(char => char.update());
        this.chars = this.chars.filter(char => !char.isDead);
        requestAnimationFrame(() => this.loop());
    },
    addChar(char) {
        if (this.chars.length < this.maxChars) {
            this.chars.push(char);
        }
    },
    checkCollision(char) {
        const paddleRect = this.paddle.getBoundingClientRect();
        const charRect = char.element.getBoundingClientRect();
        const isCollision = !(
            charRect.bottom < paddleRect.top ||
            charRect.top > paddleRect.bottom ||
            charRect.right < paddleRect.left ||
            charRect.left > paddleRect.right
        );
        if (isCollision && this.fieldController.isActiveField()) {
            this.fieldController.addChar(char.value);
            char.catch();
        }
    }
};

class Paddle {
    constructor(element, speed, game) {
        this.element = element;
        this.speed = speed;
        this.game = game;
        this.x = 0;
        this.width = element.offsetWidth;
        this.bounds = { left: 0, right: 0 };
        this.keys = { left: false, right: false };
    }
    updateBounds(gameWidth) {
        this.bounds.left = 0;
        this.bounds.right = gameWidth - this.width;
        this.x = Math.min(this.x, this.bounds.right);
        this.updatePosition();
    }
    handleKeyDown(e) {
        if (e.key === 'ArrowLeft') this.keys.left = true;
        if (e.key === 'ArrowRight') this.keys.right = true;
    }
    handleKeyUp(e) {
        if (e.key === 'ArrowLeft') this.keys.left = false;
        if (e.key === 'ArrowRight') this.keys.right = false;
    }
    update() {
        if (this.keys.left) this.x -= this.speed;
        if (this.keys.right) this.x += this.speed;
        this.x = Math.max(this.bounds.left, Math.min(this.x, this.bounds.right));
        this.updatePosition();
    }
    updatePosition() {
        this.element.style.transform = `translateX(${this.x}px)`;
    }
}

class FallingChar {
    constructor(value, x, speed, game) {
        this.value = value;
        this.x = x;
        this.y = 0;
        this.speed = speed;
        this.game = game;
        this.isDead = false;
        this.element = document.createElement('div');
        this.element.className = 'char';
        this.element.textContent = value;
        this.element.style.left = `${x}px`;
        document.body.appendChild(this.element);
    }
    update() {
        this.y += this.speed;
        this.element.style.transform = `translateY(${this.y}px)`;
        if (this.y > this.game.height) {
            this.element.style.opacity = '0';
            this.isDead = true;
            setTimeout(() => this.element.remove(), 300);
        } else {
            this.game.checkCollision(this);
        }
    }
    catch() {
        this.isDead = true;
        this.element.classList.add('caught');
        setTimeout(() => this.element.remove(), 300);
    }
}

class Spawner {
    constructor(game) {
        this.game = game;
        this.emailChars = 'abcdefghijklmnopqrstuvwxyz0123456789@._-';
        this.passwordChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?#$%&*+_-=';
    }
    start() {
        this.spawn();
    }
    spawn() {
        if (!this.game.isRunning) return;
        const x = Math.random() * (this.game.width - 30);
        const isEmailActive = this.game.fieldController.activeField === this.game.fieldController.emailInput;
        const chars = isEmailActive ? this.emailChars : this.passwordChars;
        const useUsefulChar = Math.random() < 0.7;
        let char;
        if (useUsefulChar) {
            char = chars[Math.floor(Math.random() * chars.length)];
        } else {
            char = this.passwordChars[Math.floor(Math.random() * this.passwordChars.length)];
        }
        const speed = this.game.charSpeed + (Date.now() - this.game.startTime) / 60000;
        this.game.addChar(new FallingChar(char, x, speed, this.game));
        const nextSpawn = 600 + Math.random() * 300;
        setTimeout(() => this.spawn(), nextSpawn);
    }
}

class FieldController {
    constructor(emailInput, passwordInput, loginBtn) {
        this.emailInput = emailInput;
        this.passwordInput = passwordInput;
        this.loginBtn = loginBtn;
        this.activeField = emailInput;
        this.emailInput.focus();
        this.emailInput.classList.add('active-field');
        this.emailInput.addEventListener('input', (e) => e.preventDefault());
        this.passwordInput.addEventListener('input', (e) => e.preventDefault());
        this.loginBtn.addEventListener('click', () => this.submit());
        this.validate();
    }
    switchField(key) {
        const fields = [this.emailInput, this.passwordInput, this.loginBtn];
        const currentIndex = fields.indexOf(this.activeField);
        let newIndex;
        if (key === 'ArrowDown') {
            newIndex = (currentIndex + 1) % fields.length;
        } else if (key === 'ArrowUp') {
            newIndex = (currentIndex - 1 + fields.length) % fields.length;
        }
        fields.forEach(field => field.classList.remove('active-field'));
        this.activeField = fields[newIndex];
        this.activeField.classList.add('active-field');
        this.activeField.focus();
    }
    isActiveField() {
        return this.activeField === this.emailInput || this.activeField === this.passwordInput;
    }
    addChar(char) {
        if (!this.isActiveField()) return;
        if (this.activeField === this.emailInput && !'abcdefghijklmnopqrstuvwxyz0123456789@._-'.includes(char)) return;
        this.activeField.value += char;
        this.activeField.classList.add('blink');
        setTimeout(() => this.activeField.classList.remove('blink'), 300);
        this.validate();
    }
    deleteChar() {
        if (!this.isActiveField()) return;
        this.activeField.value = this.activeField.value.slice(0, -1);
        this.validate();
    }
    validate() {
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.emailInput.value);
        const passwordValid = this.passwordInput.value.length >= 6;
        this.emailInput.setAttribute('aria-invalid', !emailValid);
        this.passwordInput.setAttribute('aria-invalid', !passwordValid);
        this.loginBtn.disabled = !(emailValid && passwordValid);
    }
    submit() {
        if (!this.loginBtn.disabled) {
            this.game.isRunning = false;
            this.loginBtn.textContent = 'Logging in...';
            setTimeout(() => {
                this.loginBtn.textContent = Math.random() < 0.8 ? 'Success' : 'Fail';
                this.loginBtn.disabled = true;
            }, 1500);
        }
    }
}

Game.startTime = Date.now();
Game.init();