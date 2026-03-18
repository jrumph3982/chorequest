export default function Loading() {
  return (
    <main className="py-8 animate-pulse">
      <div className="h-3 bg-gray-800 rounded w-24 mb-4" />

      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-gray-800 rounded-full mx-auto mb-2" />
        <div className="h-6 bg-gray-800 rounded w-36 mx-auto mb-1.5" />
        <div className="h-3 bg-gray-800 rounded w-52 mx-auto" />
      </div>

      {/* Balance */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 flex justify-between items-center">
        <div className="h-4 bg-gray-800 rounded w-20" />
        <div className="h-6 bg-gray-800 rounded w-24" />
      </div>

      {/* Items */}
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-gray-800 rounded" />
                  <div className="h-4 bg-gray-800 rounded w-32" />
                  <div className="h-4 bg-gray-800 rounded w-16" />
                </div>
                <div className="h-3 bg-gray-800 rounded w-48 mt-1" />
              </div>
              <div className="h-8 bg-gray-800 rounded w-20 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
