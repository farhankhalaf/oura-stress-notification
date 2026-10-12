# iPhone walkthrough

The README demo stays inside one iPhone frame throughout:

1. A clear lock screen.
2. The real Telegram stress notification appears and stays visible for about five seconds.
3. An unlock swipe directly after the notification.
4. A simulated tap on the actual Oura Home Screen icon opens Oura Today.
5. A simulated tap on Stress opens the real Daytime Stress screen.

<img src="images/demo-walkthrough.gif?v=76cffd8546ba" alt="Full iPhone walkthrough: notification arrives, unlock, tap Oura, then open Daytime Stress." width="420">

[Still image](images/demo-walkthrough.png)

## Sources and edits

This is an edited walkthrough with simulated interactions, not a continuous screen
recording. The notification is from the owner's physical iPhone screenshot.
The Home Screen, Oura Today and Daytime Stress views were captured through iPhone
Mirroring on the Mac on October 11, 2026. The Oura app screens and graph are real,
with their original text, points, colors and readings. The navigation animation
follows the native transition observed during capture.

The lock-screen notification was captured at 13:28. Its headline was edited to
"Oura recorded high stress", removing the daily minute total to match the current
first-alert wording. The later Home Screen and Oura captures show 14:12 and 14:15,
when the total had reached one hour. The walkthrough compresses this passage of
time without an intertitle. Oura readings were not changed to make the screens
agree, and the demo does not imply an instant Oura reading or alert.
The original preview spacing was retained, so the gap below the headline is wider
and less body text is visible than a newly rendered alert may show.

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
and taps the separate Oura icon to open Oura. The original alert was manually
triggered using the tool's then-current formatter and a real API reading; delivery
was confirmed on the physical iPhone lock screen. The shortened headline was not
sent as a new live alert. Notification appearance varies with iOS,
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

All iPhone and app lettering is in the source images, including the edited
notification headline and generic calendar titles. Review the full loop
on light and dark backgrounds, including the blank opening, notification arrival,
each visible tap, both app transitions and the loop seam.

## Sharing assets

- [MP4 walkthrough](images/demo-walkthrough.mp4): H.264, yuv420p, 652 x 1380,
  15 fps, 259 frames, 17.266667 seconds, no audio, fast-start playback.
- [Social preview](images/social-preview.png): 1280 x 640, 166,157 bytes, intended
  for the GitHub repository link preview. It combines the existing generated ring
  avatar with the edited real notification crop. It is labeled an unofficial tool
  and an edited demo. No new Oura UI or reading was generated.

The MP4 uses the same source frames and 4.67-second clean notification hold as the
accepted GIF, composited over a dark outer background. The tiny duration difference
comes from GIF centisecond rounding. The README GIF was not changed for this export.
Both new assets are included in the repository and the beta release downloads.

After rendering the walkthrough's source frames as above, export the MP4 with
ffmpeg 8.1 (libx264):

```sh
ffmpeg -y -framerate 15 -i /path/to/scratch/frames/%04d.png \
  -f lavfi -i color=c=0x0d1117:s=652x1380:r=15 \
  -filter_complex '[1:v][0:v]overlay=shortest=1:format=auto,format=yuv420p[v]' \
  -map '[v]' -an -c:v libx264 -preset slow -crf 18 -r 15 -frames:v 259 \
  -map_metadata -1 -movflags +faststart /path/to/repo/docs/images/demo-walkthrough.mp4
```

The [social-preview SVG](images/social-preview.svg) embeds its image assets and
outlines every letter, so it renders without installed fonts. In a scratch Node
folder, install `@resvg/resvg-js@2.6.2` and render it:

```sh
npm install @resvg/resvg-js@2.6.2
node --input-type=module - /path/to/repo/docs/images/social-preview.svg /path/to/repo/docs/images/social-preview.png <<'JS'
import fs from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
fs.writeFileSync(process.argv[3], new Resvg(fs.readFileSync(process.argv[2])).render().asPng());
JS
```

To change the card composition, [render_social_preview.py](images/render_social_preview.py)
builds its SVG using `fonttools==4.66.1` in a development-only virtual environment.
Pass the two font files as arguments: Arial.ttf and Arial Bold.ttf. The renderer
pins their SHA-256 hashes to `525979822591a3447cfc49d943d6f7683508e25543407871c0ed8fed05fd2bd9`
and `d72db21f9242aedd6b917d8549ad5921766b24d5f8d0becfda2ff4c620b3c2e0` respectively.
The original fonts are not bundled; the committed outlined SVG is the portable
render source. None of these development dependencies is needed to run the tool.

Published asset SHA-256:

```text
social-preview.png     1606a12af7949d1559b6a426172697a730bc30f96085c78ab2c9e437f66c8b49
demo-walkthrough.mp4   35b8e149572b96191b4a9767e3de0940b446d49fedc9351c8a1cf338f6234149
```

## Earlier versions

The [stacked real-screenshot explainer](images/demo-real.gif) was replaced because
it did not show the requested phone walkthrough. The [older realistic mockup](images/demo-realistic.gif)
and [illustrated mockup](images/demo-illustrated.gif) use synthetic data and UI.
They are retained as earlier artwork, not the README demo.
