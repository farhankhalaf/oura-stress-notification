# iPhone walkthrough

The README demo stays inside one iPhone frame throughout:

1. A clear lock screen.
2. The real Telegram stress notification appears and stays visible for about five seconds.
3. An unlock swipe directly after the notification.
4. A simulated tap on the actual Oura Home Screen icon opens Oura Today.
5. A simulated tap on Stress opens the real Daytime Stress screen.

<img src="images/demo-walkthrough.gif?v=0ea17395ecbf" alt="Full iPhone walkthrough: notification arrives, unlock, tap Oura, then open Daytime Stress." width="420">

[Still image](images/demo-walkthrough.png)

## Sources and edits

This is an edited walkthrough with simulated interactions, not a continuous screen
recording. The notification is from the owner's physical iPhone screenshot.
The Home Screen, Oura Today and Daytime Stress views were captured through iPhone
Mirroring on the Mac on October 11, 2026. The Oura app screens and graph are real,
with their original text, points, colors and readings. The navigation animation
follows the native transition observed during capture.

The lock-screen notification shows 45 minutes at 13:28. The later Home Screen and
Oura captures show 14:12 and 14:15, when the total had reached one hour. The walkthrough
compresses this passage of time without an intertitle. The data was not changed to make the
screens agree, and the demo does not imply an instant Oura reading or alert.

The empty lock screen was made from the same screenshot by removing notification
cards and widgets and filling the covered wallpaper with image-generation cleanup.
Its original clock, date, status bar and bottom controls were retained. The Home
Screen calendar widget is kept, with generic event titles: "Plan the week",
"Evening walk" and "Read and unwind". Its layout and event times are preserved.
The actual app icons, positions, labels, notification badges and counts are retained.
No Oura app UI was generated.
Raw originals containing unrelated private information are not in this repository.

The native movement and tag overlays were temporarily turned off for a clean graph
and restored after capture. Other edits are screen cropping, a consistent rounded
phone boundary, transparent outer margins, notification reveal, unlock/launch/slide
transitions, simulated touch indicators, and a fade through black at the loop seam.
The launch-only snapshot omits the moving clock, battery and Dynamic Island using
the app's own background pixels; the held app view restores the original status
bar directly. This avoids duplicated device overlays during the simulated zoom.
GIF encoding uses a palette per frame and light lossy compression to reduce the
download size. These presentation edits do not change stress data.

The Telegram notification opens Telegram when tapped. The demo correctly unlocks
and taps the separate Oura icon to open Oura. The alert was manually triggered
using the tool's normal formatter and a real API reading; delivery was confirmed
on the physical iPhone lock screen. Notification appearance varies with iOS,
Telegram and the person's settings.

## Rebuild

The safe source assets are in [images/walkthrough](images/walkthrough).
The composition source is [render_walkthrough.mjs](images/render_walkthrough.mjs).
Use a scratch folder with Node and `@resvg/resvg-js`, plus ffmpeg and gifsicle.
These development tools are only for the GIF; the alert program remains Python
standard-library only. Copy the renderer into the scratch folder so Node can find
its dependency, then use absolute paths:

```sh
node render_walkthrough.mjs /path/to/repo/docs/images /path/to/scratch/frames
ffmpeg -y -framerate 15 -i /path/to/scratch/frames/%04d.png \
  -filter_complex '[0:v]split[a][b];[a]palettegen=max_colors=256:reserve_transparent=1:stats_mode=single[p];[b][p]paletteuse=new=1:dither=bayer:bayer_scale=4:alpha_threshold=128' \
  -loop 0 -final_delay 7 /path/to/scratch/unoptimized.gif
gifsicle -O3 --lossy=20 /path/to/scratch/unoptimized.gif -o /path/to/repo/docs/images/demo-walkthrough.gif
cp /path/to/scratch/frames/poster.png /path/to/repo/docs/images/demo-walkthrough.png
```

All iPhone and app lettering is in the captured source pixels. Review the full loop
on light and dark backgrounds, including the blank opening, notification arrival,
each visible tap, both app transitions and the loop seam.

## Earlier versions

The [stacked real-screenshot explainer](images/demo-real.gif) was replaced because
it did not show the requested phone walkthrough. The [older realistic mockup](images/demo-realistic.gif)
and [illustrated mockup](images/demo-illustrated.gif) use synthetic data and UI.
They are retained as earlier artwork, not the README demo.
