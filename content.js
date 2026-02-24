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
	button.classList.remove('SYNC_BASE');
	button.classList.replace("SYNC_OFF", "SYNC_ON");
	button.textContent = "SYNC";
	chrome.runtime.sendMessage({ type: "ACTIVATE" });
}

function promote() {
	button.classList.add('SYNC_BASE');
	button.textContent = "BASE";
	chrome.runtime.sendMessage({ type: "PROMOTE" });
}

function deactivate() {
	button.classList.remove('SYNC_BASE');
	button.classList.replace("SYNC_ON", "SYNC_OFF");
	button.textContent = "SYNC";
	chrome.runtime.sendMessage({ type: "DEACTIVATE" });
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

const div = document.createElement("div");
div.id = "yt-sync-container";
div.classList.add("ytp-autohide-fade-transition");
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

		sendResponse({ time: Number(player.getAttribute("yt-sync-time")) + Number(input.value), paused: video.paused });
		return true;
	}

	if (msg.type === "SYNC") {
		button.classList.remove('SYNC_BASE');
		button.textContent = "SYNC";

		window.postMessage({
			source: "yt-sync",
			time: Number(msg.time) + Number(input.value),
			paused: msg.paused,
		});

		sendResponse({});
		return true;
	}
});

document.addEventListener('yt-navigate-start', () => {
	deactivate();
});

function insertToggle() {
	const player = document.getElementById("movie_player");
	if (!player) return setTimeout(insertToggle, 1000);

	const video = player.querySelector("video");
	if (!video) return setTimeout(insertToggle, 1000);

	const container = player.querySelector(".ytp-time-display");
	if (!container) return setTimeout(insertToggle, 1000);

	container.appendChild(div);
}

insertToggle();