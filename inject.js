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

	function format_time(seconds) {
		const isNegative = seconds < 0;
		const absSeconds = Math.abs(seconds);

		const hs = Math.floor(absSeconds / 3600.0);
		const ms = Math.floor((absSeconds % 3600) / 60.0);
		const ss = Math.floor(absSeconds % 60);

		const h = hs > 0 ? `${String(hs)}:` : '';
		const m = String(ms).padStart(hs > 0 ? 2 : 1, '0');
		const s = String(ss).padStart(2, '0');

		const sign = isNegative ? '-' : '';

		return `${sign}${h}${m}:${s}`;
	}

	window.addEventListener("message", event => {
		if (event.data?.source !== "yt-sync") return;

		const { time, paused, playbackRate, syncMode } = event.data;

		const player = document.getElementById("movie_player");
		if (!player) return;

		const video = player.querySelector("video");
		if (!video) return;

		const warning = document.getElementById("yt-sync-warning");
		if (!warning) return;

		const warningTime = document.getElementById("yt-sync-warning-time");
		if (!warningTime) return;

		const { currentTime, currentIngestionTime } = getCurrentIngestionTime(player);

		const delta = time - (syncMode === "actual_time" ? currentIngestionTime : currentTime);
		const seek = currentTime + delta;
		const seekableEnd = player.getProgressState()?.seekableEnd;
		const isWithinSeekRange = 0 <= seek && seek <= seekableEnd;

		if (isWithinSeekRange) {
			warning.className = "";
		} else {
			warning.className = "isOutsideSeekRange";
			warningTime.textContent = format_time(seek);
		}

		if (Math.abs(delta) > 1.0) {
			if (isWithinSeekRange) {
				player.seekTo(seek, true);
			} else if (seek < 0) {
				player.seekTo(0, true);
			} else if (seekableEnd < seek) {
				player.seekTo(seekableEnd, true);
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