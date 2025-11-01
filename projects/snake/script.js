// Wait for DOM + canvas
window.addEventListener("load", () => {
	const canvas = document.getElementById("game-canvas");
	const ctx = canvas.getContext("2d");
	const scoreEl = document.getElementById("score");
	const startBtn = document.getElementById("start-btn");

	const GRID_SIZE = 20;
	const TILE_COUNT = 15;

	let snake = [{ x: 7, y: 7 }];
	let food = { x: 10, y: 10 };
	let dx = 0,
		dy = 0;
	let score = 0;
	let gameInterval;
	let gameRunning = false;

	function draw() {
		ctx.fillStyle = "#008000";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Draw snake
		snake.forEach((part, i) => {
			ctx.fillStyle = i === 0 ? "#00ff00" : "#90ee90";
			ctx.fillRect(
				part.x * GRID_SIZE,
				part.y * GRID_SIZE,
				GRID_SIZE - 2,
				GRID_SIZE - 2
			);
		});

		// Draw food
		ctx.fillStyle = "red";
		ctx.beginPath();
		ctx.arc(
			food.x * GRID_SIZE + GRID_SIZE / 2,
			food.y * GRID_SIZE + GRID_SIZE / 2,
			GRID_SIZE / 2 - 2,
			0,
			Math.PI * 2
		);
		ctx.fill();
	}

	function update() {
		if (!gameRunning || (dx === 0 && dy === 0)) return; // ← Don't move if no direction

		const head = { x: snake[0].x + dx, y: snake[0].y + dy };

		// Wall collision
		if (
			head.x < 0 ||
			head.x >= TILE_COUNT ||
			head.y < 0 ||
			head.y >= TILE_COUNT
		) {
			gameOver();
			return;
		}

		// Self collision (skip head)
		for (let i = 1; i < snake.length; i++) {
			if (snake[i].x === head.x && snake[i].y === head.y) {
				gameOver();
				return;
			}
		}

		snake.unshift(head);

		// Eat food
		if (head.x === food.x && head.y === food.y) {
			score += 10;
			scoreEl.textContent = score;
			spawnFood();
		} else {
			snake.pop();
		}

		draw();
	}

	function spawnFood() {
		let x, y;
		do {
			x = Math.floor(Math.random() * TILE_COUNT);
			y = Math.floor(Math.random() * TILE_COUNT);
		} while (snake.some((part) => part.x === x && part.y === y));
		food = { x, y };
	}

	function gameOver() {
		gameRunning = false;
		clearInterval(gameInterval);
		alert("Game Over! Score: " + score);
		startBtn.textContent = "Restart";
	}

	function startGame() {
		if (gameRunning) return;

		// Reset
		snake = [{ x: 7, y: 7 }];
		dx = dy = 0;
		score = 0;
		scoreEl.textContent = "0";
		spawnFood();
		draw();

		gameRunning = true;
		startBtn.textContent = "Running...";
		clearInterval(gameInterval);
		gameInterval = setInterval(update, 150);
	}

	// === CONTROLS ===
	document.addEventListener("keydown", (e) => {
		if (!gameRunning) return;

		const key = e.key;
		if (key === "ArrowUp" && dy !== 1) {
			dx = 0;
			dy = -1;
		} else if (key === "ArrowDown" && dy !== -1) {
			dx = 0;
			dy = 1;
		} else if (key === "ArrowLeft" && dx !== 1) {
			dx = -1;
			dy = 0;
		} else if (key === "ArrowRight" && dx !== -1) {
			dx = 1;
			dy = 0;
		}
	});

	startBtn.addEventListener("click", startGame);

	// Initial draw
	draw();
});
