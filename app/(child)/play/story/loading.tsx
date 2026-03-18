export default function Loading() {
  return (
    <main className="py-8 animate-pulse">
      <div className="h-3 bg-gray-800 rounded w-24 mb-4" />

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-gray-800 rounded-full mx-auto mb-2" />
        <div className="h-7 bg-gray-800 rounded w-28 mx-auto mb-2" />
        <div className="h-3 bg-gray-800 rounded w-56 mx-auto" />
      </div>

      {/* Chapters */}
      <div className="space-y-3 mb-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-3 bg-gray-800 rounded w-16" />
                  <div className="h-4 bg-gray-800 rounded w-20" />
                </div>
                <div className="h-5 bg-gray-800 rounded w-40 mb-2" />
                <div className="h-3 bg-gray-800 rounded w-full mb-1" />
                <div className="h-3 bg-gray-800 rounded w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="h-3 bg-gray-800 rounded w-24 mb-3" />
        <div className="flex gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <div className="h-6 bg-gray-800 rounded w-10 mb-1" />
              <div className="h-3 bg-gray-800 rounded w-14" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
