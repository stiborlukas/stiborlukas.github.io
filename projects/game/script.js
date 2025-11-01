// --- Game Constants and Global Variables ---
var FONT = 28;
var ROWS = 15;
var COLS = 25;
var ENEMIES_PER_LEVEL_BASE = 4;
var ITEMS_PER_LEVEL_BASE = 2;
var FOV_RADIUS = 7;
var BOSS_LEVEL_INTERVAL = 5;

var WALL_CHANCE = 0.55;
var NUM_ITERATIONS = 5;
var BIRTH_LIMIT = 4;
var DEATH_LIMIT = 3;

var map;
var asciidisplay;
var player;
var enemies;
var items;
var gameOver = false;
var combatLog = [];
var currentLevel = 0;
var exitStairs = null;

var game;
var gameMessageText = null;
var mainMenuTitle = null;
var playButton = null;

var visible;
var visited;
var dashMode = false;
var isLoading = false;

// --- Game Initialization ---

window.onload = function() {
    game = new Phaser.Game(COLS * FONT * 0.6, ROWS * FONT, Phaser.AUTO, null, {
        create: create
    });
};

// Main create function called by Phaser
function create() {
    game.input.keyboard.addCallbacks(null, null, onKeyUp);
    showMainMenu();
}

// Displays main menu screen
function showMainMenu() {
    currentLevel = 0;
    clearGameDisplay();

    mainMenuTitle = game.add.text(game.world.centerX, game.world.centerY - 80, 'CAVE CRAWLER', {
        font: "48px monospace",
        fill: "#00FF00",
        align: "center"
    });
    mainMenuTitle.anchor.setTo(0.5, 0.5);
    mainMenuTitle.setShadow(4, 4, 'rgba(0,255,0,0.5)', 8);

    playButton = game.add.text(game.world.centerX, game.world.centerY + 20, 'PLAY GAME', {
        font: "28px monospace",
        fill: "#FFFFFF",
        align: "center",
        backgroundColor: 'rgba(0, 100, 0, 0.5)',
        padding: {x: 15, y: 8}
    });
    playButton.anchor.setTo(0.5, 0.5);
    playButton.inputEnabled = true;
    playButton.input.useHandCursor = true;
    playButton.events.onInputDown.add(startNewGame, this);

    game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.addOnce(startNewGame, this);
    
    document.getElementById('combat-log').innerHTML = "Welcome! Press ENTER or click PLAY to start.";
    document.getElementById('player-hp').textContent = 'HP: -';
    document.getElementById('player-atk').textContent = 'ATK: -';
    document.getElementById('player-def').textContent = 'DEF: -';
    document.getElementById('enemies-left').textContent = 'Enemies: -';
    document.getElementById('game-level').textContent = 'Level: -';
    document.getElementById('ability-heal').innerHTML = `Heal (H): -`;
    document.getElementById('ability-fireball').innerHTML = `Fireball (F): -`;
    document.getElementById('ability-dash').innerHTML = `Dash (D): -`;
}

// Starts new game from level 1
function startNewGame() {
    if (mainMenuTitle) mainMenuTitle.destroy();
    if (playButton) playButton.destroy();
    game.input.keyboard.removeKey(Phaser.Keyboard.ENTER);

    currentLevel = 1;
    gameOver = false;
    combatLog = [];
    player = null;
    loadLevel();
    logMessage("Game started! Find and defeat all enemies to find the exit.");
}

// Loads a new dungeon level
function loadLevel() {
    showLoadingScreen();

    game.time.events.add(Phaser.Timer.SECOND * 0.1, () => {
        clearGameDisplay();

        enemies = [];
        items = [];
        exitStairs = null;

        initMap();
        initScreen();

        if (!player || !player.alive) {
            initPlayer();
        } else {
            var newPos = getRandomFloorPosition();
            player.x = newPos.x;
            player.y = newPos.y;
            player.healCooldown = 0;
            player.fireballCooldown = 0;
            player.dashCooldown = 0;
            logMessage(`You descend to Level ${currentLevel}!`);
        }

        initEnemies();
        initItems();

        visible = Array(ROWS).fill(0).map(() => Array(COLS).fill(false));
        visited = Array(ROWS).fill(0).map(() => Array(COLS).fill(false));

        placeExitStairs();
        calcFOV();
        updateDisplay();
        hideLoadingScreen();
    }, this);
}

// Clears all game objects from display
function clearGameDisplay() {
    if (asciidisplay) {
        for (var y = 0; y < asciidisplay.length; y++) {
            for (var x = 0; x < asciidisplay[y].length; x++) {
                asciidisplay[y][x].destroy();
            }
        }
        asciidisplay = null;
    }
    if (gameMessageText) {
        gameMessageText.destroy();
        gameMessageText = null;
    }
}

// Toggles loading screen visibility
function showLoadingScreen() {
    isLoading = true;
    document.getElementById('loading-screen').style.display = 'flex';
}

function hideLoadingScreen() {
    isLoading = false;
    document.getElementById('loading-screen').style.display = 'none';
}

// --- Map Functions ---

// Initializes map using Cellular Automata
function initMap() {
    map = Array(ROWS).fill(0).map(() => Array(COLS).fill('.'));

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (x === 0 || x === COLS - 1 || y === 0 || y === ROWS - 1 || Math.random() < WALL_CHANCE) {
                map[y][x] = '#';
            } else {
                map[y][x] = '.';
            }
        }
    }

    for (let i = 0; i < NUM_ITERATIONS; i++) {
        map = runCellularAutomata(map);
    }

    let startAttempts = 0;
    let initialPlayerPos = {x: -1, y: -1};
    let connectedFloors = [];

    do {
        initialPlayerPos = getRandomFloorPositionWithinMap();
        connectedFloors = getConnectedComponent(initialPlayerPos.x, initialPlayerPos.y, map);
        startAttempts++;
        if (startAttempts > 5 && connectedFloors.length < (ROWS * COLS) / 4) {
            console.log("Map not sufficiently connected, re-generating...");
            initMap();
            return;
        }
    } while (!isValidPosition(initialPlayerPos.x, initialPlayerPos.y) || connectedFloors.length < (ROWS * COLS) / 4);
}

// Applies one iteration of Cellular Automata rules
function runCellularAutomata(oldMap) {
    let newMap = Array(ROWS).fill(0).map(() => Array(COLS).fill('.'));

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            let wallCount = getAdjacentWallCount(oldMap, x, y);

            if (oldMap[y][x] === '#') {
                if (wallCount < DEATH_LIMIT) {
                    newMap[y][x] = '.';
                } else {
                    newMap[y][x] = '#';
                }
            } else {
                if (wallCount > BIRTH_LIMIT) {
                    newMap[y][x] = '#';
                } else {
                    newMap[y][x] = '.';
                }
            }
            if (x === 0 || x === COLS - 1 || y === 0 || y === ROWS - 1) {
                newMap[y][x] = '#';
            }
        }
    }
    return newMap;
}

// Counts adjacent walls (including diagonals)
function getAdjacentWallCount(currentMap, cellX, cellY) {
    let count = 0;
    for (let y = cellY - 1; y <= cellY + 1; y++) {
        for (let x = cellX - 1; x <= cellX + 1; x++) {
            if (x === cellX && y === cellY) continue;
            if (x < 0 || x >= COLS || y < 0 || y >= ROWS) {
                count++;
            } else if (currentMap[y][x] === '#') {
                count++;
            }
        }
    }
    return count;
}

// Flood fill to find connected floor tiles
function getConnectedComponent(startX, startY, currentMap) {
    let component = [];
    let queue = [{x: startX, y: startY}];
    let visitedCells = Array(ROWS).fill(0).map(() => Array(COLS).fill(false));

    if (!isValidPosition(startX, startY)) return component;

    visitedCells[startY][startX] = true;
    component.push({x: startX, y: startY});

    let head = 0;
    while(head < queue.length) {
        let current = queue[head++];
        let neighbors = [
            {x: current.x, y: current.y - 1},
            {x: current.x, y: current.y + 1},
            {x: current.x - 1, y: current.y},
            {x: current.x + 1, y: current.y}
        ];

        for (let neighbor of neighbors) {
            if (neighbor.x >= 0 && neighbor.x < COLS &&
                neighbor.y >= 0 && neighbor.y < ROWS &&
                currentMap[neighbor.y][neighbor.x] === '.' &&
                !visitedCells[neighbor.y][neighbor.x]) {
                
                visitedCells[neighbor.y][neighbor.x] = true;
                queue.push(neighbor);
                component.push(neighbor);
            }
        }
    }
    return component;
}

// Checks if position is valid floor tile
function isValidPosition(x, y) {
    return x >= 0 && x < COLS && y >= 0 && y < ROWS && map[y][x] === '.';
}

// Finds random floor position (for validation)
function getRandomFloorPositionWithinMap() {
    var x, y;
    let attempts = 0;
    const MAX_RANDOM_POS_ATTEMPTS = 5000;
    do {
        x = Math.floor(Math.random() * (COLS - 2)) + 1;
        y = Math.floor(Math.random() * (ROWS - 2)) + 1;
        attempts++;
        if (attempts > MAX_RANDOM_POS_ATTEMPTS) {
            console.error("getRandomFloorPositionWithinMap: Could not find a free floor position after " + MAX_RANDOM_POS_ATTEMPTS + " attempts.");
            return {x: 1, y: 1};
        }
    } while (map[y][x] === '#');
    return { x: x, y: y };
}

// Finds random unoccupied floor position
function getRandomFloorPosition() {
    var x, y;
    let attempts = 0;
    const MAX_PLACEMENT_ATTEMPTS = 5000;
    do {
        x = Math.floor(Math.random() * (COLS - 2)) + 1;
        y = Math.floor(Math.random() * (ROWS - 2)) + 1;
        attempts++;
        if (attempts > MAX_PLACEMENT_ATTEMPTS) {
            console.error("getRandomFloorPosition: Could not find a free floor position after " + MAX_PLACEMENT_ATTEMPTS + " attempts.");
            for (let cy = 1; cy < ROWS - 1; cy++) {
                for (let cx = 1; cx < COLS - 1; cx++) {
                    if (map[cy][cx] === '.' && !isPositionOccupied(cx, cy) && !(exitStairs && exitStairs.x === cx && exitStairs.y === cy)) {
                        console.warn("getRandomFloorPosition: Fallback found a position via full scan.");
                        return {x: cx, y: cy};
                    }
                }
            }
            console.error("getRandomFloorPosition: Fallback failed. Returning default position.");
            return {x: 1, y: 1};
        }
    } while (!isValidPosition(x, y) || isPositionOccupied(x, y) || (exitStairs && exitStairs.x === x && exitStairs.y === y));
    return { x: x, y: y };
}

// Checks if position is occupied by player, enemy, or item
function isPositionOccupied(x, y) {
    if (player && player.alive && player.x === x && player.y === y) return true;
    if (enemies) {
        for (var i = 0; i < enemies.length; i++) {
            if (enemies[i].alive && enemies[i].x === x && enemies[i].y === y) {
                return true;
            }
        }
    }
    if (items) {
        for (var i = 0; i < items.length; i++) {
            if (items[i].x === x && items[i].y === y) {
                return true;
            }
        }
    }
    return false;
}

// --- Field of View (FOV) Functions ---

// Calculates FOV using radius and line of sight
function calcFOV() {
    visible = Array(ROWS).fill(0).map(() => Array(COLS).fill(false));
    visible[player.y][player.x] = true;
    visited[player.y][player.x] = true;

    for (let y = player.y - FOV_RADIUS; y <= player.y + FOV_RADIUS; y++) {
        for (let x = player.x - FOV_RADIUS; x <= player.x + FOV_RADIUS; x++) {
            if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
                const dist = Math.abs(x - player.x) + Math.abs(y - player.y);
                if (dist <= FOV_RADIUS && hasLineOfSight(player.x, player.y, x, y)) {
                    visible[y][x] = true;
                    visited[y][x] = true;
                }
            }
        }
    }
}

// Bresenham-based line of sight check
function hasLineOfSight(x0, y0, x1, y1) {
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1;
    let sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    while (true) {
        if (map[y0][x0] === '#' && !(x0 === player.x && y0 === player.y) && !(x0 === x1 && y0 === y1)) {
            return false;
        }
        
        if (x0 === x1 && y0 === y1) break;

        let e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y0 += sy;
        }
    }
    return true;
}

// --- Screen Display Functions ---

// Initializes 2D array of Phaser text objects
function initScreen() {
    if (asciidisplay) {
        for (var y = 0; y < asciidisplay.length; y++) {
            for (var x = 0; x < asciidisplay[y].length; x++) {
                asciidisplay[y][x].destroy();
            }
        }
    }
    asciidisplay = [];
    for (var y = 0; y < ROWS; y++) {
        var newRow = [];
        asciidisplay.push(newRow);
        for (var x = 0; x < COLS; x++) {
            var style = {
                font: FONT + "px monospace",
                fill: "#666"
            };
            var text = game.add.text(FONT * 0.6 * x, FONT * y, '', style);
            newRow.push(text);
        }
    }
}

// Updates map, entities, and UI
function updateDisplay() {
    for (var y = 0; y < ROWS; y++) {
        for (var x = 0; x < COLS; x++) {
            var cell = asciidisplay[y][x];

            if (visible[y][x]) {
                var entity = getEntityAt(x, y);
                if (entity) {
                    cell.text = entity.char;
                    cell.fill = entity.color;
                } else {
                    cell.text = map[y][x];
                    if (exitStairs && exitStairs.x === x && exitStairs.y === y) {
                        cell.text = exitStairs.char;
                        cell.fill = exitStairs.color;
                    } else {
                        cell.fill = (map[y][x] === '#') ? "#555" : "#333";
                    }
                }
            } else if (visited[y][x]) {
                cell.text = map[y][x];
                if (exitStairs && exitStairs.x === x && exitStairs.y === y) {
                    cell.text = exitStairs.char; 
                    cell.fill = "#006655";
                } else {
                    cell.fill = (map[y][x] === '#') ? "#222" : "#111";
                }
            } else {
                cell.text = '';
                cell.fill = "#000";
            }
        }
    }

    if (player) {
        document.getElementById('game-level').textContent = 'Level: ' + currentLevel;
        document.getElementById('player-hp').textContent = 'HP: ' + player.hp + '/' + player.maxHp;
        document.getElementById('player-atk').textContent = 'ATK: ' + player.minDamage + '-' + player.maxDamage;
        document.getElementById('player-def').textContent = 'DEF: ' + player.armor;

        document.getElementById('ability-heal').innerHTML = `Heal (H): ${player.healCooldown > 0 ? `<span class="cooldown">${player.healCooldown}</span>` : 'Ready'}`;
        document.getElementById('ability-fireball').innerHTML = `Fireball (F): ${player.fireballCooldown > 0 ? `<span class="cooldown">${player.fireballCooldown}</span>` : 'Ready'}`;
        document.getElementById('ability-dash').innerHTML = `Dash (D): ${player.dashCooldown > 0 ? `<span class="cooldown">${player.dashCooldown}</span>` : 'Ready'}`;
    }
    if (enemies) {
        var aliveEnemies = enemies.filter(function(e) { return e.alive; }).length;
        
        if (currentLevel % BOSS_LEVEL_INTERVAL === 0) {
            document.getElementById('enemies-left').textContent = 'Boss: ' + (aliveEnemies > 0 ? 'ALIVE' : 'DEFEATED');
        } else {
            document.getElementById('enemies-left').textContent = 'Enemies: ' + aliveEnemies + '/' + (ENEMIES_PER_LEVEL_BASE + (currentLevel -1) * 1);
        }
    }
}

// Returns entity at position
function getEntityAt(x, y) {
    if (player && player.alive && player.x === x && player.y === y) {
        return { char: '@', color: "#00FF00" };
    }
    if (enemies) {
        for (var i = 0; i < enemies.length; i++) {
            var enemy = enemies[i];
            if (enemy.alive && enemy.x === x && enemy.y === y) {
                return { char: enemy.char, color: enemy.color };
            }
        }
    }
    if (items) {
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.x === x && item.y === y) {
                return { char: item.char, color: item.color };
            }
        }
    }
    return null;
}

// --- Player Functions ---

// Initializes player with starting stats
function initPlayer() {
    var pos = getRandomFloorPosition();
    player = {
        x: pos.x,
        y: pos.y,
        hp: 5,
        maxHp: 5,
        minDamage: 1,
        maxDamage: 2,
        armor: 0,
        alive: true,
        healCooldown: 0,
        fireballCooldown: 0,
        dashCooldown: 0,
        lastMoveDir: {x: 0, y: 0}
    };
}

// Handles player movement and interaction
function movePlayer(dx, dy) {
    if (gameOver || !player.alive) return;

    player.lastMoveDir = {x: dx, y: dy};
    var newX = player.x + dx;
    var newY = player.y + dy;

    if (!isValidPosition(newX, newY)) {
        logMessage("You hit a wall!");
        return;
    }

    if (exitStairs && newX === exitStairs.x && newY === exitStairs.y) {
        const aliveEnemies = enemies.filter(e => e.alive).length;
        if (aliveEnemies === 0) {
            currentLevel++;
            loadLevel();
            return;
        } else {
            logMessage(`You must defeat all ${aliveEnemies} enemies before you can exit!`);
            return;
        }
    }

    var targetItem = null;
    for (var i = 0; i < items.length; i++) {
        if (items[i].x === newX && items[i].y === newY) {
            targetItem = items[i];
            break;
        }
    }

    if (targetItem) {
        pickUpItem(targetItem);
        player.x = newX;
        player.y = newY;
    } else {
        var targetEnemy = null;
        for (var i = 0; i < enemies.length; i++) {
            if (enemies[i].alive && enemies[i].x === newX && enemies[i].y === newY) {
                targetEnemy = enemies[i];
                break;
            }
        }

        if (targetEnemy) {
            attackEnemy(targetEnemy);
        } else {
            player.x = newX;
            player.y = newY;
        }
    }

    endPlayerTurn();
}

// Attacks enemy with random damage
function attackEnemy(enemy) {
    var damage = Math.floor(Math.random() * (player.maxDamage - player.minDamage + 1)) + player.minDamage;
    var oldHp = enemy.hp;
    enemy.hp -= damage;

    if (enemy.hp <= 0) {
        enemy.alive = false;
        logMessage("You defeated a " + enemy.char + "! (dealt " + damage + " damage, was " + oldHp + " HP)");
    } else {
        logMessage("You hit a " + enemy.char + " for " + damage + " damage! (" + enemy.char + ": " + enemy.hp + " HP remaining)");
    }
}

// Heal ability (1-2 HP, 5 turn cooldown)
function playerHeal() {
    if (gameOver || !player.alive) return;
    if (player.healCooldown > 0) {
        logMessage("Heal is on cooldown! (" + player.healCooldown + " turns remaining)");
        endPlayerTurn();
        return;
    }

    const healAmount = Math.floor(Math.random() * 2) + 1;
    player.hp = Math.min(player.maxHp, player.hp + healAmount);
    player.healCooldown = 5;
    logMessage("You heal for " + healAmount + " HP!");

    endPlayerTurn();
}

// Fireball ability (2-4 damage to adjacent enemy, 8 turn cooldown)
function playerFireball() {
    if (gameOver || !player.alive) return;
    if (player.fireballCooldown > 0) {
        logMessage("Fireball is on cooldown! (" + player.fireballCooldown + " turns remaining)");
        endPlayerTurn();
        return;
    }

    let targetEnemy = null;
    const adjacentDirs = [{x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}];
    for (const dir of adjacentDirs) {
        const targetX = player.x + dir.x;
        const targetY = player.y + dir.y;
        for (let i = 0; i < enemies.length; i++) {
            if (enemies[i].alive && enemies[i].x === targetX && enemies[i].y === targetY && visible[targetY][targetX]) {
                targetEnemy = enemies[i];
                break;
            }
        }
        if (targetEnemy) break;
    }

    if (targetEnemy) {
        const fireballDamage = Math.floor(Math.random() * 3) + 2;
        const oldHp = targetEnemy.hp;
        targetEnemy.hp -= fireballDamage;
        player.fireballCooldown = 8;

        if (targetEnemy.hp <= 0) {
            targetEnemy.alive = false;
            logMessage("You hit a " + targetEnemy.char + " with a fireball for " + fireballDamage + " damage, defeating it! (was " + oldHp + " HP)");
        } else {
            logMessage("You hit a " + targetEnemy.char + " with a fireball for " + fireballDamage + " damage! (" + targetEnemy.char + ": " + targetEnemy.hp + " HP remaining)");
        }
        endPlayerTurn();
    } else {
        logMessage("No enemy in adjacent range for Fireball!");
    }
}

// Dash ability (move 2 tiles, 6 turn cooldown)
function playerDash(dx, dy) {
    if (gameOver || !player.alive) return;
    if (player.dashCooldown > 0) {
        logMessage("Dash is on cooldown! (" + player.dashCooldown + " turns remaining)");
        endPlayerTurn();
        return;
    }

    let originalX = player.x;
    let originalY = player.y;
    let movedDistance = 0;

    for (let step = 1; step <= 2; step++) {
        let nextX = originalX + dx * step;
        let nextY = originalY + dy * step;
        
        if (isValidPosition(nextX, nextY) && !isPositionOccupied(nextX, nextY)) {
            player.x = nextX;
            player.y = nextY;
            movedDistance = step;
        } else {
            if (step === 1) {
                logMessage("Dash path blocked by " + (map[nextY] && map[nextY][nextX] === '#' ? "a wall" : "an entity") + "!");
            }
            break;
        }
    }

    if (movedDistance > 0) {
        player.dashCooldown = 6;
        logMessage(`You dashed ${movedDistance} spaces!`);
        endPlayerTurn();
    } else {
        logMessage("Failed to dash.");
        endPlayerTurn();
    }
}

// End of player turn - cooldowns, enemy turn, FOV, UI
function endPlayerTurn() {
    if (player.healCooldown > 0) player.healCooldown--;
    if (player.fireballCooldown > 0) player.fireballCooldown--;
    if (player.dashCooldown > 0) player.dashCooldown--;

    dashMode = false;

    if (!gameOver) {
        enemyTurn();
    }

    calcFOV();
    updateDisplay();
    checkGameState();
}

// --- Item Functions ---

// Spawns items based on level
function initItems() {
    items = [];
    const numItems = ITEMS_PER_LEVEL_BASE + Math.floor((currentLevel - 1) / 2);

    for (var i = 0; i < numItems; i++) {
        var pos = getRandomFloorPosition();
        var itemType, itemChar, itemColor;

        const rand = Math.random();
        if (rand < 0.5) {
            itemType = 'potion';
            itemChar = 'P';
            itemColor = '#FFFF00';
        } else if (rand < 0.8) {
            itemType = 'sword';
            itemChar = 'W';
            itemColor = '#00FFFF';
        } else {
            itemType = 'armor';
            itemChar = 'X';
            itemColor = '#AAEEFF';
        }

        items.push({
            x: pos.x,
            y: pos.y,
            type: itemType,
            char: itemChar,
            color: itemColor
        });
    }
}

// Applies item effects and removes from map
function pickUpItem(item) {
    logMessage("You picked up a " + item.type + "!");
    switch (item.type) {
        case 'potion':
            const healAmount = Math.floor(Math.random() * 2) + 2;
            player.hp = Math.min(player.maxHp, player.hp + healAmount);
            logMessage("You gained " + healAmount + " HP!");
            break;
        case 'sword':
            player.minDamage += 1;
            player.maxDamage += 1;
            logMessage("Your attack damage increased!");
            break;
        case 'armor':
            player.armor += 1;
            logMessage("Your defense increased!");
            break;
    }
    items = items.filter(i => !(i.x === item.x && i.y === item.y));
}

// --- Enemy Functions ---

// Spawns enemies (normal or boss)
function initEnemies() {
    enemies = [];
    
    if (currentLevel % BOSS_LEVEL_INTERVAL === 0) {
        console.log("Spawning boss for Level " + currentLevel);
        var pos = getRandomFloorPosition();
        const bossMultiplier = currentLevel / BOSS_LEVEL_INTERVAL;

        enemies.push({
            x: pos.x,
            y: pos.y,
            char: 'Ø',
            color: '#FF0000',
            hp: Math.floor(10 * bossMultiplier) + 5,
            maxHp: Math.floor(10 * bossMultiplier) + 5,
            alive: true,
            damage: Math.floor(2 * bossMultiplier) + 2,
            speed: 1,
            ranged: false,
            aiType: 'basic'
        });
        console.log(`Boss spawned for Level ${currentLevel}: HP: ${enemies[0].hp}, Alive: ${enemies[0].alive}`);
        logMessage("A powerful boss appears!");
    } else {
        const numEnemies = ENEMIES_PER_LEVEL_BASE + Math.floor((currentLevel - 1) * 1);

        for (var i = 0; i < numEnemies; i++) {
            var pos = getRandomFloorPosition();
            var enemyData;

            const rand = Math.random();
            if (rand < 0.35) {
                enemyData = { char: 'E', color: '#FF4444', hp: 1, damage: 1, speed: 1, ranged: false, aiType: 'basic' };
            } else if (rand < 0.65) {
                enemyData = { char: 'B', color: '#FF8800', hp: Math.floor(Math.random() * 2) + 2, damage: Math.floor(Math.random() * 2) + 1, speed: 1, ranged: false, aiType: 'basic' };
            } else if (rand < 0.80) {
                enemyData = { char: 'S', color: '#00BBFF', hp: 1, damage: 1, speed: 2, ranged: false, aiType: 'scout' };
            } else {
                enemyData = { char: 'A', color: '#FF00FF', hp: 1, damage: 1, speed: 1, ranged: true, range: 5, aiType: 'archer' };
            }

            enemyData.hp += Math.floor((currentLevel - 1) / 2);
            enemyData.damage += Math.floor((currentLevel - 1) / 3);
            enemyData.hp = Math.max(1, enemyData.hp);
            enemyData.damage = Math.max(1, enemyData.damage);

            enemies.push({
                x: pos.x,
                y: pos.y,
                hp: enemyData.hp,
                maxHp: enemyData.hp,
                alive: true,
                char: enemyData.char,
                color: enemyData.color,
                damage: enemyData.damage,
                speed: enemyData.speed,
                ranged: enemyData.ranged,
                range: enemyData.range || 0,
                aiType: enemyData.aiType
            });
        }
    }
}

// Places exit stairs
function placeExitStairs() {
    var pos = getRandomFloorPosition();
    exitStairs = {
        x: pos.x,
        y: pos.y,
        char: '>',
        color: '#00FFCC'
    };
}

// Enemy AI turn
function enemyTurn() {
    for (var i = 0; i < enemies.length; i++) {
        var enemy = enemies[i];
        if (!enemy.alive || !player.alive) continue;

        for (let moveCount = 0; moveCount < enemy.speed; moveCount++) {
            if (!enemy.alive || !player.alive) break;

            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const distance = Math.abs(dx) + Math.abs(dy);

            let acted = false;

            if (visible[enemy.y] && visible[enemy.y][enemy.x] && visible[player.y][player.x]) {
                if (enemy.ranged && distance <= enemy.range && hasLineOfSight(enemy.x, enemy.y, player.x, player.y)) {
                    dealDamageToPlayer(enemy, enemy.damage);
                    logMessage(enemy.char + " shoots you for " + enemy.damage + " damage! (Your HP: " + player.hp + "/" + player.maxHp + ")");
                    acted = true;
                } else if (distance === 1) {
                    dealDamageToPlayer(enemy, enemy.damage);
                    logMessage(enemy.char + " attacks you for " + enemy.damage + " damage! (Your HP: " + player.hp + "/" + player.maxHp + ")");
                    acted = true;
                } else {
                    let moveX = 0, moveY = 0;
                    if (Math.abs(dx) > Math.abs(dy)) {
                        moveX = dx > 0 ? 1 : -1;
                    } else {
                        moveY = dy > 0 ? 1 : -1;
                    }

                    if (enemy.aiType === 'scout') {
                        if (!isValidPosition(enemy.x + moveX, enemy.y + moveY) || isPositionOccupied(enemy.x + moveX, enemy.y + moveY)) {
                            if (moveX !== 0) {
                                moveX = 0;
                                moveY = Math.random() < 0.5 ? 1 : -1;
                            } else {
                                moveY = 0;
                                moveX = Math.random() < 0.5 ? 1 : -1;
                            }
                        }
                    }

                    let newX = enemy.x + moveX;
                    let newY = enemy.y + moveY;

                    if (isValidPosition(newX, newY) && !isPositionOccupied(newX, newY)) {
                        enemy.x = newX;
                        enemy.y = newY;
                        acted = true;
                    } else if (enemy.aiType === 'basic' || enemy.aiType === 'archer') {
                        moveX = 0; moveY = 0;
                        if (Math.abs(dx) <= Math.abs(dy)) {
                            moveX = dx > 0 ? 1 : -1;
                        } else {
                            moveY = dy > 0 ? 1 : -1;
                        }
                        newX = enemy.x + moveX;
                        newY = enemy.y + moveY;
                        if (isValidPosition(newX, newY) && !isPositionOccupied(newX, newY)) {
                            enemy.x = newX;
                            enemy.y = newY;
                            acted = true;
                        }
                    }
                }
            } else {
                var directions = [{x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}];
                var attempts = 0;
                let movedRandomly = false;
                while (!movedRandomly && attempts < 4) {
                    var dir = directions[Math.floor(Math.random() * 4)];
                    var newRX = enemy.x + dir.x;
                    var newRY = enemy.y + dir.y;
                    if (isValidPosition(newRX, newRY) && !isPositionOccupied(newRX, newRY)) {
                        enemy.x = newRX;
                        enemy.y = newRY;
                        movedRandomly = true;
                        acted = true;
                    }
                    attempts++;
                }
            }
            if(!acted && enemy.speed > 1) {
                break;
            }
        }
    }
}

// Deals damage to player with armor reduction
function dealDamageToPlayer(attacker, baseDamage) {
    let actualDamage = Math.max(1, baseDamage - player.armor);
    player.hp -= actualDamage;
    player.hp = Math.max(0, player.hp);

    if (player.hp <= 0) {
        player.alive = false;
        gameOver = true;
    }
}

// --- Game State Functions ---

// Checks win/lose conditions
function checkGameState() {
    var aliveEnemies = enemies.filter(function(e) { return e.alive; }).length;

    if (!player.alive) {
        gameOver = true;
        showGameOver("DEFEAT! You were overwhelmed by enemies.", 'defeat-message');
    } else if (currentLevel % BOSS_LEVEL_INTERVAL === 0 && aliveEnemies === 0) {
        gameOver = true;
        showGameOver("VICTORY! You defeated the mighty boss!", 'victory-message');
    } else if (aliveEnemies === 0) {
        logMessage("All enemies defeated! Find the exit (>) to descend!");
    }
    
    if (currentLevel % BOSS_LEVEL_INTERVAL === 0) {
        console.log(`CheckGameState for Level ${currentLevel} (Boss Level): Alive enemies count: ${aliveEnemies}`);
    }
}

// Shows game over or victory screen
function showGameOver(message, cssClass) {
    if (gameMessageText) {
        gameMessageText.destroy();
    }

    var style = {
        fill: '#FFF',
        align: "center",
        font: "32px monospace",
    };

    gameMessageText = game.add.text(game.world.centerX, game.world.centerY,
        message + '\n\nPress R to restart', style);
    gameMessageText.anchor.setTo(0.5, 0.5);
    gameMessageText.backgroundColor = (cssClass === 'victory-message') ? 'rgba(46, 229, 46, 0.9)' : 'rgba(229, 34, 34, 0.9)';
    gameMessageText.padding.set(20, 40);
    gameMessageText.setShadow(2, 2, 'rgba(0,0,0,0.5)', 5);

    logMessage(message);
}

// Logs message to combat log
function logMessage(message) {
    combatLog.push(message);
    if (combatLog.length > 10) {
        combatLog.shift();
    }

    var logElement = document.getElementById('combat-log');
    logElement.innerHTML = combatLog.join('<br>');
    logElement.scrollTop = logElement.scrollHeight;
}

// --- Input Handling ---

// Handles keyboard input
function onKeyUp(event) {
    if (isLoading) return;

    if (currentLevel === 0) {
        if (event.keyCode === Phaser.Keyboard.ENTER) {
            startNewGame();
        }
        return;
    }

    if (gameOver) {
        if (event.keyCode === Phaser.Keyboard.R) {
            showMainMenu();
        }
        return;
    }

    if (dashMode) {
        let dashDx = 0, dashDy = 0;
        let validDashDirection = false;
        switch(event.keyCode) {
            case Phaser.Keyboard.LEFT: dashDx = -1; validDashDirection = true; break;
            case Phaser.Keyboard.RIGHT: dashDx = 1; validDashDirection = true; break;
            case Phaser.Keyboard.UP: dashDy = -1; validDashDirection = true; break;
            case Phaser.Keyboard.DOWN: dashDy = 1; validDashDirection = true; break;
            default:
                logMessage("Dash cancelled. Press an arrow key after 'D'.");
                dashMode = false;
                endPlayerTurn();
                return;
        }
        if (validDashDirection) {
            playerDash(dashDx, dashDy);
        } else {
            dashMode = false;
        }
        return;
    }

    switch (event.keyCode) {
        case Phaser.Keyboard.LEFT:
            movePlayer(-1, 0);
            break;
        case Phaser.Keyboard.RIGHT:
            movePlayer(1, 0);
            break;
        case Phaser.Keyboard.UP:
            movePlayer(0, -1);
            break;
        case Phaser.Keyboard.DOWN:
            movePlayer(0, 1);
            break;
        case Phaser.Keyboard.H:
            playerHeal();
            break;
        case Phaser.Keyboard.F:
            playerFireball();
            break;
        case Phaser.Keyboard.D:
            if (player.dashCooldown > 0) {
                logMessage("Dash is on cooldown! (" + player.dashCooldown + " turns remaining)");
                endPlayerTurn();
            } else {
                logMessage("Dash: Press an arrow key for direction.");
                dashMode = true;
            }
            break;
    }
}