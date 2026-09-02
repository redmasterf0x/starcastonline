import { brandAssets } from "@/lib/brand-assets"

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#05052d] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative">
          <img src={brandAssets.capstone.white || "/placeholder.svg"} alt="Starcast Media" className="w-80 h-80 mx-auto animate-pulse object-contain" />
          <div className="absolute inset-0 rounded-full bg-[#ea6f2a]/20 animate-ping"></div>
        </div>
        <img src={brandAssets.logotype.horizontalWhite || "/placeholder.svg"} alt="Loading Starcast Media" className="h-28 mx-auto object-contain" />
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#ea6f2a] animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-[#ea6f2a] animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-[#ea6f2a] animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  )
}
