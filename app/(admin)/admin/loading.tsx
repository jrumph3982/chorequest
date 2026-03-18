export default function Loading() {
  return (
    <main className="py-8 animate-pulse">
      {/* Welcome heading */}
      <div className="mb-8">
        <div className="h-7 bg-gray-200 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-60" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="h-4 bg-gray-200 rounded w-32 mb-3" />
            <div className="h-9 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
        ))}
      </div>
    </main>
  )
}
