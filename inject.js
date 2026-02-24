(() => {
	function getCurrentIngestionTime(player) {
		const playerResponse = player.getPlayerResponse();
		if (!playerResponse) return { currentTime: null, currentIngestionTime: null };

		const isLiveNow = playerResponse.microformat?.playerMicroformatRenderer?.liveBroadcastDetails?.isLiveNow;
		if (isLiveNow !== false) return { currentTime: null, currentIngestionTime: null }; // live

		const startTimestampISOString = playerResponse.microformat?.playerMicroformatRenderer?.liveBroadcastDetails?.startTimestamp;
		if (!startTimestampISOString) return { currentTime: null, currentIngestionTime: null };

		const currentTime = player.getCurrentTime();
		if (!currentTime) return { currentTime: null, currentIngestionTime: null };

		const startTimestamp = Math.floor(new Date(startTimestampISOString).getTime() / 1000);
		return { currentTime, currentIngestionTime: startTimestamp + currentTime };
	}

	window.addEventListener("message", event => {
		if (event.data?.source !== "yt-sync") return;

		const { time, paused } = event.data;
		if (!time) return;

		const player = document.getElementById("movie_player");
		if (!player) return;

		const { currentTime, currentIngestionTime } = getCurrentIngestionTime(player);
		if (!currentTime) return;
		if (!currentIngestionTime) return;

		const delta = time - currentIngestionTime;
		const seek = currentTime + delta;

		if (Math.abs(delta) > 1.0) {
			player.seekTo(seek, true);
		} else if (delta > 0.2) {
			player.setPlaybackRate(1.25);
		} else {
			player.setPlaybackRate(1);
		}

		if (paused) {
			player.pauseVideo();
		} else {
			const seekableEnd = player.getProgressState()?.seekableEnd;
			if (seek < seekableEnd) {
				player.playVideo();
			}
		}
	});

	setInterval(() => {
		const player = document.getElementById("movie_player");
		if (!player) return;

		const { currentTime, currentIngestionTime } = getCurrentIngestionTime(player);
		if (!currentIngestionTime) return;

		player.setAttribute("yt-sync-time", currentIngestionTime);
		player.setAttribute("yt-sync-state", player.getPlayerState());
		player.setAttribute("yt-sync-isLiveContent", player.getPlayerResponse()?.videoDetails?.isLiveContent);
	}, 100);
})();