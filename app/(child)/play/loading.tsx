export default function Loading() {
  return (
    <main className="py-6 animate-pulse">
      {/* Hero */}
      <div className="text-center mb-5">
        <div className="w-12 h-12 bg-gray-800 rounded-full mx-auto mb-2" />
        <div className="h-5 bg-gray-800 rounded w-40 mx-auto mb-1" />
        <div className="h-3 bg-gray-800 rounded w-56 mx-auto" />
      </div>

      {/* XP bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
        <div className="flex justify-between mb-2">
          <div className="h-4 bg-gray-800 rounded w-20" />
          <div className="h-4 bg-gray-800 rounded w-24" />
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2.5" />
        <div className="h-3 bg-gray-800 rounded w-32 mt-1.5" />
      </div>

      {/* Scrap + Allowance */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[0, 1].map((i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <div className="h-3 bg-gray-800 rounded w-12 mx-auto mb-1.5" />
            <div className="h-6 bg-gray-800 rounded w-20 mx-auto" />
          </div>
        ))}
      </div>

      {/* Chore section */}
      <div className="mb-6">
        <div className="h-3 bg-gray-800 rounded w-28 mb-2" />
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex justify-between items-center gap-3">
                <div className="flex-1">
                  <div className="h-4 bg-gray-800 rounded w-36 mb-1.5" />
                  <div className="h-3 bg-gray-800 rounded w-24" />
                </div>
                <div className="h-6 bg-gray-800 rounded w-16 flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nav links */}
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-4">
            <div className="h-4 bg-gray-800 rounded w-32" />
          </div>
        ))}
      </div>
    </main>
  )
}
