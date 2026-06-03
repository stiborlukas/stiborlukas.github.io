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
		{ name: "CV_Stibor_en.pdf", type: "pdf", url: "docs/CV_Stibor_en.pdf" },
		{ name: "CV_Stibor_cz.pdf", type: "pdf", url: "docs/CV_Stibor_cz.pdf" },
	],
	Pictures: [
		{ name: "vacation.jpg", type: "img", url: "img/vacation.jpg" },
		{ name: "bike.jpg", type: "img", url: "img/bike.jpg" },
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


// ============================================================
// NaaS Terminal - no as a service, because sometimes you just want to be denied.
// ============================================================
(function () {

  const icon    = document.getElementById('naas-icon');
  const win     = document.getElementById('naas-window');
  const output  = document.getElementById('naas-output');
  const inputEl = document.getElementById('naas-input');
  const sugRow  = document.getElementById('naas-suggestions');

  if (!icon || !win || !output || !inputEl) return;

  // ── Open / close ─────────────────────────────────────────
  icon.addEventListener('dblclick', () => {
    win.style.display = 'block';
    makeDraggable(win);
    inputEl.focus();
    if (!booted) boot();
  });

  // Re-use your existing close-btn pattern
  win.querySelector('.close-btn').addEventListener('click', () => {
    win.style.display = 'none';
  });

  // ── Drag (mirrors your existing windows) ─────────────────
  function makeDraggable(el) {
    const bar = el.querySelector('.title-bar');
    if (bar._draggable) return;
    bar._draggable = true;
    let ox, oy;
    bar.addEventListener('mousedown', e => {
      ox = e.clientX - el.offsetLeft;
      oy = e.clientY - el.offsetTop;
      const move = ev => { el.style.left = (ev.clientX - ox) + 'px'; el.style.top = (ev.clientY - oy) + 'px'; };
      const up   = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
    });
  }

  // ── Helpers ───────────────────────────────────────────────
  function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function line(html, color) {
    const el = document.createElement('div');
    el.style.cssText = 'font-family:"Courier New",Courier,monospace;font-size:13px;line-height:1.6;white-space:pre-wrap;word-break:break-word;';
    el.style.color   = color || '#c0c0c0';
    el.innerHTML     = html;
    output.appendChild(el);
    output.scrollTop = output.scrollHeight;
    return el;
  }
  function blank() { line('\u00a0'); }
  function ts()    { return new Date().toTimeString().slice(0,8); }

  // ── Suggestions ───────────────────────────────────────────
  ['Can I get a raise?','Leave work early?','Skip the meeting?',
   'Will you date me?','Free pizza today?','Can I have a refund?'
  ].forEach(txt => {
    const b = document.createElement('button');
    b.textContent = txt;
    b.style.cssText = 'font-size:11px;padding:1px 6px;cursor:pointer;';
    b.addEventListener('click', () => { inputEl.value = txt; inputEl.focus(); });
    sugRow.appendChild(b);
  });

  // ── Boot sequence ─────────────────────────────────────────
  let booted = false;
  function boot() {
    booted = true;
    line('Microsoft(R) Windows 98', '#fff');
    line('   (C)Copyright Microsoft Corp 1981-1999.', '#c0c0c0');
    blank();
    line('<span style="color:#00ff00">[  OK  ]</span> denial.service loaded');
    line('<span style="color:#00ff00">[  OK  ]</span> /dev/no mounted  (naas.isalman.dev)');
    line('<span style="color:#ffff00">[ WARN ]</span> optimism module not found');
    line('<span style="color:#ff4444">[ DENY ]</span> hope: segmentation fault (core dumped)');
    blank();
    line('No-as-a-Service v4.2.0 — type a request, get denied.', '#c0c0c0');
    line('Try: HELP  DIR  CLS  WHOAMI', '#555');
    blank();
  }

  // ── Special commands ──────────────────────────────────────
  const specials = {
    cls:    () => { output.innerHTML = ''; },
    help:   () => { line('HELP  CLS  DIR  WHOAMI  EXIT  SUDO'); line('All roads lead to no.', '#555'); },
    dir:    () => {
      line(' Volume in drive C is NO');
      line(' Volume Serial Number is DEAD-BEEF');
      blank();
      line(' Directory of C:\\');
      blank();
      line('HOPE        &lt;DIR&gt;   [DELETED]        ', '#555');
      line('RAISE       &lt;DIR&gt;   [ACCESS DENIED]  ', '#555');
      line('VACATION    &lt;DIR&gt;   [ACCESS DENIED]  ', '#555');
      line('NO      EXE   99,999 bytes', '#c0c0c0');
      blank();
      line('       1 File(s)   99,999 bytes');
      line('       0 Dir(s)    0 bytes free');
    },
    whoami: () => { line('rejected_user', '#0f0'); },
    exit:   () => { line("You can't leave. The no follows you home.", '#f44'); },
    quit:   () => { line("You can't leave. The no follows you home.", '#f44'); },
    sudo:   () => { line('sudo: command not found. Also still no.', '#f44'); },
    yes:    () => { line("'yes' is not a recognised command.", '#f44'); },
  };

  // ── State ─────────────────────────────────────────────────
  let busy = false, rejects = 0;
  const hist = []; let hi = -1;

  // ── Main handler ──────────────────────────────────────────
  async function handle() {
    if (busy) return;
    const raw = inputEl.value.trim();
    if (!raw) return;
    inputEl.value = '';
    hist.unshift(raw); hi = -1;

    line('C:\\&gt; ' + esc(raw), '#fff');

    const lower = raw.toLowerCase();
    for (const [cmd, fn] of Object.entries(specials)) {
      if (lower === cmd || lower.startsWith(cmd + ' ')) { fn(); blank(); return; }
    }

    busy = true; inputEl.disabled = true;
    const spins = ['|','/','-','\\'];
    let si = 0, prog = 0;
    const ldr = line('Querying /dev/no... 0%', '#555');
    const iv = setInterval(() => {
      si = (si + 1) % 4;
      prog = Math.min(prog + Math.floor(Math.random() * 14) + 4, 99);
      ldr.textContent = spins[si] + ' Contacting NaaS daemon... ' + prog + '%';
    }, 90);

    try {
      const data = await fetch('https://naas.isalman.dev/no').then(r => r.json());
      clearInterval(iv); ldr.remove();

      rejects++;
      const reason = data.reason || data.message || JSON.stringify(data);
      const code   = Math.floor(Math.random() * 200) + 1;
      const pad    = String(rejects).padStart(4,'0');
      const hints  = [
        'try sudo (also no)',
        'rm -rf ./expectations might help',
        'file a ticket at /dev/null',
        'chmod 777 ./hope won\'t work',
        'git rebase --onto reality',
      ];

      line('[' + ts() + '] naas-daemon: verdict \u2192 DENIED', '#f44');
      blank();
      line('\u2554\u2550\u2550 REJECTION NOTICE #' + pad + ' \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557', '#f44');
      line('  ' + esc(reason), '#ff6');
      line('\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d', '#f44');
      blank();
      line('Exit code: ' + code + '  (ERRNO_NO_' + code + ')', '#555');
      line('Hint: ' + hints[Math.floor(Math.random() * hints.length)], '#555');
      blank();

    } catch(e) {
      clearInterval(iv); ldr.remove();
      line('ERROR: Connection refused \u2014 even the API said no.', '#f44');
      line('Details: ' + esc(e.message), '#555');
      blank();
    }

    busy = false; inputEl.disabled = false; inputEl.focus();
  }

  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') { handle(); return; }
    if (e.key === 'ArrowUp')   { e.preventDefault(); hi = Math.min(hi+1, hist.length-1); inputEl.value = hist[hi] || ''; }
    if (e.key === 'ArrowDown') { e.preventDefault(); hi = Math.max(hi-1, -1); inputEl.value = hi >= 0 ? hist[hi] : ''; }
  });

  win.addEventListener('click', () => inputEl.focus());

})();