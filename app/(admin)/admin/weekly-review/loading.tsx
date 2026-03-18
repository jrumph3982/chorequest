export default function Loading() {
  return (
    <main className="py-8 animate-pulse">
      <div className="h-7 bg-gray-200 rounded w-36 mb-6" />

      {/* Week nav */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-9 bg-gray-200 rounded w-20" />
        <div className="h-5 bg-gray-200 rounded w-40" />
        <div className="h-9 bg-gray-200 rounded w-20" />
      </div>

      {/* Child card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="h-5 bg-gray-200 rounded w-32 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="h-7 bg-gray-200 rounded w-8 mx-auto mb-1" />
              <div className="h-3 bg-gray-200 rounded w-16 mx-auto" />
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-4">
          <div className="flex justify-between mb-3">
            <div className="h-4 bg-gray-200 rounded w-28" />
            <div className="h-4 bg-gray-200 rounded w-16" />
          </div>
          <div className="h-10 bg-gray-200 rounded w-full" />
        </div>
      </div>
    </main>
  )
}
