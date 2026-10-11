// Full-phone walkthrough using real screen captures and simulated interactions.
// Development only. Run a scratch copy with @resvg/resvg-js installed.
// Arguments: source directory containing walkthrough/, output directory.
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';

const source = process.argv[2], out = process.argv[3];
if (!source || !out) throw new Error('Pass the image source and output directories.');
fs.mkdirSync(out, { recursive: true });
const png = name => 'data:image/png;base64,' + fs.readFileSync(path.join(source, 'walkthrough', name + '.png')).toString('base64');
const lock = png('lockscreen-empty'), notice = png('notification');
const home = png('home'), today = png('oura-today'), stress = png('daytime-stress');
const launch = png('oura-launch');
const FPS = 15, SECONDS = 16, W = 620, H = 1348;
const clamp = x => Math.max(0, Math.min(1, x));
const progress = (t, a, b) => clamp((t - a) / (b - a));
const ease = x => 1 - Math.pow(1 - clamp(x), 3);
const smooth = x => { const p = clamp(x); return p * p * (3 - 2 * p); };
const image = (src, x = 0, y = 0, w = W, h = H, extra = '') => `<image x="${x}" y="${y}" width="${w}" height="${h}" xlink:href="${src}" ${extra}/>`;

function touch(x, y, t, start, end) {
  if (t < start || t > end) return '';
  const p = progress(t, start, end), opacity = Math.sin(Math.PI * p);
  return `<g opacity="${opacity}"><circle cx="${x}" cy="${y}" r="${15 + 17 * p}" fill="#fff" fill-opacity=".22" stroke="#fff" stroke-width="3"/><circle cx="${x}" cy="${y}" r="6" fill="#fff"/></g>`;
}

function lockScene(t) {
  let art = image(lock);
  const p = ease(progress(t, 1.5, 1.95));
  if (p > 0) art += `<g opacity="${p}" transform="translate(0 ${32 * (1 - p)})">${image(notice, 22.6, 585, 574.8, 251, 'clip-path="url(#noticeClip)"')}</g>`;
  return art;
}

function frame(t) {
  let art = '';
  if (t < 5.4) {
    art = lockScene(t);
    // Real source captures were taken later than the original notification.
    if (t >= 4.65) {
      const p = Math.sin(Math.PI * progress(t, 4.65, 5.4));
      art += `<rect width="620" height="1348" fill="#000" opacity="${.24 * p}"/><text x="310" y="1040" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="32" font-weight="500" fill="#fff" opacity="${p}">Later</text>`;
    }
  } else if (t < 6.05) {
    const p = ease(progress(t, 5.4, 6.05));
    art = `<g transform="translate(310 674) scale(${1.045 - .045 * p}) translate(-310 -674)">${image(home)}</g>`;
    art += `<g transform="translate(0 ${-H * p})">${lockScene(4)}</g>`;
    if (p < .85) art += `<circle cx="310" cy="${H * (1 - p) - 38}" r="14" fill="#fff" fill-opacity="${.7 * (1 - p)}"/>`;
  } else if (t < 7.45) {
    const press = t < 7 ? 0 : Math.sin(Math.PI * progress(t, 7, 7.45));
    art = image(home) + `<rect x="474" y="913" width="100" height="100" rx="24" fill="#000" opacity="${.2 * press}"/>` + touch(524, 963, t, 7.0, 7.45);
  } else if (t < 8.05) {
    const p = ease(progress(t, 7.45, 8.05));
    const w = 100 + (W - 100) * p, h = 100 + (H - 100) * p;
    const x = 474 * (1 - p), y = 913 * (1 - p), r = 24 + 72 * p;
    // Keep the wallpaper and status strip on one transform, without a seam.
    art = image(home);
    art += `<defs><clipPath id="launch"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/></clipPath></defs>`;
    art += image(launch, x, y, w, h, `preserveAspectRatio="xMidYMid slice" clip-path="url(#launch)" opacity="${smooth(progress(p, 0, .42))}"`);
    // The incoming app snapshot has no duplicated device overlays. Home's
    // status bar remains visible behind it until covered; the held Today frame
    // then switches directly to its original status bar, with no crossfade.
  } else if (t < 10.05) {
    art = image(today) + touch(494, 248, t, 9.6, 10.05);
  } else if (t < 10.8) {
    const p = ease(progress(t, 10.05, 10.8));
    // Match the native right-to-left navigation observed in iPhone Mirroring.
    const edge = W * (1 - p);
    const movingPages = `${image(today, -.3 * W * p)}<rect width="${edge}" height="1348" fill="#000" opacity="${.1 * p}"/><rect x="${edge - 12}" width="12" height="1348" fill="url(#navShadow)"/><rect x="${edge}" width="620" height="1348" fill="#34222f"/>${image(stress, edge)}`;
    art = `<g clip-path="url(#body)">${movingPages}</g>`;
    // Backgrounds follow the page edge. Identically positioned status glyphs
    // remain fixed rather than crossfading a purple band over the blue page.
    art += `<defs><clipPath id="incomingStatus"><rect x="${edge}" width="620" height="90"/></clipPath></defs>`;
    art += `<g clip-path="url(#status)">${image(today)}<rect width="${edge}" height="90" fill="#000" opacity="${.1 * p}"/><rect x="${edge - 12}" width="12" height="90" fill="url(#navShadow)"/><g clip-path="url(#incomingStatus)"><rect width="620" height="90" fill="#34222f"/>${image(stress)}</g></g>`;
    // Below all status glyphs and the island, join the sampled backgrounds to
    // their moving counterparts. This removes residual gradient mismatch.
    art += `<g mask="url(#statusJoin)">${movingPages}</g>`;
  } else if (t < 15.0) {
    art = image(stress);
    if (t >= 14.5) art += `<rect width="620" height="1348" fill="#000" opacity="${smooth(progress(t, 14.5, 15))}"/>`;
  } else {
    art = image(lock) + `<rect width="620" height="1348" fill="#000" opacity="${1 - smooth(progress(t, 15.55, 16))}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="652" height="1380" viewBox="0 0 652 1380">
    <defs>
      <clipPath id="phone"><rect width="620" height="1348" rx="96"/></clipPath>
      <clipPath id="noticeClip"><rect x="22.6" y="585" width="574.8" height="251" rx="39"/></clipPath>
      <clipPath id="body"><rect y="90" width="620" height="1258"/></clipPath>
      <clipPath id="status"><rect width="620" height="90"/></clipPath>
      <linearGradient id="navShadow"><stop stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
      <linearGradient id="joinFade" gradientUnits="userSpaceOnUse" x1="0" y1="80" x2="0" y2="90"><stop stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient>
      <mask id="statusJoin" maskUnits="userSpaceOnUse" x="0" y="80" width="620" height="10"><rect y="80" width="620" height="10" fill="url(#joinFade)"/></mask>
    </defs>
    <g transform="translate(16 16)" clip-path="url(#phone)">
      <rect width="620" height="1348" fill="#000"/>${art}
      <rect x="214" y="22" width="192" height="55" rx="27.5" fill="#000"/>
    </g>
    <rect x="16.5" y="16.5" width="619" height="1347" rx="95.5" stroke="#242828" stroke-width="1" fill="none"/>
  </svg>`;
}

let previous = '', buffer;
for (let i = 0; i < FPS * SECONDS; i++) {
  const svg = frame(i / FPS);
  if (svg !== previous) buffer = new Resvg(svg, { font: { loadSystemFonts: true } }).render().asPng();
  previous = svg;
  fs.writeFileSync(path.join(out, `${String(i).padStart(4, '0')}.png`), buffer);
}
fs.writeFileSync(path.join(out, 'poster.png'), new Resvg(frame(3)).render().asPng());
fs.writeFileSync(path.join(out, 'timeline.json'), JSON.stringify({fps:FPS,seconds:SECONDS,phases:[
  {at:0,label:'Clear lock screen'}, {at:1.5,label:'Real notification arrives'},
  {at:4.65,label:'Later, time compressed'}, {at:5.4,label:'Unlock swipe'},
  {at:6.05,label:'Home Screen'}, {at:7,label:'Tap Oura'}, {at:7.45,label:'Oura opens'},
  {at:8.05,label:'Real Oura Today'}, {at:9.6,label:'Tap Stress'},
  {at:10.05,label:'Daytime Stress navigation'}, {at:10.8,label:'Real Daytime Stress'},
  {at:14.5,label:'Screen sleeps and returns to lock screen'}
]},null,2));
console.log(`Rendered ${FPS * SECONDS} full-phone frames at ${FPS} fps.`);
