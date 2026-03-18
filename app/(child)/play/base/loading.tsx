export default function Loading() {
  return (
    <main className="py-6 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="h-3 bg-gray-800 rounded w-24" />
        <div className="h-5 bg-gray-800 rounded w-16" />
      </div>
      <div className="text-center mb-4">
        <div className="h-6 bg-gray-800 rounded w-28 mx-auto mb-1" />
        <div className="h-3 bg-gray-800 rounded w-48 mx-auto" />
      </div>
      {/* Canvas placeholder */}
      <div className="w-full h-[280px] bg-gray-900 border border-gray-800 rounded-xl mb-4" />
      {/* Threat */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 mb-4 flex justify-between">
        <div className="h-4 bg-gray-800 rounded w-28" />
        <div className="h-5 bg-gray-800 rounded w-20" />
      </div>
      {/* Components */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <div className="h-4 bg-gray-800 rounded w-20 mb-2" />
            <div className="h-1.5 bg-gray-800 rounded-full mb-2" />
            <div className="h-6 bg-gray-800 rounded w-full" />
          </div>
        ))}
      </div>
    </main>
  )
}
