# Trivix OS — Large Update Plan

This is a big batch (~40 items). I'll group it into focused passes. Each pass touches related files so the change set stays coherent.

## Pass 1 — Canvas fixes
- Fix shape drag lag (use refs + rAF, not setState per mousemove)
- Add **Star** shape
- Fix Text tool (was bailing because `addingText` set with `select`)
- "Edit in Canvas": scale imported image to fill the white area
- Save-to-desktop now exports image filling the entire 1200×800 canvas (so reopening in Glimpse fills)
- Fix double-undo (history was being pushed twice on init)
- **Select tool**: proper hit testing & drag
- **Right-click drag** to pan the drawing area
- **Click = dot** + **Clear** button
- Disable page-level zoom; canvas keeps wheel-zoom

## Pass 2 — Sleep + Lock + Desktop
- Sleep mode: pure black overlay, never touch wallpaper state
- Lock screen: clicking with mouse unlocks (only when no password set)
- Fix bug where Weather (or last app) auto-reopens after unlock
- Drag-drop image from PC → save to Desktop **and** Files/Desktop
- Disable browser pinch/ctrl-wheel zoom on desktop

## Pass 3 — Notifications + Clock
- Calendar event notifications actually fire (interval check every 30s)
- Notifications now include app icon + name, slightly larger card
- Alarms/Timer/Stopwatch run in background via a shared store + global ticker in Desktop.jsx

## Pass 4 — New: Media app + Bin folder + Music/Video folders
- `Music/` and `Video/` folders auto-created in fileStore
- New `MediaApp` with Video/Audio sections + landing chooser + top-left switch button
- New `MediaWidget` (mp3 player + spinning CD)
- `Bin/` folder; right-click delete → moves to Bin; right-click in Bin → Recover; "Delete All" button
- Note deletion cascades (remove from Desktop & any folder copies)

## Pass 5 — Quest improvements
- Pin tab widths uniform (truncate names)
- Back/forward buttons fixed
- Zoom in/out icon beside bookmark
- Remove copyright
- Increase tab/url-bar translucency
- New tabs open in Quest (intercept target=_blank)
- Enter in QuestBar app search launches app
- Quest right-click on tab title bar → expand window (double-click)
- Quest bar right-click on app icon → "Pin to Dock" for hidden apps

## Pass 6 — Dock + Menu bar + System
- Dock above windows (z-index bump)
- Right-click context menus above windows
- Widget picker popup above windows
- Right dock height = central dock
- Light mode: dock indicator black; show which app focused
- Live activity back on menu bar beside notifications icon
- WiFi + Bluetooth icons in right dock (with detection via navigator.connection / bluetooth where available)
- Settings → new **Connections** section (WiFi & Bluetooth controls)
- Battery percentage popup with gradient bar + charging icon
- Battery + Bluetooth widget (up to 5 devices)
- Alt+X / Option+X opens Settings (System)
- Weather: pinned star → yellow
- Notes: remove highlighter icon, empty new-note state
- About: add small "Majd Mahayni"
- Extended/maximized windows: pass `isMaximized` and let apps use full real estate (Editors, Files, Canvas, Media)
- Alt+S app-switcher popup (icons + name on selected)
- Tips: redesigned layout; remove from dock (Quest-only access)

## Pass 7 — Cursors, touch, USB, paste
- Upload new cursors (30×30) via lovable-assets, swap CSS to use them
- Add `touch-action` + pointer event handling on draggable surfaces
- USB device detection via `navigator.usb` → show in Files
- Files right-click "Paste" for images copied from Quest (clipboard listener)
- Light-mode deep-sea wallpaper: lower contrast

## Technical notes
- Background timers: single store in `src/lib/clockStore.js` + ticker mounted in `Desktop.jsx`
- New widget: `MediaWidget.jsx` registered in `widgetDefs.js`
- New connections store: `src/lib/connectionsStore.js`
- New `src/lib/bin.js` helper wrapping fileStore moves
- Cursors uploaded as assets, referenced via `cursor: url(...) 0 0, auto` in `index.css`
- Tips: full rewrite of `TipsApp.jsx` with sectioned sidebar layout

## Out of scope warning
This will take several edits across ~30 files. I'll work pass-by-pass and ship in one go. Some "advanced detection" (real WiFi signal strength, real Bluetooth pairing) is limited by browser APIs — I'll use `navigator.connection` and the Web Bluetooth API where supported, with graceful fallbacks (mock state if unsupported) so the UI always works.

Confirm and I'll start implementing.