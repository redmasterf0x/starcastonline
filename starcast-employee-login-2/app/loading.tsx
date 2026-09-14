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
        {/* Cosmic Reactor Orbital Ring */}
        <div className="relative flex items-center justify-center w-32 h-32 mx-auto">
          {/* Outer rotating dashed ring */}
          <div
            className="w-full h-full rounded-full border border-dashed border-[#ea6f2a]/60 animate-spin absolute inset-0"
            style={{ animationDuration: "6s" }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-[#ea6f2a] shadow-[0_0_12px_#ea6f2a] absolute -top-1.5 left-1/2 -translate-x-1/2 border border-white" />
          </div>

          {/* Inner pulsing aura */}
          <div className="w-24 h-24 rounded-full bg-[#ea6f2a]/20 animate-ping absolute inset-0 m-auto" />

          {/* Reinforced ring */}
          <div className="w-24 h-24 rounded-full border-2 border-[#ea6f2a]/40 absolute inset-0 m-auto" />

          {/* Center Core Reactor Node */}
          <div className="relative z-10 w-6 h-6 rounded-full bg-[#ea6f2a] border-2 border-white/90 shadow-[0_0_24px_#ea6f2a] animate-pulse" />
        </div>

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
