// Drawing helpers shared by the backdrops and the cast: flat comic shapes with
// thick ink outlines, written as SVG markup strings.

export const INK = "#111";
export const PAPER = "#fdf6e3";

/** Outline attributes: ink stroke of the given width, rounded joins. */
export const ink = (w = 3) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/** An unfilled ink line. */
export const stroke = (w = 2, color = INK) => `stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;

export const range = (n: number) => Array.from({ length: n }, (_, i) => i);

export const rect = (x: number, y: number, w: number, h: number, fill: string, line = 3, rx = 0) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}"${rx ? ` rx="${rx}"` : ""} fill="${fill}" ${ink(line)}/>`;

export const circle = (cx: number, cy: number, r: number, fill: string, line = 3) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${ink(line)}/>`;

export const path = (d: string, fill: string, line = 3) => `<path d="${d}" fill="${fill}" ${ink(line)}/>`;

export const text = (x: number, y: number, size: number, fill: string, words: string, extra = "") =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-family="Bangers, Impact, sans-serif" font-size="${size}" fill="${fill}" ${extra}>${words}</text>`;

/** A soft vertical fade, for light cones and skies. */
export const fade = (id: string, top: string, bottom: string, topOpacity = 1, bottomOpacity = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}" stop-opacity="${topOpacity}"/><stop offset="1" stop-color="${bottom}" stop-opacity="${bottomOpacity}"/></linearGradient>`;

/** A few stars in a night sky, at fixed spots so the panel never shifts. */
export const stars = (points: [number, number][]) => points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="${PAPER}"/>`).join("");

/** Floor boards or tiles converging on a vanishing point above the panel's centre. */
export const perspective = (top: number, color: string, rows: number[] = []) =>
  range(9).map((i) => {
    const x = -200 + i * 100;
    return `<path d="M${200 + (x - 200) * 0.35} ${top} L${x} 300" stroke="${color}" stroke-width="2"/>`;
  }).join("") + rows.map((y) => `<path d="M0 ${y} H400" stroke="${color}" stroke-width="2"/>`).join("");
