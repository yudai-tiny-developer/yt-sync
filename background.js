const activeTabs = new Set();
let activeTabsArray = [];
let baseTab = null;

function activate(tabId) {
	activeTabs.add(tabId);
	activeTabsArray = Array.from(activeTabs);
	if (!baseTab) {
		baseTab = tabId;
	}
}

function promote(tabId) {
	activeTabs.add(tabId);
	activeTabsArray = Array.from(activeTabs);
	baseTab = tabId;
}

function deactivate(tabId) {
	activeTabs.delete(tabId);
	activeTabsArray = Array.from(activeTabs);
	if (baseTab === tabId) {
		baseTab = activeTabsArray[0];
	}
}

chrome.runtime.onMessage.addListener((msg, sender) => {
	const tabId = sender.tab?.id;
	if (!tabId) return;

	if (msg.type === "ACTIVATE") {
		activate(tabId);
		return;
	}

	if (msg.type === "PROMOTE") {
		promote(tabId);
		return;
	}

	if (msg.type === "DEACTIVATE") {
		deactivate(tabId);
		return;
	}
});

setInterval(() => {
	if (activeTabsArray.length < 1) return;

	chrome.tabs.sendMessage(baseTab, { type: "BASE" }).then(r => {
		if (!r) {
			deactivate(baseTab);
			return;
		}

		activeTabsArray.map(tabId => tabId === baseTab || chrome.tabs.sendMessage(tabId, { type: "SYNC", time: r.time, paused: r.paused }).then(r => {
			if (!r) {
				deactivate(tabId);
				return;
			}
		}).catch(() => { }));
	}).catch(() => { });
}, 200);