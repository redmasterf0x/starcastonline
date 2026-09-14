import { brandAssets } from "@/lib/brand-assets"

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#05051f] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #ea6f2a 0%, #20efe0 60%, transparent 80%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 text-center space-y-5 animate-in fade-in zoom-in-95 duration-300 max-w-sm">
        {/* Orbital rings & StarCast Mascot */}
        <div className="relative flex items-center justify-center w-36 h-36 mx-auto">
          {/* Outer rotating dashed ring */}
          <div
            className="w-full h-full rounded-full border border-dashed border-[#ea6f2a]/60 animate-spin absolute inset-0"
            style={{ animationDuration: "8s" }}
          >
            <div className="w-3 h-3 rounded-full bg-[#ea6f2a] shadow-[0_0_10px_#ea6f2a] absolute -top-1.5 left-1/2 -translate-x-1/2" />
          </div>

          {/* Inner pulsing aura */}
          <div className="w-28 h-28 rounded-full bg-[#ea6f2a]/20 animate-ping absolute inset-0 m-auto" />

          {/* Mascot */}
          <img
            src={brandAssets.capstone.white || "/images/starcast-mascot.png"}
            alt="StarCast Mascot"
            className="w-24 h-24 object-contain relative z-10 animate-pulse drop-shadow-[0_0_24px_rgba(234,111,42,0.6)]"
          />
        </div>

        {/* StarCast Wordmark */}
        <img
          src={brandAssets.logotype.horizontalWhite || "/images/starcast-wordmark.png"}
          alt="StarCast Media"
          className="h-8 mx-auto object-contain drop-shadow-md"
        />

        {/* Bouncing Cosmic Energy Nodes */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <div
            className="w-2 h-2 rounded-full bg-[#ea6f2a] animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-[#ea6f2a] animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-[#ea6f2a] animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  )
}
