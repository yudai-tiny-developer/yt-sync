let syncMode = "actual_time";

const s = document.createElement('script');
s.id = '_yt_sync';
s.src = chrome.runtime.getURL('inject.js');
s.onload = () => s.remove();
(document.head || document.documentElement).append(s);

const button = document.createElement("button");
button.id = "yt-sync-toggle";
button.classList.add("SYNC_OFF");
button.textContent = "SYNC";

function activate() {
	chrome.runtime.sendMessage({ type: "ACTIVATE" }).then(() => {
		button.classList.remove('SYNC_BASE');
		button.classList.replace("SYNC_OFF", "SYNC_ON");
		button.textContent = "SYNC";
	});
}

function promote() {
	chrome.runtime.sendMessage({ type: "PROMOTE" }).then(() => {
		button.classList.add('SYNC_BASE');
		button.textContent = "BASE";
	});
}

function deactivate() {
	chrome.runtime.sendMessage({ type: "DEACTIVATE" }).then(() => {
		button.classList.remove('SYNC_BASE');
		button.classList.replace("SYNC_ON", "SYNC_OFF");
		button.textContent = "SYNC";
	});
}

function reset() {
	chrome.runtime.sendMessage({ type: "DEACTIVATE" }).then(() => {
		button.classList.remove('SYNC_BASE');
		button.classList.replace("SYNC_ON", "SYNC_OFF");
		button.textContent = "SYNC";
		input.value = 0;
		handleSelection("actual_time");
	});
}

button.addEventListener('click', () => {
	if (button.classList.contains("SYNC_OFF")) {
		activate();
	} else {
		if (!button.classList.contains("SYNC_BASE")) {
			promote();
		} else {
			deactivate();
		}
	}
});

const input = document.createElement("input");
input.id = "yt-sync-input";
input.type = "number";
input.value = 0;
input.min = -43200;
input.max = 43200;
input.step = 0.1;
input.title = "n-sec offset";

input.addEventListener('keydown', e => {
	e.stopImmediatePropagation();
});

input.addEventListener('wheel', e => {
	e.stopImmediatePropagation();
});

const warningMsg = document.createElement("span");
warningMsg.id = "yt-sync-warning-msg";

const warningTime = document.createElement("span");
warningTime.id = "yt-sync-warning-time";

const warning = document.createElement("div");
warning.id = "yt-sync-warning";
warning.appendChild(warningMsg);
warning.appendChild(warningTime);

const menuBtn = document.createElement("button");
menuBtn.className = "kebab-btn";
menuBtn.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';

const dropdownMenu = document.createElement("div");
dropdownMenu.className = "dropdown-menu";

const menu = document.createElement("div");
menu.id = "yt-sync-menu";
menu.appendChild(menuBtn);
menu.appendChild(dropdownMenu);

const menuOptions = [
	{ id: 'actual_time', label: chrome.i18n.getMessage('actual_time'), selected: true },
	{ id: 'timestamp', label: chrome.i18n.getMessage('timestamp'), selected: false },
];

function renderMenu() {
	dropdownMenu.innerHTML = '';

	menuOptions.forEach(option => {
		const item = document.createElement('div');
		item.className = `menu-item ${option.selected ? 'selected' : ''}`;
		item.dataset.id = option.id;

		item.innerHTML = `
                    <span class="checkmark">
                        <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </span>
                    <span>${option.label}</span>
                `;

		item.addEventListener('click', (e) => {
			handleSelection(option.id);
		});

		dropdownMenu.appendChild(item);
	});
}

function handleSelection(selectedId) {
	menuOptions.forEach(option => {
		option.selected = (option.id === selectedId);
	});

	renderMenu();
	dropdownMenu.classList.remove('show');

	syncMode = selectedId;
}

menuBtn.addEventListener('click', (e) => {
	e.stopPropagation();
	dropdownMenu.classList.toggle('show');
});

window.addEventListener('click', () => {
	dropdownMenu.classList.remove('show');
});

const div = document.createElement("div");
div.id = "yt-sync-container";
div.appendChild(button);
div.appendChild(input);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if (msg.type === "BASE") {
		button.classList.add('SYNC_BASE');
		button.textContent = "BASE";

		const player = document.getElementById("movie_player");
		if (!player) return;

		const video = player.querySelector("video");
		if (!video) return;

		if (msg.tabs > 1) {
			warning.className = "";
			warningMsg.textContent = "";
			warningTime.textContent = "";
		} else {
			warningMsg.textContent = chrome.i18n.getMessage('help1');
			warningTime.textContent = chrome.i18n.getMessage('help2');
			warning.className = "isOutsideSeekRange";
		}

		sendResponse({
			time: (syncMode === "actual_time" ? Number(player.getAttribute("yt-sync-time")) : video.currentTime) + Number(input.value),
			paused: video.paused,
			playbackRate: video.playbackRate,
			syncMode,
		});
		return true;
	}

	if (msg.type === "SYNC") {
		button.classList.remove('SYNC_BASE');
		button.textContent = "SYNC";

		handleSelection(msg.syncMode);

		window.postMessage({
			source: "yt-sync",
			time: Number(msg.time) + Number(input.value),
			paused: msg.paused,
			playbackRate: msg.playbackRate,
			syncMode: msg.syncMode,
		});

		sendResponse({});
		return true;
	}
});

document.addEventListener('yt-navigate-start', () => {
	reset();
});

function insertToggle() {
	const player = document.getElementById("movie_player");
	if (!player) return setTimeout(insertToggle, 1000);

	const video = player.querySelector("video");
	if (!video) return setTimeout(insertToggle, 1000);

	const container = player.querySelector(".ytp-time-display");
	if (!container) return setTimeout(insertToggle, 1000);

	renderMenu();

	container.appendChild(div);
	container.appendChild(warning);
	container.appendChild(menu);
}

insertToggle();