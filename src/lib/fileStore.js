import { APP_DEFS } from "@/components/desktop/Dock";

export const ROOT_FOLDERS = ["Desktop", "Documents", "Downloads", "Pictures", "Music", "Video", "Applications", "Bin"];

export const DEFAULT_FS = {
  Desktop: {},
  Documents: {},
  Downloads: {},
  Pictures: {},
  Music: {},
  Video: {},
  Bin: {},
  Applications: Object.fromEntries(APP_DEFS.map((app) => [`${app.name}.app`, { __file: true, kind: "app", appId: app.id, name: app.name }]))
};

export const isDir = (entry) => entry && typeof entry === "object" && !entry.__file;
export const readFs = () => {
  try {
    const stored = JSON.parse(localStorage.getItem("trivix_fs")) || {};
    const merged = { ...DEFAULT_FS, ...stored, Applications: DEFAULT_FS.Applications };
    // Ensure new folders exist
    for (const folder of ROOT_FOLDERS) if (!merged[folder]) merged[folder] = {};
    return merged;
  } catch { return DEFAULT_FS; }
};
export const writeFs = (fs) => {
  localStorage.setItem("trivix_fs", JSON.stringify({ ...fs, Applications: DEFAULT_FS.Applications }));
  window.dispatchEvent(new CustomEvent("trivix-fs-change", { detail: readFs() }));
};
export const getNode = (fs, path = []) => path.reduce((node, p) => node?.[p] || {}, fs);
export const fileExt = (name = "") => (name.includes(".") ? name.split(".").pop().slice(0, 4).toUpperCase() : "FILE");
export const flattenFs = (fs, basePath = []) => Object.entries(getNode(fs, basePath)).flatMap(([name, entry]) => {
  if (isDir(entry)) return [{ name, entry, path: [...basePath, name], kind: "folder" }, ...flattenFs(fs, [...basePath, name])];
  return [{ name, entry, path: basePath, kind: entry?.kind === "app" ? "app" : "file" }];
});
export const uniqueName = (node, fileName) => {
  let name = fileName, i = 1;
  while (node[name]) {
    const dot = fileName.lastIndexOf(".");
    name = dot > 0 ? `${fileName.slice(0, dot)} ${i}${fileName.slice(dot)}` : `${fileName} ${i}`;
    i += 1;
  }
  return name;
};

// Move a file to Bin (preserving original path for recovery)
export const moveToBin = (fs, path, name) => {
  const node = getNode(fs, path);
  const entry = node[name];
  if (!entry) return fs;
  delete node[name];
  const bin = fs.Bin;
  const newName = uniqueName(bin, name);
  bin[newName] = { ...entry, __binMeta: { originalPath: path, originalName: name, deletedAt: Date.now() } };
  return fs;
};

export const recoverFromBin = (fs, name) => {
  const entry = fs.Bin[name];
  if (!entry?.__binMeta) return fs;
  const { originalPath, originalName } = entry.__binMeta;
  const dest = getNode(fs, originalPath);
  if (!dest || typeof dest !== "object") { delete fs.Bin[name]; return fs; }
  const { __binMeta, ...clean } = entry;
  dest[uniqueName(dest, originalName)] = clean;
  delete fs.Bin[name];
  return fs;
};
