# Notification demo

The README now uses **real iPhone screenshots**, captured on October 11, 2026.
The Telegram notification shows the dedicated bot's ring avatar and its actual
message. The Oura views were captured from the iPhone through iPhone Mirroring on
the Mac, and show real readings from the same day.

<img src="images/demo-real.gif" alt="Real Telegram alert and Oura screenshots, with a recorded stressed point selected." width="480">

[Still image](images/demo-real.png)

## What this demonstrates

- A real alert reached the physical iPhone's lock-screen notification list while
  Telegram was in the background. The owner confirmed delivery and supplied the
  notification screenshot.
- The alert was triggered manually for the demo using the current Oura API total
  and the program's normal message formatter. It was not a naturally occurring
  alert from a newly observed increase. The saved alert baseline was not changed.
- The app initially shows its latest view, then an earlier stressed point is
  selected. Oura itself changes the graph background to red for that selection.
  The selection does not mean the wearer is currently stressed.
- Open Oura separately and tap Stress to inspect the graph. Tapping the Telegram
  notification opens Telegram. Oura sync and API updates can delay an alert.

## Edits and source images

This is a ten-second sequence assembled from screenshots, not continuous footage.
Only cropping, resizing, joining the graph and total cards across removed controls,
rounded clipping, explanatory labels and crossfades were added.
Notification text, graph points, times, colors and totals were not redrawn
or retouched. GIF encoding reduces the color palette.

The notification crop excludes other notifications, widgets, the clock and carrier.
The Oura crop excludes device chrome, the floating accessibility control and
nonessential panels. The graph and total cards are joined across the removed
movement/tag controls. The movement/tag graph overlays were hidden in the app for
capture and restored afterward. The full private screenshots are not in this repository.

The public, cropped sources are:

- [Actual Telegram notification](images/real-notification.png)
- [Oura's latest view](images/real-oura-current.png)
- [Oura with an earlier stressed point selected](images/real-oura-stress.png)

Notification appearance, including avatar placement and colors, depends on the
person's iOS, Telegram and notification settings.

## Rebuild

The composition source is [render_real_demo.mjs](images/render_real_demo.mjs).
Use a scratch folder with Node and `@resvg/resvg-js`, plus ffmpeg and gifsicle.
These are development tools for the GIF; the alert program needs only Python's
standard library.

Caption fonts use Helvetica Neue when available, then Arial or the system sans-serif
fallback. The captions can render differently on another system; the source app
and notification text are pixels in the screenshots and do not depend on fonts.

Copy the renderer into that scratch folder so Node can find the dependency. Pass
absolute paths for the repository image directory and scratch output directory:

```sh
node render_real_demo.mjs /path/to/repo/docs/images /path/to/scratch/frames
ffmpeg -y -framerate 8 -i /path/to/scratch/frames/%04d.png \
  -filter_complex '[0:v]split[a][b];[a]palettegen=max_colors=256:reserve_transparent=1[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:alpha_threshold=128' \
  -loop 0 -final_delay 12 /path/to/scratch/unoptimized.gif
gifsicle -O3 /path/to/scratch/unoptimized.gif -o /path/to/repo/docs/images/demo-real.gif
cp /path/to/scratch/frames/poster.png /path/to/repo/docs/images/demo-real.png
```

Check the beginning, both graph states, transitions and loop boundary on light and
dark backgrounds. Compare decoded frames before and after GIF optimization.

## Earlier mockups

The [realistic simulation](images/demo-realistic.gif) and
[illustrated walkthrough](images/demo-illustrated.gif) use synthetic data and
simulated UI. They are retained as earlier artwork, not the README demo or evidence
of phone delivery. Their source is [render_demos.mjs](images/render_demos.mjs).
The earlier [static overview](images/stress-to-notification.svg) and
[phone illustration](images/iphone-notification.svg) are also mockups.
