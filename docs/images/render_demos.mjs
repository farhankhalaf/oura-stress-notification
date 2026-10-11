// Development-only artwork source. The alert tool does not need Node or resvg.
// Run in a scratch folder containing @resvg/resvg-js; pass an output folder.
// Encode 12 fps source frames as 8 fps GIFs with ffmpeg, then optimize with gifsicle.
// Exact rendering and encoding commands are in docs/DEMOS.md.
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
const out=process.argv[2] || '/tmp/oura-demo-render';
fs.mkdirSync(out,{recursive:true});
const frames=168, fps=12;
const sampleValues=[880,746,698,791,707,671,721,832,782,758,645,684,735,690,618,652,749,808,734,687,606,581,666,712,605,586,635,492];
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x); return x*x*(3-2*x)};
const text=(x,y,s,size=28,fill='#f7f1eb',extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${s}</text>`;
const tg=(x,y,size)=>`<g transform="translate(${x} ${y}) scale(${size/60})"><rect width="60" height="60" rx="16" fill="url(#tg)"/><path d="M10 27 L48 13 Q51 12 50 16 L44 49 Q43 52 40 49 L29 39 L24 45 Q22 47 22 42 L24 32 L43 20 L18 30Z" fill="#fff"/></g>`;
const oura=(x,y,size)=>`<g transform="translate(${x} ${y}) scale(${size/96})"><rect width="96" height="96" rx="23" fill="#1d1d24"/><ellipse cx="48" cy="52" rx="27" ry="31" fill="none" stroke="#f5f3ef" stroke-width="6"/><path d="M35 14 H62" stroke="#f5f3ef" stroke-width="5" stroke-linecap="round"/></g>`;
const touch=(x,y,p)=>p>0&&p<1?`<circle cx="${x}" cy="${y}" r="${15+19*Math.sin(p*Math.PI)}" fill="#fff" fill-opacity=".17" stroke="#fff" stroke-opacity="${.75*Math.sin(p*Math.PI)}" stroke-width="3"/>`:'';
const wallpaper=`<g transform="translate(0 -10) scale(1 1.17)"><rect x="67" y="49" width="626" height="1358" fill="url(#wall)"/><path d="M-70 802 C160 430 355 640 488 388 C657 119 780 173 889 255 L862 1080 L-70 1208Z" fill="#426266" opacity=".55"/><path d="M-40 1070 C150 666 328 788 465 621 C574 488 644 555 800 350 L830 1300 L-40 1300Z" fill="#c7cdbc"/><path d="M-65 1240 C203 840 371 1045 504 855 C640 667 789 813 895 587 L908 1358Z" fill="#385553" opacity=".92"/><path d="M195 1264 C386 1042 509 1172 750 934 L850 1300Z" fill="#1c393c"/></g>`;
const status=`<rect x="288" y="66" width="184" height="49" rx="25" fill="#101617"/><circle cx="443" cy="90" r="8" fill="#1d2c33"/><g fill="#f4f8f5" transform="translate(0 13)"><path d="M574 87 V79 H579 V87 M584 87 V75 H589 V87 M594 87 V71 H599 V87 M604 87 V67 H609 V87"/><rect x="631" y="72" width="29" height="15" rx="4" fill="none" stroke="#fff" stroke-width="2"/><rect x="634" y="75" width="22" height="9" rx="1.5"/><rect x="663" y="77" width="3" height="5" rx="1"/></g>`;
function notification(y=845,illustrated=false){return `<g><rect x="91" y="${y}" width="578" height="181" rx="31" fill="${illustrated?'#f1f5f2':'url(#glass)'}"/>${tg(114,y+25,54)}${text(183,y+46,'Oura Stress Alerts',26,'#1d2926','font-weight="700"')}${text(642,y+46,'now',21,'#738079','text-anchor="end"')}<circle cx="194" cy="${y+81}" r="7" fill="#d45c53"/>${text(211,y+89,'Oura recorded high stress:',24,'#26312e')}${text(183,y+122,'15 min today.',24,'#26312e')}${text(183,y+155,'Your body has been showing…',23,'#35413c')}</g>`;}
// The app layout follows the supplied full-screen Oura reference. Values below
// are synthetic: the first high-stress sample is at 15:00, with no later data.
function appScreen(illustrated){
 const values=sampleValues;
 const pts=values.map((y,i)=>[47+(848/63)*i,y]);
 let chart='';
 for(const y of [394,525,655,787,933]) chart+=`<path d="M47 ${y} H895" stroke="#e8ddd6" stroke-opacity=".24" stroke-width="1.4"/>`;
 [['Stressed',470],['Engaged',601],['Relaxed',730],['Restored',870]].forEach(([label,y])=>chart+=text(895,y,label,29,'#c5b5b2','text-anchor="end"'));
 const segment=arr=>`<polyline points="${arr.map(v=>v.join(',')).join(' ')}" fill="none" stroke="#d7c7c4" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
 chart+=segment(pts.slice(0,8))+`<path d="M${pts[7].join(' ')} L${pts[9].join(' ')}" stroke="#d7c7c4" stroke-width="2.6" stroke-dasharray="1 9" stroke-linecap="round"/>`+segment(pts.slice(9));
 pts.forEach(([x,y],i)=>{if(i!==8)chart+=`<circle cx="${x}" cy="${y}" r="6.8" fill="#f6eae4"/>`});
 for(let i=0;i<16;i++)chart+=`<circle cx="${87+i*54}" cy="975" r="3.6" fill="#b5aaa8" fill-opacity=".67"/>`;
 chart+=text(47,1032,'8:15am',29,'#c5b5b2')+text(248,1032,'12pm',29,'#c5b5b2','text-anchor="middle"')+text(575,1032,'6pm',29,'#c5b5b2','text-anchor="middle"')+text(895,1032,'12am',29,'#c5b5b2','text-anchor="end"');
 const toggle=y=>`<rect x="754" y="${y}" width="141" height="55" rx="27.5" fill="#565255"/><circle cx="783" cy="${y+27.5}" r="23" fill="#e4dad5"/>`;
 let ui=`<rect width="942" height="2056" fill="#1a1a1d"/><rect width="942" height="1080" fill="url(#stress)"/><path d="M73 163 L55 182 L73 201" stroke="#f5ece5" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>${text(471,199,'Daytime Stress',39,'#f4eae5','text-anchor="middle"')}<circle cx="852" cy="183" r="22" fill="none" stroke="#f4eae5" stroke-width="3.5"/>${text(852,197,'i',37,'#f4eae5','text-anchor="middle" font-family="Georgia, serif" font-weight="600"')}${text(426,293,'Today',40,'#f4eae5','text-anchor="middle"')}<rect x="513" y="269" width="27" height="24" rx="3" fill="none" stroke="#f4eae5" stroke-width="2.5"/><path d="M513 276 H540 M520 264 V272 M534 264 V272" stroke="#f4eae5" stroke-width="2.5"/><path d="M377 318 H565" stroke="#f4eae5" stroke-width="2"/>${text(-26,293,'Yesterday',40,'#f4eae5','opacity=".2"')}${chart}`;
 ui+=`<rect x="0" y="1079" width="942" height="281" rx="53" fill="#242326"/><rect y="1079" width="942" height="70" fill="#242326"/><path d="M0 1220 H942" stroke="#ffffff" stroke-opacity=".1" stroke-width="2"/><g stroke="#ebe1dc" stroke-width="5" stroke-linecap="round"><path d="M56 1171 V1158 M66 1171 V1128 M76 1171 V1140 M86 1171 V1150 M96 1171 V1160"/></g>${text(122,1168,'Daily movement',39,'#eee4de')}${toggle(1122)}<path d="M54 1268 H72 L99 1295 L77 1317 L50 1290 V1272Z" fill="#eee4de"/><circle cx="62" cy="1280" r="4" fill="#242326"/>${text(122,1309,'Tags and activities',39,'#eee4de')}${toggle(1263)}`;
 ui+=`<rect x="0" y="1380" width="462" height="185" rx="29" fill="#242326"/><rect x="481" y="1380" width="461" height="185" rx="29" fill="#242326"/>${text(47,1458,'STRESSED',30,'#c5b5b2','font-weight="600" letter-spacing="1.5"')}${text(47,1513,'15m',39,'#f4eae5')}${text(527,1458,'RESTORED',30,'#c5b5b2','font-weight="600" letter-spacing="1.5"')}${text(527,1513,'1h',39,'#f4eae5')}<path d="M400 1463 L411 1475 L400 1487 M881 1463 L892 1475 L881 1487" fill="none" stroke="#c5b5b2" stroke-width="3.5" stroke-linecap="round"/><rect x="0" y="1585" width="942" height="357" rx="53" fill="url(#stress)"/>${text(47,1671,'Stressed',51,'#f4eae5')}${text(47,1734,'20m ago',33,'#c5b5b2','font-style="italic"')}${text(47,1806,'Your body is showing elevated signs of',34,'#f4eae5')}${text(47,1861,'stress. Take a moment to unwind.',34,'#f4eae5')}`;
 ui+=`<rect x="73" y="1857" width="654" height="101" rx="50" fill="#49464b" fill-opacity=".95"/><circle cx="814" cy="1908" r="49" fill="#49464b" fill-opacity=".95"/><g stroke="#c0b7b4" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M143 1925 V1887 Q164 1870 177 1878 Q180 1900 157 1901 H141 Q126 1902 125 1888 H143"/><path d="M274 1878 C246 1904 268 1927 290 1915 C265 1914 272 1893 274 1878Z"/><path d="M396 1878 C370 1904 384 1926 398 1923 C421 1917 417 1902 405 1897 C407 1916 390 1910 396 1878Z"/><path d="M513 1889 C486 1868 474 1898 488 1910 L513 1930 L538 1910 C552 1898 540 1868 513 1889Z"/><path d="M615 1897 L627 1886 L639 1897 L651 1886 L663 1897 M615 1916 L627 1905 L639 1916 L651 1905 L663 1916"/><path d="M814 1888 Q814 1908 797 1908 Q814 1908 814 1926 Q814 1908 831 1908 Q814 1908 814 1888Z"/></g>`;
 return `<g transform="translate(67 49) scale(${626/942})">${ui}</g>`;
}

function homeScreen(illustrated){
 let s=(illustrated?'<rect x="67" y="49" width="626" height="1358" fill="#dce7e0"/>'+text(380,173,'Home screen',37,'#234539','text-anchor="middle" font-weight="600"'):wallpaper);
 s+=oura(118,220,112)+text(174,371,'Oura',26,illustrated?'#234539':'#fff','text-anchor="middle"');
 s+=tg(324,220,112)+text(380,371,'Telegram',26,illustrated?'#234539':'#fff','text-anchor="middle"');
 s+=`<rect x="530" y="220" width="112" height="112" rx="27" fill="#e9ede7"/>${text(586,254,'TUE',20,'#b34d45','text-anchor="middle" font-weight="600"')}${text(586,309,'6',53,'#1d2926','text-anchor="middle"')}${text(586,371,'Calendar',26,illustrated?'#234539':'#fff','text-anchor="middle"')}`;
 if(!illustrated){s+=`<g transform="translate(0 200)"><rect x="105" y="1050" width="550" height="119" rx="43" fill="#d9e8df" fill-opacity=".2"/><rect x="145" y="1073" width="76" height="76" rx="20" fill="#43bb69"/><path d="M163 1090 L174 1086 L182 1100 L176 1107 Q180 1118 192 1123 L200 1117 L213 1125 L209 1137 Q177 1140 160 1104Z" fill="#fff"/><rect x="342" y="1073" width="76" height="76" rx="20" fill="#f1f5f4"/><circle cx="380" cy="1111" r="29" fill="#3caee2" stroke="#fff" stroke-width="2"/><path d="M398 1090 L385 1116 L364 1131 L376 1105Z" fill="#fff"/><path d="M398 1090 L376 1105 L385 1116Z" fill="#ec6261"/><rect x="539" y="1073" width="76" height="76" rx="20" fill="#43bb69"/><path d="M578 1087 C544 1087 544 1129 566 1133 L558 1142 L579 1134 C612 1133 611 1087 578 1087Z" fill="#fff"/></g>`;}
 return s;
}
function ouraHome(){
 let s=`<rect x="67" y="49" width="626" height="1358" fill="#25232e"/>${text(380,192,'Today',36,'#f5eee9','text-anchor="middle"')}<path d="M101 168 H140 M101 181 H140 M101 194 H140" stroke="#f5eee9" stroke-width="3" stroke-linecap="round"/>`;
 const labels=['Readiness','Sleep','Resilience','Stress'],values=['82','84','Solid','15m'];
 for(let i=0;i<4;i++){let x=145+i*151;s+=`<circle cx="${x}" cy="291" r="60" fill="${i===3?'#62414b':'#3b3942'}"/>${text(x,302,values[i],28,'#e8dbd8','text-anchor="middle"')}${text(x,384,labels[i],25,'#e8dbd8','text-anchor="middle"')}`;}
 s+=`<rect x="92" y="466" width="576" height="638" rx="36" fill="url(#stress)"/><circle cx="142" cy="530" r="28" fill="#ffffff" fill-opacity=".08"/><path d="M126 527 L134 519 L142 527 L150 519 L158 527 M126 539 L134 531 L142 539 L150 531 L158 539" fill="none" stroke="#e6d8d3" stroke-width="2.5" stroke-linecap="round"/><path d="M594 530 H625 M614 519 L625 530 L614 541" fill="none" stroke="#b7a7a6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${text(190,523,'Daytime Stress',32,'#f6eae4')}${text(190,568,'STRESSED',26,'#f182a5','font-weight="600" letter-spacing="1"')}${text(367,568,'20m ago',24,'#c7b6b6')}${text(128,658,'Your latest reading shows elevated',26,'#d9cccc')}${text(128,697,'physiological stress.',26,'#d9cccc')}<rect x="122" y="752" width="516" height="285" rx="21" fill="#ffffff" fill-opacity=".05"/><g clip-path="url(#mini-chart)"><rect x="122" y="752" width="177.375" height="285" fill="url(#night-hatch)"/></g><path d="M193 916 V875 M193 905 H245 V916 M203 889 H239 V905 H203Z" fill="none" stroke="#e6d8d3" stroke-width="3.5" stroke-linejoin="round"/><circle cx="202" cy="886" r="5" fill="#e6d8d3"/><path d="M248 752 V1037 M380 752 V1037 M512 752 V1037" stroke="#eee1de" stroke-opacity=".12"/><polyline points="${sampleValues.map((v,i)=>[122+(8.25+i*.25)*21.5,990-(933-v)/539*190].join(',')).join(' ')}" fill="none" stroke="#dfceca" stroke-width="3"/><g fill="#f4e8e1">${sampleValues.map((v,i)=>`<circle cx="${122+(8.25+i*.25)*21.5}" cy="${990-(933-v)/539*190}" r="3.8"/>`).join('')}</g>${text(131,1018,'12 am',21,'#c7b6b6')}${text(263,1018,'6 am',21,'#c7b6b6')}${text(395,1018,'12 pm',21,'#c7b6b6')}${text(527,1018,'6 pm',21,'#c7b6b6')}`;
 s+=`<rect x="91" y="1238" width="475" height="114" rx="57" fill="#49464b" fill-opacity=".95"/><circle cx="619" cy="1295" r="48" fill="#49464b" fill-opacity=".95"/><g fill="none" stroke="#dbd3cd" stroke-width="2.5" stroke-linecap="round"><circle cx="167" cy="1278" r="11"/><path d="M167 1256 V1261 M167 1295 V1300 M145 1278 H150 M184 1278 H189 M151 1262 L155 1266 M179 1290 L183 1294 M151 1294 L155 1290 M179 1266 L183 1262 M320 1292 Q312 1263 343 1266 Q345 1294 320 1292 M317 1299 L333 1275 M479 1298 V1274 M479 1289 Q460 1286 467 1269 Q479 1255 490 1269 Q499 1286 479 1289 M619 1278 V1310 M603 1294 H635"/></g>${text(167,1330,'Today',20,'#f4ece7','text-anchor="middle"')}${text(328,1330,'Vitals',20,'#bdb2b0','text-anchor="middle"')}${text(479,1330,'My Health',20,'#bdb2b0','text-anchor="middle"')}`;
 return s;
}

function frame(t,illustrated){
 const reset=t>=13.525, scene=reset?0:t;
 const unlock=smooth((scene-3.1)/.6),open=smooth((scene-5.2)/.55),detail=smooth((scene-6.75)/.45);
 const note=smooth((scene-.65)/.35);
 let lock=wallpaper+text(380,217,'Tuesday, October 6',29,'#f5f4ed','text-anchor="middle" font-weight="500"')+text(380,355,'3:20',134,'#f5f4ed','text-anchor="middle" font-weight="600" letter-spacing="-5"');
 lock+=`<g opacity="${note}" transform="translate(0 ${24*(1-note)})">${notification(1045,illustrated)}</g>`;
 lock+=text(380,1333,'Swipe up to open',22,'#dce9e1','text-anchor="middle"');
 if(illustrated){lock='<rect x="67" y="49" width="626" height="1358" fill="#dce7e0"/>'+text(380,193,'Your iPhone',37,'#234539','text-anchor="middle" font-weight="600"')+text(380,347,'3:20',116,'#234539','text-anchor="middle" font-weight="600"')+`<g opacity="${note}">${notification(555,true)}</g>`+text(380,1000,'Unlock, then open Oura',30,'#385c4c','text-anchor="middle"');}
 else {
  lock+=`<path d="M369 156 V146 a11 11 0 0 1 22 0 V156" fill="none" stroke="#f4f4ef" stroke-width="3.5"/><rect x="366" y="154" width="28" height="23" rx="5" fill="#f4f4ef"/><circle cx="151" cy="1308" r="39" fill="#172626" fill-opacity=".4"/><path d="M142 1290 H160 L156 1302 V1325 H146 V1302Z" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><circle cx="609" cy="1308" r="39" fill="#172626" fill-opacity=".4"/><path d="M590 1298 H600 L604 1293 H615 L619 1298 H628 V1322 H590Z" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><circle cx="609" cy="1309" r="7" fill="none" stroke="#fff" stroke-width="3"/>`;
 }
 let inside='';
 if(scene<3.1) inside=lock;
 else if(scene<3.7) inside=homeScreen(illustrated)+`<g transform="translate(0 ${-1358*unlock})"><g clip-path="url(#clip)">${lock}</g></g>`;
 else if(scene<5.2) inside=homeScreen(illustrated);
 else if(scene<5.75){
  const x=118+(67-118)*open,y=220+(49-220)*open,w=112+(626-112)*open,h=112+(1358-112)*open;
  inside=homeScreen(illustrated)+`<defs><clipPath id="opening"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${27+52*open}"/></clipPath></defs><g clip-path="url(#opening)"><g transform="translate(${x} ${y}) scale(${w/626} ${h/1358}) translate(-67 -49)">${ouraHome()}</g></g>`;
 } else if(scene<6.75) inside=ouraHome();
 else if(scene<7.2) inside=`<g transform="translate(${-188*detail} 0)">${ouraHome()}</g><g transform="translate(${626*(1-detail)} 0)">${appScreen(illustrated)}</g>`;
 else inside=appScreen(illustrated);
 inside+=touch(380,1382-160*clamp((scene-2.75)/.7),clamp((scene-2.75)/.7));
 inside+=touch(173,276,clamp((scene-4.55)/.65));
 inside+=touch(598,291,clamp((scene-6.1)/.65));
 const steps=scene<3.7?'1. Get a stress alert':scene<5.7?'2. Unlock and open Oura':scene<7.2?'3. Tap Stress':'4. See recorded stress';
 const extra=illustrated?`<rect x="85" y="8" width="590" height="62" rx="31" fill="#234539"/>${text(380,49,steps,30,'#eff5ef','text-anchor="middle" font-weight="600"')}`:'';
 const footerY=illustrated?1550:1485;
 const footer=`<rect x="86" y="${footerY-32}" width="588" height="48" rx="24" fill="#234539"/>${text(380,footerY,illustrated?'Illustrative demo · Example data':'Simulated iPhone demo · Example data',22,'#eff5ef','text-anchor="middle"')}`;
 const clock=scene>=3.1?text(130,105,'3:20',24,illustrated&&scene<5.5?'#234539':'#fff','font-weight="600"'):'';
 const dim=t<13.2?0:t<13.525?smooth((t-13.2)/.325):1-smooth((t-13.525)/.325);
 const shade=`<rect x="67" y="49" width="626" height="1358" fill="#101719" opacity="${dim}"/>`;
 const body=illustrated?`<rect x="53" y="35" width="654" height="1390" rx="77" fill="#1b2421" stroke="#90a89c" stroke-width="3"/>`:`<rect x="47" y="238" width="8" height="89" rx="4" fill="#4d5254"/><rect x="47" y="349" width="8" height="89" rx="4" fill="#4d5254"/><rect x="705" y="273" width="8" height="142" rx="4" fill="#4d5254"/><rect x="51" y="32" width="658" height="1392" rx="96" fill="#353a3c"/><rect x="56" y="37" width="648" height="1382" rx="92" fill="#111719" stroke="#788084" stroke-width="2"/>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="456" height="${illustrated?954:914}" viewBox="0 0 760 ${illustrated?1590:1523}"><defs><pattern id="night-hatch" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0 L8 8 M-2 6 L2 10 M6 -2 L10 2" stroke="#ded2cf" stroke-opacity=".12" stroke-width="1"/></pattern><clipPath id="mini-chart"><rect x="122" y="752" width="516" height="285" rx="21"/></clipPath><linearGradient id="wall" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c3d9d3"/><stop offset=".46" stop-color="#768f8b"/><stop offset="1" stop-color="#253f43"/></linearGradient><linearGradient id="stress" x1="0" y1="0" x2=".6" y2="1"><stop stop-color="#643b42"/><stop offset=".5" stop-color="#462b33"/><stop offset="1" stop-color="#271d24"/></linearGradient><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#4ebff0"/><stop offset="1" stop-color="#2489cb"/></linearGradient><linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f1f4f1"/><stop offset="1" stop-color="#dce5e1"/></linearGradient><clipPath id="clip"><rect x="67" y="49" width="626" height="1358" rx="79"/></clipPath></defs><g font-family="Helvetica Neue, Arial, sans-serif">${extra}<g transform="translate(0 ${illustrated?70:0})">${body}<g clip-path="url(#clip)">${inside}${clock}${illustrated?'':status}<rect x="272" y="1382" width="216" height="8" rx="4" fill="#fff" fill-opacity=".9"/>${shade}</g></g>${footer}</g></svg>`;
}

for(const kind of ['realistic','illustrated']){
 const dir=path.join(out,kind);fs.mkdirSync(dir,{recursive:true});
 for(let i=0;i<frames;i++){
  const svg=frame(i/fps,kind==='illustrated');
  const r=new Resvg(svg,{font:fs.existsSync('/System/Library/Fonts/HelveticaNeue.ttc')?{loadSystemFonts:false,fontFiles:['/System/Library/Fonts/HelveticaNeue.ttc','/System/Library/Fonts/Supplemental/Arial.ttf'],defaultFontFamily:'Helvetica Neue'}:{loadSystemFonts:true,defaultFontFamily:'Arial'}});
  fs.writeFileSync(path.join(dir,`${String(i).padStart(4,'0')}.png`),r.render().asPng());
  if([18,50,74,100].includes(i))fs.writeFileSync(path.join(out,`${kind}-${i}.svg`),svg);
 }
}
console.log('Rendered two 14-second demos at 12 fps.');
