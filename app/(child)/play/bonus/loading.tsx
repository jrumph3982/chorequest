export default function Loading() {
  return (
    <main className="py-8 animate-pulse">
      <div className="h-3 bg-gray-800 rounded w-24 mb-4" />

      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-gray-800 rounded-full mx-auto mb-2" />
        <div className="h-7 bg-gray-800 rounded w-36 mx-auto mb-1.5" />
        <div className="h-3 bg-gray-800 rounded w-60 mx-auto" />
      </div>

      {/* Form card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8 space-y-4">
        <div>
          <div className="h-4 bg-gray-800 rounded w-32 mb-2" />
          <div className="h-20 bg-gray-800 rounded-lg w-full" />
        </div>
        <div>
          <div className="h-4 bg-gray-800 rounded w-48 mb-2" />
          <div className="h-10 bg-gray-800 rounded-lg w-full" />
        </div>
        <div className="h-11 bg-gray-800 rounded-lg w-full" />
      </div>

      {/* Recent requests */}
      <div className="h-4 bg-gray-800 rounded w-28 mb-3" />
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex justify-between gap-3">
              <div className="flex-1">
                <div className="h-4 bg-gray-800 rounded w-3/4 mb-1.5" />
                <div className="h-3 bg-gray-800 rounded w-24" />
              </div>
              <div className="h-5 bg-gray-800 rounded w-16 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
