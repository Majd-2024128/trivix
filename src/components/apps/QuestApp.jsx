import { useState, useRef } from "react";
import { Search, ArrowLeft, ArrowRight, RotateCw, Home, Globe } from "lucide-react";

const GOOGLE_SEARCH_URL = "https://www.google.com/search?igu=1&q=";
const GOOGLE_HOME = "https://www.google.com/webhp?igu=1";

export default function QuestApp() {
  const [url, setUrl] = useState(GOOGLE_HOME);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef(null);

  const navigate = (targetUrl) => {
    let finalUrl = targetUrl;
    if (!/^https?:\/\//i.test(targetUrl)) {
      if (/\.\w{2,}/.test(targetUrl)) {
        finalUrl = "https://" + targetUrl;
      } else {
        finalUrl = GOOGLE_SEARCH_URL + encodeURIComponent(targetUrl);
      }
    }
    setUrl(finalUrl);
    setInputValue(finalUrl);
    setIsLoading(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) navigate(inputValue.trim());
  };

  const goHome = () => {
    setUrl(GOOGLE_HOME);
    setInputValue("");
    setIsLoading(true);
  };

  const refresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = url;
      setIsLoading(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1c1c1e] text-white font-space">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-[#2c2c2e]">
        <button onClick={() => iframeRef.current?.contentWindow?.history.back()} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-4 h-4 text-white/50" />
        </button>
        <button onClick={() => iframeRef.current?.contentWindow?.history.forward()} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <ArrowRight className="w-4 h-4 text-white/50" />
        </button>
        <button onClick={refresh} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <RotateCw className={`w-4 h-4 text-white/50 ${isLoading ? "animate-spin" : ""}`} />
        </button>
        <button onClick={goHome} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <Home className="w-4 h-4 text-white/50" />
        </button>

        <form onSubmit={handleSubmit} className="flex-1 flex items-center">
          <div className="flex-1 flex items-center gap-2 bg-[#1c1c1e] rounded-lg px-3 py-1.5 border border-white/10 focus-within:border-white/25 transition-colors">
            <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search Google or enter URL"
              className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/30 outline-none"
            />
            {inputValue && (
              <Globe className="w-3.5 h-3.5 text-white/30 shrink-0" />
            )}
          </div>
        </form>
      </div>

      {/* Browser content */}
      <div className="flex-1 relative bg-white">
        <iframe
          ref={iframeRef}
          src={url}
          onLoad={() => setIsLoading(false)}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          title="Quest Browser"
        />
        {isLoading && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500/30">
            <div className="h-full bg-blue-500 animate-pulse w-1/2" />
          </div>
        )}
      </div>
    </div>
  );
}
