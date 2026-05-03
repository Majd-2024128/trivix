import auroraRealImg from "@/assets/wallpaper-aurora-real.jpg";
import deepSeaImg from "@/assets/wallpaper-deep-sea.jpg";

const HEX_RE = /#([0-9a-fA-F]{6})\b/g;

function hexToHsl(hex) {
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h *= 60;
  }
  return [h, s, l];
}

function hslToHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function lightenHex(hex) {
  const [h, s, l] = hexToHsl(hex);
  const newL = l + (0.85 - l) * 0.7;
  const newS = s * 0.65 + 0.1;
  return hslToHex(h, Math.min(1, newS), Math.min(0.95, newL));
}

function lightenGradient(gradient) {
  return gradient.replace(HEX_RE, (_, h) => lightenHex(h));
}

const DARK_WALLPAPERS = [
  { id: "green", label: "Forest Green", dark: "linear-gradient(145deg, #1a472a 0%, #2d6a4f 25%, #40916c 50%, #52b788 75%, #74c69d 100%)" },
  { id: "ocean", label: "Deep Ocean", dark: "linear-gradient(145deg, #03045e 0%, #0077b6 40%, #00b4d8 100%)" },
  { id: "sunset", label: "Sunset", dark: "linear-gradient(145deg, #370617 0%, #9d0208 30%, #f48c06 70%, #ffba08 100%)" },
  { id: "night", label: "Midnight", dark: "linear-gradient(145deg, #03001C 0%, #1a0533 40%, #301060 100%)" },
  { id: "rose", label: "Rose", dark: "linear-gradient(145deg, #590d22 0%, #a4133c 40%, #ff4d6d 80%, #ffb3c1 100%)" },
  { id: "slate", label: "Slate", dark: "linear-gradient(145deg, #1b263b 0%, #415a77 50%, #778da9 100%)" },
  { id: "aurora", label: "Aurora", dark: "linear-gradient(145deg, #00251a 0%, #006d77 35%, #83c5be 70%, #edf6f9 100%)" },
  { id: "lava", label: "Lava", dark: "linear-gradient(145deg, #03071e 0%, #6a040f 40%, #dc2f02 75%, #faa307 100%)" },
  { id: "violet", label: "Violet Dream", dark: "linear-gradient(145deg, #240046 0%, #5a189a 35%, #9d4edd 70%, #c77dff 100%)" },
  { id: "graphite", label: "Graphite", dark: "linear-gradient(145deg, #212529 0%, #495057 50%, #adb5bd 100%)" },
  { id: "monochrome", label: "Monochrome", dark: "linear-gradient(145deg, #000000 0%, #2d2d2d 50%, #595959 100%)" },
  { id: "deepsky", label: "Deep Sea", dark: `url(${deepSeaImg})`, light: `url(${deepSeaImg})`, isImage: true },
];

export const WALLPAPERS = [
  ...DARK_WALLPAPERS.map((w) => ({ ...w, light: w.light || lightenGradient(w.dark) })),
  {
    id: "aurora-real",
    label: "Iqralandic Flag",
    dark: `url(${auroraRealImg})`,
    light: `url(${auroraRealImg})`,
    isImage: true,
  },
];

export const DEFAULT_WALLPAPER_ID = "deepsky";

export function normalizeWallpaperUrl(value) {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.startsWith("url(")) return trimmed;
  if (/^(data:image\/|blob:|https?:\/|\/)/i.test(trimmed)) return `url("${trimmed.replace(/"/g, "\\\"")}")`;
  return trimmed;
}

export function getWallpaperById(id) {
  return WALLPAPERS.find((w) => w.id === id) || WALLPAPERS[0];
}

export function gradientForTheme(wp, isDark) {
  return isDark ? wp.dark : wp.light;
}
