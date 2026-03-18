export default function Loading() {
  return (
    <main className="py-8 animate-pulse">
      <div className="h-7 bg-gray-200 rounded w-44 mb-6" />
      <div className="h-4 bg-gray-200 rounded w-32 mb-3" />
      <div className="space-y-3 mb-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-52 mb-1.5" />
                <div className="h-3 bg-gray-200 rounded w-28" />
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <div className="h-8 bg-gray-200 rounded w-20" />
                <div className="h-8 bg-gray-200 rounded w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
