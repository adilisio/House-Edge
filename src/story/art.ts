// Placeholder art for act one: each place is a coloured backdrop and each
// character a flat silhouette. The AI-made asset library replaces these later
// without the story changing, since Ink only names places and people.

export interface Place {
  label: string;
  sky: string;
  ground: string;
}

export interface Character {
  /** Silhouette fill. */
  color: string;
  /** Head colour, so similar silhouettes stay distinct. */
  head: string;
}

export const PLACES: Record<string, Place> = {
  "casino-exterior": { label: "The Gilded Crane", sky: "#1b1440", ground: "#e63946" },
  "casino-floor": { label: "The Gilded Crane, casino floor", sky: "#7a1f2b", ground: "#f2b705" },
  "city-map": { label: "The city", sky: "#2b2d42", ground: "#59606b" },
  "lucky-strike": { label: "The Lucky Strike", sky: "#3d5a40", ground: "#a07a4f" },
  alley: { label: "The alley out back", sky: "#22223b", ground: "#4a4e69" },
  "city-street": { label: "Fifth Street", sky: "#7fb7d6", ground: "#59606b" },
  diner: { label: "The diner on Fifth", sky: "#f4a261", ground: "#2ec4b6" },
  gallery: { label: "The Varga Gallery", sky: "#f1ece2", ground: "#b8c0cc" },
  "street-night": { label: "On the way to the motel", sky: "#0d1b2a", ground: "#415a77" },
  "crane-window": { label: "Crane's office", sky: "#111111", ground: "#f2b705" },
};

export const CHARACTERS: Record<string, Character> = {
  Sam: { color: "#2ec4b6", head: "#1b6f68" },
  Theo: { color: "#8d99ae", head: "#3d405b" },
  Leo: { color: "#264653", head: "#e9c46a" },
  Dee: { color: "#111111", head: "#e76f51" },
  Vince: { color: "#7b2cbf", head: "#f2b705" },
  Kessler: { color: "#6c584c", head: "#a98467" },
  Crane: { color: "#1d1d1d", head: "#e63946" },
  Guard: { color: "#343a40", head: "#6c757d" },
  Buyer: { color: "#adb5bd", head: "#6c757d" },
  Waiter: { color: "#f8f9fa", head: "#6c757d" },
};
