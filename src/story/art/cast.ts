// The cast, from the waist up on a 120 x 182 figure. Each keeps the colours
// the first placeholder art gave them, so a silhouette still reads at a glance.
//
// A character is a body (everything that never changes) and a face. At rest
// the face is the character's own drawing; any other mood is drawn from the
// face's measurements, so every character can look happy, angry, worried,
// shocked or sad. Glasses, moustaches and cigars go on top of whatever the
// face is doing.

import { INK, PAPER, circle, ink, path, stroke } from "./kit";

export const MOODS = ["neutral", "happy", "angry", "worried", "shocked", "sad"] as const;
export type Mood = (typeof MOODS)[number];

export const isMood = (word: string): word is Mood => (MOODS as readonly string[]).includes(word);

/**
 * Read "Theo worried, High Roller angry": each entry is a name and, last, a
 * mood. Entries that don't end in a known mood are left out.
 */
export function parseMoods(text: string): Record<string, Mood> {
  const moods: Record<string, Mood> = {};
  for (const entry of text.split(",")) {
    const words = entry.trim().split(/\s+/);
    const mood = words.pop() ?? "";
    if (words.length && isMood(mood)) moods[words.join(" ")] = mood;
  }
  return moods;
}

interface Face {
  /** Height of the eyes' centres; the eyes sit at x 52 and 68. */
  eyeY: number;
  /** Height of the brows at rest. */
  browY: number;
  /** Height of the mouth's centre. */
  mouthY: number;
  /** The face at rest, as the character was first drawn. */
  neutral: string;
  /** Drawn on top of any mood: glasses, a moustache, a cigar. */
  over?: string;
  /** Eyes drawn as whites with pupils, rather than dots. */
  whites?: boolean;
}

export interface Character {
  /** SVG markup for a 120 x 182 viewBox, standing on its bottom edge. */
  body: string;
  face: Face;
}

const shoulders = (fill: string) => path("M6 182 L12 128 Q18 100 60 96 Q102 100 108 128 L114 182 Z", fill);
const neck = (skin: string) => path("M50 76 V100 H70 V76", skin);
const head = (skin: string, rx = 21, ry = 25) =>
  `<ellipse cx="39" cy="58" rx="5" ry="7" fill="${skin}" ${ink()}/><ellipse cx="81" cy="58" rx="5" ry="7" fill="${skin}" ${ink()}/>` +
  `<ellipse cx="60" cy="54" rx="${rx}" ry="${ry}" fill="${skin}" ${ink()}/>`;
const eyes = (y = 54, r = 2.6) => `<circle cx="52" cy="${y}" r="${r}" fill="${INK}"/><circle cx="68" cy="${y}" r="${r}" fill="${INK}"/>`;
const whites = (y: number) =>
  `<ellipse cx="52" cy="${y}" rx="5" ry="3.5" fill="#fff" ${ink(2)}/><ellipse cx="68" cy="${y}" rx="5" ry="3.5" fill="#fff" ${ink(2)}/>`;
const nose = `<path d="M60 57 l3 8 h-5" ${stroke()}/>`;
const brows = (d: string, w = 3) => `<path d="${d}" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
const mouth = (d: string, w = 2.5) => `<path d="${d}" ${stroke(w)}/>`;
const lenses = (y: number, r: number) =>
  `<circle cx="${60 - 8 - (r - 7)}" cy="${y}" r="${r}" fill="${PAPER}" fill-opacity="0.35" ${ink(2)}/>` +
  `<circle cx="${60 + 8 + (r - 7)}" cy="${y}" r="${r}" fill="${PAPER}" fill-opacity="0.35" ${ink(2)}/><path d="M59 ${y} h2" ${stroke()}/>`;
/** Shirt showing in the V of a jacket. */
const shirt = (fill = PAPER) => path("M46 98 L60 128 L74 98 Z", fill);
const tie = (fill: string) => path("M57 100 L63 100 L66 126 L60 134 L54 126 Z", fill, 2);
const lapels = (fill: string, low = 140) => path(`M44 98 L38 ${low} L54 116 Z M76 98 L82 ${low} L66 116 Z`, fill);
/** Stubble or jowl shading along the jaw. */
const jaw = (opacity = 0.18) => `<path d="M40 62 Q42 80 60 80 Q78 80 80 62 Q74 74 60 74 Q46 74 40 62 Z" fill="#000" fill-opacity="${opacity}"/>`;

/** Brows, eyes and mouth for a mood, placed from the face's measurements. */
function moodFace(face: Face, mood: Exclude<Mood, "neutral">): string {
  const { eyeY: e, browY: b, mouthY: m } = face;
  const dots = (y = e, r = 2.6) => (face.whites ? whites(y) + eyes(y, 2.4) : eyes(y, r));
  switch (mood) {
    case "happy":
      return (
        brows(`M46 ${b - 1} q5 -4 10 0 M64 ${b - 1} q5 -4 10 0`) +
        `<path d="M48 ${e + 1} q4 -5 8 0 M64 ${e + 1} q4 -5 8 0" ${stroke(2.5)}/>` +
        path(`M50 ${m - 2} Q60 ${m + 9} 70 ${m - 2} Z`, "#fff", 2)
      );
    case "angry":
      return brows(`M46 ${b - 3} L56 ${b + 2} M74 ${b - 3} L64 ${b + 2}`, 3.5) + dots() + mouth(`M51 ${m + 3} q9 -7 18 0`, 3);
    case "worried":
      return (
        brows(`M46 ${b + 1} L56 ${b - 3} M74 ${b + 1} L64 ${b - 3}`) +
        dots() +
        mouth(`M52 ${m} q4 -3 8 0 q4 3 8 0`) +
        // A bead of sweat at the temple.
        path(`M86 ${e - 14} q4 6 0 10 q-4 -4 0 -10 Z`, "#90e0ef", 1.5)
      );
    case "shocked":
      return (
        brows(`M46 ${b - 4} q5 -4 10 0 M64 ${b - 4} q5 -4 10 0`) +
        circle(52, e, 4.5, "#fff", 2) + circle(68, e, 4.5, "#fff", 2) + eyes(e, 2) +
        `<ellipse cx="60" cy="${m + 3}" rx="4" ry="5" fill="#3a1a1a" ${ink(2)}/>`
      );
    case "sad":
      return brows(`M46 ${b + 1} L56 ${b - 2} M74 ${b + 1} L64 ${b - 2}`, 2.5) + dots(e + 1, 2.4) + mouth(`M52 ${m + 3} q8 -7 16 0`);
  }
}

/** A character's figure with the given expression, as SVG markup for a 120 x 182 viewBox. */
export function figureSvg(name: string, mood: Mood = "neutral"): string {
  const c = CHARACTERS[name];
  if (!c) return "";
  const face = mood === "neutral" ? c.face.neutral : moodFace(c.face, mood);
  return c.body + face + (c.face.over ?? "");
}

export const CHARACTERS: Record<string, Character> = {
  Sam: {
    body: `
      ${shoulders("#2ec4b6")}
      <path d="M60 128 V182" ${stroke()}/>
      ${neck("#e0ac69")}
      ${shirt()}
      ${path("M42 96 L34 120 L52 112 L60 128 L46 98 Z M78 96 L86 120 L68 112 L60 128 L74 98 Z", "#26a69a")}
      <path d="M30 150 h18 M72 150 h18" ${stroke()}/>
      ${head("#e0ac69")}
      ${jaw()}
      ${path("M38 52 Q36 28 58 26 Q82 26 82 50 Q76 38 62 38 Q52 42 44 40 Q40 46 38 52 Z", "#4a2c1a")}
      ${nose}`,
    face: {
      eyeY: 54,
      browY: 47,
      mouthY: 68,
      neutral: brows("M47 47 l9 -1 M64 46 l9 1") + eyes() + mouth("M52 69 q8 2 15 -3"),
    },
  },
  Crane: {
    body: `
      ${shoulders("#1d1d1d")}
      ${neck("#f1c7a5")}
      ${shirt()}
      ${tie("#e63946")}
      ${lapels("#000")}
      ${circle(86, 128, 4, "#f2b705", 1.5)}
      ${head("#f1c7a5", 19, 26)}
      ${path("M41 50 Q40 24 62 25 Q82 27 80 50 Q78 36 64 34 Q48 34 41 50 Z", "#ced4da")}
      <path d="M48 40 Q60 30 76 40" ${stroke(2, "#adb5bd")}/>
      <path d="M42 64 q2 10 10 14 M78 64 q-2 10 -10 14" ${stroke(2, "rgba(0,0,0,0.2)")}/>
      ${nose}`,
    face: {
      eyeY: 56,
      browY: 50,
      mouthY: 71,
      neutral: brows("M46 49 l10 3 M74 49 l-10 3") + eyes(56) + mouth("M51 70 q9 4 18 -1"),
    },
  },
  Dee: {
    body: `
      ${shoulders("#1a1a1a")}
      <path d="M60 104 V182" stroke="#adb5bd" stroke-width="2"/>
      <path d="M28 120 q6 -10 14 -14 M92 120 q-6 -10 -14 -14" ${stroke(2, "#495057")}/>
      ${neck("#8d5524")}
      ${path("M42 96 Q60 112 78 96 L80 106 Q60 122 40 106 Z", "#e76f51")}
      ${path("M70 108 L76 136 L64 132 Z", "#e76f51")}
      ${head("#8d5524")}
      ${circle(60, 22, 14, "#2b1d14")}
      ${path("M38 52 Q38 30 60 30 Q82 30 82 52 Q78 40 60 40 Q42 40 38 52 Z", "#2b1d14")}
      <circle cx="38" cy="66" r="4" fill="none" stroke="#f2b705" stroke-width="2"/>
      ${nose}`,
    face: {
      eyeY: 55,
      browY: 49,
      mouthY: 70,
      neutral: brows("M47 49 l9 1 M64 50 l9 -1") + eyes(55) + mouth("M53 70 h14"),
    },
  },
  Theo: {
    body: `
      ${shoulders("#8d99ae")}
      ${path("M30 104 Q60 126 90 104 Q86 96 60 98 Q34 96 30 104 Z", "#6c7a91")}
      <path d="M52 112 v20 M68 112 v20" ${stroke(2.5, PAPER)}/>
      <rect x="40" y="148" width="40" height="22" rx="4" fill="none" stroke="#6c7a91" stroke-width="3"/>
      ${neck("#f3d1b4")}
      <path d="M42 92 Q60 108 78 92" stroke="${INK}" stroke-width="5" fill="none"/>
      <ellipse cx="42" cy="92" rx="7" ry="9" fill="#e63946" ${ink()}/><ellipse cx="78" cy="92" rx="7" ry="9" fill="#e63946" ${ink()}/>
      ${head("#f3d1b4", 20, 24)}
      ${path("M38 54 L36 36 L44 40 L46 26 L54 34 L60 22 L66 33 L74 26 L76 40 L84 36 L82 54 Q76 40 60 40 Q44 40 38 54 Z", "#3d405b")}
      ${nose}`,
    face: {
      eyeY: 55,
      browY: 48,
      mouthY: 70,
      neutral: brows("M48 49 l8 -2 M64 47 l8 2", 2.5) + eyes(55) + mouth("M54 70 q6 -2 12 0"),
    },
  },
  Vince: {
    body: `
      ${shoulders("#7b2cbf")}
      ${neck("#c68642")}
      ${shirt()}
      ${tie("#f2b705")}
      ${lapels("#5a189a", 144)}
      ${path("M84 132 l6 -6 l4 6 Z", "#f2b705", 1.5)}
      <path d="M80 134 h16" ${stroke()}/>
      ${head("#c68642")}
      ${path("M38 50 Q36 26 60 26 Q84 26 82 50 Q80 40 70 36 Q74 42 66 44 Q60 36 48 38 Q40 42 38 50 Z", INK)}
      ${nose}`,
    face: {
      eyeY: 54,
      browY: 46,
      mouthY: 72,
      neutral: `<path d="M47 47 q5 -3 10 0 M63 47 q5 -3 10 0" ${stroke(2.5)}/>` + eyes() + path("M49 69 q11 10 22 0 Z", PAPER, 2),
      // The pencil moustache.
      over: `<path d="M50 66 q10 -3 20 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    },
  },
  Leo: {
    body: `
      ${shoulders(PAPER)}
      ${path("M30 112 Q38 100 50 98 L60 128 L70 98 Q82 100 90 112 L94 182 H26 Z", "#264653")}
      ${[136, 152, 168].map((y) => circle(60, y, 2.5, "#f2b705", 1)).join("")}
      ${neck("#d9a066")}
      ${path("M50 102 L60 106 L50 110 Z M70 102 L60 106 L70 110 Z", "#e63946", 2)}
      ${head("#d9a066")}
      ${path("M38 56 Q36 34 46 32 Q44 42 40 56 Z M82 56 Q84 34 74 32 Q76 42 80 56 Z", "#adb5bd")}
      <path d="M44 34 Q60 22 76 34" ${stroke(3, "#adb5bd")}/>
      <path d="M60 59 l3 6 h-5" ${stroke()}/>`,
    face: {
      eyeY: 54,
      browY: 44,
      mouthY: 75,
      neutral: eyes(),
      // Glasses and the big grey moustache.
      over: lenses(54, 7) + path("M50 68 Q60 62 70 68 Q60 72 50 68 Z", "#adb5bd", 2),
    },
  },
  Kessler: {
    body: `
      ${shoulders("#6c584c")}
      ${neck("#e8b98f")}
      ${shirt("#e9e4d8")}
      ${path("M58 100 L64 100 L70 128 L62 136 L58 126 Z", "#7f5539", 2)}
      ${lapels("#5a483e")}
      <path d="M24 150 q8 4 14 0 M84 160 q6 4 12 -2" ${stroke(2, "#4a3c34")}/>
      ${head("#e8b98f", 23, 25)}
      ${jaw(0.2)}
      ${path("M37 56 Q36 40 44 36 L46 50 Z M83 56 Q84 40 76 36 L74 50 Z", "#6c584c")}
      <path d="M60 57 l4 9 h-6" ${stroke()}/>`,
    face: {
      eyeY: 55,
      browY: 49,
      mouthY: 71,
      neutral: brows("M46 48 l10 2 M64 50 l10 -2", 3.5) + eyes(55) + mouth("M52 71 q8 -3 16 1"),
    },
  },
  Guard: {
    body: `
      ${shoulders("#343a40")}
      ${path("M46 98 L60 116 L74 98 Z", "#495057")}
      <path d="M60 116 V182" ${stroke()}/>
      ${path("M24 132 h22 v14 h-22 Z", "#495057", 2)}
      ${path("M74 132 l12 -4 l4 10 l-12 4 Z", "#c9a227", 2)}
      ${path("M90 104 h10 v28 h-10 Z", INK, 2)}<path d="M95 104 V92" ${stroke(3)}/>
      ${neck("#c68642")}
      ${head("#c68642")}
      ${path("M34 40 Q60 18 86 40 L84 46 H36 Z", "#212529")}
      ${path("M32 46 H92 Q86 54 60 52 Q40 52 32 46 Z", "#111")}
      ${circle(60, 34, 5, "#c9a227", 2)}
      ${nose}`,
    face: {
      eyeY: 59,
      browY: 54,
      mouthY: 72,
      neutral: brows("M46 53 l10 1 M64 54 l10 -1") + eyes(59) + mouth("M52 72 h16"),
    },
  },
  Buyer: {
    body: `
      ${shoulders("#adb5bd")}
      ${path("M44 98 L60 124 L76 98 Z", "#e9e4d8")}
      ${[132, 148, 164].map((y) => circle(60, y, 2.5, "#6c757d", 1)).join("")}
      ${path("M46 98 L60 124 L74 98", "none", 2)}
      ${neck("#f3d1b4")}
      ${head("#f3d1b4", 22, 24)}
      ${path("M38 52 Q38 38 46 34 Q60 30 80 40 Q66 36 50 42 Q42 46 38 52 Z", "#6c757d", 2)}
      <path d="M60 60 l3 6 h-5" ${stroke()}/>
      ${path("M84 40 q4 6 0 10 q-4 -4 0 -10 Z", "#90e0ef", 1.5)}`,
    face: {
      eyeY: 56,
      browY: 45,
      mouthY: 72,
      neutral: eyes(56) + brows("M44 46 l9 -3 M67 43 l9 3", 2.5) + mouth("M53 72 q3 -3 7 0 q3 3 7 0"),
      over: lenses(56, 8),
    },
  },
  Waiter: {
    body: `
      ${shoulders("#f8f9fa")}
      ${path("M46 98 L60 120 L74 98 Z", PAPER)}
      ${path("M50 102 L60 106 L50 110 Z M70 102 L60 106 L70 110 Z", INK, 2)}
      ${[134, 150, 166].map((y) => circle(60, y, 2.5, "#c9a227", 1)).join("")}
      <path d="M60 120 V182" ${stroke(2, "#ced4da")}/>
      ${path("M82 150 h16 v14 h-16 Z", "#f8f9fa", 2)}
      ${neck("#e0ac69")}
      ${head("#e0ac69", 20, 25)}
      ${path("M40 50 Q40 28 60 28 Q80 28 80 50 Q76 36 54 38 L52 32 Q46 40 40 50 Z", "#212529")}
      ${nose}`,
    face: {
      eyeY: 55,
      browY: 48,
      mouthY: 70,
      // Eyes politely closed.
      neutral: brows("M47 48 h9 M64 48 h9") + `<path d="M48 55 q4 -3 8 0 M64 55 q4 -3 8 0" ${stroke(2.5)}/>` + mouth("M54 70 h12"),
    },
  },
  // Matches the close-up in the poker scene: white dinner jacket, black
  // shirt, gold chain, cigar, and eyes you can watch wander.
  "High Roller": {
    body: `
      ${shoulders("#f8f9fa")}
      ${path("M46 98 L60 128 L74 98 Z", "#1d1d1d")}
      <path d="M48 100 Q60 124 72 100" ${stroke(3, "#f2b705")}/>
      ${circle(60, 120, 4, "#f2b705", 1.5)}
      ${lapels("#e9ecef")}
      ${path("M84 130 l8 -6 l4 4 l-6 6 Z", "#e63946", 1.5)}
      ${neck("#e9b48a")}
      ${head("#e9b48a", 22, 25)}
      ${jaw(0.12)}
      ${path("M38 54 Q36 28 60 28 Q84 28 82 54 Q78 40 60 39 Q42 40 38 54 Z", INK)}
      ${nose}`,
    face: {
      eyeY: 54,
      browY: 48,
      mouthY: 70,
      whites: true,
      neutral: whites(54) + eyes(54) + brows("M45 48 l12 -1 M63 47 l12 1") + mouth("M50 70 q10 4 20 0"),
      over: path("M68 70 l16 -3 v4 l-16 3 Z", "#7a4a2a", 1.5) + circle(85, 69, 2.5, "#e63946", 1),
    },
  },
};
