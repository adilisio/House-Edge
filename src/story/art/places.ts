// Backdrops for every place the story names, drawn on a 400 x 300 panel. The
// cast stands across the bottom middle, so the telling details sit up top and
// at the sides. Gradient ids carry the place's key so they never collide.

import { INK, PAPER, circle, fade, ink, path, perspective, range, rect, stars, stroke, text } from "./kit";

export interface Place {
  label: string;
  /** SVG markup for a 400 x 300 viewBox. */
  svg: string;
}

const casinoExterior = `
<defs>
  ${fade("ce-sky", "#120c30", "#3b1d5e")}
  <radialGradient id="ce-glow"><stop offset="0" stop-color="#ffd166" stop-opacity="0.6"/><stop offset="1" stop-color="#ffd166" stop-opacity="0"/></radialGradient>
</defs>
<rect width="400" height="300" fill="url(#ce-sky)"/>
${stars([[20, 20], [70, 12], [372, 30], [350, 70], [14, 90], [385, 120]])}
${rect(38, 24, 324, 214, "#2a1f4a")}
${rect(38, 24, 324, 10, "#f2b705")}
${range(7).map((i) => range(2).map((r) => {
  const x = 56 + i * 44;
  const y = 46 + r * 30;
  if (i !== 5 || r !== 0) return rect(x, y, 28, 20, "#3d2f66");
  // Crane's office: the one lit window, with him in it.
  return `<rect x="${x - 10}" y="${y - 10}" width="48" height="40" fill="url(#ce-glow)"/>${rect(x, y, 28, 20, "#f2b705")}<path d="M${x + 8} ${y + 20} q6 -12 12 0 Z" fill="${INK}"/><circle cx="${x + 14}" cy="${y + 7}" r="3.5" fill="${INK}"/>`;
}).join("")).join("")}
<rect x="100" y="104" width="200" height="42" rx="4" fill="${INK}" stroke="#e63946" stroke-width="4"/>
${text(200, 135, 28, "#ffd166", "GILDED CRANE", `letter-spacing="2" stroke="#e63946" stroke-width="1"`)}
${path("M84 156 H316 L300 176 H100 Z", "#e63946")}
${range(12).map((i) => circle(108 + i * 17, 176, 3.2, "#ffd166", 1.5)).join("")}
${rect(158, 180, 84, 58, "#ffd166")}
<path d="M200 180 V238 M179 180 V238 M221 180 V238" ${stroke()}/>
<rect x="0" y="238" width="400" height="62" fill="#3b3355"/>
<path d="M0 238 H400" ${ink()}/>
${path("M162 238 H238 L270 300 H130 Z", "#e63946")}
<path d="M0 268 H130 M270 268 H400" stroke="#5c5280" stroke-width="3"/>
<path d="M20 238 V170 M380 238 V170" stroke="${INK}" stroke-width="4"/>
${circle(20, 166, 8, "#ffd166")}${circle(380, 166, 8, "#ffd166")}
`;

const casinoFloor = `
<defs>
  <radialGradient id="cf-glow"><stop offset="0" stop-color="#ffe8a3" stop-opacity="0.7"/><stop offset="1" stop-color="#ffe8a3" stop-opacity="0"/></radialGradient>
  <pattern id="cf-carpet" width="28" height="28" patternUnits="userSpaceOnUse"><rect width="28" height="28" fill="#f2b705"/><path d="M14 2 L26 14 L14 26 L2 14 Z" fill="#e63946" stroke="${INK}" stroke-width="1.5"/><circle cx="14" cy="14" r="3" fill="#7a1f2b"/></pattern>
</defs>
<rect width="400" height="300" fill="#7a1f2b"/>
${range(9).map((i) => `<path d="M${i * 50} 0 V200" stroke="#5e1720" stroke-width="6"/>`).join("")}
${[80, 320].map((x) => `
  <circle cx="${x}" cy="40" r="60" fill="url(#cf-glow)"/>
  <path d="M${x} 0 V18" ${stroke(3)}/>
  ${path(`M${x - 34} 44 L${x} 18 L${x + 34} 44 Z`, "#f2b705")}
  ${range(5).map((j) => circle(x - 28 + j * 14, 50, 4, "#fff3b0", 1.5)).join("")}`).join("")}
${range(6).map((i) => {
  const x = 16 + i * 64;
  if (i === 2 || i === 3) return "";
  return `${rect(x, 104, 48, 96, "#264653")}${rect(x + 6, 112, 36, 26, "#90e0ef", 2)}${text(x + 24, 132, 14, "#e63946", "7 7 7")}${rect(x + 8, 146, 32, 8, "#f2b705", 2)}${path(`M${x + 48} 120 l10 -6 v20`, "none", 2)}${circle(x + 58, 112, 4, "#e63946", 2)}`;
}).join("")}
${path("M140 132 Q200 112 260 132 L272 176 Q200 196 128 176 Z", "#2d6a4f")}
<path d="M150 140 Q200 124 250 140" ${stroke(2, "#f2b705")}/>
${range(4).map((i) => circle(170 + i * 20, 160, 5, ["#e63946", "#fdf6e3", "#264653", "#f2b705"][i], 1.5)).join("")}
<rect x="0" y="200" width="400" height="100" fill="url(#cf-carpet)"/>
<path d="M0 200 H400" ${ink()}/>
`;

const cityMap = `
<rect width="400" height="300" fill="#3a3d55"/>
${path("M-10 230 Q120 190 200 220 T410 170 V196 Q300 230 200 246 T-10 256 Z", "#457b9d")}
${range(7).map((c) => range(6).map((r) => {
  const x = 12 + c * 56;
  const y = 10 + r * 50;
  if (y + 36 > 196 && y < 256) return "";
  return rect(x, y, 44, 38, ["#59606b", "#4f5566", "#626a7d"][(c + r) % 3], 2, 3);
}).join("")).join("")}
${rect(124, 60, 44, 38, "#7a1f2b", 2, 3)}${text(146, 86, 13, "#ffd166", "CRANE")}
<path d="M58 140 H118 V100 H230 V48 H340" ${stroke(4, "#f2b705")} stroke-dasharray="10 8"/>
${[[146, 50], [340, 38]].map(([x, y]) => path(`M${x} ${y} q-12 -14 0 -26 q12 12 0 26 Z`, "#e63946", 2) + circle(x, y - 17, 3.5, PAPER, 1.5)).join("")}
${rect(320, 250, 66, 38, PAPER, 2)}
${path("M353 256 l0 8 M353 256 l-4 6 M353 256 l4 6", "none", 2)}
${text(353, 282, 12, INK, "N")}
`;

const luckyStrike = `
<defs><radialGradient id="ls-lamp"><stop offset="0" stop-color="#fff3b0" stop-opacity="0.6"/><stop offset="1" stop-color="#fff3b0" stop-opacity="0"/></radialGradient></defs>
<rect width="400" height="300" fill="#3d5a40"/>
${range(10).map((i) => `<path d="M${i * 44 + 12} 0 V210" stroke="#33493a" stroke-width="10"/>`).join("")}
<path d="M80 40 l20 -6 M340 70 l-14 10 M300 150 l16 4" ${stroke(3, "#2a3b2c")}/>
${rect(84, 22, 232, 50, INK, 3, 6)}
${text(200, 60, 32, "#80ffdb", `LUCKY STR<tspan fill="#2a3b2c">IKE</tspan>`, `letter-spacing="2"`)}
<circle cx="200" cy="110" r="70" fill="url(#ls-lamp)"/>
<path d="M200 0 V86" ${stroke(2)}/>
${path("M182 100 L200 84 L218 100 Z", "#2a9d8f")}
${path("M70 150 Q200 120 330 150 L346 210 H54 Z", "#2d6a4f")}
<path d="M84 156 Q200 130 316 156" ${stroke(2, PAPER)}/>
${path("M238 168 q10 -8 16 2 q4 10 -6 12 q-6 6 -10 -2 Z", "#3e2a1c", 1.5)}
${range(3).map((i) => rect(150 + i * 26, 160, 18, 26, PAPER, 2, 2)).join("")}
<rect x="0" y="210" width="400" height="90" fill="#a07a4f"/>
<path d="M0 210 H400" ${ink()}/>
${range(5).map((i) => `<path d="M0 ${226 + i * 16} H400" stroke="#8a6640" stroke-width="2"/>`).join("")}
${range(8).map((i) => `<path d="M${i * 60 + (i % 2) * 30} ${210 + (i % 5) * 16} v16" stroke="#8a6640" stroke-width="2"/>`).join("")}
`;

const alley = `
<defs>${fade("al-sky", "#0d1027", "#2b2d52")}<radialGradient id="al-lamp"><stop offset="0" stop-color="#ffd166" stop-opacity="0.55"/><stop offset="1" stop-color="#ffd166" stop-opacity="0"/></radialGradient></defs>
<rect width="400" height="300" fill="url(#al-sky)"/>
${path("M0 0 H150 L170 210 H0 Z", "#4a3040")}
${path("M400 0 H250 L230 210 H400 Z", "#3d2a3a")}
${range(9).map((i) => `<path d="M0 ${20 + i * 22} L${150 + (i * 20) / 9} ${20 + i * 22} M400 ${20 + i * 22} L${250 - (i * 20) / 9} ${20 + i * 22}" stroke="#2c1d28" stroke-width="2"/>`).join("")}
${rect(30, 110, 50, 100, "#22223b")}
<circle cx="56" cy="96" r="50" fill="url(#al-lamp)"/>
${path("M44 92 h24 l-6 -10 h-12 Z", "#f2b705", 2)}
<path d="M290 30 H380 M290 70 H380 M290 30 V110 M380 30 V110 M290 110 H380" ${stroke(3)}/>
${range(5).map((i) => `<path d="M${296 + i * 18} 30 V70" stroke="${INK}" stroke-width="2"/>`).join("")}
<path d="M300 70 L370 110" ${stroke(3)}/>
${path("M282 170 H372 L366 214 H288 Z", "#2a6f4f")}${path("M278 160 H376 L372 172 H282 Z", "#245c42")}
<rect x="0" y="210" width="400" height="90" fill="#4a4e69"/>
<path d="M0 210 H400" ${ink()}/>
<ellipse cx="200" cy="262" rx="70" ry="10" fill="#8e9aaf" opacity="0.6"/>
<path d="M120 210 L60 300 M280 210 L340 300" stroke="#3b3f58" stroke-width="3"/>
`;

const cityStreet = `
<rect width="400" height="300" fill="#7fb7d6"/>
${circle(340, 40, 18, "#ffd166")}
${[[0, 70, 70, "#e9c46a"], [70, 40, 80, "#f4a261"], [150, 90, 60, "#b8c0cc"], [210, 50, 90, "#e76f51"], [300, 80, 100, "#a8dadc"]].map(([x, y, w, c]) =>
  rect(x as number, y as number, w as number, 210 - (y as number), c as string) +
  range(3).map((r) => range(Math.floor((w as number) / 26)).map((k) => rect((x as number) + 10 + k * 26, (y as number) + 14 + r * 30, 14, 16, "#2b2d42", 2)).join("")).join("")).join("")}
<rect x="0" y="196" width="400" height="16" fill="#adb5bd"/>
<path d="M0 196 H400" ${ink()}/>
<rect x="0" y="212" width="400" height="88" fill="#59606b"/>
<path d="M0 212 H400" ${ink()}/>
${range(6).map((i) => `<rect x="${i * 76 + 10}" y="254" width="40" height="6" fill="${PAPER}"/>`).join("")}
${[[8, "#f2b705"], [250, "#e63946"]].map(([x, c]) => `${rect(x as number, 150, 120, 56, c as string, 3, 8)}${range(4).map((k) => rect((x as number) + 10 + k * 27, 158, 20, 18, "#cde7f3", 2)).join("")}${circle((x as number) + 24, 206, 10, INK)}${circle((x as number) + 96, 206, 10, INK)}`).join("")}
${path("M150 196 l14 -20 h34 l14 20 Z", "#8d99ae", 2)}
`;

const diner = `
<rect width="400" height="300" fill="#f4a261"/>
${rect(0, 0, 400, 16, "#e76f51")}
${rect(24, 34, 230, 112, "#8ecae6")}
<path d="M24 120 H254" stroke="#5a8fa8" stroke-width="2"/>
${path("M40 120 V80 H70 V120 M84 120 V64 H118 V120 M200 120 V74 H240 V120", "#4a6b7c", 2)}
${rect(130, 100, 54, 16, "#adb5bd", 2, 6)}
<path d="M139 116 a5 5 0 0 0 10 0 M165 116 a5 5 0 0 0 10 0" fill="${INK}"/>
<path d="M139 34 V146 M196 34 V146" stroke="${INK}" stroke-width="4"/>
<rect x="282" y="36" width="92" height="44" rx="8" fill="${INK}" stroke="#e63946" stroke-width="4"/>
${text(328, 69, 30, "#ff8fa3", "EAT", `letter-spacing="3"`)}
${rect(290, 112, 84, 56, "#e9f5f9", 3, 6)}
${path("M300 150 l16 -16 l16 16 Z M336 150 l16 -16 l16 16 Z", "#e9c46a", 2)}
${rect(0, 168, 400, 12, "#dee2e6")}
${rect(0, 180, 400, 44, "#2ec4b6")}
${range(10).map((i) => `<path d="M${i * 42 + 20} 184 V220" stroke="#1b9a8e" stroke-width="3"/>`).join("")}
${path("M58 168 v-10 h14 v10 M64 158 v-3", PAPER, 2)}
${path("M216 168 v-18 q8 -6 16 0 v18 Z", "#6c584c", 2)}
${range(10).map((i) => range(3).map((r) => ((i + r) % 2 ? `<rect x="${i * 40}" y="${224 + r * 26}" width="40" height="26" fill="${INK}"/>` : "")).join("")).join("")}
<path d="M0 224 H400" ${ink()}/>
`;

const gallery = `
<defs><linearGradient id="ga-spot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
<rect width="400" height="300" fill="#f1ece2"/>
<rect x="0" y="0" width="400" height="12" fill="#2b2d42"/>
${[60, 200, 340].map((x) => `${path(`M${x - 8} 12 h16 l-4 10 h-8 Z`, "#2b2d42", 2)}<path d="M${x - 6} 22 L${x - 56} 150 H${x + 56} L${x + 6} 22 Z" fill="url(#ga-spot)"/>`).join("")}
${rect(22, 46, 76, 96, "#b5838d", 5)}${rect(30, 54, 60, 80, "#e5989b", 2)}${circle(60, 84, 16, "#ffd166", 2)}${path("M30 120 L60 100 L90 124 V134 H30 Z", "#6d597a", 2)}
${rect(140, 40, 120, 92, "#c9a227", 6)}${rect(150, 50, 100, 72, "#264653", 2)}${path("M150 122 Q180 70 210 100 T250 70 V122 Z", "#2a9d8f", 2)}${circle(226, 70, 9, "#e9c46a", 2)}
${rect(304, 52, 72, 84, "#b8c0cc", 5)}${rect(312, 60, 56, 68, PAPER, 2)}${rect(318, 66, 22, 30, "#e63946", 2)}${rect(342, 84, 20, 38, "#457b9d", 2)}${rect(318, 100, 20, 22, "#f2b705", 2)}
${rect(190, 132, 20, 8, PAPER, 1.5)}
<rect x="0" y="200" width="400" height="100" fill="#b8c0cc"/>
<path d="M0 200 H400" ${ink()}/>
${perspective(200, "#a3acb9", [230, 268])}
${[30, 370].map((x) => `${path(`M${x - 6} 210 V160`, "none", 4)}${circle(x - 6, 156, 6, "#c9a227", 2)}`).join("")}
<path d="M24 172 Q200 200 376 172" ${stroke(5, "#9d0208")}/>
`;

const streetNight = `
<defs>${fade("sn-sky", "#060d17", "#1b2a41")}<linearGradient id="sn-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd166" stop-opacity="0.45"/><stop offset="1" stop-color="#ffd166" stop-opacity="0"/></linearGradient></defs>
<rect width="400" height="300" fill="url(#sn-sky)"/>
${stars([[30, 24], [120, 14], [210, 30], [380, 18], [300, 44]])}
${circle(340, 50, 16, "#f1ece2", 2)}
${path("M0 150 V110 H40 V90 H90 V130 H130 V150 Z", "#0d1b2a", 2)}
${rect(250, 70, 90, 34, INK, 3, 4)}${text(295, 96, 22, "#ff5d8f", "MOTEL", `letter-spacing="2"`)}
${rect(262, 106, 66, 16, INK, 2, 3)}${text(295, 119, 11, "#80ffdb", "VACANCY")}
<path d="M295 122 V170" stroke="${INK}" stroke-width="4"/>
${[70, 330].map((x) => `<path d="M${x - 10} 40 L${x - 60} 210 H${x + 40} L${x + 10} 40 Z" fill="url(#sn-cone)"/><path d="M${x} 210 V40 h-14" stroke="${INK}" stroke-width="4" fill="none"/>${path(`M${x - 22} 40 h16 l-3 6 h-10 Z`, "#ffd166", 2)}`).join("")}
<rect x="0" y="170" width="400" height="20" fill="#2c3e55"/>
<rect x="0" y="190" width="400" height="110" fill="#415a77"/>
<path d="M0 190 H400" ${ink()}/>
${range(5).map((i) => `<rect x="${i * 90 + 20}" y="246" width="44" height="5" fill="#ffd166"/>`).join("")}
${path("M150 200 q8 -34 46 -38 h80 q30 4 44 38 h22 q8 2 8 12 v26 h-224 v-26 q0 -10 24 -12 Z", "#2b2b2b")}
${path("M206 168 h60 l20 30 h-90 Z", "#5a7896", 2)}
${circle(190, 238, 16, INK)}${circle(320, 238, 16, INK)}
${circle(190, 238, 6, "#6c757d", 2)}${circle(320, 238, 6, "#6c757d", 2)}
${rect(342, 210, 12, 8, "#ffd166", 2)}
`;

const craneWindow = `
<defs>
  <radialGradient id="cw-floor" cx="0.5" cy="1"><stop offset="0" stop-color="#ffd166" stop-opacity="0.9"/><stop offset="1" stop-color="#7a1f2b" stop-opacity="0.2"/></radialGradient>
  <radialGradient id="cw-fire"><stop offset="0" stop-color="#ff9f1c" stop-opacity="0.6"/><stop offset="1" stop-color="#ff9f1c" stop-opacity="0"/></radialGradient>
</defs>
<rect width="400" height="300" fill="#2b2118"/>
${range(8).map((i) => `<path d="M${i * 54} 0 V206" stroke="#231a13" stroke-width="4"/>`).join("")}
${rect(110, 20, 230, 150, "#3a1218")}
<rect x="113" y="23" width="224" height="144" fill="url(#cw-floor)"/>
${range(4).map((i) => `${path(`M${150 + i * 50} 23 v14 l-12 14 h24 Z`, "#f2b705", 1.5)}`).join("")}
${range(10).map((i) => circle(124 + i * 23, 140 + (i % 2) * 10, 4, ["#e63946", "#2ec4b6", "#ffd166"][i % 3], 1)).join("")}
<path d="M225 20 V170 M110 95 H340" stroke="${INK}" stroke-width="5"/>
${rect(26, 56, 62, 46, "#c9a227", 5)}${rect(32, 62, 50, 34, "#556b2f", 2)}${path("M32 96 L52 74 L66 86 L82 70 V96 Z", "#2d4a22", 2)}
<rect x="340" y="120" width="70" height="90" fill="url(#cw-fire)"/>
${rect(352, 134, 52, 72, "#5c4033")}${rect(362, 150, 32, 56, "#1a1a1a", 2)}${path("M368 206 q4 -18 10 -6 q6 -16 10 6 Z", "#ff9f1c", 2)}
<rect x="0" y="206" width="400" height="94" fill="#4a2c1a"/>
<path d="M0 206 H400" ${ink()}/>
${path("M20 240 H380 L392 300 H8 Z", "#6f4518")}
<path d="M30 252 H370" stroke="#5a3712" stroke-width="3"/>
${rect(300, 222, 10, 18, PAPER, 2)}${path("M296 222 h18 l-4 -10 h-10 Z", "#ffd166", 2)}
${rect(60, 228, 40, 12, "#2b2118", 2)}
`;

const hideout = `
<defs><radialGradient id="hi-bulb"><stop offset="0" stop-color="#fff3b0" stop-opacity="0.6"/><stop offset="1" stop-color="#fff3b0" stop-opacity="0"/></radialGradient></defs>
<rect width="400" height="300" fill="#5c4b51"/>
${rect(8, 30, 150, 176, "#8d99ae")}
${range(14).map((i) => `<path d="M10 ${40 + i * 12} H156" stroke="#6c7a91" stroke-width="2"/>`).join("")}
${rect(70, 196, 24, 8, "#495057", 2)}
${rect(196, 34, 150, 92, "#f8f9fa", 4)}
<path d="M210 56 h40 M210 70 h60 M282 50 l20 20 M302 50 l-20 20 M210 92 q30 -20 56 4 l-8 -2 M270 96 l-4 -8" ${stroke(2.5, "#1d3557")}/>
${rect(214, 100, 40, 14, "#e63946", 2)}${rect(296, 92, 30, 22, "#f2b705", 2)}
<path d="M200 126 V136 M342 126 V136" ${stroke(3)}/>
<circle cx="180" cy="40" r="60" fill="url(#hi-bulb)"/>
<path d="M180 0 V30" ${stroke(2)}/>
${circle(180, 36, 7, "#fff3b0", 2)}
${rect(350, 150, 44, 10, "#8c7b6b")}${rect(358, 122, 22, 28, "#343a40", 2, 3)}${rect(364, 140, 10, 10, PAPER, 1.5)}
${rect(166, 158, 56, 48, "#b08968")}<path d="M166 158 L222 206 M222 158 L166 206" stroke="#7f5539" stroke-width="3"/>
<rect x="0" y="206" width="400" height="94" fill="#8c7b6b"/>
<path d="M0 206 H400" ${ink()}/>
<ellipse cx="300" cy="262" rx="44" ry="9" fill="#5c4b51" opacity="0.7"/>
${perspective(206, "#7d6c5d")}
`;

const officeHall = `
<rect width="400" height="300" fill="#3a0f16"/>
${range(9).map((i) => `<path d="M${i * 50} 0 V140" stroke="#4a141d" stroke-width="12"/>`).join("")}
${rect(0, 140, 400, 70, "#5c1a24")}${range(8).map((i) => rect(12 + i * 50, 150, 34, 50, "#4a141d", 2)).join("")}
<path d="M0 140 H400" stroke="#c9a227" stroke-width="4"/>
${rect(150, 36, 100, 174, "#2b1a12", 4)}
${rect(160, 48, 80, 68, "#3d2518", 2)}${rect(160, 126, 80, 74, "#3d2518", 2)}
${circle(232, 124, 5, "#c9a227", 2)}
${rect(172, 18, 56, 14, "#c9a227", 2)}${text(200, 30, 11, INK, "V. CRANE")}
${[90, 310].map((x) => `<circle cx="${x}" cy="70" r="26" fill="#ffd166" opacity="0.3"/>${path(`M${x - 8} 84 h16 l-4 -24 h-8 Z`, "#c9a227", 2)}${path(`M${x - 7} 60 q7 -16 14 0 Z`, "#fff3b0", 2)}`).join("")}
<rect x="0" y="210" width="400" height="90" fill="#2b0a10"/>
<path d="M0 210 H400" ${ink()}/>
${path("M150 210 H250 L320 300 H80 Z", "#7a1f2b")}
<path d="M160 214 H240 L304 296 H96 Z" ${stroke(2, "#c9a227")}/>
`;

const rooftop = `
<defs>${fade("rt-sky", "#0b132b", "#3a3a6a")}<radialGradient id="rt-glow" cx="0.5" cy="1"><stop offset="0" stop-color="#ffd166" stop-opacity="0.7"/><stop offset="1" stop-color="#ffd166" stop-opacity="0"/></radialGradient></defs>
<rect width="400" height="300" fill="url(#rt-sky)"/>
${stars([[20, 20], [90, 40], [160, 12], [250, 26], [330, 14], [384, 50], [60, 80]])}
<ellipse cx="250" cy="150" rx="120" ry="80" fill="url(#rt-glow)"/>
${[[0, 120, 50], [50, 140, 40], [90, 110, 60], [150, 130, 40], [300, 125, 50], [350, 100, 50]].map(([x, y, w]) => `${rect(x, y, w, 200 - y, "#1c2541", 2)}${range(3).map((k) => `<rect x="${x + 8 + (k % 2) * 18}" y="${y + 10 + k * 18}" width="8" height="8" fill="#ffd166" opacity="0.8"/>`).join("")}`).join("")}
${rect(200, 70, 90, 130, "#3a0f16")}${path("M200 70 L245 40 L290 70 Z", "#f2b705")}
${text(245, 100, 15, "#ffd166", "GILDED")}${text(245, 118, 15, "#ffd166", "CRANE")}
${range(4).map((r) => range(4).map((k) => `<rect x="${208 + k * 20}" y="${130 + r * 16}" width="10" height="8" fill="#ffd166"/>`).join("")).join("")}
${path("M20 160 h56 v40 h-56 Z", "#5c4033")}${path("M14 160 l34 -22 l34 22 Z", "#3d2b22")}<path d="M28 200 V230 M68 200 V230" ${stroke(4)}/>
<rect x="0" y="200" width="400" height="100" fill="#3d405b"/>
${rect(-4, 200, 408, 22, "#4d5170")}
${range(10).map((i) => `<path d="M${i * 44} 200 v22" stroke="#3d405b" stroke-width="2"/>`).join("")}
`;

const bar = `
<defs><radialGradient id="ba-lamp"><stop offset="0" stop-color="#90e0ef" stop-opacity="0.7"/><stop offset="1" stop-color="#90e0ef" stop-opacity="0"/></radialGradient></defs>
<rect width="400" height="300" fill="#003049"/>
${rect(30, 40, 340, 110, "#4a6f8a")}
${[78, 118].map((y) => rect(30, y, 340, 6, "#6b4226", 2)).join("")}
${range(14).map((i) => {
  const x = 40 + i * 23;
  const c = ["#2a9d8f", "#e9c46a", "#e76f51", "#8ecae6", "#9d0208"][i % 5];
  return path(`M${x} 78 v-18 q0 -6 4 -8 v-8 h6 v8 q4 2 4 8 v18 Z`, c, 2) + path(`M${x + 2} 118 v-16 q0 -6 5 -8 v-6 h4 v6 q5 2 5 8 v16 Z`, ["#e9c46a", "#8ecae6", "#2a9d8f"][i % 3], 2);
}).join("")}
${[90, 310].map((x) => `<circle cx="${x}" cy="30" r="44" fill="url(#ba-lamp)"/><path d="M${x} 0 V16" ${stroke(2)}/>${path(`M${x - 12} 16 h24 l-4 26 h-16 Z`, "#48cae4")}<path d="M${x - 10} 28 h20" stroke="${INK}" stroke-width="2"/>`).join("")}
${rect(0, 168, 400, 16, "#8b5e34")}
${rect(0, 184, 400, 50, "#6b4226")}
${range(8).map((i) => `<path d="M${i * 54 + 24} 188 V230" stroke="#5a3820" stroke-width="3"/>`).join("")}
${path("M150 168 v-14 h10 v14 M300 168 l-6 -16 h18 l-6 16 Z", "#e9c46a", 2)}
<rect x="0" y="234" width="400" height="66" fill="#669bbc"/>
<path d="M0 234 H400" ${ink()}/>
${perspective(234, "#5a8aa8")}
`;

const deeCar = `
<defs>${fade("dc-sky", "#0b1d3a", "#1d3557")}</defs>
<rect width="400" height="300" fill="#0d1321"/>
${path("M30 40 Q200 14 370 40 L392 170 H8 Z", "url(#dc-sky)")}
${range(6).map((i) => `<rect x="${44 + i * 56}" y="${100 - (i % 3) * 18}" width="40" height="${70 + (i % 3) * 18}" fill="#14213d" stroke="${INK}" stroke-width="2"/>${range(3).map((k) => `<rect x="${52 + i * 56 + (k % 2) * 14}" y="${110 - (i % 3) * 18 + k * 16}" width="8" height="6" fill="#ffd166"/>`).join("")}`).join("")}
${circle(108, 160, 6, "#e63946", 2)}${circle(300, 160, 6, "#e63946", 2)}
${rect(170, 40, 60, 18, "#2b2d42", 2, 4)}<path d="M200 22 V40" ${stroke(3)}/>
<path d="M196 58 v10 M204 58 v14" ${stroke(1.5)}/>${rect(190, 68, 10, 10, "#e63946", 1.5)}${rect(200, 72, 10, 10, PAPER, 1.5)}
${path("M0 0 H400 V40 Q200 10 0 40 Z", "#1a1a1a")}
${path("M0 0 L30 40 L8 170 H0 Z M400 0 L370 40 L392 170 H400 Z", "#1a1a1a")}
${path("M0 170 H400 V300 H0 Z", "#457b9d")}
${path("M0 170 Q200 150 400 170 V200 H0 Z", "#2b4a66")}
${rect(150, 176, 100, 20, "#14213d", 2, 6)}
${range(3).map((i) => circle(176 + i * 24, 186, 6, "#90e0ef", 1.5)).join("")}
${circle(60, 230, 56, "none", 9)}<circle cx="60" cy="230" r="56" fill="none" stroke="#2b2d42" stroke-width="5"/>
<path d="M60 230 L14 216 M60 230 L106 216 M60 230 V286" stroke="${INK}" stroke-width="7"/>
${circle(60, 230, 12, "#2b2d42")}
`;

const highLimit = `
<defs><radialGradient id="hl-lamp" cx="0.5" cy="0"><stop offset="0" stop-color="#fff3b0" stop-opacity="0.7"/><stop offset="1" stop-color="#fff3b0" stop-opacity="0"/></radialGradient></defs>
<rect width="400" height="300" fill="#2d6a4f"/>
${range(10).map((i) => `<path d="M${i * 44 + 10} 0 V180" stroke="#255a43" stroke-width="12"/>`).join("")}
<path d="M0 180 H400" stroke="#c9a227" stroke-width="5"/>
<rect x="0" y="182" width="400" height="118" fill="#d4a373"/>
${path("M160 0 H240 L300 150 H100 Z", "url(#hl-lamp)", 0)}
<path d="M200 0 V40" ${stroke(2)}/>
${path("M168 52 L200 38 L232 52 Z", "#2d6a4f")}
${path("M70 150 Q200 110 330 150 L350 214 Q200 240 50 214 Z", "#1b4332")}
<path d="M84 158 Q200 124 316 158 L330 206 Q200 228 70 206 Z" fill="#2d6a4f" ${stroke(2, "#c9a227")}/>
${range(3).map((i) => range(4).map((k) => `<ellipse cx="${150 + i * 50}" cy="${178 - k * 4}" rx="10" ry="4" fill="${["#e63946", "#264653", "#f2b705"][i]}" ${ink(1.5)}/>`).join("")).join("")}
${rect(10, 140, 64, 8, "#6f4518")}<path d="M18 148 V200 M66 148 V200" ${stroke(4)}/>
${range(4).map((i) => rect(16 + i * 13, 118, 10, 22, "#f8f9fa", 1.5, 2)).join("")}
${range(4).map((i) => `<path d="M${18 + i * 13} 126 h6" stroke="#c9a227" stroke-width="2"/>`).join("")}
${rect(318, 40, 60, 70, "#c9a227", 5)}${rect(326, 48, 44, 54, "#1b4332", 2)}${text(348, 82, 18, "#ffd166", "$")}
`;

const corridor = `
<defs><radialGradient id="co-light"><stop offset="0" stop-color="#f1faee" stop-opacity="0.6"/><stop offset="1" stop-color="#f1faee" stop-opacity="0"/></radialGradient></defs>
<rect width="400" height="300" fill="#2f3e46"/>
${path("M0 0 L130 70 V200 L0 260 Z", "#3d5058")}
${path("M400 0 L270 70 V200 L400 260 Z", "#354850")}
${rect(130, 70, 140, 130, "#52796f")}
${rect(176, 104, 48, 96, "#354f52", 2)}${circle(216, 154, 3, "#c9a227", 1.5)}
${path("M30 60 L90 88 V180 L30 200 Z", "#4a5d65", 2)}
${path("M370 60 L310 88 V180 L370 200 Z", "#43555d", 2)}
<circle cx="200" cy="40" r="44" fill="url(#co-light)"/>
${rect(178, 18, 44, 10, "#f1faee", 2)}
${path("M300 30 h40 v6 h-12 l-4 14 h-24 Z", "#e9ecef", 2)}${circle(306, 44, 6, "#212529", 2)}${circle(334, 34, 3, "#e63946", 1)}
<path d="M320 0 V30" ${stroke(3)}/>
<path d="M100 26 V40" ${stroke(2)}/>${circle(100, 42, 4, "#adb5bd", 2)}
${path("M100 42 l-30 -6 l2 6 Z M100 42 l30 6 l-2 -6 Z", "#adb5bd", 1.5)}
${path("M0 260 L130 200 H270 L400 260 V300 H0 Z", "#52796f")}
${path("M130 200 H270 L400 260 V300 H0 V260 Z", "#4a6b62")}
${range(5).map((i) => `<path d="M${130 - i * 34} ${200 + i * 16} H${270 + i * 34}" stroke="#3f5e55" stroke-width="2"/>`).join("")}
<path d="M200 200 V300" stroke="#3f5e55" stroke-width="2"/>
`;

const vaultFloor = `
<defs>${fade("vf-light", "#fff3b0", "#fff3b0", 0.5, 0)}</defs>
<rect width="400" height="300" fill="#495057"/>
${[40, 120, 280, 360].map((x) => `<path d="M${x} 0 V214" stroke="#3b4147" stroke-width="3"/>${[30, 110, 190].map((y) => `<circle cx="${x - 8}" cy="${y}" r="2" fill="#6c757d"/><circle cx="${x + 8}" cy="${y}" r="2" fill="#6c757d"/>`).join("")}`).join("")}
${rect(96, 22, 208, 196, "#343a40")}
${circle(200, 120, 92, "#adb5bd", 5)}
${range(16).map((i) => {
  const a = (i / 16) * Math.PI * 2;
  return circle(200 + Math.cos(a) * 82, 120 + Math.sin(a) * 82, 4, "#6c757d", 1.5);
}).join("")}
${circle(200, 120, 70, "#ced4da")}
${range(3).map((i) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
  const d = `M200 120 L${200 + Math.cos(a) * 50} ${120 + Math.sin(a) * 50}`;
  return `<path d="${d}" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="${d}" stroke="#f2b705" stroke-width="4" stroke-linecap="round"/>`;
}).join("")}
${circle(200, 120, 22, "#212529")}
${range(20).map((i) => {
  const a = (i / 20) * Math.PI * 2;
  return `<path d="M${200 + Math.cos(a) * 17} ${120 + Math.sin(a) * 17} L${200 + Math.cos(a) * 21} ${120 + Math.sin(a) * 21}" stroke="${PAPER}" stroke-width="1.5"/>`;
}).join("")}
${circle(200, 120, 9, "#adb5bd", 2)}
<path d="M200 96 l-4 -6 h8 Z" fill="#e63946"/>
${rect(318, 60, 44, 18, "#f2b705", 2)}${text(340, 73, 11, INK, "STAFF ONLY")}
${circle(56, 64, 9, "#e63946")}
<path d="M150 0 L250 0 L330 214 L70 214 Z" fill="url(#vf-light)"/>
<rect x="0" y="214" width="400" height="86" fill="#6c757d"/>
<path d="M0 214 H400" ${ink()}/>
${perspective(214, "#5c636a", [248])}
`;

export const PLACES: Record<string, Place> = {
  "casino-exterior": { label: "The Gilded Crane", svg: casinoExterior },
  "casino-floor": { label: "The Gilded Crane, casino floor", svg: casinoFloor },
  "city-map": { label: "The city", svg: cityMap },
  "lucky-strike": { label: "The Lucky Strike", svg: luckyStrike },
  alley: { label: "The alley out back", svg: alley },
  "city-street": { label: "Fifth Street", svg: cityStreet },
  diner: { label: "The diner on Fifth", svg: diner },
  gallery: { label: "The Varga Gallery", svg: gallery },
  "street-night": { label: "On the way to the motel", svg: streetNight },
  "crane-window": { label: "Crane's office", svg: craneWindow },
  hideout: { label: "The garage on Pier Street", svg: hideout },
  "office-hall": { label: "Outside Crane's office", svg: officeHall },
  rooftop: { label: "The hideout roof", svg: rooftop },
  bar: { label: "The Blue Lantern", svg: bar },
  "dee-car": { label: "Dee's car", svg: deeCar },
  "high-limit": { label: "The high-limit room", svg: highLimit },
  corridor: { label: "A service corridor", svg: corridor },
  "vault-floor": { label: "The vault floor", svg: vaultFloor },
};
