// Development-only composition of real, cropped screenshots. No UI is redrawn.
// Run a scratch copy with @resvg/resvg-js installed, then encode with ffmpeg.
// Arguments: source image directory, output directory. See ../DEMOS.md.
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';

const source = process.argv[2];
const out = process.argv[3];
if (!source || !out) throw new Error('Pass the image source and output directories.');
fs.mkdirSync(out, { recursive: true });
const png = name => 'data:image/png;base64,' + fs.readFileSync(path.join(source, name)).toString('base64');
const notification = png('real-notification.png');
const current = png('real-oura-current.png');
const selected = png('real-oura-stress.png');
const fps = 8, seconds = 10;
const clamp = x => Math.max(0, Math.min(1, x));
const smooth = x => { const v = clamp(x); return v * v * (3 - 2 * v); };

function frame(t) {
  // Four seconds on the current view, then a real selected stressed point.
  // Crossfade back at the loop boundary. Both source screenshots keep all data.
  const selection = smooth((t - 3.5) / 0.5) * (1 - smooth((t - 9.25) / 0.75));
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="660" height="1104" viewBox="0 0 660 1104">
    <defs>
      <clipPath id="notification"><rect x="20" y="16" width="620" height="183" rx="46"/></clipPath>
      <clipPath id="oura"><rect x="20" y="282" width="620" height="746" rx="20"/></clipPath>
    </defs>
    <image x="20" y="16" width="620" height="183" xlink:href="${notification}" clip-path="url(#notification)"/>
    <rect x="114" y="220" width="432" height="42" rx="21" fill="#24242a"/>
    <g opacity="${1 - selection}">
      <text x="316" y="248" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="22" fill="#ffffff">Open Oura → Stress</text>
      <path d="M480 232 V249 M474 243 L480 249 L486 243" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <text x="330" y="247" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="20" fill="#ffffff" opacity="${selection}">Earlier stressed point selected</text>
    <g clip-path="url(#oura)">
      <image x="20" y="282" width="620" height="746" xlink:href="${current}"/>
      <image x="20" y="282" width="620" height="746" xlink:href="${selected}" opacity="${selection}"/>
    </g>
    <rect x="104" y="1050" width="452" height="32" rx="16" fill="#24242a"/>
    <text x="330" y="1072" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="17" fill="#ffffff">Real screenshots · Alert triggered for demo</text>
  </svg>`;
}

for (let i = 0; i < seconds * fps; i++) {
  const bytes = new Resvg(frame(i / fps), { font: { loadSystemFonts: true } }).render().asPng();
  fs.writeFileSync(path.join(out, `${String(i).padStart(4, '0')}.png`), bytes);
}
fs.writeFileSync(path.join(out, 'poster.png'), new Resvg(frame(5), { font: { loadSystemFonts: true } }).render().asPng());
console.log(`Rendered ${seconds * fps} frames at ${fps} fps and a static poster.`);
