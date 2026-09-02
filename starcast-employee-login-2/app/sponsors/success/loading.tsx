export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#ea6f2a] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[#9a9fc4] text-sm">Confirming your purchase...</p>
      </div>
    </div>
  )
}
