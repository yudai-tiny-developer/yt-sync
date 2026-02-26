(() => {
	function getCurrentIngestionTime(player) {
		const playerResponse = player.getPlayerResponse();
		if (!playerResponse) return { currentTime: null, currentIngestionTime: null };

		const isLiveNow = playerResponse.microformat?.playerMicroformatRenderer?.liveBroadcastDetails?.isLiveNow;
		if (isLiveNow !== false) return { currentTime: null, currentIngestionTime: null }; // live

		const startTimestampISOString = playerResponse.microformat?.playerMicroformatRenderer?.liveBroadcastDetails?.startTimestamp;
		if (!startTimestampISOString) return { currentTime: null, currentIngestionTime: null };

		const currentTime = player.getCurrentTime();
		if (!currentTime && currentTime !== 0) return { currentTime: null, currentIngestionTime: null };

		const startTimestamp = Math.floor(new Date(startTimestampISOString).getTime() / 1000);
		return { currentTime, currentIngestionTime: startTimestamp + currentTime };
	}

	window.addEventListener("message", event => {
		if (event.data?.source !== "yt-sync") return;

		const { time, paused, playbackRate } = event.data;

		const player = document.getElementById("movie_player");
		if (!player) return;

		const video = player.querySelector("video");
		if (!video) return;

		const warning = document.getElementById("yt-sync-warning");
		if (!warning) return;

		const { currentTime, currentIngestionTime } = getCurrentIngestionTime(player);

		const delta = time - currentIngestionTime;
		const seek = currentTime + delta;
		const seekableEnd = player.getProgressState()?.seekableEnd;
		const isWithinSeekRange = 0 <= seek && seek < seekableEnd;

		if (isWithinSeekRange) {
			warning.className = "";
		} else {
			warning.className = "isOutsideSeekRange";
		}

		if (Math.abs(delta) > 1.0) {
			if (isWithinSeekRange) {
				player.seekTo(seek, true);
			}
			video.playbackRate = playbackRate;
		} else if (delta > 0.2) {
			video.playbackRate = playbackRate + 0.1;
		} else if (delta < -0.2) {
			video.playbackRate = playbackRate - 0.1;
		} else {
			video.playbackRate = playbackRate;
		}

		if (paused) {
			player.pauseVideo();
		} else {
			if (isWithinSeekRange) {
				player.playVideo();
			} else {
				player.pauseVideo();
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