import { APP_DEFS } from "@/components/desktop/Dock";

export const ROOT_FOLDERS = ["Desktop", "Documents", "Downloads", "Pictures", "Applications"];

export const DEFAULT_FS = {
  Desktop: {},
  Documents: {},
  Downloads: {},
  Pictures: {},
  Applications: Object.fromEntries(APP_DEFS.map((app) => [`${app.name}.app`, { __file: true, kind: "app", appId: app.id, name: app.name }]))
};

export const isDir = (entry) => entry && typeof entry === "object" && !entry.__file;
export const readFs = () => {
  try { return { ...DEFAULT_FS, ...(JSON.parse(localStorage.getItem("trivix_fs")) || {}), Applications: DEFAULT_FS.Applications }; }
  catch { return DEFAULT_FS; }
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