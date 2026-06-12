export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <p className="text-slate-300 animate-pulse">Cargando...</p>
      </div>
    </div>
  )
}
