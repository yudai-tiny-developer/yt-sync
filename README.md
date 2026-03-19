# Synchronized Playback for YouTube Archived Live Streams

Chrome extension for synchronizing playback across multiple YouTube archived livestream tabs.

It adds a `SYNC` control to the YouTube player, lets one tab act as the base timeline, and keeps the other open archived streams aligned with it.

## Features

- Synchronize multiple YouTube archived livestream
- Choose a base tab that drives playback position, pause state, and playback speed
- Apply a per-tab offset in seconds to fine-tune alignment
- Switch between two sync modes:
  - `Sync with the actual broadcast time`
  - `Sync with the video timestamp`
- Shows an out-of-range warning when a target stream cannot seek to the requested position

## Usage

1. Open the YouTube archived livestream pages you want to synchronize
2. Press `SYNC` on each page you want to include
3. The first tab where you press `SYNC` automatically becomes the `BASE` tab
4. If you want a different tab to control the group, click the active `SYNC` button on that tab once more so it becomes `BASE`
5. If the current `BASE` tab is closed, one of the other synchronized tabs is automatically promoted to become the new `BASE`
6. Optionally adjust each tab's offset value in seconds
7. Use the menu on the base tab to switch between broadcast-time sync and timestamp sync

## Sync Modes

### Actual broadcast time

Best for comparing separate archives of the same live event from different channels or perspectives.

This mode synchronizes videos based on the real-world broadcast time derived from the video metadata and current playback position.

### Video timestamp

Best when you want all tabs to match the visible player timestamp directly.

This mode synchronizes videos using each video's current playback timestamp.

## License

This project is licensed under dual licenses:
*   [Apache License 2.0](LICENSE-APACHE)
*   [MIT License](LICENSE-MIT)
