export default function Loading() {
  return (
    <main className="py-8 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 bg-gray-200 rounded w-32" />
        <div className="h-9 bg-gray-200 rounded w-28" />
      </div>
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-44 mb-2" />
                <div className="flex gap-2 flex-wrap">
                  <div className="h-5 bg-gray-200 rounded w-16" />
                  <div className="h-5 bg-gray-200 rounded w-14" />
                  <div className="h-5 bg-gray-200 rounded w-20" />
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <div className="h-8 bg-gray-200 rounded w-12" />
                <div className="h-8 bg-gray-200 rounded w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
