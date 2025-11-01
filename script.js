// === CLOCK ===
const clockEl = document.getElementById("clock");
function updateClock() {
	const now = new Date();
	clockEl.textContent = now.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	});
}
updateClock();
setInterval(updateClock, 10000);

// === WINDOWS ===
const icons = {
	about: document.getElementById("about-icon"),
	projects: document.getElementById("projects-icon"),
	contact: document.getElementById("contact-icon"),
	mycomputer: document.getElementById("mycomputer-icon"),
	cmd: document.getElementById("cmd-icon"),
};
const windows = {
	about: document.getElementById("about-window"),
	projects: document.getElementById("projects-window"),
	contact: document.getElementById("contact-window"),
	mycomputer: document.getElementById("mycomputer-window"),
	cmd: document.getElementById("cmd-window"),
};

Object.values(windows).forEach(makeDraggable);

function makeDraggable(win) {
	if (win.classList.contains("fullscreen")) return;
	const titleBar = win.querySelector(".title-bar");
	let offsetX,
		offsetY,
		isDragging = false;
	titleBar.addEventListener("mousedown", (e) => {
		isDragging = true;
		const rect = win.getBoundingClientRect();
		offsetX = e.clientX - rect.left;
		offsetY = e.clientY - rect.top;
		win.style.zIndex = Date.now();
		resetInactivityTimer();
	});
	document.addEventListener("mousemove", (e) => {
		if (!isDragging) return;
		win.style.left = e.clientX - offsetX + "px";
		win.style.top = e.clientY - offsetY + "px";
	});
	document.addEventListener("mouseup", () => (isDragging = false));
}

// === ICON CLICKS ===
icons.about.addEventListener("click", () => showWindow("about"));
icons.projects.addEventListener("click", () => showWindow("projects"));
icons.contact.addEventListener("click", () => showWindow("contact"));
icons.mycomputer.addEventListener("click", () => showWindow("mycomputer"));
icons.cmd.addEventListener("click", openCmd);
document
	.getElementById("cancel-contact")
	.addEventListener("click", () => hideWindow("contact"));

document.querySelectorAll(".close-btn").forEach((btn) =>
	btn.addEventListener("click", (e) => {
		const win = e.target.closest(".window");
		win.classList.remove("active");
		resetInactivityTimer();
	})
);

function showWindow(name) {
	const win = windows[name];
	win.classList.add("active");
	win.style.zIndex = Date.now();
	if (name === "mycomputer") openMcFolder("");
	resetInactivityTimer();
}
function hideWindow(name) {
	windows[name].classList.remove("active");
}

// === COMMAND PROMPT ===
const cmdWindow = windows.cmd;
const cmdOutput = document.getElementById("cmd-output");
const cmdInput = document.getElementById("cmd-input");
const cmdPrompt = document.getElementById("cmd-prompt");
let currentDir = "";

function openCmd() {
	showWindow("cmd");
	cmdInput.focus();
	if (!cmdOutput.innerHTML) printWelcome();
}

function printWelcome() {
	print("<span style='color:#0f0'>Microsoft(R) Windows 98</span>");
	print(
		"<span style='color:#0f0'>(C) Copyright Microsoft Corp 1981-1998.</span><br>"
	);
	print("Type <span style='color:#ff0'>help</span> for commands.");
}

function print(line) {
	cmdOutput.innerHTML += line + "<br>";
	cmdOutput.scrollTop = cmdOutput.scrollHeight;
}

function updatePrompt() {
	cmdPrompt.textContent = currentDir ? `C:\\${currentDir}>` : "C:\\>";
}

const commands = {
	help: () =>
		`
<span style="color:#ff0">Available commands:</span>
  help     whoami   projects   about
  clear    ls       cd         exit
`.trim(),

	whoami: () => "guest@portfolio98",

	projects: () => {
		showWindow("projects");
		return "Opening Projects...";
	},
	about: () => {
		showWindow("about");
		return "Opening About Me...";
	},

	clear: () => {
		cmdOutput.innerHTML = "";
		return "";
	},

	ls: () => {
		const dirs = ["Documents", "Pictures", "Code", "Games"];
		return dirs.map((d) => `<span style="color:#0f0">${d}</span>`).join("<br>");
	},

	cd: (arg = "") => {
		const dir = arg.trim();
		if (!dir || dir === "..") {
			currentDir = "";
			return "Changed to C:\\";
		}
		const valid = ["Documents", "Pictures", "Code", "Games"];
		if (valid.includes(dir)) {
			currentDir = dir;
			return `Changed to C:\\${dir}`;
		}
		return "Directory not found.";
	},

	exit: () => {
		hideWindow("cmd");
		return "";
	},
};

cmdInput.addEventListener("keydown", (e) => {
	if (e.key !== "Enter") return;
	const cmd = cmdInput.value.trim();
	if (!cmd) return;

	print(
		`<span style="color:#aaa">${cmdPrompt.textContent}</span> <span style="color:#fff">${cmd}</span>`
	);
	cmdInput.value = "";

	const [command, ...args] = cmd.split(" ");
	const fn = commands[command.toLowerCase()];
	const result = fn ? fn(args.join(" ")) : `'${command}' is not recognized.`;
	if (result) print(result);
	updatePrompt();
});

// === MY COMPUTER DATA ===
const mcContent = {
	Documents: [
		{ name: "Resume.pdf", type: "pdf", url: "docs/Resume.pdf" },
		{ name: "Cover Letter.docx", type: "doc", url: "docs/Cover.docx" },
	],
	Pictures: [
		{ name: "vacation.jpg", type: "img", url: "img/vacation.jpg" },
		{ name: "portfolio.png", type: "img", url: "img/portfolio.png" },
	],
	Programs: [{ name: "cmd.exe", type: "app", run: openCmd }],
	Games: [
		{
			name: "Minesweeper.exe",
			type: "game",
			url: "projects/minesweeper/index.html",
		},
		{ name: "Snake.exe", type: "game", url: "projects/snake/index.html" },
	],
};

const mcIcons = {
	pdf: "img/img.png",
	doc: "img/img.png",
	img: "img/img.png",
	game: "img/ms.png",
    app: "img/cmd.png",
};

const myComputerWin = document.getElementById("mycomputer-window");
const mcTree = document.getElementById("mc-tree");
const mcFiles = document.getElementById("mc-files");
const mcPath = document.getElementById("mc-path");
const mcBack = document.getElementById("mc-back");
const mcForward = document.getElementById("mc-forward");

let mcHistory = [],
	mcHistIdx = -1;
makeDraggable(myComputerWin);

mcTree.addEventListener("click", (e) => {
	const folder = e.target.closest(".folder");
	if (!folder) return;
	openMcFolder(folder.dataset.path);
	resetInactivityTimer();
});

mcBack.addEventListener("click", () => {
	if (mcHistIdx > 0) openMcFolder(mcHistory[--mcHistIdx]);
	resetInactivityTimer();
});
mcForward.addEventListener("click", () => {
	if (mcHistIdx < mcHistory.length - 1) openMcFolder(mcHistory[++mcHistIdx]);
	resetInactivityTimer();
});

function openMcFolder(path) {
	mcHistory = mcHistory.slice(0, mcHistIdx + 1);
	mcHistory.push(path);
	mcHistIdx++;
	mcPath.textContent = path ? `C:\\${path}` : "C:\\";
	mcBack.disabled = mcHistIdx === 0;
	mcForward.disabled = mcHistIdx === mcHistory.length - 1;

	mcFiles.innerHTML = "";
	const files = mcContent[path] || [];
	if (files.length === 0) {
		mcFiles.innerHTML =
			"<p style='padding:1rem;color:#666;'>This folder is empty.</p>";
		return;
	}

	const table = document.createElement("table");
	table.style.width = "100%";
	files.forEach((f) => {
		const tr = document.createElement("tr");
		tr.style.cursor = "pointer";
		tr.innerHTML = `<td style="width:32px;padding:4px;"><img src="${
			mcIcons[f.type]
		}" width="24"></td><td style="padding:4px;">${f.name}</td>`;
		tr.addEventListener("click", () => {
			if (f.run) {
				f.run();
			} else {
				openFileInWindow(f.url, f.name);
			}
			resetInactivityTimer();
		});

		table.appendChild(tr);
	});
	mcFiles.appendChild(table);
}

function openFileInWindow(url, title) {
	const existing = document.querySelector(`.file-browser iframe[src="${url}"]`);
	if (existing) {
		const win = existing.closest(".window");
		win.classList.add("active");
		win.style.zIndex = Date.now();
		return;
	}

	const win = document.createElement("div");
	win.className = "window file-browser active";
	win.innerHTML = `
          <div class="title-bar">
            <div class="title-bar-text">Internet Explorer - ${title}</div>
            <div class="title-bar-controls">
              <button aria-label="Close" class="close-btn"></button>
            </div>
          </div>
          <div class="window-body" style="padding:0;height:calc(100% - 30px);">
            <iframe src="${url}" style="width:100%;height:100%;border:none;"></iframe>
          </div>
        `;
	document.querySelector("main").appendChild(win);
	makeDraggable(win);
	win.style.zIndex = Date.now();
	win.querySelector(".close-btn").addEventListener("click", () => {
		win.classList.remove("active");
		resetInactivityTimer();
	});
	resetInactivityTimer();
}

// === SCREENSAVER ===
const INACTIVITY_TIMEOUT = 1200000;
const USE_BSOD = true;
let inactivityTimer;

function resetInactivityTimer() {
	clearTimeout(inactivityTimer);
	inactivityTimer = setTimeout(() => {
		if (USE_BSOD) {
			document.getElementById("bsod").style.display = "block";
		} else {
			startPipesScreensaver();
		}
	}, INACTIVITY_TIMEOUT);
}

function exitScreensaver() {
	document.getElementById("screensaver").style.display = "none";
	document.getElementById("bsod").style.display = "none";
	resetInactivityTimer();
}

["mousemove", "mousedown", "keydown", "touchstart", "click"].forEach((evt) =>
	document.addEventListener(evt, resetInactivityTimer, { passive: true })
);

function startPipesScreensaver() {
	const ss = document.getElementById("screensaver");
	const canvas = document.getElementById("pipes-canvas");
	const ctx = canvas.getContext("2d");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	ss.style.display = "block";

	let pipes = [];
	const colors = ["#00f", "#0f0", "#f00", "#ff0", "#f0f", "#0ff"];

	function createPipe() {
		return {
			x: Math.random() * canvas.width,
			y: Math.random() * canvas.height,
			z: Math.random() * 1000 + 500,
			vx: (Math.random() - 0.5) * 3,
			vy: (Math.random() - 0.5) * 3,
			vz: (Math.random() - 0.5) * 10 + 5,
			color: colors[Math.floor(Math.random() * colors.length)],
			segments: [],
		};
	}

	for (let i = 0; i < 15; i++) pipes.push(createPipe());

	function render() {
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		pipes.forEach((pipe) => {
			pipe.x += pipe.vx;
			pipe.y += pipe.vy;
			pipe.z += pipe.vz;

			if (
				pipe.z > 3000 ||
				pipe.x < -200 ||
				pipe.x > canvas.width + 200 ||
				pipe.y < -200 ||
				pipe.y > canvas.height + 200
			) {
				Object.assign(pipe, createPipe());
				pipe.segments = [];
			}

			const scale = 1000 / pipe.z;
			const x2d = pipe.x * scale + canvas.width / 2;
			const y2d = pipe.y * scale + canvas.height / 2;
			const radius = 20 * scale;

			pipe.segments.unshift({ x: x2d, y: y2d, r: radius });
			if (pipe.segments.length > 30) pipe.segments.pop();

			ctx.strokeStyle = pipe.color;
			ctx.lineWidth = radius * 0.8;
			ctx.lineCap = "round";
			ctx.beginPath();
			pipe.segments.forEach((seg, i) =>
				i === 0 ? ctx.moveTo(seg.x, seg.y) : ctx.lineTo(seg.x, seg.y)
			);
			ctx.stroke();
		});

		requestAnimationFrame(render);
	}

	render();
}

// Start on load
window.addEventListener("load", () => {
	resetInactivityTimer();
});

document
	.getElementById("screensaver")
	.addEventListener("click", exitScreensaver);
document.getElementById("bsod").addEventListener("click", exitScreensaver);
document.addEventListener("keydown", exitScreensaver);

// === EXIT SCREENSAVER ON ANY ACTIVITY ===
const exitOnEvent = () => {
	const ss = document.getElementById("screensaver");
	const bsod = document.getElementById("bsod");
	if (ss.style.display === "block" || bsod.style.display === "block") {
		exitScreensaver();
	}
};

// Exit screensaver on any user input
document.addEventListener("mousemove", exitOnEvent, { passive: true });
document.addEventListener("mousedown", exitOnEvent, { passive: true });
document.addEventListener("keydown", exitOnEvent, { passive: true });
document.addEventListener("touchstart", exitOnEvent, { passive: true });

// Reset inactivity timer on activity
["mousemove", "mousedown", "keydown", "touchstart", "click"].forEach((evt) =>
	document.addEventListener(evt, resetInactivityTimer, { passive: true })
);

// Start on load
window.addEventListener("load", () => {
	resetInactivityTimer();
});
