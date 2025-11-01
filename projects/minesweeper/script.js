const ROWS = 9,
	COLS = 9,
	TOTAL_MINES = 10;

let board = [],
	revealed = 0,
	flags = 0,
	gameActive = false,
	startTime,
	timerInterval;

const gridEl = document.getElementById("grid");
const mineCounterEl = document.getElementById("mine-counter");
const timerEl = document.getElementById("timer");
const faceEl = document.getElementById("face");

function initGame() {
	// Reset board
	board = Array.from({ length: ROWS }, () =>
		Array.from({ length: COLS }, () => ({
			mine: false,
			opened: false,
			flagged: false,
			num: 0,
		}))
	);

	revealed = 0;
	flags = 0;
	gameActive = true;
	gridEl.innerHTML = "";
	updateCounter(TOTAL_MINES);
	timerEl.textContent = "000";
	faceEl.className = "face happy"; // ← Happy face
	clearInterval(timerInterval);
	startTime = null;

	// Place mines
	let placed = 0;
	while (placed < TOTAL_MINES) {
		const r = Math.floor(Math.random() * ROWS);
		const c = Math.floor(Math.random() * COLS);
		if (!board[r][c].mine) {
			board[r][c].mine = true;
			placed++;
		}
	}

	// Calculate numbers
	for (let r = 0; r < ROWS; r++) {
		for (let c = 0; c < COLS; c++) {
			if (board[r][c].mine) continue;
			let count = 0;
			for (let dr = -1; dr <= 1; dr++) {
				for (let dc = -1; dc <= 1; dc++) {
					if (dr === 0 && dc === 0) continue;
					const nr = r + dr,
						nc = c + dc;
					if (
						nr >= 0 &&
						nr < ROWS &&
						nc >= 0 &&
						nc < COLS &&
						board[nr][nc].mine
					)
						count++;
				}
			}
			board[r][c].num = count;
		}
	}

	// Create cells
	for (let r = 0; r < ROWS; r++) {
		for (let c = 0; c < COLS; c++) {
			const cell = document.createElement("div");
			cell.className = "cell";
			cell.dataset.r = r;
			cell.dataset.c = c;

			// Left click
			cell.addEventListener("click", () => {
				if (!gameActive) return;
				if (!startTime) {
					startTime = Date.now();
					startTimer();
				}
				openCell(r, c);
			});

			// Right click
			cell.addEventListener("contextmenu", (e) => {
				e.preventDefault();
				if (!gameActive || board[r][c].opened) return;
				if (!startTime) {
					startTime = Date.now();
					startTimer();
				}
				toggleFlag(r, c, cell);
			});

			gridEl.appendChild(cell);
		}
	}
}

function startTimer() {
	timerInterval = setInterval(() => {
		const elapsed = Math.floor((Date.now() - startTime) / 1000);
		timerEl.textContent = String(Math.min(elapsed, 999)).padStart(3, "0");
	}, 500);
}

function openCell(r, c) {
	const cell = board[r][c];
	if (cell.opened || cell.flagged || !gameActive) return;

	cell.opened = true;
	revealed++;
	const el = getCellEl(r, c);
	el.classList.add("open");

	if (cell.mine) {
		el.classList.add("mine");
		faceEl.className = "face dead"; // ← Dead face
		gameActive = false;
		clearInterval(timerInterval);
		revealAllMines();
		return;
	}

	if (cell.num > 0) {
		el.textContent = cell.num;
		el.classList.add(`num${cell.num}`);
	} else {
		// Flood fill
		for (let dr = -1; dr <= 1; dr++) {
			for (let dc = -1; dc <= 1; dc++) {
				const nr = r + dr,
					nc = c + dc;
				if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) openCell(nr, nc);
			}
		}
	}

	if (revealed === ROWS * COLS - TOTAL_MINES) win();
}

function toggleFlag(r, c, el) {
	const cell = board[r][c];
	if (cell.opened) return;
	cell.flagged = !cell.flagged;
	flags += cell.flagged ? 1 : -1;
	el.classList.toggle("flag", cell.flagged);
	updateCounter(TOTAL_MINES - flags);
}

function updateCounter(value) {
	mineCounterEl.textContent = String(Math.max(0, value)).padStart(3, "0");
}

function revealAllMines() {
	for (let r = 0; r < ROWS; r++) {
		for (let c = 0; c < COLS; c++) {
			if (board[r][c].mine) {
				const el = getCellEl(r, c);
				el.classList.add("open", "mine");
			}
		}
	}
}

function win() {
	gameActive = false;
	faceEl.className = "face cool"; // ← Cool sunglasses
	clearInterval(timerInterval);
	// Flag any unflagged mines
	for (let r = 0; r < ROWS; r++) {
		for (let c = 0; c < COLS; c++) {
			if (board[r][c].mine && !board[r][c].flagged) {
				getCellEl(r, c).classList.add("flag");
			}
		}
	}
}

function getCellEl(r, c) {
	return gridEl.children[r * COLS + c];
}

faceEl.addEventListener("click", initGame);
faceEl.addEventListener("contextmenu", (e) => e.preventDefault());

// Start first game
initGame();
