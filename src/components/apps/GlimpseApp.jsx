import { File } from "lucide-react";
import { useTheme, themed } from "@/lib/ThemeContext";
import { fileExt } from "@/lib/fileStore";

export default function GlimpseApp({ file, name }) {
  const { isDark } = useTheme();
  const t = themed(isDark);
  const isImage = file?.dataUrl && file?.type?.startsWith("image/");
  const isText = file?.dataUrl && file?.type?.startsWith("text/");
  return (
    <div className={`h-full w-full overflow-hidden font-space ${isDark ? "bg-[#111114] text-white" : "bg-[#f7f8fb] text-[#1c1c1e]"}`}>
      <div className={`flex h-10 items-center justify-center border-b ${t.border}`}>
        <span className="text-xs font-medium">{name || file?.name}</span>
      </div>
      <div className="flex h-[calc(100%-40px)] items-center justify-center p-5">
        {isImage ? <img src={file.dataUrl} alt={name || file.name} className="max-h-full max-w-full rounded-lg object-contain shadow-2xl" /> : isText ? <iframe src={file.dataUrl} title={name || file.name} className="h-full w-full rounded-lg bg-white" /> : (
          <div className="flex flex-col items-center gap-3">
            <div className={`relative ${t.textMuted}`}><File className="h-20 w-20" /><span className="absolute inset-x-3 bottom-5 text-center text-xs font-bold">{fileExt(name || file?.name)}</span></div>
            <div className="text-lg font-semibold">{name || file?.name}</div>
            <div className={`text-xs ${t.textSubtle}`}>{file?.type || "Unknown file"}</div>
          </div>
        )}
      </div>
    </div>
  );
}