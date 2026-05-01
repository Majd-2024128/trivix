import trivixLogo from "@/assets/trivix-logo.png";

export default function MobileGate() {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center px-8 text-center font-space z-[9999]">
      <p className="text-black text-base font-medium leading-relaxed max-w-xs mb-8">
        This website is optimized for desktop devices, please try opening this website on your computer.
      </p>
      <img src={trivixLogo} alt="Trivix" className="w-16 h-16 mb-auto" draggable={false} />
      <p className="text-black/40 text-[10px] mb-6">Copyright © 2026 Tejt</p>
    </div>
  );
}
